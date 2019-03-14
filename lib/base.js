const { WBRequest } = require('./request.js');
const HTTP = require('http');

class Base {
  constructor(collection) {
    this.collection = collection;
    this.hostname = 'api.worldbank.org';
    this.version = 'v2';
  }

  getRequestOptions(o) {
    return {
      method: 'GET',
      hostname: this.hostname,
      path: `/${this.version}`
    };
  }

  isEmptyResult(data) {
    return !data || !data.length;
  }

  getCountries(countries = '') {
     const arr = countries.toUpperCase().split(';');
     // filter doubled entries
     return arr.filter((elem, index, self) => {
      return index === self.indexOf(elem);
    });
  }

  getDateFilter(date) {
    let range = '';
    const dates = date ? date.split(':') : [];
    if (dates.length === 1){
      range = dates[0]; 
    } else if (dates.length === 2) {
      let lte = dates[0] > dates[1] ? dates[0] : dates[1];
      let gte = lte === dates[0] ? dates[1] : dates[0];
      range = { $lte : lte, $gte : gte};
    }
    return range;
  }

  requestAllPages(options) {
    const wbr = new WBRequest(options);
    return wbr.requestAllPages();
  }

  query(countries, indicator, date) {
    return new Promise((resolve, reject) => {
      // const url = `http://api.worldbank.org/v2/countries/${countries}?format=json`;
      const options = {
        collection: this.collection,
        countries: countries,
        indicator: indicator,
        date: date,
        result: null
      };

      this.setQuery(options);
      this.setProjection(options);

      this.queryDatabase(options)
      .then(this.storeIfNotPresent.bind(this))
      .then(this.getResult)
      .then(r => {
        resolve(r);
      })
      .catch(err => {
        console.log('query', err);
        reject(err);
      });
    });
  }

  setQuery(o) {
    o.query = {};
  }

  getCountryFilter(countries) {
    if (countries.length === 1 && !countries[0]) {
      return '';
    } else if (countries && countries.length) {
      return { $in: countries };
    }
    return '';
  }

  setProjection(o) {
    o.projection = {
      _id: 0
    };
  }

  queryDatabase(options) {
    const p = new Promise((resolve, reject) => {
      console.log('---');
      console.log('new query', options.query);
      console.log('---');
      console.log('new projection', options.projection);
      console.log('---');
      let query = this.collection.find(options.query);

      if (options.projection) {
        query = query.project(options.projection);
      }

      query.toArray((err, docs) => {
        if (err) {
          reject(err);
        } else {
          console.log('new docs', docs);
          options.result = docs;
          resolve(options);
        }
      });
    });

    return p;
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
        resolve(o);
      }
    });
  }

  store(o, resolve, reject) {
    try {
      this.collection.insertMany(o.result)
      .then(result => {
        resolve(o);
      });
    } catch(err) {
      console.log(err);
      reject(err);
    };
  }

  getResult(o) {
    console.log('---');
    console.log('new result', o.result);
    console.log('---');
    return o.result;
  }
};

module.exports.Base = Base;