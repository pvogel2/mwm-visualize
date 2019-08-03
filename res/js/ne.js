class NECtrl {
  constructor(element) {
    this.worker = new Worker('/res/js/assets/worldworker.js');

    this.element_ = element;

    this.features = {
      cities: {color: 0x00ff33, dbType: 'dbase', dbId: 'populatedplaces'},
      rivers: {color: 0x0044ff, dbType: 'three', dbId: 'rivers'},
      lakes: {color: 0x0000aa, dbType: 'three', dbId: 'lakes'},
      geolines: {color: 0x999999, dbType: 'three', dbId: 'geolines'},
      coastline: {color: 0xffffff, dbType: 'three', dbId: 'coastline'},
      boundariesland: {color: 0x666666, dbType: 'three', dbId: 'boundariesland'}
    };

    this.worker.addEventListener('message', this);

    this.citiesSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#ne-cities-switch'));
    this.citiesSwitch.nativeControl_.addEventListener('change', event => {
      if(this.citiesSwitch.checked) {
        this.loadFeature('cities');
      } else {
        this.unloadFeature('cities');
      }
    });

    this.riversSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#ne-rivers-switch'));
    this.riversSwitch.nativeControl_.addEventListener('change', event => {
      if(this.riversSwitch.checked) {
        this.loadFeature('rivers');
      } else {
        this.unloadFeature('rivers');
      }
    });

    this.lakesSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#ne-lakes-switch'));
    this.lakesSwitch.nativeControl_.addEventListener('change', event => {
      if(this.lakesSwitch.checked) {
        this.loadFeature('lakes');
      } else {
        this.unloadFeature('lakes');
      }
    });
    this.geolinesSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#ne-geolines-switch'));
    this.geolinesSwitch.nativeControl_.addEventListener('change', event => {
      if(this.geolinesSwitch.checked) {
        this.loadFeature('geolines');
      } else {
        this.unloadFeature('geolines');
      }
    });
  }

  hide() {
    this.element_.style.display = 'none';
  }

  show() {
    this.element_.style.display = '';
  }

  handleEvent(event) {
    switch(event.type) {
      case 'message':
        const neEvent = new CustomEvent('NE:featureLoaded', { detail: event.data });
        document.dispatchEvent(neEvent);
        break;
      default:;
    }
  }

  loadFeature(id) {
    const feature = this.features[id];
    this.worker.postMessage(feature);
  }

  unloadFeature(id) {
    const feature = this.features[id];
    const neEvent = new CustomEvent('NE:unloadFeature', { detail: feature.dbId });
    document.dispatchEvent(neEvent);
  }
};

class NEThreeCities extends WorldThreeObject {
  constructor(config) {
    super(config);
    this.objId = 'sizedCities';

    this.city = new CityTemplate();

    this.rankmaxMap = [
      {size:110, color: new THREE.Color( 0, 1, 0)},
      {size:110, color: new THREE.Color( 0, 1, 0)},
      {size:110, color: new THREE.Color( 0, 1, 0)},
      {size:110, color: new THREE.Color( 0, 1, 0)},
      {size:120, color: new THREE.Color( 0, 1, 0)},
      {size:120, color: new THREE.Color( 0, 1, 0)},
      {size:120, color: new THREE.Color( 0, 1, 0)},
      {size:140, color: new THREE.Color( 0, 1, 0)},
      {size:140, color: new THREE.Color( 0, 1, 0)},
      {size:180, color: new THREE.Color( 0.2, 0.8, 0)},
      {size:260, color: new THREE.Color( 0.4, 0.6, 0)},
      {size:420, color: new THREE.Color( 0.6, 0.4, 0)},
      {size:520, color: new THREE.Color( 0.8, 0.2, 0)},
      {size:620, color: new THREE.Color( 1, 0.2, 0)},
      {size:700, color: new THREE.Color( 1, 0, 0)}
    ]
    this.sizeMax = this.rankmaxMap[this.rankmaxMap.length -1].size;
  }

  async attach(renderer, parent) {
    this.renderer = renderer;
    const instances = this.data.length;
    const colors = [];
    const offsets = [];

    const orientations = [];
    const scales = [];

    let s0;

    for(let i = 0; i < instances; i++) {
      var date = this.data[i];
      s0 = this.calcSphericalFromLatLongRad(date.lat ? date.lat : date[1], date.long ? date.long : date[0], 20.0);
      const v0 = new THREE.Vector3().setFromSpherical(s0);
      v0.toArray(offsets, i * 3);
      this.pushOrientationFromSpherical(s0, orientations);

      const rankmax = this.getRankMax(date.rankmax);
      rankmax.color.toArray(colors, i * 3);
      scales.push(rankmax.size / this.sizeMax);
    }

    this.city.geometry.maxInstancedCount = instances;
    this.city.geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array( scales ), 1 ) );
    this.city.geometry.addAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 3 ) );
    this.city.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
    this.city.geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ) );

    this.mesh = await this.city.getMesh(renderer);
    renderer.addObject(this.objId, this.mesh, false, parent);
  }

  getRankMax(rankmax) {
    return this.rankmaxMap[rankmax];
  }
}

class NEThreeFeature extends WorldThreeObject {
  constructor(config) {
    super(config);
  }

  async attach(renderer, parent) {
    this.renderer = renderer;

    const length = this.data.length;
    const s_geometry = new THREE.BufferGeometry();
    const s_positions = new Float32Array( length * 3 );
    const s_colors = new Float32Array( length * 3 );
    const s_helpers = new Float32Array( length );

    const pointColor = new THREE.Color(this.color);
    for (let i = 0; i < length; i++) {
        const date = this.data[i];
        let v0;
        if (date[2] === 1.0) {
          v0 = new THREE.Vector3();
          s_helpers[i] = 1.0;
        } else {
          v0 = new THREE.Vector3().setFromSpherical(this.calcSphericalFromLatLongRad(date[1], date[0], 20));
          s_helpers[i] = 0.0;
        }
        
        v0.toArray(s_positions, i * 3);
        pointColor.toArray(s_colors, i * 3);
    }
    s_geometry.addAttribute( 'position', new THREE.BufferAttribute( s_positions, 3 ));
    s_geometry.addAttribute( 'color', new THREE.BufferAttribute( s_colors, 3 ));
    s_geometry.addAttribute( 'helper', new THREE.BufferAttribute( s_helpers, 1 ));
    // s_geometry.addAttribute( 'size', new THREE.BufferAttribute( s_sizes, 1 ));
    // s_geometry.dynamic = true;
    // var s_material = new THREE.LineBasicMaterial( { color: color || 0xffffff } );
    const vertexShader = 'varying vec4 vColor;'
      + 'attribute float helper;'
      + 'void main() {'
      + 'vColor = vec4( color, 1. - helper );'
      + 'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );'
      + '}';

    const fragmentShader = 'varying vec4 vColor;'
      + 'void main() {'
      + 'float a = vColor.a < 1. ? 0. : 1.;'
      + 'gl_FragColor = vec4(vColor.xyz, a);'
      + '}';
    const s_material = new THREE.ShaderMaterial({
      //clipping: true,
      transparent: true,
      //depthWrite: false,
      vertexColors: THREE.VertexColors,
      //blending : THREE.AdditiveBlending,
      vertexShader : vertexShader,
      fragmentShader : fragmentShader
    });

    this.line = new THREE.Line( s_geometry, s_material );
    renderer.addObject(this.objId, this.line, false, parent);
  }
}