attribute vec2 shift;
attribute vec3 offset;
attribute vec4 orientation;
attribute vec3 color;
attribute vec2 value;
varying vec2 vShift;
varying vec2 vUV;
varying vec4 vColor;
uniform float weight;

vec3 applyQuaternionToVector( vec4 q, vec3 v ){
	return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
}

void main() {
  vUV = uv;
  vShift = shift;

  vec3 p = vec3(position.x, position.y * mix(value.x, value.y, weight), position.z);
  vec3 vPosition = applyQuaternionToVector( orientation, p );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( offset + vPosition, 1. );
  vColor = vec4( color, 1. );
}
