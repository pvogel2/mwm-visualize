const HTTP = require('http');

const MongoClient = require('mongodb').MongoClient;
const DBURL = 'mongodb://localhost:27017';
const { Countries } = require('./countries.js');
const { Indicators } = require('./indicators.js');

const wb = {
    Country: null,
    Indicators: null
};

const indicators = {
  SP_POP_TOTL : 'SP.POP.TOTL',
  SM_POP_REFG : 'SM.POP.REFG',
  SM_POP_REFG_OR :'SM.POP.REFG.OR'
};

let DB = null;
let INDICATOR = null;
let COUNTRY = null;

var DATE = 'date=2000:2017';

var QUERYPARAMS = {
    format: 'format',
    page: 'page',
    perpage: 'per_page',
    mrv: 'mrv',
    mrvev: 'mrvev',
    gapfill: 'gapfill',
    frequnecy: 'frequency',
    source: 'source',
    footnote: 'footnote',
    date: 'date'
};

/**
 * @public
 * @param callback
 * @returns
 */
function init(callback) {
  // Use connect method to connect to the Server
  MongoClient.connect(DBURL, { useNewUrlParser: true }, (err, client) => {
    if (!err) {
      DB = client.db('worldbank');
      INDICATOR = DB.collection('indicator');
      COUNTRY = DB.collection('country');
      wb.countries = new Countries(DB.collection('country'));
      wb.indicators = new Indicators(DB.collection('indicator'));
    }
    callback(err);
  });	
}

function store(options, resolve, reject) {
  try {
    console.log('store'. options);
    let p;
    if (o.indicator) {
      const ps = [];
      let indicators = [];
      const countries = getCountries(o.countries);
      console.log('Cs:', countries, o.result);
      countries.forEach(_country => {
        const items = o.result.filter(item => {
          return item.country.id === _country;
        });
        ps.push(o.collection.updateOne({iso2Code: _country}, { $set: { ['indicators.' + o.indicator.replace(/\./g, '_')]: items}}));
        indicators = indicators.concat(items);
      });

      Promise.all(ps)
      .then(results => {
        o.result = indicators;
        resolve(o);
      })
    } else {
      options.collection.insertMany(options.result)
      .then(result => {
        resolve(options);
      });
    }
  } catch(err) {
    console.log(err);
    reject(err);
  };
}

/**const options = {
  countries
  indicator
  date

  query
  collection
  projection

  result
}
 * */

/*test simplification of country requesting*/
function countryQuery(countries, indicator, date) {
  return wb.countries.query(countries, indicator, date);
  
  /*return new Promise((resolve, reject) => {
    // const url = `http://api.worldbank.org/v2/countries/${countries}?format=json`;
    const options = {
      collection: COUNTRY,
      countries: countries,
      indicator: indicator,
      date: date,
      result: null
    };

    setQuery(options);
    setProjection(options);

    console.log('---');
    console.log('old query', options.query);
    console.log('---');
    console.log('old projection', options.projection);
    console.log('---');
    queryDatabase(options)
    .then(storeIfNotPresent)
    .then(getResult)
    .then(r => {
      resolve(r);
    })
    .catch(err => {
      console.log('countryQuery', err);
      reject(err);
    });
  });*/
}

function getResult(o) {
  console.log('---');
  console.log('old result', o.result);
  console.log('---');
  return o.result;
}

function setQuery(o) {
  const q = {};
  
  const countryFilter = getCountryFilter(getCountries(o.countries));
  if (countryFilter) {
    q.iso2Code = countryFilter;
  }

  if (o.indicator) {
    q['indicators.' + o.indicator.replace(/\./g, '_') + '.date'] = getDateFilter(o.date);
  }

  o.query = q;
}

function setProjection(o) {
  const p = {};

  if (o.indicator) {
    const indicator = o.indicator.replace(/\./g, '_');
    p['indicators.' + indicator] = 1;
    p['iso2Code'] = 1;
  } else {
    p.indicators = 0;
  }

  o.projection = p;
}

/**
 * request data from external WB API and store the result in database
 * */
function storeIfNotPresent(o) {
  return new Promise((resolve, reject) => {
    if (isEmptyResult(o.result)) {
      const rOptions = getRequestOptions(o);
      console.log(rOptions);
      requestAllPages(rOptions)
      .then(results => {
        o.result = results;
        store(o, resolve, reject);
      });
    } else {
      if (o.indicator) {
        let mapped = [];
        o.result.forEach(item => {
          mapped = mapped.concat(item.indicators[o.indicator.replace(/\./g, '_')]);
        });
        o.result = mapped;
      }
      console.log('just resolving');
      resolve(o);
    }
  });  
}

function getCountryFilter(countries) {
  if (countries.length === 1 && !countries[0]) {
    return '';
  } else if (countries && countries.length) {
    return { $in: countries };
  }
  return '';
}

function getCountries(countries = '') {
   const arr = countries.toUpperCase().split(';');
   // filter doubled entries
   return arr.filter((elem, index, self) => {
    return index === self.indexOf(elem);
  });
}

function getDateFilter(date) {
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

function requestAllPages(options) {
  return new Promise((resolve, reject) => {
    let page = 0;
    let results = [];
    const getNextPage = function () {
      makeRequest(addPage(options, ++page))
      .then(r => {
        const meta = r.head;
        results = results.concat(r.body);
        if (page < meta.pages) {
          getNextPage();
        } else {
          resolve(results);
        }
      })
      .catch(err => {
        console.log('requestAllPages', err);
        reject(err);
      });
    }
    getNextPage();
  });
}

function addPage(options, page) {
  const o = Object.assign({}, options);
  o.path += `&page=${page}`;
  return o;
}

function indicatorQuery(indicator) {
  // var url = `http://api.worldbank.org/v2/indicators/${indicator}?format=json`;
  // return wb.indicators.query(null, indicator, null);
  return new Promise((resolve, reject) => {
    const options = {
      countries: null,
      indicator: indicator,
      date: null,
      collection: INDICATOR,
      query: {id: indicator},
      projection: null,
      result: null
      };
  
    const rOptions = {
      method: 'GET',
      hostname: 'api.worldbank.org',
      path: `/v2/indicators/${indicator}?format=json`
    };
  
    const processResponse = options => {
      console.log(options);
      const result = JSON.parse(options.result);
      const item = result[1][0];
    }
  
    queryDatabase(options)
    .then(o => {
      if (isEmptyResult(o.result)) {
        return requestAllPages(rOptions).then(result => {
          o.result = result;
          if (o.result.length) {
            o.collection.insertMany(o.result, function(err, item) {
              if (err) {
                console.log(err, null);
              } else {
                console.log('insert ok');
              }
            });
          }
          return o;
        });
      } else {
          return o;
      }
    })
    .then(getResult)
    .then(r => {
      resolve(r);
    })
    .catch(err => {
      console.log('db indicatorQuery', err);
      reject(err);
    });
  });
}

function isEmptyResult(data) {
  return !data || !data.length;
}

function makeRequest(options) {
  const p = new Promise((resolve, reject) => {
    HTTP.get(options)
    .on('response', resp => {
      let buf = '';
      resp.on('data', chunk => buf += chunk);
      resp.on('end', () =>{
        const r = {};
        [r.head, r.body] = JSON.parse(buf);
        resolve(r);
      });
      resp.on('error', err => {
        console.log('makeRequest error');
        reject(err);
      });
    })
    .on('error',  err =>{
      reject(err);
    });
  });
  return p;
}

function queryDatabase(options) {
  // console.log('queryDatabase.options', options);
  if (options.projection) {
    options.projection._id = 0;
  }

  const p = new Promise((resolve, reject) => {
    let query = options.collection.find(options.query);

    if (options.projection) {
      query = query.project(options.projection);
    }

    query.toArray((err, docs) => {
      if (err) {
        reject(err);
      } else {
        options.result = docs;
        console.log('old docs', docs);
        resolve(options);
      }
    });
  });

  return p;
};

exports.init = init;
exports.countryQuery = countryQuery;
exports.indicatorQuery = indicatorQuery;
