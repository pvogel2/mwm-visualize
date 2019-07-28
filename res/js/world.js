class WorldApp {
  constructor() {
    this.renderer = new MWM.Renderer({
      fov: 45,
      cameraNear: 0.01,
      cameraFar: 500,
      position: {x: 0, y: 15, z: 70},
      target: {x: 0, y: 0, z: 0},
    });

    this.renderer.res = '/res/obj/';

    this.controls = {
      menu: document.querySelector('#fab_menu'),
      countrylabel: document.querySelector("#wb-three-country-label")
    }

    this.interactions = {
      px: null,
      py: null,
      dx: 0,
      dy: 0,
    }

    this.objects = {
      world: getWorldSphere(),
      sunlight: (new THREE.DirectionalLight( 0xffffff, 0.5 ))
    }

    this.renderer.addObject('world', this.objects.world);
    this.renderer.addObject('sunlight', this.objects.sunlight);

    this.transitions = {
      cameraSlide: new Transition({
        duration: 0.4,
        callback: current => {
          this.renderer.three.camera.position.set(current, 15, 70);
          this.renderer.three.camera.lookAt(current, 0, 0);
        }
      })
    }

    this.renderer.registerEventCallback('render', this);

    this.controls.menu.addEventListener('MDCMenu:selected', this);
    document.addEventListener('NE:featureLoaded', this);
    document.addEventListener('NE:unloadFeature', this);
  }

  handleEvent(event) {
    switch(event.type) {
      case 'MDCMenu:selected':
        this.transitions.cameraSlide.from = this.renderer.three.camera.position.x;
    
        switch (event.detail.index) {
          case 0:
            this.objects.world.userData.rotate = !this.objects.world.userData.rotate;
            break;
          case 1: 
          case 3: 
            this.transitions.cameraSlide.to = 0;
            break;
          case 2: 
          case 4: 
            this.transitions.cameraSlide.to = -10;
            break;
          default:;
        }
        break;
      case 'render':
        this.transitions.cameraSlide.update(event);
        break;
      case 'NE:featureLoaded':
        const json = event.detail.json;
        const id = event.detail.id;
        const color = event.detail.color;
        if (id === 'populatedplaces') {
          createCityInstances(json, color).then(mesh => {
            this.renderer.addObject('sizedCities', mesh, false, this.objects.world);
          });
        } else {
          const obj = createNEFeature(json, color);
          this.renderer.addObject( id, obj , false, this.objects.world);
        }
        break;
      case 'NE:unloadFeature':
        this.unloadNEFeature(event.detail);
        break;
      case 'move':
        this.onMouseMove(event);
        break;
      default:;
    }
  }

  unloadNEFeature(id) {
    if (id === 'populatedplaces') {
      this.renderer.removeObject('sizedCities');
    } else {
      this.renderer.removeObject(id);
    }
  }

  onMouseMove(event) {
    if (event.buttons === 1 || event.buttons === 3) { // left mouse button

      if (this.interactions.px != null) {
        this.interactions.dx = this.interactions.px - event.screenX;
      }
      this.interactions.px = event.screenX;
      this.objects.world.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -1 * this.interactions.dx * 0.005);

      if (this.interactions.py != null) {
        this.interactions.dy = this.interactions.py - event.screenY;
      }
      this.interactions.py = event.screenY;
      this.objects.world.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -1 * this.interactions.dy * 0.005);
    }

    if (event.buttons === 2 || event.buttons === 3) {
      this.controls.countrylabel.classList.remove('active')

      if (this.interactions.py != null) {
        this.interactions.dy = this.interactions.py - event.screenY;
      }
      this.interactions.py = event.screenY;
      this.objects.world.position.z += this.interactions.dy * 0.05;
    }

    if (event.buttons) return;
    
  }
}

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
          worldApp.renderer.addObject('capitalCities', mesh, false, parent);
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

function updatePopulation() {
  const config = {
      scale: 0.00000001
    };

  updateIndicator(wb.SP_POP_TOTL, config);
}

function loadRefugees() {
  const config = {
      scale: 0.00001,
      lat: 0.3,
      long:-0.99
    };

    loadIndicator(getWorldSphere(), 0xdd0000, wb.SM_POP_REFG, config);
};

function updateRefugees() {
  const config = {
      scale: 0.00001
    };

  updateIndicator(wb.SM_POP_REFG, config);
}

function loadRefugeesOrigin() {
  const config = {
    scale: 0.00001,
    lat: 0.3,
    long:-1.65
  };

  loadIndicator(getWorldSphere(), 0x00dd00, wb.SM_POP_REFG_OR, config);
};

function updateRefugeesOrigin() {
  const config = {
      scale: 0.00001
    };

  updateIndicator(wb.SM_POP_REFG_OR, config);
}

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
      worldApp.renderer.addObject(objId, mesh, false, parent);
    });
  }).catch(function(err) {
    console.log('err', err);
  });
};

function updateIndicator(id, config) {
  const p = wb.loadIndicator(id);
  const objId = `${id.replace(/\./g, '_')}Blocks`;
  p.then(
    response => response.json()
  ).then(json => {
    updateIndicatorInstances(json, config.scale, '' + wbCtrl.getYear(), id);
  });
}

function updateIndicatorInstances(data, scale, year, id) {
  const objId = `${id.replace(/\./g, '_')}Blocks`;
  const renderObj = worldApp.renderer.getObject(objId);
  if (!renderObj) return;

  const mesh = renderObj.obj;

  let attribIndex = 0;
  for (var i = 0; i < data.length; i++) {
    var date = data[i];
    var wb_country = wb.map[date.country.id.toLowerCase()];


    if (wb_country && date.date === year && date.indicator.id === id) {
      const newIdx = mesh.material.uniforms.weight.value >= 1.0 ? attribIndex * 2 : attribIndex * 2 + 1;
      mesh.geometry.attributes.value.array[newIdx] = scale * date.value || 0.0;//(200000000.0 + mesh.material.uniforms.weight.value * 200000000.0);//date.value || 0.0;
      attribIndex++;
    } else {
      //console.log("no wb_Country", date.iso2.toLowerCase(), date);
      continue;
    }
  }
  mesh.geometry.attributes.value.needsUpdate = true;
  PillarTemplate.triggerTransition(mesh, {
    target: (mesh.material.uniforms.weight.value >= 1.0 ? 0.0 : 1.0),
  });
}

function unloadIndicator(id) {
  worldApp.renderer.removeObject(`${id.replace(/\./g, '_')}Blocks`);
}

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
      values.push(0.0);
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
  pillar.geometry.addAttribute( 'value', new THREE.InstancedBufferAttribute( new Float32Array( values ), 2 ) );

  const mesh = await pillar.getMesh(worldApp.renderer);
  PillarTemplate.triggerTransition(mesh, {
    target: 1.0,
  });
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

  const cMesh = await city.getMesh(worldApp.renderer);
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

  const cMesh = await city.getMesh(worldApp.renderer);
  return cMesh;
}

function createCentroids(data, parent, color) {
  const p_uniforms = {
      texture:   { type: "t", value: worldApp.renderer.getTexture( "disc.png" ) },
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
  //worldApp.renderer.addObject( 'citypoints', points, false );
  //parent.add(centroids);
  worldApp.renderer.addObject( 'centroids', centroids , true, parent);
}

function createNEFeature(data, color) {
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
  //worldApp.renderer.addObject( 'ipccTemp01', points , false, parent);

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
  worldApp.renderer.removeObject('ipccTemp01');
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
    const globe = new GlobeTemplate();
    window._worldSphere = globe.getMesh();
  }
  return window._worldSphere;
};

document.addEventListener("DOMContentLoaded", function(event) {
  window.worldApp = new WorldApp();

  window.neCtrl = new NECtrl(document.querySelector('#ne-ctrl-card'));

  loadCountries(getWorldSphere(), 0xffffff);

  neCtrl.loadFeature('coastline');
  neCtrl.loadFeature('boundariesland');

  worldApp.renderer.registerEventCallback("click", (event, intersections) => {
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

  worldApp.renderer.registerEventCallback("move", (event, intersections) => {
    if (event.buttons === 1 || event.buttons === 3) { // left mouse button
      const w = getWorldSphere();

      if (typeof window._movedX != "undefined") {
        window._deltaX = window._movedX - event.screenX;
      }
      window._movedX = event.screenX;
      w.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -1 * window._deltaX * 0.005);

      if (typeof window._movedY != "undefined") {
        window._deltaY = window._movedY - event.screenY;
      }
      window._movedY = event.screenY;
      w.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -1 * window._deltaY * 0.005);
    }

    if (event.buttons === 2 || event.buttons === 3) {
      document.querySelector("#wb-three-country-label").classList.remove('active')
      const w = getWorldSphere();
      if (typeof window._movedY != "undefined") {
        window._deltaY = window._movedY - event.screenY;
      }
      window._movedY = event.screenY;
      w.position.z += window._deltaY * 0.05;
    }

    if (event.buttons) return;

    delete window._movedX;
    window._deltaX = 0;
    delete window._movedY;
    window._deltaY = 0;
    // var offset = worldApp.renderer.three.renderer.domElement.offset();
    // console.log('intersections', intersections);
    const widthHalf = 0.5 * worldApp.renderer.three.renderer.context.canvas.width;
    const heightHalf = 0.5 * worldApp.renderer.three.renderer.context.canvas.height;
    
    let intersected;
    const div = document.querySelector("#wb-three-country-label");

    if (intersections && intersections.length) {
      intersections.forEach(item => {
        if (!intersected || intersected.distanceToRay > item.distanceToRay) {
          intersected = item;
        }
      });
    }

    if (intersected && intersected.index != null) {
      const vector = intersected.point;
      const country = wb.getCountry(intersected.index);

      vector.project(worldApp.renderer.three.camera);

      vector.x = ( vector.x * widthHalf ) + widthHalf + 20;
      vector.y = - ( vector.y * heightHalf ) + heightHalf + 5;

      div.innerText = `${country.name()} (${country.iso2()})`; 
      div.style.top = `${vector.y}px`;
      div.style.left = `${vector.x}px`;
      div.classList.add('active');
    } else {
      div.classList.remove('active');
      div.innerText = '';
    }
  });

  worldApp.renderer.start();
});