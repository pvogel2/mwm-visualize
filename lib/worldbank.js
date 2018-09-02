const HTTP = require('http');

const indicators = {
  SP_POP_TOTL : 'SP.POP.TOTL',
  SM_POP_REFG : 'SM.POP.REFG',
  SM_POP_REFG_OR :'SM.POP.REFG.OR'
};

const MongoClient = require('mongodb').MongoClient;
const DBURL = 'mongodb://localhost:27017';
let DB = null;
let INDICATORS = null;
let COUNTRIES = null;

var DATE = 'date=2000:2017';

function init(callback) {
  // Use connect method to connect to the Server
  MongoClient.connect(DBURL, { useNewUrlParser: true }, function(err, client) {
    if (!err) {
  	  DB = client.db('worldbank');
      INDICATORS = DB.collection('indicators');
      COUNTRIES = DB.collection('countries');
    }
    callback(err);
  });	
}

function readCountryIndicators(countryId) {
  const p = new Promise((resolve, reject) => {
    const callback = function(err, data) {
      err ? reject(err) : resolve(data);
    };

    INDICATORS.findOne({"iso2" : countryId}, function(err, item) {
      if (!item) {
        insertItem({"iso2" : countryId}, callback);
      } else {
        onFindItem(item, callback);
      }
    });
  });

  return p;
}

function readIndicators(countryId) {
  if (countryId) {
    return readCountryIndicators(countryId);
  }
  /*projection of mongodb entries (e.g.filter)*/
  const pr = {
    _id:0,
    'SP_POP_TOTL.legend':0,
    'SM_POP_REFG_OR.legend':0,
    'SM_POP_REFG.legend':0
  };
  const p = new Promise((resolve, reject) => {
    INDICATORS.find().project(pr).toArray((err, items) => {
      err ? reject(err) : resolve(items);
    });
  });
  return p;
}

function insertItem(item, callback) {
	INDICATORS.insert(item, function(err, _item) {
		if (err) {
			callback(err, null);
		} else {
			onFindItem(item, callback);
		}
	});
}

function onFindItem(item, callback) {
	ensureIndicator(item, ["SP_POP_TOTL", "SM_POP_REFG", "SM_POP_REFG_OR"], true, callback);
}

function ensureIndicator(item, indicators, store, callback) {
	if (indicators.length <= 0) {
		if (store) {
		  INDICATORS.update({iso2: item.iso2}, {$set : item}, function(err, _item){
			callback(null, item);
		  });
		} else {
			callback(null, item);
		}
	} else {
		var indicator = indicators.shift();
		if (!item[indicator]) {
			worldbankDB(item.iso2, indicator, function(err, data) {
				if (err) {
					callback(err, null);
				} else {
				  console.log(indicator, data, indicators);
				  item[indicator] = data;
				  ensureIndicator(item, indicators, true, callback);
				}
			});
		} else {
			ensureIndicator(item, indicators, store, callback);
		}
	}
}

function readCountries(callback) {
  var page = 1;
  var pages = 1;
  
  const pr = {
    _id:0
  };
  COUNTRIES.find().project(pr).toArray(function(err, items) {
    if (err) {
      callback(err, null);
    } else if (items.length === 0) {
      var loadNextPage = function() {
        var url = `http://api.worldbank.org/countries/?format=json&page=${page}`;
        HTTP.get(url, function(_res){
          var str = "";
          _res.on("data", function(chunk) {
            str += chunk;
          });
      
          _res.on('end', function () {
            var result = JSON.parse(str);
            pages = result[0].pages;
            items = items.concat(result[1]);
            COUNTRIES.insert(result[1], function(err, _items) {
              if (page < pages) {
                page++;
                loadNextPage();
              } else {
                callback(null, items);
              };
            });
          });
        });
      }
      loadNextPage();
    } else {
      callback(null, items);
    }
  });
}

function getHTTPPromise(options) {
  const p = new Promise((resolve, reject) => {
    HTTP.get(options)
    .on('response', resp => {
      let buf = '';
      resp.on('data', chunk => buf += chunk);
      resp.on('end', () =>{
        resolve(buf);
      });
      resp.on('error', err => {
        console.log('getHTTPPromise error');
        reject(err);
      });
    })
    .on('error',  err =>{
      reject(err);
    });
  });
  return p;
}

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
        path: `/countries/${country}/indicators/${indicator.replace(/_/g,'.')}?format=json&page=${page}`
      };
      console.log(options);
      getHTTPPromise(options).then(cdata => {
        console.log('cdata', cdata);
        const result = JSON.parse(cdata);
        const head = result[0];
        const years = result[1];
        console.log(head);
        pages = head.pages;
    
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
    let page = 1;
    let pages = 1;
    const loadNextPage = function() {
      const options = {
        method: 'GET',
        hostname: 'api.worldbank.org',
        path: `/countries/${country}/indicators/${indicator.replace(/_/g,'.')}?format=json&page=${page}`
      };
      console.log(options);
      getHTTPPromise(options).then(cdata => {
        console.log('cdata', cdata);
        const result = JSON.parse(cdata);
        const head = result[0];
        const years = result[1];
        console.log(head);
        pages = head.pages;
    
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

function worldbankDB(country, indicator, callback) {
  //var url = "http://api.worldbank.org/indicators/" + indicator.replace(/_/g,".") + "?format=json";
  console.log("worldbankDB");
  const options = {
	method: 'GET',
	hostname: 'api.worldbank.org',
	path: `/indicators/${indicator.replace(/_/g,'.')}?format=json`,
  };

  getHTTPPromise(options)
    .then(parseIndicatorData)
    .then(result => loadCountryData(result, country, indicator))
    .then(item => {
      callback(null, item);
    })
    .catch(err => {
      callback(err, null);
    });
}


exports.init = init;
exports.readIndicators = readIndicators;
exports.readCountries = readCountries;