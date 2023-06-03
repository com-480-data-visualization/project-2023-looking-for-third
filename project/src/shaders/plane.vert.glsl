// Plane vertex shader
precision highp float;

// Attributes
attribute vec3 position;
attribute vec2 uv;
attribute vec3 normals;

// Varyings
varying vec2 v2f_uv;
varying vec3 v2f_normals;

// Uniforms
uniform mat4 mat_mvp;

void main(){
    // Calculate the position of the vertex
    vec4 position_4 = vec4(position, 1.);

    // Pass the uv and normals to the fragment shader
    v2f_uv = vec2(uv.x, 1. - uv.y);
    v2f_normals = normals;

    // Set the position of the vertex
    gl_Position = mat_mvp * position_4;
}