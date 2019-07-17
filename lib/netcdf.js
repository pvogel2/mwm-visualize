const fs = require('fs');
const NetCDFReader = require('netcdfjs');

function getStructure() {
  const p = new Promise((resolve, reject) => {
    //const data = fs.readFileSync('data/ipcc/crutem4/CRUTEM.4.6.0.0.variance_adjusted.nc');
    const data = fs.readFileSync('data/ipcc/crutem4/CRUTEM.4.6.0.0.anomalies.nc');
    const reader = new NetCDFReader(data);
    const recordDimension = reader.recordDimension;

    const structure = {
      globalAttributes: reader.globalAttributes,
      variables: reader.variables,
      recordDimension: recordDimension,
      grid: {
        latitude: reader.getDataVariable('latitude'),
        longitude: reader.getDataVariable('longitude')
      },
      indexValues: reader.getDataVariable(recordDimension.name),
   };
    resolve(structure);
  });
  return p;
}

function getData(index) {
  const p = new Promise((resolve, reject) => {
    //const data = fs.readFileSync('data/ipcc/crutem4/CRUTEM.4.6.0.0.variance_adjusted.nc');
    const data = fs.readFileSync('data/ipcc/crutem4/CRUTEM.4.6.0.0.anomalies.nc');
    const reader = new NetCDFReader(data);

    console.log(JSON.stringify(reader.variables));
    console.log(reader.recordDimension);
    console.log(reader.globalAttributes);
    console.log('------------------------');
    console.log(reader.getDataVariable('time'));
    console.log('------------------------');
    // console.log(reader.getDataVariable('longitude'));
    console.log('------------------------');
    var anomalies = reader.getDataVariable('temperature_anomaly');
    resolve(anomalies[Number(index)]);
  });
  return p;
  // const data = fs.readFileSync('../data/ipcc/hadcrut4/HadCRUT.4.6.0.0.median.nc');
  const data = fs.readFileSync('../data/ipcc/crutem4v/CRUTEM.4.6.0.0.variance_adjusted.nc');
  var reader = new NetCDFReader(data);
  console.log(reader.dimensions);
  console.log('------------------------');
  console.log(JSON.stringify(reader.variables));
  console.log('------------------------');
  console.log(reader.globalAttributes);
  console.log('------------------------');
  console.log(reader.dimensions);
  console.log('------------------------');
  console.log(reader.getAttribute('latitude'));
  console.log('------------------------');
  // console.log(reader.getDataVariable('longitude'));
  console.log('------------------------');
  console.log(reader.recordDimension);
  console.log('------------------------');
  console.log(reader.getDataVariable('latitude').length);
  console.log(reader.getDataVariable('longitude').length);
  console.log(reader.getDataVariable('time').length);
  console.log(reader.getDataVariable('temperature_anomaly')[2031].length);
  // console.log(reader.getDataVariable('temperature_anomaly')[0][0]);
  console.log(reader.getDataVariable('temperature_anomaly')[2000][200]);
  console.log(reader.getDataVariable('field_status')[1977][3]);
}

exports.getData = getData;
exports.getStructure = getStructure;