uniform sampler2D texture;
varying vec2 vUV;
varying vec4 vColor;
uniform float time;

vec2 centered(vec2 p) {
  return vec2(vUV.x - .5,vUV.y - .5);
}

float blink(float pos) {
  float b = 0.85*sin((pos / 0.2 - 10. * time));
  return .5 * smoothstep(.7, 1.,b);
}

void main() {
  vec4 inputSample = texture2D( texture, vUV );
  vec2 vCentered = centered(vUV);
  float rad =  .5 - min(length(vCentered), .5);
  gl_FragColor = vec4( vColor.xyz, rad + rad * blink(rad));
}
