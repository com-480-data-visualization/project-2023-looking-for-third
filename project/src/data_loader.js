//Author: Andria Kolić

import { toRadian } from "../lib/gl-matrix_3.3.0/esm/common.js"

// TODO: would be used for caching
// let disaster_dict = {}

// Colors for each disaster type:
export const disaster_colors = {
    // Yellow
    "Drought": [224./255., 211./255., 25./255.],
    // Brown
    "Earthquake": [84./255., 37./255., 15./255.],
    // Black
    "Volcanic activity": [0.0, 0.0, 0.0],
    // Purple
    "Mass movement": [136. / 255., 0. / 255., 255. / 255.],
    // Light blue
    "Storm": [40./255., 198./255., 209./255.],
    // Dark blue
    "Flood": [7./255., 41./255., 143./255.],
    // Bright green
    "Epidemic": [4. / 255., 255. / 255., 0. / 255.],
    // Light grey
    "Landslide": [180. / 255., 180. / 255., 180. / 255.],
    // Orange
    "Wildfire": [247./255., 84./255., 20./255.],
    // Magenta
    "Extreme temperature": [204./255., 12./255., 188./255.],

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

        // We restrict the maximum number of models assigned to a single disaster event - otherwise we can easily run into performance issues
        // e.g. Moving from unrestricted to maximum 3 per event reduced the number of models from ~1800 to ~900 (for year 2000)
        // Moving futher to maximum 1 per event reduced the number of models to ~500
        // TODO: Maybe select the coordinates we're showing in a smarter way?
        // coords = coords.slice(0, 1)
    } else if (row['Country Latitude'] != null && row['Country Longitude']) {
        // Latitude and Longitude geocoded from the 'Country' field - poor precision but available for every event
        quality = 2
        coords.push([row['Country Latitude'], row['Country Longitude']])
    }

    return [quality, coords]
}

function log_with_timestamp(msg) {
    let date = new Date()
    date.setTime(Date.now())

    let hours = date.getHours()
    let minutes = date.getMinutes()
    let seconds = date.getSeconds()
    let milliseconds = date.getMilliseconds()

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    milliseconds = milliseconds < 10 ? '00' + milliseconds : (milliseconds < 100 ? '0' + milliseconds : milliseconds);
    console.log(hours + ':' + minutes + ':' + seconds + '.' + milliseconds)

    console.log(msg)
}

function construct_from_disaster_array(disasters) {
    let disaster_blueprint_list = []

    disasters.forEach(row => {
        if (!(row['Type'] in disaster_colors)) {
            return
        }
        let extracted_coord_data = extract_coords(row)
        let coords_raw = extracted_coord_data[1]

        let coords = []
        coords_raw.forEach(coord_pair => {
            let lat = parseFloat(coord_pair[0])
            let lng = parseFloat(coord_pair[1])

            coords.push(from_lat_lng_to_x_y_z(lat, lng))
        })

        disaster_blueprint_list.push({
            "coords": coords,
            "scale": 0.03,
            "mesh_index": 0,
            "color_index": row.Type,
            "Type": row.Type,
            "Subtype": row.Subtype,
            "Country": row.Country,
            "Location": row.Location,
            "Start Year": row["Start Year"],
            "Start Month": row["Start Month"],
            "Start Day": row["Start Day"],
            "End Year": row["End Year"],
            "End Month": row["End Month"],
            "End Day": row["End Day"],
            "Total Affected": row["Total Affected"],
            "Total Deaths": row["Total Deaths"],
        })
    })

    return disaster_blueprint_list
}

async function load_data(year, callback) {
    // // TODO: if we are doing caching, we would check for cached events here
    // if (year in disaster_dict && Array.isArray(disaster_dict[year]) && disaster_dict[year].length > 0) {
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

            callback(construct_from_disaster_array(json))
        })
        .catch((err) => {
            console.log(err)
            // Since there was an error, erase previously rendered data and pretend like there's no data for requested year
            callback([])
        })
}

export {
    load_data,
    log_with_timestamp,
}