varying vec2 vUV;
varying vec2 vShift;
varying vec4 vColor;
uniform float time;

float limit = 0.02;

float period;
float scale;

void main() {
  period = time *3.14 * 0.25;
  scale = 15. + 3. * sin(period);

  // calculate value for upper boundary
  vec2 va = smoothstep(vShift - scale * limit, vShift - limit, vUV);
  // add value for lower boundary
  va += 1. - smoothstep(limit, scale * limit, vUV);

  // limit minimum and maximum opacity
  float a = clamp(length(va), .15, .9);
  float b = 0.;
  // sharpen corners
  if (vUV.x < limit * 0.5 || vUV.y < limit * 0.5 || vUV.x > vShift.x - limit * 0.5 || vUV.y > vShift.y - limit * 0.5) {
    a = 1.;
  }

  gl_FragColor = vec4(vColor.x, vColor.y, vColor.z, a);
}
