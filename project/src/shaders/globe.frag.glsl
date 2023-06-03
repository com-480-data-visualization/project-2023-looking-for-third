/*
Shader to render the color of the globe terrain, using a uniform to determine the color.
*/
precision highp float;

// Varyings
varying vec3 v2f_normal;
varying vec2 v2f_uv;
varying vec3 v2f_dir_from_camera;
varying vec3 v2f_dir_to_light;
varying float v2f_dist_to_light;

// Uniforms
uniform sampler2D globe_texture;
uniform sampler2D globe_normals;
uniform mat3 mat_normals;

// Constants
const vec3 ambient = vec3(0.06,0.06,0.06);
const vec3 sun_color = normalize(vec3(0.6,0.6,0.6));
const vec3 dir_to_light = normalize(vec3(1.0,1.0,1.0));

/**
* Main function, called for each pixel to determine its color.
*/
void main() {
    // Get the color from the texture.
    vec3 t_color = texture2D(globe_texture, v2f_uv).rgb;
    // Get the normal from the normal map
    vec3 normal  = normalize(texture2D(globe_normals, v2f_uv).rgb);
    
    //Compute the ambient and diffuse lighting.
    vec3 color = ambient * t_color;
    float diffuse = max(dot(normal, dir_to_light), 0.0);
    color += diffuse * t_color * sun_color;

    // Set the output color.
    gl_FragColor = vec4(color, 1.0);
}
