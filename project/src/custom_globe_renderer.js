import {mat3, mat4, vec3} from "../lib/gl-matrix_3.3.0/esm/index.js"
import {mat4_matmul_many} from "../lib/icg_libs/icg_math.js"


export function init_globe(regl, resources, x, y, z, mesh){
    const sphere_mesh = mesh
    const pipeline_draw_globe = regl({
        // Pass the vertex positions, normals and uv coordinates to the vertex shader
        attributes: {
            position: sphere_mesh.vertices,
            normals: sphere_mesh.normals,
            uv: sphere_mesh.uvs,
        },
        // Pass the faces to the shader
        elements: sphere_mesh.faces,
        uniforms: {
            mat_mvp: regl.prop('mat_mvp'),
            mat_model_view: regl.prop('mat_model_view'),
            mat_normals: regl.prop('mat_normals'),
            globe_texture: regl.prop('globe_texture'),
            globe_normals: regl.prop('globe_normals'),
            globe_heights: regl.prop('globe_heights'),
            c_pos: regl.prop('c_pos'),
            l_pos: regl.prop('l_pos'),
        },
        vert: resources['shaders/globe.vert.glsl'],
        frag: resources['shaders/globe.frag.glsl'],
    })

    class GlobeActor{
        constructor(x, y, z){
            // Create the transformation matrices
            this.mat_mvp = mat4.create()
            this.mat_model_view = mat4.create()
            let mat_model_to_world = mat4.create()
            // Scale the model to world matrix by its scale
            
            //Create the normal matrix
            this.mat_normals = mat3.create()
            this.mat_model_to_world = mat4.translate( mat_model_to_world, mat_model_to_world, [x, y, z])
        }

        draw({mat_projection, mat_view, globe_texture, globe_normals, globe_heights, c_pos, l_pos}){
            // Calculate the model view matrix
            mat4_matmul_many(this.mat_model_view, mat_view, this.mat_model_to_world)
            mat4_matmul_many(this.mat_mvp, mat_projection, this.mat_model_view)

            // Calculate the normal matrix
            mat3.fromMat4(this.mat_normals, this.mat_model_view)
            mat3.transpose(this.mat_normals, this.mat_normals)
            mat3.invert(this.mat_normals, this.mat_normals)

            pipeline_draw_globe({
                mat_mvp: this.mat_mvp,
                mat_model_view: this.mat_model_view,
                mat_normals: this.mat_normals,
                globe_texture: globe_texture,
                globe_normals: globe_normals,
                globe_heights: globe_heights,
                c_pos: c_pos,
                l_pos: l_pos,
            })
        }
    }

    return new GlobeActor(x, y, z)
}