const { Base } = require('./base.js');

class Countries extends Base {
  constructor(collection) {
    super(collection);
  }

  setQuery(o) {
    const q = {};
    
    const countryFilter = this.getCountryFilter(this.getCountries(o.countries));
    if (countryFilter) {
      q.iso2Code = countryFilter;
    }

    if (o.indicator) {
      q['indicators.' + o.indicator.replace(/\./g, '_') + '.date'] = this.getDateFilter(o.date);
    }

    o.query = q;
  }

  setProjection(o) {
   super.setProjection(o);

   const p = {};

   if (o.indicator) {
      const indicator = o.indicator.replace(/\./g, '_');
      p['indicators.' + indicator] = 1;
      p['iso2Code'] = 1;
    } else {
      p.indicators = 0;
    }

   Object.assign(o.projection, p);
  }

  getRequestOptions(o) {
    const ph = super.getRequestOptions(o);
    Object.assign(ph, {
      path: `${ph.path}/countries/${o.countries}/${o.indicator ? 'indicators/' + o.indicator : ''}?format=json${o.date ? '&data=' + o.date : ''}`
    });

    return ph;
  }


  storeIfNotPresent(o) {
    return new Promise((resolve, reject) => {
      if (this.isEmptyResult(o.result)) {
        const rOptions = this.getRequestOptions(o);
        this.requestAllPages(rOptions)
        .then(results => {
          o.result = results;
          this.store(o, resolve, reject);
        });
      } else {
        if (o.indicator) {
          let mapped = [];
          o.result.forEach(item => {
            mapped = mapped.concat(item.indicators[o.indicator.replace(/\./g, '_')]);
          });
          o.result = mapped;
        }
        resolve(o);
      }
    });
  }

  store(o, resolve, reject) {
    try {
      if (o.indicator) {
        const ps = [];
        let indicators = [];
        const countries = this.getCountries(o.countries);
        console.log('Cs:', countries, o.result);
        countries.forEach(_country => {
          const items = o.result.filter(item => {
            /* get indicator for related country */
            return item.country.id === _country;
          });
          ps.push(this.collection.updateOne({iso2Code: _country}, { $set: { ['indicators.' + o.indicator.replace(/\./g, '_')]: items}}));
          indicators = indicators.concat(items);
        });
    
        Promise.all(ps)
        .then(results => {
          o.result = indicators;
          resolve(o);
        })
      } else {
        super.store(o, resolve, reject);
      }
    } catch(err) {
      console.log(err);
      reject(err);
    }
  }
};

module.exports.Countries = Countries;