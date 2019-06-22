varying vec2 vUV;
varying float height;
varying float pitch;

#if NUM_DIR_LIGHTS > 0
    struct DirectionalLight {
        vec3 direction;
        vec3 color;
        // int shadow;
        // float shadowBias;
        // float shadowRadius;
        // vec2 shadowMapSize;
     };

     uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
#endif

varying vec3 vNormal;
varying float directionalStrength;

void main() {
  vUV = uv;

  height = position.y;
  pitch = dot(vec3(0., 1., 0.), normal);

  vNormal = normalMatrix * normal;
  directionalStrength = max(dot(vNormal, normalize(directionalLights[ 0 ].direction)), 0.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
}
