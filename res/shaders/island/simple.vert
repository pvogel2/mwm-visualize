varying vec2 vUV;
varying float height;
varying float pitch;

#if NUM_DIR_LIGHTS > 0
    struct DirectionalLight {
        vec3 direction;
        vec3 color;
        int shadow;
        float shadowBias;
        float shadowRadius;
        vec2 shadowMapSize;
     };
     uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
#endif
varying vec4 vColor;

void main() {
  float r = directionalLights[0].color.r;
  vColor = vec4(directionalLights[0].color, 1.);
  vUV = uv;
  height = position.y;
  pitch = dot(vec3(0., 1., 0.), normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
}
