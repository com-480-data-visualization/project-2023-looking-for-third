//Author: Zacharie Mizeret (modified by Andrija Kolić)

import { mat3, mat4, vec3 } from "../lib/gl-matrix_3.3.0/esm/index.js"
import { mat4_matmul_many } from "../lib/icg_libs/icg_math.js"

/**
 * 
 * @param {REGL} regl REGL instance
 * @param {*} resources Dictionary of all REGL resources
 * @param {Number} x X coordinate (in world coordinates)
 * @param {Number} y Y coordinate (in world coordinates)
 * @param {Number} z Z coordinate (in world coordinates)
 * @param {Number} scale Scale of the disaster mesh
 * @param {Mesh} mesh Mesh of the disaster
 * @param {vec3} color Color of the disaster
 * @returns {DisasterActor} Disaster actor ready for REGL rendering pipeline
 */
export function init_disaster(regl, resources, x, y, z, scale, mesh, color) {
    const disaster_mesh = mesh
    /**
     * REGL pipeline for drawing the disaster.
     */
    const pipeline_draw_disaster = regl({
        // Pass the vertex positions, normals and uv coordinates to the vertex shader
        attributes: {
            position: disaster_mesh.vertex_positions,
            normals: disaster_mesh.vertex_normals,
            uv: disaster_mesh.vertex_tex_coords,
        },

        // Pass the faces to the shader
        elements: disaster_mesh.faces,
        uniforms: {
            mat_mvp: regl.prop('mat_mvp'),
            mat_model_view: regl.prop('mat_model_view'),
            mat_normals: regl.prop('mat_normals'),
            disaster_color: regl.prop('disaster_color'),
        },
        vert: resources['shaders/disaster.vert.glsl'],
        frag: resources['shaders/disaster.frag.glsl'],
    })

    /**
     * Disaster actor class. Has two main functions:
     * constructor: initializes the disaster actor
     * draw: draws the disaster actor
     */
    class DisasterActor {
        constructor(x, y, z, scale, c_color) {
            this.visible = true
            this.type = 'Earthquake'
            this.update(x, y, z, scale, c_color)
        }

        /**
         * 
         * @param {Number} x X coordinate (in world coordinates)
         * @param {Number} y Y coordinate (in world coordinates)
         * @param {Number} z Z coordinate (in world coordinates)
         * @param {Number} scale Scale of the disaster mesh
         * @param {vec3} c_color Color of the disaster
         * @param {String} type Type of the disaster
         * @param {Boolean} set_passive Whether to set the passive color to the color given
         * @param {Boolean} visible Whether the disaster is visible
         */
        update(x, y, z, scale, c_color, type, set_passive = true, visible = true) {
            this.color = c_color
            this.type = type
            this.visible = visible
            if (set_passive) {
                this.passive_color = c_color
            }
            // Create the transformation matrices
            this.mat_mvp = mat4.create()
            this.mat_model_view = mat4.create()
            let mat_model_to_world = mat4.create()
            //Create the normal matrix
            this.mat_normals = mat3.create()

            // Calculate the object and globe normals at that poitn
            const normal = vec3.fromValues(0, 0, -1)
            // Globe normal is just the normalized position (since the globe is at the origin)
            const globe_normal = vec3.fromValues(x, y, z)
            // Normalize both vectors for the rotation
            vec3.normalize(normal, normal)
            vec3.normalize(globe_normal, globe_normal)

            this.position = globe_normal

            // Find the rotation axis
            const rot_axis = vec3.create()
            vec3.cross(rot_axis, normal, globe_normal)
            vec3.normalize(rot_axis, rot_axis)

            // Find the angle between the two vectors
            const angle = Math.acos(vec3.dot(normal, globe_normal))

            // Create the model to world matrix
            this.mat_model_to_world = mat4.translate(mat_model_to_world, mat_model_to_world, globe_normal)
            this.mat_model_to_world = mat4.scale(mat_model_to_world, mat_model_to_world, [scale, scale, scale])
            this.mat_model_to_world = mat4.rotate(this.mat_model_to_world, this.mat_model_to_world, angle, rot_axis)
        }

        /**
         * Set the color of the disaster
         * @param {vec3} c_color Color of the disaster
         */
        set_color(c_color) {
            this.color = c_color
        }

        /**
         * Update the scale of the disaster
         * @param {Number} scale Scale of the disaster mesh
         */
        set_scale(scale) {
            this.update(this.position[0], this.position[1], this.position[2], scale, this.color, this.type, false, this.visible)
        }

        /**
         * Set the blueprint index of the disaster.
         * @param {Number} index Index of the blueprint in the blueprint array
         */
        set_blueprint_index(index) {
            this.blueprint_index = index
        }

        /**
         * Draw the disaster actor.
         */
        draw({ mat_projection, mat_view }) {

            mat4_matmul_many(this.mat_model_view, mat_view, this.mat_model_to_world)
            mat4_matmul_many(this.mat_mvp, mat_projection, this.mat_model_view)

            // Calculate the normal matrix
            mat3.fromMat4(this.mat_normals, this.mat_model_view)
            mat3.transpose(this.mat_normals, this.mat_normals)
            mat3.invert(this.mat_normals, this.mat_normals)

            pipeline_draw_disaster({
                mat_mvp: this.mat_mvp,
                mat_model_view: this.mat_model_view,
                mat_normals: this.mat_normals,
                disaster_color: this.color,
            })
        }

    }

    // Return the disaster actor
    return new DisasterActor(x, y, z, scale, color)
}