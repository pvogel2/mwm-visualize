const Parser = require('node-dbf').default;


function getParsedData() {
  const parser = new Parser('data/naturalEarth/ne_10m_populated_places/ne_10m_populated_places.dbf');

  const p = new Promise((resolve, reject) => {
    const data = [];
    parser.on('start', (p) => {
        console.log('dBase file parsing has started');
    });
    
    parser.on('header', (h) => {
        console.log('dBase file header has been parsed');
    });
    
    parser.on('record', record => {
      const date = {
        rankmax: record.RANK_MAX, //population (from 0 .. 14)
        name: record.NAME,
        lat: Number(record.LATITUDE),//.replace(',','.')),
        long: record.LONGITUDE
      };
      data.push(date);
    });
    
    parser.on('end', (p) => {
      console.log('Finished parsing the dBase file. Records found: ', data.length);
      resolve(data);  
    });
    
    parser.parse();
  });
  return p;
};
exports.getParsedData = getParsedData;