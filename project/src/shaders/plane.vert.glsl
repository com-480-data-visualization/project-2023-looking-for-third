precision highp float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 v2f_uv;

uniform mat4 mat_mvp;

void main(){
    vec4 position_4 = vec4(position, 1.);

    v2f_uv = vec2(uv.x, 1. - uv.y);

    gl_Position = mat_mvp * position_4;
}