import { vec3 } from "../lib/gl-matrix_3.3.0/esm/index.js"
import { icg_mesh_load_obj } from "../lib/icg_libs/icg_mesh.js"
import { init_disaster } from "./disaster_object.js"
import { toRadian } from "../lib/gl-matrix_3.3.0/esm/common.js"

// TODO: would be used for caching
// let disaster_dict = {}

let regl
let resources
let cube_mesh

async function init_data_loader(_regl, _resources) {
    regl = _regl
    resources = _resources

    cube_mesh = await icg_mesh_load_obj(regl, './meshes/cube.obj')
}

function from_lat_lng_to_x_y_z(lat_in_degrees, lng_in_degrees) {
    let lat = toRadian(lat_in_degrees)
    let lng = toRadian(lng_in_degrees + 180) // we add 180 in order to fix the fact that the map's 0 is in the pacific

    let x = Math.cos(lat) * Math.cos(lng)
    let y = Math.cos(lat) * Math.sin(lng)
    let z = Math.sin(lat)
    return [x, y, z]
}

function extract_coords(row) {
    // Indicate the trust we have in the selected coordinates - some are more precise or reliable than others
    // We can use this value if we have a need to filter events (if there are too many)
    let quality = -1
    // coords is an array of arrays - each element of coords is an array in the format: [lat, lng]
    let coords = []

    if (row['Latitude'] != null && row['Longitude']) {
        // Latitude and Longitude that were provided in the dataset - should be very precise but is missing for most events
        quality = 5
        coords.push([row['Latitude'], row['Longitude']])
    } else if (row['Location Latitude'] != null && row['Location Longitude']) {
        // Latitude and Longitude geocoded from the raw 'Location' field - if present represents only one place
        quality = 4
        coords.push([row['Location Latitude'], row['Location Longitude']])
    } else if (row['Smart Coords'] != null) {
        // Latitude and Longitude geocoded after some preprocessing of the 'Location' field
        // If present represents an array of places
        quality = 3
        let arr = JSON.parse(row['Smart Coords'])
        arr.forEach(el => {
            coords.push([el['Lat'], el['Lng']])
        })
    } else if (row['Country Latitude'] != null && row['Country Longitude']) {
        // Latitude and Longitude geocoded from the 'Country' field - poor precision but available for every event
        quality = 2
        coords.push([row['Country Latitude'], row['Country Longitude']])
    }

    return [quality, coords]
}

function construct_from_disaster_array(disasters) {
    let disaster_actor_list = []

    disasters.forEach(row => {
        let extracted_coord_data = extract_coords(row)
        let coords_raw = extracted_coord_data[1]

        let coords = []
        coords_raw.forEach(coord_pair => {
            let lat = parseFloat(coord_pair[0])
            let lng = parseFloat(coord_pair[1])

            coords.push(from_lat_lng_to_x_y_z(lat, lng))
        })

        coords.forEach(coord_pair => {
            let dis = init_disaster(regl, resources, coord_pair[0], coord_pair[1], coord_pair[2], 0.03, cube_mesh, vec3.fromValues(1., 0., 0.))
            disaster_actor_list.push(dis)
        })
    })

    return disaster_actor_list
}

async function load_data(year, callback) {
    // // TODO: if we are doing caching, we would check for cached events here
    // if (year in disaster_dict && Array.isArray(disaster_dict[year]) && disaster_dict[year].length > 0) {
    //     // Disasters already loaded for requested year
    //     // disaster_list = construct_from_disaster_array(disaster_dict[year])
    //     callback(construct_from_disaster_array(disaster_dict[year]))
    //     return
    // }

    fetch('../data/Year_' + year + '.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(json => {
            // TODO: Do we wanna cache events in memory?
            // disaster_dict[year] = json

            // disaster_list = construct_from_disaster_array(json)
            callback(construct_from_disaster_array(json))
            // callback(construct_from_disaster_array(json.slice(0, 10)))
        })
        .catch((err) => {
            console.log(err)
            // Since there was an error, erase previously rendered data and pretend like there's no data for requested year
            callback([])
        })
}

export {
    init_data_loader,
    load_data,
}