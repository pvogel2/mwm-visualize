uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D texture3;
varying vec2 vUV;
varying float height;
varying float pitch;
varying vec4 vColor;

void main() {
  vec4 inputSample1 = texture2D( texture1, vUV );
  vec4 inputSample2 = texture2D( texture2, vUV );
  vec4 inputSample3 = texture2D( texture3, vUV );
  float h = smoothstep(40., 65., height);
  gl_FragColor = vColor * mix(inputSample3, mix(inputSample1, inputSample2, h), pitch * pitch * pitch);
}
