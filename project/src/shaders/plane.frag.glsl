precision highp float;
varying vec2 v2f_uv;
varying vec3 v2f_normals;

uniform sampler2D plane_texture;

const vec3 dir_to_light = normalize(vec3(0., -1., 0.));
const vec3 ambient = vec3(0.1, 0.1, 0.1);
const vec3 sun_color = vec3(0.85, 0.85, 0.85);
void main(){
    vec3 t_color = texture2D(plane_texture, v2f_uv).rgb;
    vec3 color = ambient * t_color;
    float diffuse = max(dot(v2f_normals, dir_to_light), 0.);
    color += diffuse * sun_color * t_color;
    gl_FragColor = vec4(color, 1.);
}