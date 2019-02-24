const HTTP = require('http');

const indicators = {
  SP_POP_TOTL : 'SP.POP.TOTL',
  SM_POP_REFG : 'SM.POP.REFG',
  SM_POP_REFG_OR :'SM.POP.REFG.OR'
};

const MongoClient = require('mongodb').MongoClient;
const DBURL = 'mongodb://localhost:27017';
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
  MongoClient.connect(DBURL, { useNewUrlParser: true }, function(err, client) {
    if (!err) {
      DB = client.db('worldbank');
      INDICATOR = DB.collection('indicator');
      COUNTRY = DB.collection('country');
    }
    callback(err);
  });	
}

function store(collection, data, resolve, reject) {
  collection.insertMany(data)
  .then(result => {
    resolve(results);
  })
  .catch(err => {
    console.log(err);
    reject(err);
  })
}

/**
 * @public
 * @param country
 * @param indicator
 * @param date
 * @returns
 */
function countryQuery(country, indicator, date) {
  const p = new Promise((resolve, reject) => {
    // const url = `http://api.worldbank.org/v2/countries/${country}/indicators/${indicator}?format=json&data=${date}`;
  
    if (!country) {
      reject(new Error('no country given'));
      return;
    }

    const options = {
      method: 'GET',
      hostname: 'api.worldbank.org',
      path: `/v2/countries/${country}${(indicator ? `/indicators/${indicator}` : '')}?format=json${(date? `&date=${date}` : '')}`
    };

    const query = {};
    const projection = {};

    const countries = getCountries(country);
    const countryFilter = getCountryFilter(countries);
    if (countryFilter) {
      query.iso2Code = countryFilter;
    }

    if (indicator) {
      indicator = indicator.replace(/\./g, '_');
      query['indicators.' + indicator + '.date'] = getDateFilter(date);
      projection['indicators.' + indicator] = 1;
      projection['iso2Code'] = 1;
    } else {
      projection.indicators = 0;
    }

    getQueryPromise({query: query, collection: COUNTRY}, projection)
    .then(cdata => {
      if (isEmptyResult(cdata)) {
        requestAllPages(options)
        .then(results => {
          if (indicator) {
            /* store indicators for exisitng country */
            countries.forEach(_country => {
              const items = results.filter(item => {
                /* get indicator for related country */
                return item.country.id === _country;
              });
              COUNTRY.updateOne({iso2Code: _country}, { $set: { ['indicators.' + indicator]: items}})
              .then(result => {
                resolve({ indicator: items });
              })
              .catch(err => {
                console.log(err);
                reject(err);
              })
            });
          } else {
            /* store basic country data */
            //store(COUNTRY, results, resolve, reject);
            COUNTRY.insertMany(results)
            .then(result => {
              resolve(results);
            })
            .catch(err => {
              console.log(err);
              reject(err);
            })
          }
        })
        .catch(err => {
          console.log('db err indicatorQuery', err);
          reject(err);
        });
      } else {
        // console.log('db res indicatorQuery', cdata);
        if (indicator) {
          let mapped = [];
          cdata.forEach(item => {
            mapped = mapped.concat(item.indicators[indicator]);
          });
          resolve(mapped);
        } else {
          resolve(cdata);
        }
      }
    }).catch(err => {
      console.log('db err indicatorQuery', err);
      reject(err);
    });
  });

  return p;
}

function isEmptyResult(data) {
  return !data || !data.length;
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
  const p = new Promise((resolve, reject) => {
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
  return p;
}

function addPage(options, page) {
  const o = Object.assign({}, options);
  o.path += `&page=${page}`;
  return o;
}

function indicatorQuery(indicator) {
  // var url = `http://api.worldbank.org/v2/indicators/${indicator}?format=json`;
  const options = {
    method: 'GET',
    hostname: 'api.worldbank.org',
    path: `/v2/indicators/${indicator}?format=json`
  };

  const processResponse = cdata => {
    const result = JSON.parse(cdata);
    const item = result[1][0];

    INDICATOR.insert(item, function(err, _item) {
      if (err) {
        console.log(err, null);
      } else {
        console.log('insert ok');
      }
    });
  }

  getQueryPromise({query: {id: indicator}, collection: INDICATOR})
    .then(processResponse)
    .catch(err => {
      console.log('db indicatorQuery', err);
    });
}

/**
 * @public
 * @returns
 */
function countriesQuery() {
  // exclude the '_id' field
  console.log('countriesQuery');
  const p = new Promise((resolve, reject) => {
    const pr = {
      _id: 0,
      indicators: 0
    };

    COUNTRY.find().project(pr).toArray((err, items) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (items.length === 0) {
        countryQuery()
          .then(countries => {
            resolve(countries);
          })
          .catch(err => {
            reject(err);
          })
        return;
      }

      resolve(items);
    });
  });

  return p;
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
        //const head = result[0];
        //const years = result[1];
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

function getQueryPromise(options, projection) {
  // console.log('getQueryPromise.options', options);
  if (projection) {
    projection._id = 0;
  }

  const p = new Promise((resolve, reject) => {
    let query = options.collection.find(options.query);

    if (projection) {
      query = query.project(projection);
    }

    query.toArray((err, docs) => {
      err ? reject(err) : resolve(docs);
    });
  });

  return p;
};

function parseIndicatorData(data) {
  const json = JSON.parse(data);
  const head = json[0];
  const body = json[1];

  const item = {
    data : [],
    legend : body[0]
  };
  return item;
}

function loadCountryPage(item, country, indicator) {
  return (new Promise((resolve, reject) => {
    let page = 1;
    let pages = 1;
    const loadNextPage = function() {
      const options = {
        method: 'GET',
        hostname: 'api.worldbank.org',
        path: `/v2/countries/${country}/indicators/${indicator.replace(/_/g,'.')}?format=json&page=${page}`
      };

      makeRequest(options).then(r => {
        const head = r.head;
        const years = r.body;

        pages = r.head.pages;
    
        for (idx in years) {
          item.data.push({
            date : years[idx].date,
            decimal : years[idx].decimal,
            value : years[idx].value
          });
        }
        if (page < pages) {
          page++;
          loadNextPage();
        } else {
          resolve(item);
        }
      }).catch(err => {
        console.log('err', err);
        reject(err);
      });
    };
    loadNextPage();
  }));
}

function loadCountryData(item, country, indicator) {
  return (new Promise((resolve, reject) => {
    let page = 0;
    let pages = 0;

    const loadNextPage = function() {
      page++;
      const options = {
        method: 'GET',
        hostname: 'api.worldbank.org',
        path: `/countries/${country}/indicators/${indicator.replace(/_/g,'.')}?format=json&page=${page}`
      };

      makeRequest(options).then(r => {
        const head = r.head;
        const years = r.body;

        pages = head.pages;
    
        for (idx in years) {
          item.data.push({
            date : years[idx].date,
            decimal : years[idx].decimal,
            value : years[idx].value
          });
        }
        if (page < pages) {
          loadNextPage();
        } else {
          resolve(item);
        }
      }).catch(err => {
        console.log('err', err);
        reject(err);
      });
    };
    loadNextPage();
  }));
}

exports.init = init;
exports.countryQuery = countryQuery;
exports.countriesQuery = countriesQuery;
exports.indicatorQuery = indicatorQuery;
