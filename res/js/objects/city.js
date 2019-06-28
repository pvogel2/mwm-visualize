class CityTemplate {
  constructor() {
    this._createGeometry();
  }

  get geometry() {
    return this._geometry;
  }

  _createGeometry() {
    var verticesCount = 12;
    var positions = [
      -0.3, 0.0, 0.0,    -0.3, 1.0, 0.0,    0.3, 1.0, 0.0,    0.3, 0.0, 0.0,
      0.0, 0.0, -0.3,    0.0, 1.0, -0.3,    0.0, 1.0, 0.3,    0.0, 0.0, 0.3,
      -0.3, 0.0, -0.3,    -0.3, 0.0, 0.3,    0.3, 0.0, 0.3,    0.3, 0.0, -0.3
    ];

    var uvs = [
      0.0, 0.0,    0.0, 1.0,    1.0, 1.0,    1.0, 0.0,
      0.0, 0.0,    0.0, 1.0,    1.0, 1.0,    1.0, 0.0,
      0.0, 0.0,    0.0, 1.0,    1.0, 1.0,    1.0, 0.0
    ];

    var indices = [8, 9, 10,   8, 10, 11,    0, 1, 2,    0, 2, 3,    4, 5, 6,    4, 6, 7];

    /**currently inversion needed to compensate a inversion problem from using quaternions*/
    for (var i = 0; i< 24; i++) {
      positions[i] = positions[i]*-1.0;
    }

    this._geometry = new THREE.InstancedBufferGeometry();
    this._geometry.setIndex( indices );

    this._geometry.addGroup(0, 6, 1);
    this._geometry.addGroup(6, 12, 0);

    this._geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
    this._geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
  }

  async getMesh(renderer) {
    var fileLoader = new THREE.FileLoader();
    const fragShaders = [];
    let vertShaders;
    try {
      const instanceFrag = await new Promise((resolve) => {//6
        fileLoader.load('/res/shaders/capital/frag/instance.frag', (data) => {
          resolve(data);
        });
      });
      fragShaders.push(instanceFrag);
      const simpleFrag = await new Promise((resolve) => {//6
        fileLoader.load('/res/shaders/capital/frag/simple.frag', (data) => {
          resolve(data);
        });
      });
      fragShaders.push(simpleFrag); 
      
      vertShaders = await new Promise((resolve) => {//7
        fileLoader.load('/res/shaders/capital/vert/instance.vert', (data) => {
          resolve(data);
        });
      });
    } catch(e) {
      console.log('errors', e);
    }

    const p_uniforms0 = {
        texture:   { type: "t", value: renderer.getTexture( "pin.png" ) },
        time:{type:"f", value: 0.0}
    };
    const p_uniforms1 = {
        texture:   { type: "t", value: renderer.getTexture( "disc.png" ) },
        time:{type:"f", value: 0.0}
    };

    var p_material0 = new THREE.ShaderMaterial( {
      uniforms: p_uniforms0,
      transparent: true,
      depthWrite: false,
      vertexShader:   Array.isArray(vertShaders) ? vertShaders[0] : vertShaders,
      fragmentShader: Array.isArray(fragShaders) ? fragShaders[0] : fragShaders
    });
    p_material0.side = THREE.DoubleSide;

    var p_material1 = new THREE.ShaderMaterial( {
      uniforms: p_uniforms1,
      transparent: true,
      depthWrite: false,
      vertexShader:   Array.isArray(vertShaders) ? vertShaders[1] : vertShaders,
      fragmentShader: Array.isArray(fragShaders) ? fragShaders[1] : fragShaders
    });
    p_material1.side = THREE.DoubleSide;

    renderer.registerEventCallback('render', function(data) {
      p_material0.uniforms.time.value += 0.01;
      p_material1.uniforms.time.value += 0.01;
    });

    return new THREE.Mesh( this._geometry, [p_material0, p_material1] );
  }
}