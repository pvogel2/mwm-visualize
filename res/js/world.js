let renderer;

function loadCities(parent, color) {
  loadFeature(getWorldSphere(), 0xffffff, 'populatedplaces','dbase');
};

function removeCities() {
  renderer.removeObject('citypoints');
  renderer.removeObject('citylines');
  renderer.removeObject('sizedCities');
};

function loadCountries(parent, color) {
  fetch('/data/countries').then(
      response => response.json()
      ).then(json => {
        wb.setData(json);
        createCentroids(json, parent, color);
        const captials = json.filter(item => {
          return item.latitude !== "" && item.longitude !== "";
        });
        createCapitalInstances(captials, color).then(mesh => {
          renderer.addObject('capitalCities', mesh, false, parent);
        });
      }).catch(function(err) {
        console.log('err', err);
      });
}

function loadPopulation() {
  const config = {
    scale: 0.00000001,
    lat: 0.3,
    long:-0.33
  };

  loadIndicator(getWorldSphere(), 0x0000dd, wb.SP_POP_TOTL, config);
};

function loadRefugees() {
  const config = {
      scale: 0.00001,
      lat: 0.3,
      long:-0.99
    };

    loadIndicator(getWorldSphere(), 0xdd0000, wb.SM_POP_REFG, config);
};

function loadRefugeesOrigin() {
  const config = {
    scale: 0.00001,
    lat: 0.3,
    long:-1.65
  };

  loadIndicator(getWorldSphere(), 0x00dd00, wb.SM_POP_REFG_OR, config);
};

function unloadPopulation() {
  unloadIndicator(wb.SP_POP_TOTL);
}

function unloadRefugees() {
  unloadIndicator(wb.SM_POP_REFG);
}

function unloadRefugeesOrigin() {
  unloadIndicator(wb.SM_POP_REFG_OR);
}

function loadIndicator(parent, color, id, config) {
  const p = wb.loadIndicator(id);
  const objId = `${id.replace(/\./g, '_')}Blocks`;
  p.then(
    response => response.json()
  ).then(json => {
    createIndicatorInstances(json, color, config.scale, '' + wbCtrl.getYear(), id, {lat: config.lat, long: config.long}).then(mesh => {
      console.log(`add ${objId}`);
      renderer.addObject(objId, mesh, false, parent);
    });
  }).catch(function(err) {
    console.log('err', err);
  });
};

function unloadIndicator(id) {
  renderer.removeObject(`${id.replace(/\./g, '_')}Blocks`);
}

function loadFeature(parent, color, id, type) {
  if (worldWorker) {
    worldWorker.postMessage({id:id, type: type, color: color});
  } else {
    fetch(`/data/openworld/${id}/${type}`).then(
      response => response.json()
    ).then(json => {
      console.log("LOADED JSON FOR FEATURE");
      var obj = createFeature(json, color);
      renderer.addObject( id, obj , false, parent);
      console.log("create line complete end");
  
    }).catch(function(err) {
      console.log('err', err);
    });
  }
};

function removeFeature(id) {
  renderer.removeObject( id);
};

async function createIndicatorInstances(data, color, scale, year, id, offset) {
  var offsets = [];
  var orientations = [];
  var values = [];
  var instanceCounter = 0;

  for (var i = 0; i < data.length; i++) {
    var date = data[i];
    var wb_country = wb.map[date.country.id.toLowerCase()];


    if (wb_country && date.date === year && date.indicator.id === id) {
      var s0 = calcSphericalFromLatLongRad(Number(wb_country.center.latitude)+offset.lat, Number(wb_country.center.longitude)+offset.long, 20.025);
      values.push(scale * date.value || 0.0);
    } else {
      //console.log("no wb_Country", date.iso2.toLowerCase(), date);
      continue;
    }
 
    var v0 = new THREE.Vector3().setFromSpherical(s0);
    v0.toArray(offsets, instanceCounter * 3);
    pushOrientationFromSpherical(s0, orientations);
    instanceCounter++;
  }

  const pillar = new PillarTemplate({color});
  pillar.geometry.maxInstancedCount = instanceCounter;
  pillar.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
  pillar.geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ) );
  pillar.geometry.addAttribute( 'value', new THREE.InstancedBufferAttribute( new Float32Array( values ), 1 ) );

  const mesh = await pillar.getMesh(renderer);
  return mesh;
}

async function createCityInstances(data, color) {
  var instances = data.length;
  var colors = [];
  var offsets = [];

  var rank_max_map = [
    {size:110, color: new THREE.Color( 0, 1, 0)},
    {size:110, color: new THREE.Color( 0, 1, 0)},
    {size:110, color: new THREE.Color( 0, 1, 0)},
    {size:110, color: new THREE.Color( 0, 1, 0)},
    {size:120, color: new THREE.Color( 0, 1, 0)},
    {size:120, color: new THREE.Color( 0, 1, 0)},
    {size:120, color: new THREE.Color( 0, 1, 0)},
    {size:140, color: new THREE.Color( 0, 1, 0)},
    {size:140, color: new THREE.Color( 0, 1, 0)},
    {size:180, color: new THREE.Color( 0.2, 0.8, 0)},
    {size:260, color: new THREE.Color( 0.4, 0.6, 0)},
    {size:420, color: new THREE.Color( 0.6, 0.4, 0)},
    {size:520, color: new THREE.Color( 0.8, 0.2, 0)},
    {size:620, color: new THREE.Color( 1, 0.2, 0)},
    {size:700, color: new THREE.Color( 1, 0, 0)}
   ];

  var orientations = [];
  var scales = [];

  for(var i = 0; i < instances; i++) {
    var date = data[i];
    var s0 = calcSphericalFromLatLongRad(date.lat ? date.lat : date[1], date.long ? date.long : date[0], 20.0);
    var v0 = new THREE.Vector3().setFromSpherical(s0);
    v0.toArray(offsets, i * 3);
    pushOrientationFromSpherical(s0, orientations);

    var cityColor = rank_max_map[date.rankmax].color;
    const size = rank_max_map[date.rankmax].size;
    cityColor.toArray(colors, i * 3);
    scales.push(size / 700);
  }

  var city = new CityTemplate();

  city.geometry.maxInstancedCount = instances;
  city.geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array( scales ), 1 ) );
  city.geometry.addAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 3 ) );
  city.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
  city.geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ) );

  const cMesh = await city.getMesh(renderer);
  return cMesh;
}


async function createCapitalInstances(data, color) {
  var instances = data.length;

  var colors = [];
  var offsets = [];

  var cityColor = new THREE.Color( color);
   var orientations = [];
  var scales = [];

  for(var i = 0; i < instances; i++) {
    var date = data[i];
    var s0 = calcSphericalFromLatLongRad(Number(date.latitude), Number(date.longitude), 20.025);
    var v0 = new THREE.Vector3().setFromSpherical(s0);
    v0.toArray(offsets, i * 3);
    pushOrientationFromSpherical(s0, orientations);
    scales.push(1.5);
    cityColor.toArray(colors, i * 3);
  }

  var city = new CityTemplate();

  city.geometry.maxInstancedCount = instances;
  city.geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array( scales ), 1 ) );
  city.geometry.addAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 3 ) );
  city.geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
  city.geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ) );

  const cMesh = await city.getMesh(renderer);
  return cMesh;
}

function createCentroids(data, parent, color) {
  const p_uniforms = {
      texture:   { type: "t", value: renderer.getTexture( "disc.png" ) },
  };
  p_uniforms.texture.value.wrapS = p_uniforms.texture.value.wrapT = THREE.RepeatWrapping;

  var p_material = new THREE.ShaderMaterial( {
    uniforms: p_uniforms,
    depthWrite: false,
    transparent: true,
    vertexShader:   document.getElementById( 'vertexshader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshader' ).textContent
  });

  var p_geometry = new THREE.BufferGeometry();
  var p_positions = new Float32Array( data.length * 3 );
  var p_colors = new Float32Array( data.length * 3 );
  var p_sizes = new Float32Array( data.length);

  var pointColor = new THREE.Color( 1, 0, 0);
  for (var i = 0; i < data.length; i++) {
      var date = data[i];
      var s0 = calcSphericalFromLatLongRad(Number(date.center.latitude), Number(date.center.longitude), 20.025);
      var v0 = new THREE.Vector3().setFromSpherical(s0);

      v0.toArray(p_positions, i * 3);
      pointColor.toArray( p_colors, i * 3);
      p_sizes[i] = 200;
  }
  //centroid_size_bufferAttr = ;
  //centroid_size_bufferAttr.dynamic = true;
  p_geometry.addAttribute( 'position', new THREE.BufferAttribute( p_positions, 3 ));
  p_geometry.addAttribute( 'size', new THREE.BufferAttribute( p_sizes, 1 ));
  p_geometry.addAttribute( 'color', new THREE.BufferAttribute( p_colors, 3 ));

  //var s_material = new THREE.PointsMaterial( { size: 0.05, vertexColors: THREE.VertexColors } );
  var centroids = new THREE.Points( p_geometry, p_material );
  //var lines = new THREE.LineSegments( s_geometry, s_material );
  //renderer.addObject( 'citypoints', points, false );
  //parent.add(centroids);
  renderer.addObject( 'centroids', centroids , true, parent);
}

function createFeature(data, color) {
  var length = data.length;
  var s_geometry = new THREE.BufferGeometry();
  var s_positions = new Float32Array( length * 3 );
  var s_colors = new Float32Array( length * 3 );
  var s_helpers = new Float32Array( length );

  var pointColor = new THREE.Color(color);
  for (var i = 0; i < length; i++) {
      var date = data[i];
      var v0;
      if (date[2] === 1.0) {
        v0 = new THREE.Vector3();
        s_helpers[i] = 1.0;
      } else {
        v0 = new THREE.Vector3().setFromSpherical(calcSphericalFromLatLongRad(date[1], date[0], 20));
        s_helpers[i] = 0.0;
      }
      
      v0.toArray(s_positions, i * 3);
      pointColor.toArray(s_colors, i * 3);
  }
  s_geometry.addAttribute( 'position', new THREE.BufferAttribute( s_positions, 3 ));
  s_geometry.addAttribute( 'color', new THREE.BufferAttribute( s_colors, 3 ));
  s_geometry.addAttribute( 'helper', new THREE.BufferAttribute( s_helpers, 1 ));
  // s_geometry.addAttribute( 'size', new THREE.BufferAttribute( s_sizes, 1 ));
  // s_geometry.dynamic = true;
  // var s_material = new THREE.LineBasicMaterial( { color: color || 0xffffff } );
  var vertexShader = 'varying vec4 vColor;'
    + 'attribute float helper;'
    + 'void main() {'
    + 'vColor = vec4( color, 1. - helper );'
    + 'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );'
    + '}';

  var fragmentShader = 'varying vec4 vColor;'
    + 'void main() {'
    + 'float a = vColor.a < 1. ? 0. : 1.;'
    + 'gl_FragColor = vec4(vColor.xyz, a);'
    + '}';
  var s_material = new THREE.ShaderMaterial({
    //clipping: true,
    transparent: true,
    //depthWrite: false,
    vertexColors: THREE.VertexColors,
    //blending : THREE.AdditiveBlending,
    vertexShader : vertexShader,
    fragmentShader : fragmentShader
  });

  return new THREE.Line( s_geometry, s_material );
}

function createTemperatureInstance(data) {
  const grid = ipcc.getGrid();

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array( data.length * 3 );
  const colors = new Float32Array( data.length * 3 );

  const material = new THREE.ShaderMaterial({
    depthWrite: false,
    transparent: true,
    vertexShader:   document.getElementById( 'vertexshaderTest' ).textContent,
    fragmentShader: document.getElementById( 'fragmentshaderTest' ).textContent
    /*vertexColors: THREE.VertexColors,
    vertexShader : 'varying vec4 vColor;\n\tvoid main() {\n\tvColor = vec4( color, 1.0 );\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}',
    fragmentShader : 'varying vec4 vColor;\n\tvoid main() {\n\tgl_FragColor = vColor;\n}'*/
  });

  let totalCount = 0;
  var rank_anomaly_map = ipcc.getColorMap()
  const blackColor = new THREE.Color( 0x010101);
  const tmp_data = new Uint8Array(3 * grid.longitude.length * grid.latitude.length);

  for (let i_lat = 0; i_lat < grid.latitude.length; i_lat++) {
    const curr_lat = grid.latitude[i_lat];

    for (let i_long = 0; i_long < grid.longitude.length; i_long++) {
      const curr_long = grid.longitude[i_long];

      var s0 = calcSphericalFromLatLongRad(curr_lat, curr_long, 20.25);
      var v0 = new THREE.Vector3().setFromSpherical(s0);
      var value = data[totalCount];
      v0.toArray(positions, totalCount * 3);

      if(-1.0000000150474662e+30 === value) {
       blackColor.toArray( colors, totalCount * 3);
        tmp_data[totalCount * 3] = 255 * blackColor.r;
        tmp_data[totalCount * 3 + 1] = 255 * blackColor.g;
        tmp_data[totalCount * 3 + 2] = 255 * blackColor.b;
      } else {
        const baseColor = rank_anomaly_map[0].color;
        tmp_data[totalCount * 3] = 255 * baseColor.r;
        tmp_data[totalCount * 3 + 1] = 255 * baseColor.g;
        tmp_data[totalCount * 3 + 2] = 255 * baseColor.b;
        const valueMaped = rank_anomaly_map.find(m => {
          return m.step >= value;
        });
        if (valueMaped) {
         valueMaped.color.toArray(colors, totalCount * 3);
          tmp_data[totalCount * 3] = 255 * valueMaped.color.r;
          tmp_data[totalCount * 3 + 1] = 255 * valueMaped.color.g;
          tmp_data[totalCount * 3 + 2] = 255 * valueMaped.color.b;
        } else {
          baseColor.toArray(colors, totalCount * 3);
          tmp_data[totalCount * 3] = 255 * baseColor.r;
          tmp_data[totalCount * 3 + 1] = 255 * baseColor.g;
          tmp_data[totalCount * 3 + 2] = 255 * baseColor.b;
        }
      }
      totalCount++;
    }
  }

  geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ));
  geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ));

  const points = new THREE.Points( geometry, material);
  const parent = getWorldSphere();
  //renderer.addObject( 'ipccTemp01', points , false, parent);

  const texture = new THREE.DataTexture( tmp_data, grid.longitude.length, grid.latitude.length, THREE.RGBFormat, THREE.UnsignedByteTyp, THREE.UVMapping);
  texture.needsUpdate = true;

  parent.material.map = texture;
  parent.material.color = new THREE.Color( 1, 1, 1);
  parent.material.map.needsUpdate = true;
  parent.material.needsUpdate = true;
  parent.geometry.uvsNeedUpdate = true;

  return texture;
};

function removeTemperatureInstance() {
  renderer.removeObject('ipccTemp01');
};

function calcSphericalFromLatLongRad(lat, long, r) {
    var phi   = (90-lat)*(Math.PI/180);
    var theta = (long+180)*(Math.PI/180);
    return new THREE.Spherical(r, phi, theta - Math.PI * 0.5);
}

function pushOrientationFromSpherical(s, target) {
  /**currently inversion needed to compensate a inversion problem from using quaternions*/
  const a = -1 * s.phi;
  const b = -1 * s.theta;
  /**multiplication of two quaternions rotating phi and theta*/
  target.push( Math.cos(a/2)*Math.cos(b/2) );
  target.push( -1*Math.sin(a/2)*Math.sin(b/2) );
  target.push( Math.cos(a/2)*Math.sin(b/2) );
  target.push( Math.sin(a/2)*Math.cos(b/2) );
}

function getWorldSphere() {
  if (!window._worldSphere) {
    const geometry = new THREE.SphereGeometry( 20, 64, 64 );
    //  var obj = new THREE.Mesh( object, new THREE.MeshPhongMaterial( {glowMap : emap,reflectivity :0.5, map : dmap, specularMap :smap, bumpMap :bmap , bumpScale : 0.005} ));
    //const material = new THREE.MeshPhongMaterial( {map: earthTexture, bumpMap : earthTexture, bumpScale :0.2} );
    var color = new THREE.Color( 0x010101);
    const material = new THREE.MeshPhongMaterial( {color: color} );
    window._worldSphere = new THREE.Mesh( geometry, material );
  }
  return window._worldSphere;
};

document.addEventListener("DOMContentLoaded", function(event) {
  const animations = [];
  renderer = new MWM.Renderer({});
  renderer.res = '/res/obj/';

  const worldSphere = getWorldSphere();

  window.runAnimation = true;
  worldSphere.onAfterRender = function(){
    worldSphere.rotateY(0.002);
  };

  var fabMenuEl = document.querySelector('#fab_menu');
  fabMenuEl.addEventListener('MDCMenu:selected', function(evt) {
     var detail = evt.detail;
     if (detail.index === 0) {
       window.runAnimation = !window.runAnimation;
       if (window.runAnimation) {
          worldSphere.onAfterRender = function(){
            worldSphere.rotateY(0.002);
          };
       } else {
          worldSphere.onAfterRender = function(){};
       }
     }
  });

  renderer.addObject('world', worldSphere);

  // White directional light at half intensity shining from the top.
  const sunLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
  renderer.addObject( 'sunLight', sunLight );

  //document.querySelector('.mwm-loading').style.display = 'none';


  if (window.Worker) {
    worldWorker = new Worker('/res/js/assets/worldworker.js');

    worldWorker.addEventListener('message', msg => {
      const json = msg.data.json;
      const id = msg.data.id;
      const color = msg.data.color;
      const parent = getWorldSphere();
      if (id === 'populatedplaces') {
        createCityInstances(json, color).then(mesh => {
          renderer.addObject('sizedCities', mesh, false, parent);
        });
      } else {
        const obj = createFeature(json, color);
        renderer.addObject( id, obj , false, parent);
      }
    });

    loadCountries(getWorldSphere(), 0xffffff);
  }

  loadFeature(getWorldSphere(), 0xffffff, 'coastline','three');
  loadFeature(getWorldSphere(), 0x666666, 'boundariesland','three');

  renderer.registerEventCallback("click", (event, intersections) => {
    var intersected;
    if (intersections && intersections.length) {
      intersections.forEach(item => {
        if (!intersected || intersected.distanceToRay > item.distanceToRay) {
          intersected = item;
        }
      });
    }
    if (intersected && intersected.index != null) {
      intersected.object.geometry.attributes.size.array[intersected.index] = 400;
      intersected.object.geometry.attributes.size.needsUpdate = true;

      wbCtrl.setCountry(intersected.index);
    }
  });

  renderer.start();
});