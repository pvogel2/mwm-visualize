var wb = {
  SP_POP_TOTL: 'SP.POP.TOTL',
  SM_POP_REFG: 'SM.POP.REFG',
  SM_POP_REFG_OR: 'SM.POP.REFG.OR',
  setData: async json => {
    wb.data = json;
    wb.map = {};
    wb.data.forEach(item => {
      //wb.map[item.ISO3136.toLowerCase()] = item;
      wb.map[item.iso2Code.toLowerCase()] = item;
    });
  },
  loadPopulation: () => fetch('/data/worldbank/country/;/indocators/SP.POP.TOTL/'),
  loadRefugees: () => fetch('/data/worldbank/country/;/indocators/SM.POP.REFG/'),
  loadRefugeesOrigin: () => fetch('/data/worldbank/country/;/indocators/SM.POP.REFG.OR/'),
  loadIndicator: (id, country = ';') => fetch(`/data/worldbank/country/${country}/indocators/${id}/`),
  loadCountries: () => 
    fetch('/data/countries')
      .then(response => response.json())
      .then(json => {wb.setData(json)}),
  getCountry: index => {
    const data = wb.data[index];
    return (data ? new WBCountry(data) : null);
  },
  getCountryCount: () => wb.data.length,
};

/**
{
  "indicator": {
    "id": "SP.POP.TOTL",
    "value": "Population, total"
  },
  "country": {
    "id": "DE",
    "value": "Germany"
  },
  "countryiso3code": "DEU",
  "date": "2018",
  "value": null,
  "unit": "",
  "obs_status": "",
  "decimal": 0
  }
*/

class WBCtrl {
  constructor(element) {
    this.element_ = element;
    this.countryFilter_ = null;
    this.country = null;

    const filterIcon = this.element_.querySelector('.mdc-text-field__icon');
    filterIcon.addEventListener('click', this);

    this.yearSlider = new mdc.slider.MDCSlider(this.element_.querySelector('.mdc-slider'));

    this.yearSlider.listen('MDCSlider:change', (event) => {
      if (!this.sliderDoubleEventToggle) {
      console.log(`Value changed to ${event.detail.value}`);
      this.updateControls();
      this.updateGraphs();
      this.updateIndicator(wb.SP_POP_TOTL);
      this.updateIndicator(wb.SM_POP_REFG);
      this.updateIndicator(wb.SM_POP_REFG_OR);
      }
      this.sliderDoubleEventToggle = !this.sliderDoubleEventToggle;
    });

    this.populationSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#wb-pop-switch'));
    this.populationSwitch.nativeControl_.addEventListener('change', this.togglePopulation.bind(this));

    this.refugeesSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#wb-ref-switch'));
    this.refugeesSwitch.nativeControl_.addEventListener('change', this.toggleRefugees.bind(this));

    this.refugeesOriginSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#wb-ref-origin-switch'));
    this.refugeesOriginSwitch.nativeControl_.addEventListener('change', this.toggleRefugeesOrigin.bind(this));

    this.renderer = null;
  }

  togglePopulation() {
    if(this.populationSwitch.checked) {
      this.loadIndicator(wb.SP_POP_TOTL);
    } else {
      this.unloadIndicator(wb.SP_POP_TOTL);
    }
  }


  toggleRefugees() {
    if(this.refugeesSwitch.checked) {
      this.loadIndicator(wb.SM_POP_REFG);
    } else {
      this.unloadIndicator(wb.SM_POP_REFG);
    }
  }

  toggleRefugeesOrigin() {
    if(this.refugeesOriginSwitch.checked) {
      this.loadIndicator(wb.SM_POP_REFG_OR);
    } else {
      this.unloadIndicator(wb.SM_POP_REFG_OR);
    }
  }

  loadIndicator(id) {
    wb.loadIndicator(id)
      .then(response => response.json())
      .then(json => {
        const wbEvent = new CustomEvent('WB:indicatorLoaded', { detail: {data: json, id: id, year: this.getYear()}});
        document.dispatchEvent(wbEvent);
      });
  }

  unloadIndicator(id) {
    const wbEvent = new CustomEvent('WB:unloadIndicator', { detail: {id: id}});
    document.dispatchEvent(wbEvent);
  }

  updateIndicator(id) {
    wb.loadIndicator(id)
      .then(response => response.json())
      .then(json => {
        const wbEvent = new CustomEvent('WB:indicatorUpdated', { detail: {data: json, id: id, year: this.getYear()}});
        document.dispatchEvent(wbEvent);
      });
  }

  getIndicators() {
    return ['SP.POP.TOTL', 'SM.POP.REFG', 'SM.POP.REFG.OR'];
  }

  setCountry(index) {
    this.country = wb.getCountry(index);
    if (!this.country) {
      console.log(`wb: can not set country, unknown index ${index}`);
      return;
    }
    this.element_.querySelector('.wb_income').textContent = `${this.country.incomeValue()} (${this.country.incomeId()})`;
    this.element_.querySelector('.wb-country-filter input').value = `${this.country.name()} (${this.country.iso2()})`;
    this.applyFilter();
  }

  getYear() {
    return this.yearSlider.value;
  }

  hide() {
    this.element_.style.display = 'none';
  }

  show() {
    this.element_.style.display = 'block';
    if (!this.renderer) {
      this.renderer = new MWM.Renderer({
        cameraType: 'orhtogonal',
        parentSelector: '.wb-threejs-map',
        width: 400,
        height: 200,
      });
      this.yearSlider.layout();

      this.renderer.registerEventCallback("click", this.renderCallback.bind(this));
    }
  }

  
  renderCallback(event, intersections) {
    console.log('rendered');
  }

  createLines() {
    const indicators = this.getIndicators();
    const indicatorColors = { 
      'SP_POP_TOTL': new THREE.Color(0x0000ff),
      'SM_POP_REFG': new THREE.Color(0xff0000),
      'SM_POP_REFG_OR': new THREE.Color(0x00ff00),
    }

    const lines = [];
    indicators.forEach(indicator => {
      const data = this.country.data.indicators[indicator.replace(/\./g, '_')];
      const length = data.length;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array( length * 3 );
      const colors = new Float32Array( length * 3 );
  
      const currentColor = new THREE.Color(0xffffff);
      const defaultColor = indicatorColors[indicator.replace(/\./g, '_')];
  
      const oldest = Number(data[data.length - 1].date);
      const latest = Number(data[0].date);
      let minValue = 0;
      let maxValue = 0;// 318622525;
  
      const indices = [];

      for (let i = 0; i < length; i++) {
        const date = data[i];
        minValue = Math.min(minValue, date.value);
        maxValue = Math.max(maxValue, date.value);
      }

      for (let i = 0; i < length; i++) {
          const date = data[i];
          const x = 200 - i * 400 / length;
          const y = (date.value ? date.value / maxValue * 195 : 0) - 100;
          // console.log(Number(date.date), date.value, '->', x, y);
          const v0 = new THREE.Vector3(x, y, 0);
         
          v0.toArray(positions, i * 3);
          if (this.getYear() === Number(date.date)) {
            currentColor.toArray(colors, i * 3);
            indices.push(i);
          } else {
            defaultColor.toArray(colors, i * 3);
          }
      }
  
      geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ));
      geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ));
      //s_geometry.addAttribute( 'helper', new THREE.BufferAttribute( s_helpers, 1 ));
      // s_geometry.addAttribute( 'size', new THREE.BufferAttribute( s_sizes, 1 ));
      // s_geometry.dynamic = true;
      var material = new THREE.LineBasicMaterial({
        vertexColors: THREE.VertexColors
      });
      const line = new THREE.Line( geometry, material );
      line.userData.indices = indices;
      line.userData.minYear = oldest;
      line.userData.maxYear = latest;
      line.userData.minValue = minValue;
      line.userData.maxValue = maxValue;
     lines.push(line);
    });
    return lines;
  }

  async applyFilter() {
    const indicators = this.getIndicators();

    if (this.country) {
      await this.country.ensureIndicators(indicators);
    }

    this.writeGraphs();
    this.updateControls();
  }

  updateControls() {
    this.element_.querySelector('.mwm-md-time-slider__current').innerText = this.getYear();
    if (!this.country) return;

    const indicators = this.getIndicators();
    indicators.forEach(indicator => {
      const selector = `.wb_${indicator.toLowerCase().replace(/\./g, '_')}`;
      this.element_.querySelector(selector).textContent = this.country.findIndicatorValue(indicator, this.getYear());
    });
  }

  updateGraphs() {
    if (!this.country || !this.renderer) return;

    const indicators = this.getIndicators();
    const indicatorColors = { 
      'SP_POP_TOTL': new THREE.Color(0x0000ff),
      'SM_POP_REFG': new THREE.Color(0xff0000),
      'SM_POP_REFG_OR': new THREE.Color(0x00ff00),
    }

    indicators.forEach((indicator, i) => {
      const defaultColor = indicatorColors[indicator.replace(/\./g, '_')];
      const currentColor = new THREE.Color(0xffffff);
      const item = this.renderer.getObject(`wbLine${i}`);
      const line = item.obj;
      const colors = line.geometry.attributes.color.array;
      const data = this.country.data.indicators[indicator.replace(/\./g, '_')];
      const newIndex = this.country.findIndicatorIndex(indicator, this.getYear());

      if (line) {
        const indices = line.userData.indices;
        indices.forEach(index => {
          defaultColor.toArray(colors, index * 3);
        });
        line.userData.indices = [];

        if (newIndex >= 0) {
          currentColor.toArray(colors, newIndex * 3);
          line.userData.indices.push(newIndex);
        }
      }
      line.geometry.attributes.color.needsUpdate = true;
    });
    this.renderer.frame();
  }

  writeGraphs() {
    if (!this.renderer) return;

    const lines = this.createLines();

    lines.forEach((line, i) => {
      this.renderer.removeObject(`wbLine${i}`);
      this.renderer.addObject(`wbLine${i}`, line);
    });
    this.renderer.frame();
  }

  handleEvent(event) {
    if (event.type === 'click') {
      this.countryFilter_ = this.element_.querySelector('.wb-country-filter input').value;
      this.applyFilter();
    } else if (event.type ==='change') {
      console.log(event);
    }
  }
}

class WBIndicatorItem {
  static filter(items, iso2, id) {
    return items.filter(item => {   
      return (item.country.id === iso2 && item.indicator.id === id);
    });
  }

  constructor(data) {
    this.data = data;
  }

  date() {
    return this.data.date;
  }


  value() {
    return this.data.value;
  }
  id() {
    return this.data.indicator.id;
  }

  countryId() {
    return this.data.country.id;
  }

  countryIso3() {
    return this.data.countryiso3code;
  }
}

class WBCountry {
  constructor(data) {
    this.data = data;
  }

  name() {
    return this.data.name;
  }

  iso2() {
    return this.data.iso2Code;
  }

  get centroid() {
    return {
      lat: Number(this.data.center.latitude),
      long: Number(this.data.center.longitude)
    }
  }

  get capitalCoords() {
    if (this.data.latitude === "" || this.data.longitude === "") {
      return null;
    }
    return {
      lat: Number(this.data.latitude),
      long: Number(this.data.longitude)
    }
  }

  incomeValue() {
    return this.data.incomeLevel.value;
  }

  incomeId() {
    return this.data.incomeLevel.id;
  }

  _indicators() {
    return !!this.data.indicators;
  }

  hasIndicators(ids) {
    let found = !!this.data.indicators;
    if (found) {
      ids.forEach(id => {
        found = found && !!this.data.indicators[id.replace(/\./g, '_')];
      });
    }
    return found;
  }

  findIndicatorIndex(id, date_year) {
    return this.data.indicators[id.replace(/\./g, '_')].findIndex(item => {
      return (`${date_year}` === item.date);
    });
  }

  findIndicatorValue(id, date_year) {
    const ind = this.data.indicators[id.replace(/\./g, '_')].find(item => {
      return (`${date_year}` === item.date);
    });
    return (ind.value ? ind.value : '-');
  }

  extendIndicators(id, ind) {
    if (!this.data.indicators) {
      this.data.indicators = {};
    }
    this.data.indicators[id.replace(/\./g, '_')] = ind;
  }

  async ensureIndicators(ids) {
    if (!this.hasIndicators(ids)) {
      const iso2Code = this.iso2();

      const json = await fetch(`/data/worldbank/country/${iso2Code}/indocators/${ids.join(';')}/`).then(
        response => response.json()
      );

      ids.forEach(id => {
        this.extendIndicators(id, WBIndicatorItem.filter(json, iso2Code, id));
      });
    }
  }
}

class WBThreeIndicator extends WorldThreeObject {
  constructor(config) {
    super(config);

    this.scale = config.scale;
    this.year = config.year;
    this.objId = `${this.id.replace(/\./g, '_')}Blocks`;

    this.offset = {
        lat: config.lat ? config.lat : 0.0,
        long: config.long ? config.long : 0.0,
    }

    this.pillar = new PillarTemplate({color: this.color});
  }

  async attach(renderer, parent) {
//  async createWBIndicatorInstances(data, color, scale, year, id, offset) {
    this.renderer = renderer;
    const offsets = [];
    const orientations = [];
    const values = [];
    let instanceCounter = 0;

    for (let i = 0; i < this.data.length; i++) {
      const date = this.data[i];
      const country = this.findCountry(date);

      let s0;
      
      if (country) {
        s0 = this.calcSphericalFromLatLongRad(
          Number(country.center.latitude) + this.offset.lat,
          Number(country.center.longitude) + this.offset.long,
          20.025
        );
        values.push(0.0);
        values.push(this.scale * date.value || 0.0);
      } else {
        //console.log("no country", date.iso2.toLowerCase(), date);
        continue;
      }
   
      const v0 = new THREE.Vector3().setFromSpherical(s0);
      v0.toArray(offsets, instanceCounter * 3);

      this.pushOrientationFromSpherical(s0, orientations);

      instanceCounter++;
    }

    this.pillar.geometry.maxInstancedCount = instanceCounter;
    this.pillar.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
    this.pillar.geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ) );
    this.pillar.geometry.addAttribute( 'value', new THREE.InstancedBufferAttribute( new Float32Array( values ), 2 ) );

    this.mesh = await this.pillar.getMesh(renderer);
    PillarTemplate.triggerTransition(this.mesh, {
      target: 1.0,
    });
    renderer.addObject(this.objId, this.mesh, false, parent);
  }

  update(config) {
    if (!this.mesh) return;
    this.data = config.data ? config.data : this.data;;
    this.color = config.color ? config.color : this.color;
    this.year = config.year ? config.year : this.year;

    let attribIndex = 0;
    for (let i = 0; i < this.data.length; i++) {
      const date = this.data[i];
      const country = this.findCountry(date);

      if (country) {
        const newIdx = this.mesh.material.uniforms.weight.value >= 1.0 ? attribIndex * 2 : attribIndex * 2 + 1;
        this.mesh.geometry.attributes.value.array[newIdx] = this.scale * date.value || 0.0;//(200000000.0 + mesh.material.uniforms.weight.value * 200000000.0);//date.value || 0.0;
        attribIndex++;
      } else {
        //console.log("no wb_Country", date.iso2.toLowerCase(), date);
        continue;
      }
    }
    this.mesh.geometry.attributes.value.needsUpdate = true;
    PillarTemplate.triggerTransition(this.mesh, {
      target: (this.mesh.material.uniforms.weight.value >= 1.0 ? 0.0 : 1.0),
    });
  }

  findCountry(date) {
    return (Number(date.date) === this.year && date.indicator.id === this.id
      ? wb.map[date.country.id.toLowerCase()]
      : null);
  }
}

class WBThreeCountries extends WorldThreeObject {
  constructor(config) {
    super(config);

    this.capitalsObjId = 'WBThreeCountryCapitals';
    this.centersObjId = 'WBThreeCountryCentroids';

    this.capitals = new CityTemplate();
    this.centroidsPoints = null;
    this.capitalsMesh = null;
  }

  async attach(renderer, parent) {
    this.renderer = renderer;
  //async function createWBCountryProps(parent, color) {
    const data = this.data;
    const p_uniforms = {
        texture:   { type: "t", value: renderer.getTexture( "disc.png" ) },
    };
    p_uniforms.texture.value.wrapS = p_uniforms.texture.value.wrapT = THREE.RepeatWrapping;

    var p_material = new THREE.ShaderMaterial( {
      uniforms: p_uniforms,
      depthWrite: false,
      transparent: true,
      vertexShader:   document.getElementById( 'vertexshader' ).textContent,
      fragmentShader: document.getElementById( 'fragmentshader' ).textContent
    });

    const countryCount = wb.getCountryCount();

    var p_geometry = new THREE.BufferGeometry();
    var p_positions = new Float32Array( countryCount * 3 );
    var p_colors = new Float32Array( countryCount * 3 );
    var p_sizes = new Float32Array(  countryCount );

    var pointColor = new THREE.Color( 1, 0, 0);

    const cap_colors = [];
    const cap_offsets = [];

    const cap_color = new THREE.Color(this.color);
    const cap_orientations = [];
    const cap_scales = [];
    let cap_counter = 0;
    
    for (let i = 0; i < countryCount ; i++) {
        const country = wb.getCountry(i);
        const center = country.centroid;
        /*capital*/
        const capitalCoords = country.capitalCoords;
        if (capitalCoords) {
          const cap_s0 = this.calcSphericalFromLatLongRad(capitalCoords.lat, capitalCoords.long, 20.025);
          const cap_v0 = new THREE.Vector3().setFromSpherical(cap_s0);

          cap_v0.toArray(cap_offsets, cap_counter * 3);
          this.pushOrientationFromSpherical(cap_s0, cap_orientations);
          cap_scales.push(1.5);
          cap_color.toArray(cap_colors, cap_counter * 3);
          cap_counter++;
        }
        /*-------*/

        const s0 = this.calcSphericalFromLatLongRad(center.lat, center.long, 20.025);
        const v0 = new THREE.Vector3().setFromSpherical(s0);

        v0.toArray(p_positions, i * 3);
        pointColor.toArray( p_colors, i * 3);
        p_sizes[i] = 200;
    }

    p_geometry.addAttribute( 'position', new THREE.BufferAttribute( p_positions, 3 ));
    p_geometry.addAttribute( 'size', new THREE.BufferAttribute( p_sizes, 1 ));
    p_geometry.addAttribute( 'color', new THREE.BufferAttribute( p_colors, 3 ));

    this.centroidsPoints = new THREE.Points( p_geometry, p_material );
    renderer.addObject( this.centroidsObjId, this.centroidsPoints , true, parent);

    this.capitals.geometry.maxInstancedCount = cap_counter;
    this.capitals.geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array( cap_scales ), 1 ) );
    this.capitals.geometry.addAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( cap_colors ), 3 ) );
    this.capitals.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( cap_offsets ), 3 ) );
    this.capitals.geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( cap_orientations ), 4 ) );

    this.capitalsMesh = await this.capitals.getMesh(renderer);
    renderer.addObject(this.capitalsObjId, this.capitalsMesh, false, parent);
  }

  detach() {
    if (this.renderer) {
      this.renderer.removeObject(this.centroidsObjId);
      this.renderer.removeObject(this.capitalsObjId);
    } else {
      console.log('WBThreeIndicator: renderer not defined.');
    }
  }
}