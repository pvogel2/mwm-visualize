const Parser = require('node-dbf').default;

const memCache = {};

function getParsedData(path) {
  const p = new Promise((resolve, reject) => {
    if (memCache[path]) {
      console.log('Use cached memcache data. Records cached: ', memCache[path].length);
      resolve(memCache[path]);
      return;
    }
    
    const data = [];
    const parser = new Parser(path);
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

      memCache[path] = data;

      resolve(data);
    });
    
    parser.parse();
  });
  return p;
};
exports.getParsedData = getParsedData;