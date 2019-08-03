class IPCC {
  constructor(element) {
    this.element_ = element;
    this.timeIndex_ = -1;
    this.structure_ = {};
    this.textureMap = null;
    this.textureWidth = 400;
    this.textureHeight = 200;

    const slider = this.element_.querySelector('.mdc-slider.ipcc-time-slider');
    if (slider) {
      this.slider_ = new mdc.slider.MDCSlider(slider);
      
      this.slider_.listen('MDCSlider:change', () => {
        this.update(this.slider_.value);
      });
    }

    this.renderer = new MWM.Renderer({
      cameraType: 'orhtogonal',
      parentSelector: '.ipcc-threejs-map',
      width: this.textureWidth,
      height: this.textureHeight,
    });
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
      this.loadTempAnomaly(this.structure_.recordDimension.length - 1);
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
    this.renderer.removeObject('ipccTextureMap');

    if (texture) {
      const geometry = new THREE.PlaneGeometry( this.textureWidth, this.textureHeight);
      //const material = new THREE.MeshBasicMaterial( { map: this.texture } );
      const material = new THREE.MeshBasicMaterial( { map: texture } );
      this.textureMap = new THREE.Mesh( geometry, material );

      this.renderer.addObject('ipccTextureMap', this.textureMap);
      this.renderer.frame();
    }
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
      const dataTexture = new IPCCThreeDataTexture({
        data: json,
        grid: this.getGrid(),
      });

      const texture = dataTexture.texture;//createTemperatureInstance(json);
      const year = this.structure_.indexValues[this.timeIndex_];
 
      this.updateUI(texture);

      const ipccEvent = new CustomEvent('IPCC:dataTextureLoaded', { detail: {texture, type: 'anomaly', year} });
      document.dispatchEvent(ipccEvent);
    }).catch(function(err) {
      console.log('err', err);
    });
  }    
}

class IPCCThreeDataTexture {
  constructor(config) {
    this.data = config.data;
    this.grid = config.grid;

    this.rankAnomalyMap = [
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
    ];

    this.texture = null;
    this.calculateTexture();
  }

  calculateTexture() {
    let totalCount = 0;
    const blackColor = new THREE.Color( 0x010101);

    const mapData = new Uint8Array(3 * this.grid.longitude.length * this.grid.latitude.length);
  
    for (let i_lat = 0; i_lat < this.grid.latitude.length; i_lat++) {
      for (let i_long = 0; i_long < this.grid.longitude.length; i_long++) {
         const value = this.data[totalCount];

        if(-1.0000000150474662e+30 === value) {
          mapData[totalCount * 3] = 255 * blackColor.r;
          mapData[totalCount * 3 + 1] = 255 * blackColor.g;
          mapData[totalCount * 3 + 2] = 255 * blackColor.b;
        } else {
          const baseColor = this.rankAnomalyMap[0].color;
          mapData[totalCount * 3] = 255 * baseColor.r;
          mapData[totalCount * 3 + 1] = 255 * baseColor.g;
          mapData[totalCount * 3 + 2] = 255 * baseColor.b;
          const valueMaped = this.rankAnomalyMap.find(m => {
            return m.step >= value;
          });
          if (valueMaped) {
            mapData[totalCount * 3] = 255 * valueMaped.color.r;
            mapData[totalCount * 3 + 1] = 255 * valueMaped.color.g;
            mapData[totalCount * 3 + 2] = 255 * valueMaped.color.b;
          } else {
            mapData[totalCount * 3] = 255 * baseColor.r;
            mapData[totalCount * 3 + 1] = 255 * baseColor.g;
            mapData[totalCount * 3 + 2] = 255 * baseColor.b;
          }
        }
        totalCount++;
      }
    }
    
    this.texture = new THREE.DataTexture( mapData, this.grid.longitude.length, this.grid.latitude.length, THREE.RGBFormat, THREE.UnsignedByteTyp, THREE.UVMapping);
    this.texture.needsUpdate = true;
  }
};

