// Autor: Zacharie Mizeret

import {mat3, mat4, vec3} from "../lib/gl-matrix_3.3.0/esm/index.js"
import {mat4_matmul_many} from "../lib/icg_libs/icg_math.js"


/**
 * Initialize a plane actor ready for REGL rendering pipeline.
 * 
 * @param {REGL} regl REGL instance
 * @param {Object} resources List of all REGL resources
 * @param {Number} x X coordinate of the plane (in world coordinates)
 * @param {Number} y Y coordinate of the plane (in world coordinates)
 * @param {Number} z Z coordinate of the plane (in world coordinates)
 * @param {Number} scale Scale of the plane mesh
 * @param {Object} mesh Plane mesh
 * 
 * @returns {PlaneActor} Plane actor
 */
export function init_plane(regl, resources, x, y, z, scale, mesh){
    const plane_mesh = mesh
    /**
     * REGL pipeline for drawing the plane.
     */
    const pipeline_draw_plane = regl({
        // Pass the vertex positions, normals and uv coordinates to the vertex shader
        attributes: {
            position: plane_mesh.vertex_positions,
            normals: plane_mesh.vertex_normals,
            uv: plane_mesh.vertex_tex_coords,
        },
        // Pass the faces to the shader
        elements: plane_mesh.faces,
        uniforms: {
            mat_mvp: regl.prop('mat_mvp'),
            mat_model_view: regl.prop('mat_model_view'),
            mat_normals: regl.prop('mat_normals'),
            plane_texture: regl.prop('plane_texture'),
        },
        vert: resources['shaders/plane.vert.glsl'],
        frag: resources['shaders/plane.frag.glsl'],
    })

    /**
     * Plane actor class. Has two main functions:
     * constructor: initializes the plane actor
     * draw: draws the plane actor
     */
    class PlaneActor{
        constructor(x, y, z, scale){
            // Create the transformation matrices
            this.mat_mvp = mat4.create()
            this.mat_model_view = mat4.create()
            let mat_model_to_world = mat4.create()
            //Create the normal matrix
            this.mat_normals = mat3.create()

            // Calculate the projection matrix to global coordinates
            this.mat_model_to_world = mat4.translate( mat_model_to_world, mat_model_to_world, [x, y, z])
            this.mat_model_to_world = mat4.scale( mat_model_to_world, mat_model_to_world, [scale, scale, scale])
        }
        /**
         * Function to draw the plane actor using REGL. All the parameters are taken as needed from the REGL pipeline.
         * As long as they are provided.
         */
        draw({mat_projection, mat_view, plane_texture}){
            mat4_matmul_many(this.mat_model_view, mat_view, this.mat_model_to_world)
            mat4_matmul_many(this.mat_mvp, mat_projection, this.mat_model_view)

            // Calculate the normal matrix
            mat3.fromMat4(this.mat_normals, this.mat_model_view)
            mat3.transpose(this.mat_normals, this.mat_normals)
            mat3.invert(this.mat_normals, this.mat_normals)

            pipeline_draw_plane({
                mat_mvp: this.mat_mvp,
                mat_model_view: this.mat_model_view,
                mat_normals: this.mat_normals,
                plane_texture: plane_texture,
            })
        }
    }
    // Return the plane actor
    return new PlaneActor(x, y, z, scale)
}

/**
 * Since the plane uses another camera to always render on top of the screen, we need to initialize the look at matrix for that camera.
 * @returns {mat4} Look at matrix for the plane camera
 */
export function init_plane_camera(){
    const cam_pos = vec3.scale(vec3.create(), vec3.normalize(vec3.create(),[0.,0.,-5., 1.]), 2)
    const lookAt = [0.,0.,0., 1.]
    const cam_up = [0.,1.,0.]
    const lookAtMat = mat4.lookAt(mat4.create(), cam_pos, lookAt, cam_up)
    return lookAtMat
}