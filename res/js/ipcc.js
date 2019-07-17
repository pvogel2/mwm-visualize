class IPCC {
  constructor(element) {
    this.element_ = element;
    this.timeIndex_ = -1;
    this.structure_ = {};
    this.textureMap = null;

    const slider = this.element_.querySelector('.mdc-slider.ipcc-time-slider');
    if (slider) {
      this.slider_ = new mdc.slider.MDCSlider(slider);
      
      this.slider_.listen('MDCSlider:change', () => {
        this.update(this.slider_.value);
      });
    }
    const threecontainer = document.querySelector('.ipcc-threejs-map');
    if (threecontainer) {
      this.threejs = {
        renderer: new THREE.WebGLRenderer(),
        scene: new THREE.Scene(),
        width: 400,
        hight: 200,
      }
      this.threejs.renderer.setSize(this.threejs.width, this.threejs.hight);
      this.threejs.camera = new THREE.OrthographicCamera(
        this.threejs.width / -2, this.threejs.width / 2,
        this.threejs.hight / 2, this.threejs.hight / -2,
        0.1, 1000
      );
      this.threejs.camera.position.z = 5;
      threecontainer.appendChild(this.threejs.renderer.domElement);
    }
  }

  loadStructure() {
    const pStructure= fetch(`/data/ipcc/structure`);

    pStructure.then(
      response => response.json()
    ).then(json => {
      this.structure_ = json;
      this.timeIndex_ = this.structure_.recordDimension.length - 1;

      for (let i = 0; i < this.structure_.globalAttributes.length; i++) {
        const attr = this.structure_.globalAttributes[i];
        if (attr.name === 'title') {
          this.element_.querySelector('.ipcc_glob_title').innerText = attr.value;
        } else if (attr.name === 'institution') {
          this.element_.querySelector('.ipcc_glob_institution').innerText = attr.value;
        }
      }
      if (this.slider_) {
        this.slider_.min = this.calcYear_(this.structure_.indexValues[0]);
        this.slider_.max = this.calcYear_(this.structure_.indexValues[this.structure_.recordDimension.length - 1]);
        this.element_.querySelector('.ipcc-time-slider__min-label').innerText = this.slider_.min;
        this.element_.querySelector('.ipcc-time-slider__max-label').innerText = this.slider_.max;
     }
      this.updateUI();
      this.element_.style.display = 'block';
      this.slider_.layout();
      ipcc.loadTempAnomaly(this.structure_.recordDimension.length - 1);
    }).catch(function(err) {
      console.log('err', err);
    });
  }

  calcYear_(days) {
    return Math.floor(days / 365) + 1850;
  }

  updateUI(texture) {
    const year = this.calcYear_(this.structure_.indexValues[this.timeIndex_]);
    this.element_.querySelector('.ipcc_time .mdc-list-item__primary-text').innerText = year;
    if (this.textureMap) {
      this.threejs.scene.remove(this.textureMap);
    }
    if (texture) {
      const geometry = new THREE.PlaneGeometry( this.threejs.width, this.threejs.hight);
      //const material = new THREE.MeshBasicMaterial( { map: this.texture } );
      const material = new THREE.MeshBasicMaterial( { map: texture } );
      this.textureMap = new THREE.Mesh( geometry, material );

      this.threejs.scene.add(this.textureMap);

      //this.textureMap.needsUpdate;
      //this.textureMap.material.map.needsUpdate = true;
      //this.textureMap.material.needsUpdate = true;
      //this.textureMap.geometry.uvsNeedUpdate = true;

      this.threejs.renderer.render( this.threejs.scene, this.threejs.camera );
    }
  }

  getColorMap() {
    return [
      {step:-10, color: new THREE.Color(0x2908d8)},
      {step:-5, color: new THREE.Color(0x264dff)},
      {step:-3, color: new THREE.Color(0x3f9fff)},
      {step:-1, color: new THREE.Color(0x72daff)},
      {step:-0.5, color: new THREE.Color(0xaaf8ff)},
      {step:-0.2, color: new THREE.Color(0xe1fffe)},
      {step:0, color: new THREE.Color(0xfeffbe)}, // 0
      {step:0.2, color: new THREE.Color(0xfee099)},
      {step:0.5, color: new THREE.Color(0xffad71)},
      {step:1, color: new THREE.Color(0xf86d5d)},
      {step:3, color: new THREE.Color(0xd92632)},
      {step:5, color: new THREE.Color(0xa50f22)}
    ]
  }

  hide() {
    this.element_.style.display = 'none';
  }

  update(index) {
    if (index !== this.timeIndex_) {
      console.log(`ipcc: new index: ${index}`);
      this.loadTempAnomaly(index);
    }
  }

  getGrid() {
    return {
      latitude: this.structure_.grid.latitude.slice(),
      longitude: this.structure_.grid.longitude.slice()
    }
  }

  loadTempAnomaly(index) {
    this.timeIndex_ = index
    const p = fetch(`/data/ipcc?index=${index}`);
    p.then(
      response => response.json()
    ).then(json => {
      const texture = createTemperatureInstance(json);
      this.updateUI(texture);
    }).catch(function(err) {
      console.log('err', err);
    });
  }    
}

