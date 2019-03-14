const HTTP = require('http');

const MongoClient = require('mongodb').MongoClient;
const { Countries } = require('./countries.js');
const { Indicators } = require('./indicators.js');

const wb = {
    countries: null,
    indicators: null
};

const indicators = {
  SP_POP_TOTL : 'SP.POP.TOTL',
  SM_POP_REFG : 'SM.POP.REFG',
  SM_POP_REFG_OR :'SM.POP.REFG.OR'
};

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
function init(callback, options) {
  // Use connect method to connect to the Server
  MongoClient.connect(options.dburl, { useNewUrlParser: true }, (err, client) => {
    if (!err) {
      const DB = client.db('worldbank');
      wb.countries = new Countries(DB.collection('country'));
      wb.indicators = new Indicators(DB.collection('indicator'));
    }
    callback(err);
  });	
};

exports.init = init;
exports.countryQuery = (countries, indicator, date) => wb.countries.query(countries, indicator, date);
exports.indicatorQuery = indicator => wb.indicators.query(null, indicator, null);
