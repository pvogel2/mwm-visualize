const PATH = require('path');
const FS = require('fs');
const SHAPEFILE = require('shapefile');
const DBF = require('./dbf.js');


const BASE = 'data/naturalEarth';
const IDMAP = {
  coastline: 'ne_10m_coastline',
  geolines: 'ne_10m_geographic_lines',
  populatedplaces: 'ne_10m_populated_places',
  boundariesland: 'ne_10m_admin_0_boundary_lines_land',
  lakes: 'ne_10m_lakes',
  rivers: 'ne_10m_rivers_lake_centerlines_scale_rank',
  boundariesmaritime: 'ne_10m_admin_0_boundary_lines_maritime_indicator',
  pacificgroupings: 'ne_10m_admin_0_pacific_groupings'
};

const TYPEMAP = {
  dbase: 'dbf',
  shape: 'shp',
  three: 'three'
};

function getData(params) {
  const id = getId(params);
  const path = getPath(params);
  const type = getType(params);

  if (!path) return null;

  if (type === TYPEMAP.shape) {
    return SHAPEFILE.open(path);
  } else if (type === TYPEMAP.three) {
    return getCachedData(params);
  } else {
    // dbase
    if (id === 'ne_10m_populated_places') {
      return DBF.getParsedData(path);
    } else {
      return SHAPEFILE.openDbf(path);
    }
  };
}

function getPath(params) {
  if (!params.length) {
    console.error('no openworld data parameters');
    return null;
  };

  const id = getId(params);

  if (!id) {
    console.error('no valid id');
    return null;
  }

  const type = getType(params);

  return PATH.join(BASE, id, `${id}.${type}`);
}

function getType(params) {
  return TYPEMAP[params[1]] || TYPEMAP.dbase;
}

function setType(params, type) {
  if (TYPEMAP[type]) {
    params[1] = type;
  };
}

function getId(params) {
  return IDMAP[params[0]];
}

function cacheData(params, data) {
  const targetpath = getPath(params);
  console.log('targetpath', targetpath);

  FS.open(targetpath, 'w', (err, fd) => {
    FS.writeSync(fd, JSON.stringify(data));
    FS.closeSync(fd);
    console.log('finished writing');
  });
}

function getCachedData(params) {
  if (!params) return null;

  const p = new Promise(function(resolve, reject) {
    const cachepath = getPath(params);
    const rs = FS.createReadStream(cachepath, {flags: 'r', encoding: 'utf-8'});
    rs.on('readable', () => {
      resolve(rs);
    }); 

    rs.on('error', () => {
      console.log('readable stream error');
      // saveData(params);
      const shapeParams = params.concat();
      setType(shapeParams, 'shape');
      const path = getPath(shapeParams);
      parseShape(path).then(function(data){
        console.log(data);
        cacheData(params, data);
        resolve(data);
      });
    }); 
  });
  return p;
}

function parseShape(path) {
  let data = [];
  return SHAPEFILE.open(path).then(source => source.read()
    .then(
      function parse(result) {
        if (result.done) {
          return data;
        };
        const item = result.value;
        if (item.type === "Feature") {
          if (item.geometry.type === "MultiLineString") {
            item.geometry.coordinates.forEach(line => {
              data = data.concat(line);
              data.push([0.0,0.0,1.0]);
            });
          } else if (item.geometry.type === "Polygon") {
            data = data.concat(item.geometry.coordinates[0]);
          } else {
            data = data.concat(item.geometry.coordinates);
          }
          data.push([0.0,0.0,1.0]);
        }
        return source.read().then(parse);
      }
    )
  )
  .catch(error => console.error(error.stack));
}

exports.getData = getData;
