varying vec2 vUV;
varying vec4 vColor;
attribute vec3 offset;
attribute vec3 color;
attribute vec4 orientation;
attribute float scale;

vec3 applyQuaternionToVector( vec4 q, vec3 v ){
	return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
}

void main() {
  vUV = uv;
  vec3 vPosition = applyQuaternionToVector( orientation, position );
  gl_Position = projectionMatrix * modelViewMatrix * vec4( offset + vPosition*scale, 1.0 );
  vColor = vec4( color, 1.0 );
}