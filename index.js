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

app.use('/data/wb', function(req, res){
  var parts = url.parse(req.url);
//http://api.worldbank.org/countries/bra;usa

  var path = parts.path;
  var elements = path.split("/");
  //console.log(elements);
  elements.shift();
  //console.log(elements);
  //countries = elements[1].split(";");
  var country = elements[0];

  if (country) {
    worldbank.readIndicators(country)
      .then(data => {
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(data));
      })
      .catch(err => {
        res.setHeader("Content-Type", "text/plain");
        res.statusCode = 500;
        res.send(err.message);
      });
  } else {
    worldbank.readIndicators()
      .then(data => {
        res.setHeader("Content-Type", "application/json");
        console.log(data);
        res.send(JSON.stringify(data));
      })
      .catch(err => {
        res.setHeader("Content-Type", "text/plain");
        res.statusCode = 500;
        res.send(err.message);
      });
  }
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
  worldbank.readCountries((err, countries) => {
    if (err) {
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 500;
      res.send(JSON.stringify({}));
    } else {
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
    }
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
});

