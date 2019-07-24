var wb = {
  SP_POP_TOTL: 'SP.POP.TOTL',
  SM_POP_REFG: 'SM.POP.REFG',
  SM_POP_REFG_OR: 'SM.POP.REFG.OR',
  setData: json => {
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
  getCountry: index => {
    const data = wb.data[index];
    return (data ? new WBCountry(data) : null);
  },
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
      window.updatePopulation();
      window.updateRefugees();
      window.updateRefugeesOrigin();
      }
      this.sliderDoubleEventToggle = !this.sliderDoubleEventToggle;
    });

    this.renderer = null;
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
