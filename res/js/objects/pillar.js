class PillarTemplate {
  constructor(config) {
    this.color = config.color ? config.color : 0xffffff;
    this._createGeometry();
  }

  static triggerTransition(mesh, config) {
    mesh.userData.transition_duration = config.duration || 0.5;
    mesh.userData.transition_start = 0.0;
    mesh.userData.transition_running = true;
    mesh.userData.transition_from = mesh.material.uniforms.weight.value;
    mesh.userData.transition_to = config.target;
  }

  get geometry() {
    return this._geometry;
  }

  _createGeometry() {
    this._geometry = new THREE.InstancedBufferGeometry();
    var height = 5;
    var b = new THREE.BoxBufferGeometry(0.2, 0.2 * height, 0.2);
    var verticesCount = 24;
    var positions = [
      0.1, 1.0, 0.1,
      0.1, 1.0, -0.1,
      0.1, 0.0, 0.1,
      0.1, 0.0, -0.1,
      -0.1, 1.0, -0.1,
      -0.1, 1.0, 0.1,
      -0.1, 0.0, -0.1,
      -0.1, 0.0, 0.1,
      -0.1, 1.0, -0.1,
      0.1, 1.0, -0.1,
      -0.1, 1.0, 0.1,
      0.1, 1.0, 0.1,
      -0.1, 0.0, 0.1,
      0.1, 0.0, 0.1,
      -0.1, 0.0, -0.1,
      0.1, 0.0, -0.1,
      -0.1, 1.0, 0.1,
      0.1, 1.0, 0.1,
      -0.1, 0.0, 0.1,
      0.1, 0.0, 0.1,
      0.1, 1.0, -0.1,
      -0.1, 1.0, -0.1,
      0.1, 0.0, -0.1,
      -0.1, 0.0, -0.1
    ];

    var colors = [];
    var cityColor = new THREE.Color(this.color);
    for (var i = 0; i < verticesCount; i++) {
      cityColor.toArray(colors, i * 3);
    }

    for (var i = 0; i< positions.length; i++) {
      positions[i] = positions[i]*-1.0;
    }
    var uvs = [
      0, height, 1, height, 0, 0, 1, 0, //rechts
      0, height, 1, height, 0, 0, 1, 0, //links
      0, 1, 1, 1, 0, 0, 1, 0, //oben
      0, 1, 1, 1, 0, 0, 1, 0, //unten
      0, height, 1, height, 0, 0, 1, 0, //front
      0, height, 1, height, 0, 0, 1, 0]; //back

    var shifts = [
      1, height, 1, height, 1, height, 1, height, //rechts
      1, height, 1, height, 1, height, 1, height, //rechts
      1, 1, 1, 1, 1, 1, 1, 1, //oben
      1, 1, 1, 1, 1, 1, 1, 1, //unten
      1, height, 1, height, 1, height, 1, height, //rechts
      1, height, 1, height, 1, height, 1, height]; //rechts

    var indices = [];
    for (var i = 0; i < b.index.array.length; i++) {
      indices.push(b.index.array[i]);
    };

    this._geometry.setIndex( indices );
    this._geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
    this._geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
    this._geometry.addAttribute( 'shift', new THREE.Float32BufferAttribute( shifts, 2 ) );
    this._geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( new Float32Array( colors ), 3 ) );
  }

  async getMesh(renderer) {
    var fileLoader = new THREE.FileLoader();
    let fragShader;
    let vertShader;
    try {
      fragShader = await new Promise((resolve) => {//8
        fileLoader.load('/res/shaders/block/frag/instanceSimple.frag', (data) => {
          resolve(data);
        });
      });
      
      vertShader = await new Promise((resolve) => {//9
        fileLoader.load('/res/shaders/block/vert/instanceSimple.vert', (data) => {
          resolve(data);
        });
      });
    } catch(e) {
      console.log('errors', e);
    }

    const uniforms = {
        time:{type: "f", value: 0.0},
        weight:{type: "f", value: 0.0}
      };

      var material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        transparent: true,
        depthWrite: true,
        vertexShader:   vertShader,
        fragmentShader: fragShader
      });
      material.side = THREE.DoubleSide;

      const mesh = new THREE.Mesh( this._geometry, material );
      mesh.userData.transition_duration = 0.5; 
      mesh.userData.transition_start = 0.0; 
      mesh.userData.transition_running = false;
      mesh.userData.transition_from = 0.0;
      mesh.userData.transition_to = 1.0;

      renderer.registerEventCallback('render', (data) => {
        if (mesh.userData.transition_running === true) {
          if (mesh.userData.transition_start === 0.0) {
            mesh.userData.transition_start = data.elapsedTime;
          }
          const delta = Math.min((data.elapsedTime - mesh.userData.transition_start) / mesh.userData.transition_duration, 1.0);
          material.uniforms.weight.value = (1.0 - delta) * mesh.userData.transition_from + delta * mesh.userData.transition_to;
          if (delta >= 1.0) {
            mesh.userData.transition_running = false;
            mesh.userData.transition_start = 0.0;
          }
        }
      });

      return mesh;
  }
}