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
  getCountry: index => wb.data[index],
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
  constructor(countryElement, globalElement) {
    this.countryElement_ = countryElement;
    this.globalElement_ = globalElement;
    this.countryFilter_ = null;
    this.country = null;

    const filterIcon = this.countryElement_.querySelector('.mdc-text-field__icon');
    filterIcon.addEventListener('click', this);

    this.yearSlider = new mdc.slider.MDCSlider(this.globalElement_.querySelector('.mdc-slider'));

    this.yearSlider.listen('MDCSlider:change', () => {
      console.log(`Value changed to ${this.yearSlider.value}`);
    });


  }

  getIndicators() {
    return ['SP.POP.TOTL', 'SM.POP.REFG', 'SM.POP.REFG.OR'];
  }

  setCountry(wbCountry) {
    this.country = wbCountry;
    this.countryElement_.querySelector('.wb_income').textContent = `${this.country.incomeValue()} (${this.country.incomeId()})`;
    this.countryElement_.querySelector('.wb-country-filter input').value = `${this.country.name()} (${this.country.iso2()})`;
  }

  getYear() {
    return this.yearSlider.value;
  }

  hide() {
    this.countryElement_.style.display = 'none';
    this.globalElement_.style.display = 'none';
  }

  show() {
    this.countryElement_.style.display = 'block';
    this.globalElement_.style.display = 'block';
    this.yearSlider.layout();
  }

  applyFilter() {
    if (this.country) {
      const p = wb.loadIndicator(wb.SP_POP_TOTL, this.country.iso2());
      p.then(
        response => response.json()
      ).then(json => {
        console.log(json);
      }).catch(function(err) {
        console.log('err', err);
      });
    }
  }

  handleEvent(event) {
    if (event.type === 'click') {
      this.countryFilter_ = this.countryElement_.querySelector('.wb-country-filter input').value;
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
}
