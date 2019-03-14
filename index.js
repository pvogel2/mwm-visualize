const express = require('express');
const app = express();
const acorn = require('acorn');
const fs = require('fs');
const url = require('url');
const openworld = require('./lib/openworld');
const worldbank = require('./lib/worldbank');
const csv2json = require('csvtojson');

app.get('/', (req, res) => res.sendFile(__dirname + '/res/html/index.html'));
app.use('/res/js/three/', express.static('node_modules/three/'));
app.use('/res/js/acorn/', express.static('node_modules/acorn/'));
app.use('/res/js/mdc/', express.static('node_modules/material-components-web/dist/'));
app.use('/res/css/mdc/', express.static('node_modules/material-components-web/dist/'));
app.use('/res/js/mwm/', express.static('node_modules/mwm-renderer/dist/'));
app.use('/res/js/assets/', express.static('res/js/'));
app.use('/res/obj/', express.static('res/obj/'));
app.use('/res/css/', express.static('res/css/'));
app.use('/res/html/', express.static('res/html/'));

app.use('/parse/openworld', function(req, res) {
  const params = req.path.split("/").filter(item => !!item);
  openworld.parseData(params)
  .then(result => {
    res.setHeader("Content-Type", "application/json");
    if (result.pipe) {
      console.log('piping data');
      result.pipe(res);
    } else {
      console.log('sending data');
      res.send(result);
    }
  })
  .catch(error => console.error(error.stack));
});

app.use('/data/wbv2/', function(req, res) {

  const parts = url.parse(req.url, true);
//http://api.worldbank.org/countries/bra;usa
  let country = '';
  let indicator = '';
  let date = parts.query.date || '2017';
  const path = parts.path;
  const elements = path.split("/");
  elements.shift();
  const flag = elements.shift();

  if (flag ==='country') {
    country = elements.shift();
    elements.shift();
    let indicators = elements.shift();
    const promises = [];

    if (indicators) {
      console.log('indicators', indicators, indicators.length);
      indicators = indicators.split(';');
      console.log('indicators', indicators, indicators.length);
      indicators.forEach(indicator => {
        promises.push(worldbank.countryQuery(country, indicator, date));
      });
    } else {
      console.log('country', country);
      promises.push(worldbank.countryQuery(country));
    }

    Promise.all(promises)
    .then(results => {
      let result = [];
      results.forEach(arr => { 
        result = result.concat(arr);
      });
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(result));
    })
    .catch(err => {
      res.setHeader("Content-Type", "text/plain");
      res.statusCode = 500;
      res.send(err.message);
    });
  } else if (flag ==='indicator') {
    indicator = elements.shift();
    const p = worldbank.indicatorQuery(indicator);
    p.then(r => {
      res.setHeader("Content-Type", "application/json");
      res.send(JSON.stringify(r));
    })
    .catch(err => {
      res.setHeader("Content-Type", "text/plain");
      res.statusCode = 500;
      res.send(err.message);
    });
  } else {
    console.log('unknown:', flag);
  }
  // 
  // 
});

app.use('/data/centroids', function(req, res){
  //csv2json().fromFile('data/centroids/country_centroids_all.csv').then(json => {
  csv2json().fromFile('data/centroids/country_centroids_google.csv').then(json => {
    json.forEach(item => {
      item.iso2Code = item.country;
    });
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(json));
  });
});

app.use('/data/countries', function(req, res){
  console.log('aaa');
  worldbank.countryQuery()
    .then(countries => {
      csv2json().fromFile('data/centroids/country_centroids_google.csv').then(centroids => {
        countries.forEach(country => {
          const center = {
            latitude: country.latitude,
            longitude: country.longitude
          };
          centroids.forEach(centroid => {
            if (centroid.country === country.iso2Code) {
              center.latitude = centroid.latitude;
              center.longitude = centroid.longitude;
            }
          });
          country.center = center;
        });
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(countries));
      });
    })
    .catch(err => {
      console.log('api call /data/countries', err);

      res.setHeader("Content-Type", "application/json");
      res.statusCode = 500;
      res.send(JSON.stringify({}));
    });
});

app.use('/data/openworld', function(req, res) {
  const params = req.path.split("/").filter(item => !!item);
  const data = [];
  openworld.getData(params).then(source => {
      if (source.pipe) {
        console.log('piping data');
        res.setHeader("Content-Type", "application/json");
        source.pipe(res);
      } else if (source.read) {
        source.read().then(
          function log(result) {
            if (result.done) {
              res.setHeader("Content-Type", "application/json");
              res.send(data);
              return;
            };
            data.push(result.value);
            return source.read().then(log);
          }
        );
      } else {
              res.setHeader("Content-Type", "application/json");
              res.send(data);
              return;
      }
    })
    .catch(error => console.error(error.stack));
});

app.use('/dbf', function(req, res){
  const dbf = require('./dbf.js');
  dbf.getParsedData()
  //openworld.getData(['populatedplaces','dbase'])
    .then(data => {
      res.setHeader("Content-Type", "application/json");
      res.send(data);
    })
    .catch(err => {
      console.log("error occured:", err);
      res.send([]);
    });
});

worldbank.init(err => {
  err
    ? console.log('App initialization failed!', err)
    : app.listen(3001, () => console.log('App listening on port 3001!'));
}, {dburl: 'mongodb://localhost:27017'});

