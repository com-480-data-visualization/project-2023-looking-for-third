precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normals;

varying vec2 v2f_uv;
varying vec3 v2f_normals;

uniform mat4 mat_mvp;

void main(){
    vec4 position_4 = vec4(position, 1.);

    v2f_uv = vec2(uv.x, 1. - uv.y);
    v2f_normals = normals;

    gl_Position = mat_mvp * position_4;
}