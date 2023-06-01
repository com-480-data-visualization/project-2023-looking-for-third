import { createREGL } from "../lib/regljs_2.1.0/regl.module.js"
import { vec2, vec3, vec4, mat4 } from "../lib/gl-matrix_3.3.0/esm/index.js"
import { deg_to_rad, mat4_matmul_many } from "../lib/icg_libs/icg_math.js"
import { load_text, load_texture } from "../lib/icg_libs/icg_web.js"
import { createSphere } from "./custom_globe_generator.js"
import { init_globe } from "./custom_globe_renderer.js"
import { icg_mesh_load_obj } from "../lib/icg_libs/icg_mesh.js"
import { init_plane, init_plane_camera } from "./plane_renderer.js"
import { load_data, log_with_timestamp } from "./data_loader.js"
import { init_disaster } from "./disaster_object.js"
import { angle } from "../lib/gl-matrix_3.3.0/esm/vec2.js"

const NEAR = 0.01
const FAR = 100.0
const STEP_SIZE = 0.005
const ROT_STEP_SIZE = 0.1
const MESH_RESOLUTION = 64

const SHOW_MOUSE = true

let currentYear = 2000;

document.getElementById("our-timeline-slider").addEventListener("input", (ev) => {
	// Update variable used for visualization
	currentYear = ev.target.value;
	// Update slider visual
	document.getElementById("timeline-curr-value").innerHTML = currentYear;
	// Load events for year
	load_data(currentYear, receive_disaster_blueprints)
});

const regl = createREGL({
	extensions: [
		'OES_element_index_uint',
		'oes_texture_float'
	]
})

const resources = {
	"globe_texture": load_texture(regl, './textures/globe_high_res.jpg', { wrap: ['repeat', 'repeat'] }),
	"globe_normals": load_texture(regl, './textures/globe_norm_high_res.jpg'),
	"globe_heights": load_texture(regl, './textures/globe_heights.png'),
	"plane_texture": load_texture(regl, './textures/plane_texture.png'),
	"shaders/globe.vert.glsl": load_text('./src/shaders/globe.vert.glsl'),
	"shaders/globe.frag.glsl": load_text('./src/shaders/globe.frag.glsl'),
	"shaders/plane.vert.glsl": load_text('./src/shaders/plane.vert.glsl'),
	"shaders/plane.frag.glsl": load_text('./src/shaders/plane.frag.glsl'),
	"shaders/disaster.vert.glsl": load_text('./src/shaders/disaster.vert.glsl'),
	"shaders/disaster.frag.glsl": load_text('./src/shaders/disaster.frag.glsl'),
}

for (const key of Object.keys(resources)) {
	resources[key] = await resources[key]
}

const mat_world_to_cam = mat4.identity(mat4.create())
const mat_projection = mat4.create()
const mat_view = mat4.create()

let cam_pos = vec3.scale(vec3.create(), vec3.normalize(vec3.create(), [-2.5, -2.5, 0., 1.]), 2)
let lookAt = [0., 0., 0., 1.]
let down_vec = [1., 1., 0., 1.]
let cam_up = [0., 0., 1.]
let sun_pos = [0., 0., 2., 1.]


const globe_mesh = createSphere(MESH_RESOLUTION)
const plane_mesh = await icg_mesh_load_obj(regl, './meshes/plane.obj')
const cube_mesh = await icg_mesh_load_obj(regl, './meshes/cube.obj')

const globe = init_globe(regl, resources, 0., 0., 0., globe_mesh)
const plane = init_plane(regl, resources, 0., 0., -1.5, 0.15, plane_mesh)

// Ghost follows the player airplane, but uses the globe coordinate system
let ghost_coords = vec3.fromValues(-0.71, -0.71, 0.)
let mouse_offset_intensity = 0.
let mouse_offset_angle = 0.
// Mouse follows ghost, but uses mouse offset from center of screen to compute offset from ghost
// Works pretty nice while the mouse is a reasonable distance from the center of the screen
// Once the mouse goes to the corners the desync becomes very bad, cause of the curvature of the Earth
let mouse_coords = vec3.fromValues(-0.71, -0.71, 0.)
const mouse = init_disaster(regl, resources, mouse_coords[0], mouse_coords[1], mouse_coords[2], 0.25, cube_mesh, vec3.fromValues(0.3, 0.3, 1.))

const MOUSE_STEP_SIZE = 0.325
const MOUSE_ROT_STEP_SIZE = 1.
document.addEventListener('mousemove', e => {
	let min_dim = Math.min(window.innerWidth, window.innerHeight)
	let x = (e.clientX - window.innerWidth * 0.5) / (min_dim * 0.5)
	let y = (e.clientY - window.innerHeight * 0.5) / (min_dim * 0.5) * -1

	mouse_offset_intensity = Math.sqrt(x * x + y * y)
	mouse_offset_angle = angle(vec2.fromValues(0., 1.), vec2.fromValues(x, y))
	if (x < 0) {
		mouse_offset_angle = 2 * Math.PI - mouse_offset_angle
	}

	update_mouse()
}, false)

function update_mouse() {
	// Copy the ghost position
	vec3.copy(mouse_coords, ghost_coords)

	// Compute the forward rotation axis
	let forward_rot_axis = vec3.create()
	vec3.cross(forward_rot_axis, cam_up, down_vec)
	vec3.normalize(forward_rot_axis, forward_rot_axis)

	// Compute the forward rotation matrix using the mouse offset intensity for the angle
	let forward_rot_mat = mat4.create()
	mat4.fromRotation(forward_rot_mat, MOUSE_STEP_SIZE * mouse_offset_intensity, forward_rot_axis)

	// Forward rotate the mouse from the ghost
	vec3.transformMat4(mouse_coords, mouse_coords, forward_rot_mat)

	// Compute the sideways rotation axis
	let side_rot_axis = vec3.clone(down_vec)
	vec3.normalize(side_rot_axis, side_rot_axis)

	// Compute the sideways rotation matrix using the mouse offset angle for the angle
	let side_rot_mat = mat4.create()
	mat4.fromRotation(side_rot_mat, MOUSE_ROT_STEP_SIZE * mouse_offset_angle, side_rot_axis)

	// Sideways rotate the mouse around the ghost
	vec3.transformMat4(mouse_coords, mouse_coords, side_rot_mat)

	// Update the mouse object
	mouse.update(mouse_coords[0], mouse_coords[1], mouse_coords[2], 0.25, vec3.fromValues(0.3, 0.3, 1.))
}

// Example of how to initialize a disaster
// const disaster_pos = [-0.71, -0.71, 0.8]
// Posistion is automatically normalized so that the disaster is on the globe
// The parameters are: regl, resources, x, y, z, scale, mesh, color
// const disaster = init_disaster(regl, resources, disaster_pos[0], disaster_pos[1], disaster_pos[2], 0.3, plane_mesh, vec3.fromValues(1., 0., 0.))

function receive_disaster_blueprints(disaster_blueprints) {
	// Dump the old disasters
	disaster_list = []

	// Reuse the objects from the pool
	let cnt = 0
	disaster_blueprints.forEach(bp => {
		let dis = disaster_pool[cnt]
		cnt++

		dis.update(bp.x, bp.y, bp.z, bp.scale, vec3.fromValues(1., 0., 0.))
		disaster_list.push(dis)
	});
}

// List of DisasterActor objects to be rendered for currently selected year
let disaster_list = []
// List of DisasterActor to be reused - optimizing on allocation/deallocation
let disaster_pool = []
for (let i = 0; i < 2500; i++) {
	let dis = init_disaster(regl, resources, 1., 0., 0., 1., cube_mesh, vec3.fromValues(1., 0., 0.))
	disaster_pool.push(dis)
}

// Initial disaster load
load_data(currentYear, receive_disaster_blueprints)

// Controller to handle multiple keys
const controller = {
	"w": { pressed: false, func: move_forward },
	"a": { pressed: false, func: rotate_sideways.bind(null, true) },
	"d": { pressed: false, func: rotate_sideways.bind(null, false) },
}

// Event executor
const executeMoves = () => {
	for (const key of Object.keys(controller)) {
		if (controller[key].pressed) {
			controller[key].func()
		}
	}
}

function move_forward() {
	// Compute the rotation axis
	let rot_axis = vec3.create()
	vec3.cross(rot_axis, cam_up, down_vec)
	vec3.normalize(rot_axis, rot_axis)

	// Compute the rotation matrix
	let rot_mat = mat4.create()
	let speed = STEP_SIZE //controller.Shift.pressed ? STEP_SIZE * THROTLE : STEP_SIZE
	mat4.fromRotation(rot_mat, speed, rot_axis)

	// Rotate the camera position vector
	vec3.transformMat4(cam_pos, cam_pos, rot_mat)
	// Rotate the up vector
	vec3.transformMat4(cam_up, cam_up, rot_mat)
	// Rotate the look at vector
	vec3.transformMat4(lookAt, lookAt, rot_mat)

	// Rotate the down vector
	vec3.transformMat4(down_vec, down_vec, rot_mat)

	// Rotate the ghost position
	vec3.transformMat4(ghost_coords, ghost_coords, rot_mat)

	update_mouse()

	// Update the camera transform
	update_cam_transform()
}

function rotate_sideways(left = false) {
	// If we aren't moving, don't rotate
	if (controller.w.pressed == false) return
	// Compute the rotation axis
	let rot_axis = vec3.clone(down_vec)
	vec3.normalize(rot_axis, rot_axis)

	// Compute the rotation matrix
	let rot_mat = mat4.create()
	let speed = ROT_STEP_SIZE //controller.Shift.pressed ? ROT_STEP_SIZE * THROTLE : ROT_STEP_SIZE
	mat4.fromRotation(rot_mat, left ? -speed : speed, rot_axis)

	// Rotate the up vector
	vec3.transformMat4(cam_up, cam_up, rot_mat)
	// Rotate the look at vector
	vec3.transformMat4(lookAt, lookAt, rot_mat)

	// Rotate the down vector
	vec3.transformMat4(down_vec, down_vec, rot_mat)

	// Rotate the ghost position
	vec3.transformMat4(ghost_coords, ghost_coords, rot_mat)

	update_mouse()

	// Update the camera transform
	update_cam_transform()
}

function update_cam_transform() {
	const lookAtMat = mat4.lookAt(mat4.create(),
		cam_pos,
		lookAt,
		cam_up
	)

	mat4_matmul_many(mat_world_to_cam, lookAtMat)
}

update_cam_transform()

window.addEventListener('keydown', (event) => {
	if (event.key in controller) {
		controller[event.key].pressed = true
	}
})

window.addEventListener('keyup', (event) => {
	if (event.key in controller) {
		controller[event.key].pressed = false
	}
})


const l_pos = [0., 0., 0., 0.]
const c_pos = [0., 0., 0., 0.]

const plane_mat_world_to_cam = init_plane_camera()

regl.frame((frame) => {
	executeMoves()
	mat4.perspective(mat_projection,
		deg_to_rad * 35, // fovy
		frame.framebufferWidth / frame.framebufferHeight, // aspect ratio
		NEAR,
		FAR
	)

	vec3.transformMat4(l_pos, sun_pos, mat_view)
	mat4.copy(mat_view, mat_world_to_cam)

	const globe_info = {
		mat_projection: mat_projection,
		mat_view: mat_view,
		globe_texture: resources.globe_texture,
		globe_normals: resources.globe_normals,
		globe_heights: resources.globe_heights,
		c_pos: c_pos,
		l_pos: l_pos,
	}

	regl.clear({ color: [0.1, 0.1, 0.1, 1.] })
	globe.draw(globe_info)

	const plane_info = {
		mat_projection: mat_projection,
		mat_view: plane_mat_world_to_cam,
		plane_texture: resources.plane_texture,
	}

	plane.draw(plane_info)
	if (SHOW_MOUSE) {
		mouse.draw(globe_info)
	}

	disaster_list.forEach(obj => obj.draw(globe_info))
})