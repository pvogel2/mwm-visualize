class PillarTemplate {
  constructor(config) {
    this.color = config.color ? config.color : 0xffffff;
    this._createGeometry();
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
        scale:{type: "f", value: 0.0}
      };

      var material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        transparent: true,
        depthWrite: true,
        vertexShader:   vertShader,
        fragmentShader: fragShader
      });
      material.side = THREE.DoubleSide;

      var pScaler = {
          totalTime: 0.5,
          startTime: 0.0,
          currentValue: 0.0,
          up: renderer => {
            renderer.registerEventCallback('render', (data) => {
              if (pScaler.startTime === 0.0) {
                pScaler.startTime = data.elapsedTime;
              }
              if (pScaler.currentValue < 1.0) {
                pScaler.currentValue = Math.min((data.elapsedTime - pScaler.startTime) / pScaler.totalTime, 1.0);
                material.uniforms.scale.value = pScaler.currentValue;
              }
            });
          }
      };

      pScaler.up(renderer)
      return new THREE.Mesh( this._geometry, material );
  }
}