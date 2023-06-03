// Disaster vertex shader
precision highp float;

// Attributes
attribute vec3 position;
attribute vec3 normals;

// Varyings
varying vec3 v_normal;

// Uniforms
uniform mat4 mat_mvp;
uniform mat4 mat_model_view;
uniform mat4 mat_normals;

/**
* Main
* Computes the position for each vertex (performs interpolation between the vertices of the triangle)
*/
void main(){
    // Pass the normal to the fragment shader
    v_normal = normals;
    // Compute the position of the vertex
    gl_Position = mat_mvp * vec4(position, 1.0);
}