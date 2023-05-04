import {mat3, mat4, vec3} from "../lib/gl-matrix_3.3.0/esm/index.js"
import {mat4_matmul_many} from "../lib/icg_libs/icg_math.js"


export function init_plane(regl, resources, x, y, z, scale, mesh){
    const plane_mesh = mesh
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

    class PlaneActor{
        constructor(x, y, z, scale){
            // Create the transformation matrices
            this.mat_mvp = mat4.create()
            this.mat_model_view = mat4.create()
            let mat_model_to_world = mat4.create()
            //Create the normal matrix
            this.mat_normals = mat3.create()

            this.mat_model_to_world = mat4.translate( mat_model_to_world, mat_model_to_world, [x, y, z])
            this.mat_model_to_world = mat4.scale( mat_model_to_world, mat_model_to_world, [scale, scale, scale])
        }

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

    return new PlaneActor(x, y, z, scale)
}

export function init_plane_camera(){
    const cam_pos = vec3.scale(vec3.create(), vec3.normalize(vec3.create(),[0.,0.,-5., 1.]), 2)
    const lookAt = [0.,0.,0., 1.]
    const cam_up = [0.,1.,0.]
    const lookAtMat = mat4.lookAt(mat4.create(), cam_pos, lookAt, cam_up)
    return lookAtMat
}