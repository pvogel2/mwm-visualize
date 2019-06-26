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
        //createCapitals(json, parent, color);
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

function loadCentroids(parent, color) {
  fetch('/data/centroids').then(
  response => response.json()
  ).then(json => {
    wb.setData(json);
    createCentroids(json, parent, color);
  }).catch(function(err) {
    console.log('err', err);
  });
};

function loadCapitals(parent, color) {
  fetch('/data/countries').then(
  response => response.json()
  ).then(json => {
    createCapitals(json, parent, color);
  }).catch(function(err) {
    console.log('err', err);
  });
};

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
    long:-0.65
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
    createPopulationInstances(json, color, config.scale, '' + window._controls_.date, id, {lat: config.lat, long: config.long}).then(mesh => {
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

function createCityCloud(data, parent, color) {
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

  var c_material = new THREE.ShaderMaterial({
      vertexColors: THREE.VertexColors,
      //shading : THREE.SmoothShading,
      vertexShader : 'varying vec4 vColor;\n\tvoid main() {\n\tvColor = vec4( color, 1.0 );\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}',
      fragmentShader : 'varying vec4 vColor;\n\tvoid main() {\n\tgl_FragColor = vColor;\n}'
  });
  // geometry, need to buffer due to dynamic changing values
  var c_geometry = new THREE.BufferGeometry();

  // attributes
  var c_positions = new Float32Array( data.length * 2 * 3 ); // 3 vertices per point
  var c_colors = new Float32Array( data.length * 2 * 3 );

  var groundColor = new THREE.Color( 1, 1, 1);

  for (var i = 0; i < data.length; i++) {
      var date = data[i];

      var s0 = calcSphericalFromLatLongRad(date.lat ? date.lat : date[1], date.long ? date.long : date[0], 20.0);
      var s1 = s0.clone();
      s1.radius += 0.007 * rank_max_map[date.rankmax].size;

      var v0 = new THREE.Vector3().setFromSpherical(s0);
      var v1 = new THREE.Vector3().setFromSpherical(s1);

      var pointColor = rank_max_map[date.rankmax].color;
      v1.toArray(p_positions, i * 3);
      pointColor.toArray( p_colors, i * 3);
      p_sizes[i] = rank_max_map[date.rankmax].size;

      c_positions[ i * 6 + 0 ] = v0.x;
      c_positions[ i * 6 + 1 ] = v0.y;
      c_positions[ i * 6 + 2 ] = v0.z;
      c_positions[ i * 6 + 3 ] = v1.x;
      c_positions[ i * 6 + 4 ] = v1.y;
      c_positions[ i * 6 + 5 ] = v1.z;

      groundColor.toArray(c_colors, i * 6);
      pointColor.toArray(c_colors, i * 6 + 3);
  }

  p_geometry.addAttribute( 'position', new THREE.BufferAttribute( p_positions, 3 ));
  p_geometry.addAttribute( 'size', new THREE.BufferAttribute( p_sizes, 1 ));
  p_geometry.addAttribute( 'color', new THREE.BufferAttribute( p_colors, 3 ));

  //var s_material = new THREE.PointsMaterial( { size: 0.05, vertexColors: THREE.VertexColors } );
  var points = new THREE.Points( p_geometry, p_material );
  renderer.addObject( 'citypoints', points , false, parent);
  //parent.add(points);

  c_geometry.addAttribute( 'position', new THREE.BufferAttribute( c_positions, 3 ) );
  c_geometry.addAttribute( 'color', new THREE.BufferAttribute( c_colors, 3 ) );

  var lines = new THREE.LineSegments( c_geometry, c_material);
  renderer.addObject( 'citylines', lines , false, parent);
}

async function createPopulationInstances(data, color, scale, year, id, offset) {
  var fileLoader = new THREE.FileLoader();
  let fragShader;
  let vertShader;
  try {
    fragShader = await new Promise((resolve) => {//8
      fileLoader.load('/res/shaders/block/frag/instanceSimple.frag', (data) => {
        resolve(data);
      });
    });
    
    vertShader = await new Promise((resolve) => {//9
      fileLoader.load('/res/shaders/block/vert/instanceSimple.vert', (data) => {
        resolve(data);
      });
    });
  } catch(e) {
    console.log('errors', e);
  }

  var offsets = [];

  var orientations = [];

  var instanceCounter = 0;

  var values = [];

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
    /**currently inversion needed to compensate a inversion problem from using quaternions*/
    const a = -1 * s0.phi;
    const b = -1 * s0.theta;
    /**multiplication of two quaternions rotating phi and theta*/
    orientations.push(Math.cos(a/2)*Math.cos(b/2), -1*Math.sin(a/2)*Math.sin(b/2), Math.cos(a/2)*Math.sin(b/2), Math.sin(a/2)*Math.cos(b/2));
    instanceCounter++;
  }
  console.log(values);
  var geometry = new THREE.InstancedBufferGeometry();
  var height = 5;
  var b = new THREE.BoxBufferGeometry(0.2, 0.2 * height, 0.2);
  var verticesCount = 24;
  var positions = [
    0.1, 1.0, 0.1,
    0.1, 1.0, -0.1,
    0.1, 0.0, 0.1,
    0.1, 0.0, -0.1,
    -0.1, 1.0, -0.1,
    -0.1, 1.0, 0.1,
    -0.1, 0.0, -0.1,
    -0.1, 0.0, 0.1,
    -0.1, 1.0, -0.1,
    0.1, 1.0, -0.1,
    -0.1, 1.0, 0.1,
    0.1, 1.0, 0.1,
    -0.1, 0.0, 0.1,
    0.1, 0.0, 0.1,
    -0.1, 0.0, -0.1,
    0.1, 0.0, -0.1,
    -0.1, 1.0, 0.1,
    0.1, 1.0, 0.1,
    -0.1, 0.0, 0.1,
    0.1, 0.0, 0.1,
    0.1, 1.0, -0.1,
    -0.1, 1.0, -0.1,
    0.1, 0.0, -0.1,
    -0.1, 0.0, -0.1
  ];

  var colors = [];
  var cityColor = new THREE.Color(color);
  for (var i = 0; i < verticesCount; i++) {
    cityColor.toArray(colors, i * 3);
  }

  /**currently inversion needed to compensate a inversion problem from using quaternions*/
  for (var i = 0; i< positions.length; i++) {
    positions[i] = positions[i]*-1.0;
  }
  var uvs = [
    0, height, 1, height, 0, 0, 1, 0, //rechts
    0, height, 1, height, 0, 0, 1, 0, //links
    0, 1, 1, 1, 0, 0, 1, 0, //oben
    0, 1, 1, 1, 0, 0, 1, 0, //unten
    0, height, 1, height, 0, 0, 1, 0, //front
    0, height, 1, height, 0, 0, 1, 0]; //back

  var shifts = [
    1, height, 1, height, 1, height, 1, height, //rechts
    1, height, 1, height, 1, height, 1, height, //rechts
    1, 1, 1, 1, 1, 1, 1, 1, //oben
    1, 1, 1, 1, 1, 1, 1, 1, //unten
    1, height, 1, height, 1, height, 1, height, //rechts
    1, height, 1, height, 1, height, 1, height]; //rechts

  var indices = [];
  for (var i = 0; i < b.index.array.length; i++) {
    indices.push(b.index.array[i]);
  };

  geometry.maxInstancedCount = instanceCounter;
  console.log('maxInstances', instanceCounter);
  geometry.setIndex( indices );

  geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
  geometry.addAttribute( 'shift', new THREE.Float32BufferAttribute( shifts, 2 ) );
  geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( new Float32Array( colors ), 3 ) );
  geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
  geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ) );
  geometry.addAttribute( 'value', new THREE.InstancedBufferAttribute( new Float32Array( values ), 1 ) );

  const uniforms = {
    time:{type: "f", value: 0.0},
    scale:{type: "f", value: 0.0}
  };

  var material = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    transparent: true,
    depthWrite: true,
    vertexShader:   vertShader,
    fragmentShader: fragShader
  });
  material.side = THREE.DoubleSide;

  var pScaler = {
      totalTime: 0.5,
      startTime: 0.0,
      currentValue: 0.0,
      up: renderer => {
        renderer.registerEventCallback('render', (data) => {
          if (pScaler.startTime === 0.0) {
            pScaler.startTime = data.elapsedTime;
          }
          if (pScaler.currentValue < 1.0) {
            pScaler.currentValue = Math.min((data.elapsedTime - pScaler.startTime) / pScaler.totalTime, 1.0);
            material.uniforms.scale.value = pScaler.currentValue;
          }
        });
      }
  };

  pScaler.up(renderer)
  return new THREE.Mesh( geometry, material );
}

async function createDataInstances(data, color) {
  var fileLoader = new THREE.FileLoader();
  let fragShader;
  let vertShader;
  try {
    fragShader = await new Promise((resolve) => {//8
      fileLoader.load('/res/shaders/block/frag/instanceSimple.frag', (data) => {
        resolve(data);
      });
    });
    
    vertShader = await new Promise((resolve) => {//9
      fileLoader.load('/res/shaders/block/vert/instanceSimple.vert', (data) => {
        resolve(data);
      });
    });
  } catch(e) {
    console.log('errors', e);
  }

  var instances = data.length;
  var offsets = [];

  var orientations = [];

  for (var i = 0; i < data.length; i++) {
    var date = data[i];
    var offsetLatitude = 0.3;
    var offsetLongitude = 0.33;
    var s0 = calcSphericalFromLatLongRad(Number(date.center.latitude)+offsetLatitude, Number(date.center.longitude)+offsetLongitude, 20.025);
    var v0 = new THREE.Vector3().setFromSpherical(s0);
    v0.toArray(offsets, i * 3);
    /**currently inversion needed to compensate a inversion problem from using quaternions*/
    const a = -1 * s0.phi;
    const b = -1 * s0.theta;
    /**multiplication of two quaternions rotating phi and theta*/
    orientations.push(Math.cos(a/2)*Math.cos(b/2), -1*Math.sin(a/2)*Math.sin(b/2), Math.cos(a/2)*Math.sin(b/2), Math.sin(a/2)*Math.cos(b/2));
  }

  var geometry = new THREE.InstancedBufferGeometry();
  var height = 5;
  var b = new THREE.BoxBufferGeometry(0.2, 0.2 * height, 0.2);

  var verticesCount = 24;
  var positions = [
    0.1, 1.0, 0.1,
    0.1, 1.0, -0.1,
    0.1, 0.0, 0.1,
    0.1, 0.0, -0.1,
    -0.1, 1.0, -0.1,
    -0.1, 1.0, 0.1,
    -0.1, 0.0, -0.1,
    -0.1, 0.0, 0.1,
    -0.1, 1.0, -0.1,
    0.1, 1.0, -0.1,
    -0.1, 1.0, 0.1,
    0.1, 1.0, 0.1,
    -0.1, 0.0, 0.1,
    0.1, 0.0, 0.1,
    -0.1, 0.0, -0.1,
    0.1, 0.0, -0.1,
    -0.1, 1.0, 0.1,
    0.1, 1.0, 0.1,
    -0.1, 0.0, 0.1,
    0.1, 0.0, 0.1,
    0.1, 1.0, -0.1,
    -0.1, 1.0, -0.1,
    0.1, 0.0, -0.1,
    -0.1, 0.0, -0.1
  ];

  var colors = [];
  var cityColor = new THREE.Color( 1, 1, 0);
  for (var i = 0; i < verticesCount; i++) {
    cityColor.toArray(colors, i * 3);
  }

  /**currently inversion needed to compensate a inversion problem from using quaternions*/
  for (var i = 0; i< positions.length; i++) {
    positions[i] = positions[i]*-1.0;
  }
  var uvs = [
    0, height, 1, height, 0, 0, 1, 0, //rechts
    0, height, 1, height, 0, 0, 1, 0, //links
    0, 1, 1, 1, 0, 0, 1, 0, //oben
    0, 1, 1, 1, 0, 0, 1, 0, //unten
    0, height, 1, height, 0, 0, 1, 0, //front
    0, height, 1, height, 0, 0, 1, 0]; //back

  var shifts = [
    1, height, 1, height, 1, height, 1, height, //rechts
    1, height, 1, height, 1, height, 1, height, //rechts
    1, 1, 1, 1, 1, 1, 1, 1, //oben
    1, 1, 1, 1, 1, 1, 1, 1, //unten
    1, height, 1, height, 1, height, 1, height, //rechts
    1, height, 1, height, 1, height, 1, height]; //rechts

  var indices = [];
  for (var i = 0; i < b.index.array.length; i++) {
    indices.push(b.index.array[i]);
  };

  geometry.maxInstancedCount = instances;
  geometry.setIndex( indices );

  geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
  geometry.addAttribute( 'shift', new THREE.Float32BufferAttribute( shifts, 2 ) );
  geometry.addAttribute( 'color', new THREE.Float32BufferAttribute( new Float32Array( colors ), 3 ) );
  geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
  geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ) );

  const uniforms = {
    time:{type: "f", value: 0.0},
    scale:{type: "f", value: 0.0}
  };

  var material = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader:   vertShader,
    fragmentShader: fragShader
  });
  material.side = THREE.DoubleSide;

  var scaler = {
      totalTime: 0.5,
      startTime: 0.0,
      currentValue: 0.0,
      up: renderer => {
        renderer.registerEventCallback('render', (data) => {
          if (scaler.startTime === 0.0) {
            scaler.startTime = data.elapsedTime;
          }
          if (scaler.currentValue < 1.0) {
            scaler.currentValue = Math.min((data.elapsedTime - scaler.startTime) / scaler.totalTime, 1.0);
            material.uniforms.scale.value = scaler.currentValue;
          }
        });
      }
  };

  scaler.up(renderer);//setTimeout(() => {scaler.up(renderer)}, 1000);
  return new THREE.Mesh( geometry, material );
}

function getCity3DGeometry(vertShaders, fragShaders) {
  var verticesCount = 12;
  var positions = [
    -0.3, 0.0, 0.0,    -0.3, 1.0, 0.0,    0.3, 1.0, 0.0,    0.3, 0.0, 0.0,
    0.0, 0.0, -0.3,    0.0, 1.0, -0.3,    0.0, 1.0, 0.3,    0.0, 0.0, 0.3,
    -0.3, 0.0, -0.3,    -0.3, 0.0, 0.3,    0.3, 0.0, 0.3,    0.3, 0.0, -0.3
  ];

  var uvs = [
    0.0, 0.0,    0.0, 1.0,    1.0, 1.0,    1.0, 0.0,
    0.0, 0.0,    0.0, 1.0,    1.0, 1.0,    1.0, 0.0,
    0.0, 0.0,    0.0, 1.0,    1.0, 1.0,    1.0, 0.0
  ];

  var indices = [8, 9, 10,   8, 10, 11,    0, 1, 2,    0, 2, 3,    4, 5, 6,    4, 6, 7];

  /**currently inversion needed to compensate a inversion problem from using quaternions*/
  for (var i = 0; i< 24; i++) {
    positions[i] = positions[i]*-1.0;
  }

  var geometry = new THREE.InstancedBufferGeometry();
  geometry.setIndex( indices );

  geometry.addGroup(0, 6, 1);
  geometry.addGroup(6, 12, 0);

  geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
  geometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

  return geometry;
}

async function getCity3DMesh(geometry) {
  var fileLoader = new THREE.FileLoader();
  const fragShaders = [];
  let vertShaders;
  try {
    const instanceFrag = await new Promise((resolve) => {//6
      fileLoader.load('/res/shaders/capital/frag/instance.frag', (data) => {
        resolve(data);
      });
    });
    fragShaders.push(instanceFrag);
    const simpleFrag = await new Promise((resolve) => {//6
      fileLoader.load('/res/shaders/capital/frag/simple.frag', (data) => {
        resolve(data);
      });
    });
    fragShaders.push(simpleFrag); 
    
    vertShaders = await new Promise((resolve) => {//7
      fileLoader.load('/res/shaders/capital/vert/instance.vert', (data) => {
        resolve(data);
      });
    });
  } catch(e) {
    console.log('errors', e);
  }

  const p_uniforms0 = {
      texture:   { type: "t", value: renderer.getTexture( "pin.png" ) },
      time:{type:"f", value: 0.0}
  };
  const p_uniforms1 = {
      texture:   { type: "t", value: renderer.getTexture( "disc.png" ) },
      time:{type:"f", value: 0.0}
  };

  var p_material0 = new THREE.ShaderMaterial( {
    uniforms: p_uniforms0,
    transparent: true,
    depthWrite: false,
    vertexShader:   Array.isArray(vertShaders) ? vertShaders[0] : vertShaders,
    fragmentShader: Array.isArray(fragShaders) ? fragShaders[0] : fragShaders
  });
  p_material0.side = THREE.DoubleSide;

  var p_material1 = new THREE.ShaderMaterial( {
    uniforms: p_uniforms1,
    transparent: true,
    depthWrite: false,
    vertexShader:   Array.isArray(vertShaders) ? vertShaders[1] : vertShaders,
    fragmentShader: Array.isArray(fragShaders) ? fragShaders[1] : fragShaders
  });
  p_material1.side = THREE.DoubleSide;

  renderer.registerEventCallback('render', function(data) {
    p_material0.uniforms.time.value += 0.01;
    p_material1.uniforms.time.value += 0.01;
  });

  return new THREE.Mesh( geometry, [p_material0, p_material1] );
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
    /**currently inversion needed to compensate a inversion problem from using quaternions*/
    const a = -1 * s0.phi;
    const b = -1 * s0.theta;
    /**multiplication of two quaternions rotating phi and theta*/
    orientations.push(Math.cos(a/2)*Math.cos(b/2), -1*Math.sin(a/2)*Math.sin(b/2), Math.cos(a/2)*Math.sin(b/2), Math.sin(a/2)*Math.cos(b/2));

    var cityColor = rank_max_map[date.rankmax].color;
    const size = rank_max_map[date.rankmax].size;
    cityColor.toArray(colors, i * 3);
    scales.push(size / 700);
  }

  var geometry = getCity3DGeometry();
  geometry.maxInstancedCount = instances;

  geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array( scales ), 1 ) );
  geometry.addAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 3 ) );
  geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
  geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ) );

  const cMesh = await getCity3DMesh(geometry);
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
    /**currently inversion needed to compensate a inversion problem from using quaternions*/
    const a = -1 * s0.phi;
    const b = -1 * s0.theta;
    /**multiplication of two quaternions rotating phi and theta*/
    orientations.push(Math.cos(a/2)*Math.cos(b/2), -1*Math.sin(a/2)*Math.sin(b/2), Math.cos(a/2)*Math.sin(b/2), Math.sin(a/2)*Math.cos(b/2));
    scales.push(1.5);
    cityColor.toArray(colors, i * 3);
  }

  var geometry = getCity3DGeometry();
  geometry.maxInstancedCount = instances;

  geometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( new Float32Array( scales ), 1 ) );
  geometry.addAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 3 ) );
  geometry.addAttribute( 'offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ) );
  geometry.addAttribute( 'orientation', new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4 ) );

  const cMesh = await getCity3DMesh(geometry);
  return cMesh;
}

function createPointCloud(data, parent, color, scale, year, id) {
  var c_material = new THREE.ShaderMaterial({
      vertexColors: THREE.VertexColors,
      //shading : THREE.SmoothShading,
      vertexShader : 'varying vec4 vColor;\n\tvoid main() {\n\tvColor = vec4( color, 1.0 );\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}',
      fragmentShader : 'varying vec4 vColor;\n\tvoid main() {\n\tgl_FragColor = vColor;\n}'
  });
  // geometry, need to buffer due to dynamic changing values
  var c_geometry = new THREE.BufferGeometry();

  // attributes
  var c_positions = new Float32Array( data.length * 2 * 3 ); // 3 vertices per point
  var c_colors = new Float32Array( data.length * 2 * 3 );

  var groundColor = new THREE.Color( 1, 1, 1);

  for (var i = 0; i < data.length; i++) {
      var date = data[i];
      var wb_country = wb.map[date.country.id.toLowerCase()];

      var s0 = calcSphericalFromLatLongRad(0.0, 0.0, 20.0);
      if (wb_country) {
        s0 = calcSphericalFromLatLongRad(Number(wb_country.center.latitude), Number(wb_country.center.longitude), 20.0);
      } else {
        console.log("no wb_Country", date.iso2.toLowerCase(), date);
      }
      var v0 = new THREE.Vector3().setFromSpherical(s0);
      var s1 = s0.clone();
      // if (date.SP_POP_TOTL && date.SP_POP_TOTL.data && date.SP_POP_TOTL.data.length) {
      //  s1.radius += 0.00000001 * date.SP_POP_TOTL.data[0].value || 0.0;
      if (date.date === year && date.indicator.id === id) {
        s1.radius += scale * date.value || 0.0;
      } else {
        //console.log(date);
        ;
      }

      var v0 = new THREE.Vector3().setFromSpherical(s0);
      var v1 = new THREE.Vector3().setFromSpherical(s1);

      var pointColor = new THREE.Color(color);
      c_positions[ i * 6 + 0 ] = v0.x;
      c_positions[ i * 6 + 1 ] = v0.y;
      c_positions[ i * 6 + 2 ] = v0.z;
      c_positions[ i * 6 + 3 ] = v1.x;
      c_positions[ i * 6 + 4 ] = v1.y;
      c_positions[ i * 6 + 5 ] = v1.z;

      groundColor.toArray(c_colors, i * 6);
      pointColor.toArray(c_colors, i * 6 + 3);
  }

  c_geometry.addAttribute( 'position', new THREE.BufferAttribute( c_positions, 3 ) );
  c_geometry.addAttribute( 'color', new THREE.BufferAttribute( c_colors, 3 ) );

  var lines = new THREE.LineSegments( c_geometry, c_material);
  renderer.addObject( 'lines' + Math.random(), lines , false, parent);
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
  renderer.addObject( 'centroids', centroids , false, parent);
}

function createCapitals(data, parent, color) {
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

  var pointColor = new THREE.Color( 0, 1, 0);
  for (var i = 0; i < data.length; i++) {
      var date = data[i];
      var s0 = calcSphericalFromLatLongRad(Number(date.latitude), Number(date.longitude), 20.025);
      var v0 = new THREE.Vector3().setFromSpherical(s0);

      v0.toArray(p_positions, i * 3);
      pointColor.toArray( p_colors, i * 3);
      p_sizes[i] = 200;
  }
  p_geometry.addAttribute( 'position', new THREE.BufferAttribute( p_positions, 3 ));
  p_geometry.addAttribute( 'size', new THREE.BufferAttribute( p_sizes, 1 ));
  p_geometry.addAttribute( 'color', new THREE.BufferAttribute( p_colors, 3 ));

  var capitals = new THREE.Points( p_geometry, p_material );
  renderer.addObject( 'capitals', capitals , true, parent);
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

function calcSphericalFromLatLongRad(lat, long, r){
    var phi   = (90-lat)*(Math.PI/180);
    var theta = (long+180)*(Math.PI/180);
    return new THREE.Spherical(r, phi, theta - Math.PI * 0.5);
}

function getWorldSphere() {
  if (!window._worldSphere) {
    //const earthTexture = renderer.getTexture('GRAY_HR_SR_W.jpg');
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
    if (intersected) {
      if (intersected.index != null) {
        intersected.object.geometry.attributes.size.array[intersected.index] = 400;
        intersected.object.geometry.attributes.size.needsUpdate = true;

        const date_year = window._controls_.date;
        const indicators = window._indicators_;
        const wbCountry = new WBCountry(wb.getCountry(intersected.index));
        const iso2Code = wbCountry.iso2();

        document.querySelector('.wb_title .wb_short_name').textContent = wbCountry.name();
        document.querySelector('.wb_title .wb_iso').textContent = `(${iso2Code})`;
        document.querySelector('.wb_subtitle').textContent = `${wbCountry.incomeValue()} (${wbCountry.incomeId()})`;


        (async function() {
          const iso2Code = wbCountry.iso2();
          if (iso2Code) {
            if (!wbCountry.hasIndicators(indicators)) {
              const json = await fetch(`/data/worldbank/country/${iso2Code}/indocators/${indicators.join(';')}/`).then(
                response => response.json()
              );

              indicators.forEach(id => {
                wbCountry.extendIndicators(id, WBIndicatorItem.filter(json, iso2Code, id));
              });
            }

            indicators.forEach(id => {
              const selector = `.wb_${id.toLowerCase().replace(/\./g, '_')}`
              document.querySelector(selector).textContent = wbCountry.findIndicatorValue(id, date_year);
            });
          }
        }());
      }
    }
  });

  renderer.start();
});