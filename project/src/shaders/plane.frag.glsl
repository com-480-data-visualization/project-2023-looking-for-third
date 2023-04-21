precision highp float;
varying vec2 v2f_uv;

uniform sampler2D texture;

void main(){
    vec3 color = texture2D(texture, v2f_uv).rgb;
    gl_FragColor = vec4(color, 1.);
}