/*
Shader to render the globe terrain generated by globe.js.
*/
precision highp float;

// Attributes passed to the vertex shader
attribute vec3 position;
attribute vec3 normals;
attribute vec2 uv;

varying vec2 v2f_uv;

varying vec3 v2f_dir_from_camera;
varying vec3 v2f_dir_to_light;
varying float v2f_dist_to_light;

// Uniforms passed to the vertex shader
uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat3 mat_normals;

uniform vec4 c_pos;
uniform vec4 l_pos;

uniform sampler2D globe_heights;

const float displacement_strength = 0.1;
void main(){
    float displacement = 1.; //1. + (texture2D(globe_heights, uv).r * displacement_strength);

    vec4 position_4 = vec4(position * displacement, 1.0);

    v2f_uv = uv;

    vec4 camera_pos = mat_model_view * position_4;
    v2f_dir_from_camera = normalize(vec3(camera_pos));
    v2f_dir_to_light = normalize(vec3(l_pos - camera_pos));
    // Pass the vertex position to the fragment shader
    gl_Position = mat_mvp * position_4;
}