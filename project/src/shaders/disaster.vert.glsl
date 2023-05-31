precision highp float;


attribute vec3 position;
attribute vec3 normals;

varying vec3 v_normal;

uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat4 mat_normals;


void main(){
    v_normal = normals;
    gl_Position = mat_mvp * vec4(position, 1.0);
}