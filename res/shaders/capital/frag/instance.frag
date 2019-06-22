uniform sampler2D texture;
varying vec2 vUV;
uniform float time;
varying vec4 vColor;

float blink(float pos) {
  float blink = sin((pos / 0.2 - 10. * time)* 1.);
  return (blink > .9) ? 1. : .7;
}

void main() {
  vec4 inputSample = texture2D( texture, vUV );

  float final = blink(vUV.y);
  float haze = .2 * sin(vUV.x*3.14) * cos(vUV.y*1.57) * sin(vUV.x*3.14);

  gl_FragColor = vec4((haze + final * inputSample.x) * vColor.x, (haze + final * inputSample.y) * vColor.y, (haze + final * inputSample.z) * vColor.z,  haze + final * inputSample.a);
}
