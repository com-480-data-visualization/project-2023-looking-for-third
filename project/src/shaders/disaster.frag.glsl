precision highp float;

uniform vec3 disaster_color;

varying vec3 v_normal;

const vec3 dir_to_light = normalize(vec3(0., 0., -1.));
const vec3 ambient = vec3(0.1, 0.1, 0.1);
void main() {
    // Compute ambient component
    vec3 color = ambient * disaster_color;

    // Compute diffuse coefficient based on angles
    float diffuse = max(dot(v_normal, dir_to_light), 0.);

    // Add diffuse component to color
    color += diffuse * disaster_color;
    gl_FragColor = vec4(color, 1.);
}