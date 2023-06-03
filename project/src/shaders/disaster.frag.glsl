// Disaster fragment shader
precision highp float;

// Uniforms
uniform vec3 disaster_color;

// Varyings
varying vec3 v_normal;

// Constants
const vec3 dir_to_light = normalize(vec3(0., 0., -1.));
const vec3 ambient = vec3(0.1, 0.1, 0.1);

/**
* Main function
* Computes the color for each point passed by the vertex shader
*/
void main() {
    // Compute ambient component
    vec3 color = ambient * disaster_color;

    // Compute diffuse coefficient based on angles
    float diffuse = max(dot(v_normal, dir_to_light), 0.);

    // Add diffuse component to color
    color += diffuse * disaster_color;

    // Set output color
    gl_FragColor = vec4(color, 1.);
}