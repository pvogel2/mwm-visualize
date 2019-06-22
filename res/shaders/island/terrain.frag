uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D texture3;

varying vec2 vUV;
varying float height;
varying float pitch;
varying vec3 vNormal;
varying float directionalStrength;

float ambientStrength = 0.3;
vec3 ambientColor = vec3(1., 1. , 1.);

vec3 directionalColor = vec3(0., 0., 0.);

#if ( NUM_DIR_LIGHTS > 0 )
  
    struct DirectionalLight {
        vec3 direction;
        vec3 color;
    };
  
    uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];

#endif

void main() {
  #if ( NUM_DIR_LIGHTS > 0 )
  
    #pragma unroll_loop
    for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
      directionalColor += directionalLights[ i ].color * directionalStrength;
    }
  #endif

  vec4 inputSample1 = texture2D( texture1, vUV );
  vec4 inputSample2 = texture2D( texture2, vUV );
  vec4 inputSample3 = texture2D( texture3, vUV );
  float h = smoothstep(40., 65., height);
  vec4 diffuseColor = mix(inputSample3, mix(inputSample1, inputSample2, h), pitch * pitch * pitch);

  gl_FragColor = vec4(directionalColor + ambientStrength * ambientColor, 1.)  * diffuseColor;
}
