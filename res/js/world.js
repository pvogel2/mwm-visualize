let renderer;

function loadCities(parent, color) {
  fetch('/dbf').then(
    response => response.json()
  ).then(json => {
    createCityCloud(json, parent, color);
  }).catch(function(err) {
    console.log('err', err);
  });
};

function removeCities() {
  renderer.removeObject('citypoints');
  renderer.removeObject('citylines');
};

function loadCountries(parent, color) {
  fetch('/data/countries').then(
      response => response.json()
      ).then(json => {
        wb.setData(json);
        createCentroids(json, parent, color);
        createCapitals(json, parent, color);
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
    //wb.setData(json);
    createCapitals(json, parent, color);
  }).catch(function(err) {
    console.log('err', err);
  });
};

function loadCountryData(iso2, callback) {
  var indocators = '';
  window._indicators_.forEach((indicator, index) => {
    indocators = `${indocators}${(index > 0 ?';' : '')}${indicator}`;
  });
  var date = `2000:2017`;

  var url = `/data/wbv2/country/${iso2}/indocators/${indocators}/?date=${date}`;

  fetch(url).then(
    response => response.json()
  ).then(json => {
    callback(null, json);
  }).catch(function(err) {
    callback(err, null);
  });
};

function loadPopulation() {
  const p = wb.loadPopulation();
  const color = 0x0000dd;
  const parent = getWorldSphere();

  p.then(
    response => response.json()
  ).then(json => {
    createPointCloud(json, parent, color, 0.00000001, '' + window._controls_.date, 'SP.POP.TOTL');
  }).catch(function(err) {
    console.log('err', err);
  });
};

function loadRefugees() {
  const p = wb.loadRefugees();
  const color = 0xdd0000;
  const parent = getWorldSphere();

  p.then(
    response => response.json()
  ).then(json => {
    createPointCloud(json, parent, color, 0.00001, '' + window._controls_.date, 'SM.POP.REFG');
  }).catch(function(err) {
    console.log('err', err);
  });
};

function loadRefugeesOrigin() {
  const p = wb.loadRefugeesOrigin();
  const color = 0x00dd00;
  const parent = getWorldSphere();

  p.then(
    response => response.json()
  ).then(json => {
    createPointCloud(json, parent, color, 0.00001, '' + window._controls_.date, 'SM.POP.REFG.OR');
  }).catch(function(err) {
    console.log('err', err);
  });
};

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
        console.log(date);
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
  renderer = new MWM.Renderer();
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
      var obj = createFeature(json, color);
      renderer.addObject( id, obj , false, parent);
    });
    loadCountries(getWorldSphere(), 0xffffff);
    //loadCentroids(getWorldSphere(), 0xffffff);
    //loadCapitals(getWorldSphere(), 0xffffff);
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
        const country_data = wb.getCountry(intersected.index);

        document.querySelector('.wb_title .wb_short_name').textContent = country_data.name;
        document.querySelector('.wb_title .wb_iso').textContent = `(${country_data.iso2Code})`;
        document.querySelector('.wb_subtitle').textContent = `${country_data.incomeLevel.value} (${country_data.incomeLevel.id})`;
        if (country_data.iso2Code) {
          if (country_data.indicators && country_data.indicators.SP_POP_TOTL && country_data.indicators.SM_POP_REFG && country_data.indicators.SM_POP_REFG_OR) {
            let _item = null; 

            _item = country_data.indicators.SP_POP_TOTL.find(item => {
              return (`${date_year}` === item.date);
            });
            document.querySelector('.wb_sp_pop_totl').textContent = _item ? _item.value : "-";

            _item = country_data.indicators.SM_POP_REFG.find(item => {
              return (`${date_year}` === item.date);
            });
            document.querySelector('.wb_sm_pop_refg').textContent = _item ? _item.value : "-";

            _item = country_data.indicators.SM_POP_REFG_OR.find(item => {
              return (`${date_year}` === item.date);
            });
            document.querySelector('.wb_sm_pop_refg_or').textContent = _item ? _item.value : "-";
          } else {
            loadCountryData(country_data.iso2Code, (err, json) => {
              if (!err) {
                if (!country_data.indicators) {
                  country_data.indicators = {};
                }
                country_data.indicators.SP_POP_TOTL = json.filter(item => {   
                  return (item.country.id === country_data.iso2Code && item.indicator.id === 'SP.POP.TOTL');
                });
                country_data.indicators.SM_POP_REFG = json.filter(item => { return item.country.id === country_data.iso2Code && item.indicator.id === 'SM.POP.REFG'});
                country_data.indicators.SM_POP_REFG_OR = json.filter(item => { return item.country.id === country_data.iso2Code && item.indicator.id === 'SM.POP.REFG.OR'});
                var value = '';
                value = country_data.indicators.SP_POP_TOTL.find(function(item) {
                  return item.date === date_year;
                });
                document.querySelector('.wb_sp_pop_totl').textContent = value.value | '-';

                value = country_data.indicators.SM_POP_REFG.find(function(item) {
                  return item.date === date_year;
                });
                document.querySelector('.wb_sm_pop_refg').textContent = value.value | '-';

                value = country_data.indicators.SM_POP_REFG_OR.find(function(item) {
                  return item.date === date_year;
                });
                document.querySelector('.wb_sm_pop_refg_or').textContent = value.value | '-';
              } else {
                console.log(err);
              }
            });
          }
        }
      }
    }
  });

  renderer.start();
});