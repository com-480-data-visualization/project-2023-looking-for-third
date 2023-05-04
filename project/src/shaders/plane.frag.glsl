precision highp float;
varying vec2 v2f_uv;

uniform sampler2D plane_texture;

void main(){
    vec3 color = texture2D(plane_texture, v2f_uv).rgb;
    gl_FragColor = vec4(color, 1.);
}