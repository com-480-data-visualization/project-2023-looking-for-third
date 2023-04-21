precision highp float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 v2f_uv;

uniform mat_mvp;

void main(){
    vec4 position_4 = vec4(position, 1.);

    gl_Position = position_4;
}