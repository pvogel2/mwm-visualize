var renderer;
var count = 0;

function getDefaultGeometry() {
  const geometry = new THREE.SphereGeometry( 0.4, 16, 16 );
  let material;
  const color = new THREE.Color( 0xffffff );
  color.setHex( Math.random() * 0xffffff );
  material = new THREE.MeshBasicMaterial( {color: color} );
  count++;
  return new THREE.Mesh( geometry, material );
};

document.addEventListener("DOMContentLoaded", function(event) {
  renderer = new MWM.Renderer({
    cameraFar: 15000
  });
  renderer.res = '/res/obj/';
  renderer.addGrid(100, 10);
  renderer.addAxes(10, 10);

  var directions  = ["hillDraft.002", "hillDraft.004", "hillDraft.005", "hillDraft.006", "hillDraft.001", "hillDraft.003"];
    
  var loader = new THREE.CubeTextureLoader();
  loader.setPath( renderer.res + 'skybox/' );

  var textureCube = loader.load( [
'enviromentCubeSky.0002.bmp', 'enviromentCubeSky.0004.bmp',
'enviromentCubeSky.0005.bmp', 'enviromentCubeSky.0006.bmp',
'enviromentCubeSky.0001.bmp', 'enviromentCubeSky.0003.bmp'
  ], async function(tex) {
    renderer.three.scene.background = tex;
    var sunLight = new THREE.DirectionalLight( 0x666666, 2, 100 );
    sunLight.position.set(-400, 400, 0);
    sunLight.castShadow = true;
    sunLight.target.position.set(0, 0, 0);

    //Set up shadow properties for the light
    sunLight.shadow.mapSize.width = 1024;  // default
    sunLight.shadow.mapSize.height = 1024; // default
    sunLight.shadow.camera.near = 0.05;       // default
    sunLight.shadow.camera.far = 1500;
    var d = 500;// default
    sunLight.shadow.camera.left = - d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = - d;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    renderer.three.scene.add(sunLight);
    var slcHelper = new THREE.CameraHelper( sunLight.shadow.camera );
    renderer.three.scene.add( slcHelper );

    var dlHelper = new THREE.DirectionalLightHelper( sunLight, 5 );
    renderer.three.scene.add( dlHelper );

    /********************************/
    var fileLoader = new THREE.FileLoader();
    let fragShader;
    let vertShader;

    let fragTerrainShader;
    let vertTerrainShader;

    let meshPhysicalFragShader;
    let meshPhysicalVertShader;

    let bumpMapParseFagment;

    try {
      fragTerrainShader = await new Promise((resolve) => {//8
        fileLoader.load('/res/shaders/island/terrain.frag', (data) => {
          resolve(data);
        });
      });
      
      vertTerrainShader = await new Promise((resolve) => {//9
        fileLoader.load('/res/shaders/island/terrain.vert', (data) => {
          resolve(data);
        });
      });
      fragShader = await new Promise((resolve) => {//8
        fileLoader.load('/res/shaders/island/simple.frag', (data) => {
          resolve(data);
        });
      });
      
      vertShader = await new Promise((resolve) => {//9
        fileLoader.load('/res/shaders/island/simple.vert', (data) => {
          resolve(data);
        });
      });

      meshPhysicalFragShader = await new Promise((resolve) => {//8
        fileLoader.load('/res/shaders/island/meshphysical_frag.glsl.js', (data) => {
          resolve(data);
        });
      });
      
      meshPhysicalVertShader = await new Promise((resolve) => {//9
        fileLoader.load('/res/shaders/island/meshphysical_vert.glsl.js', (data) => {
          resolve(data);
        });
      });
      
      bumpMapParseFagment = await new Promise((resolve) => {//9
        fileLoader.load('/res/shaders/island/bumpmap_pars_fragment.glsl.js', (data) => {
          resolve(data);
        });
      });
    } catch(e) {
      console.log('errors', e);
    }

    const p_uniforms = THREE.UniformsUtils.merge( [
      THREE.UniformsLib[ "lights" ]
    ] );

    Object.assign(p_uniforms, {
        texture1: { type: "t", value: renderer.getTexture( "sand01.jpg" ) },
        texture2: { type: "t", value: renderer.getTexture( "grass01.jpg" ) },
        texture3: { type: "t", value: renderer.getTexture( "rock01.jpg" ) }
      });
      p_uniforms.texture1.value.wrapS = p_uniforms.texture1.value.wrapT
      = p_uniforms.texture2.value.wrapS = p_uniforms.texture2.value.wrapT
      = p_uniforms.texture3.value.wrapS = p_uniforms.texture3.value.wrapT
      = THREE.RepeatWrapping;

    // var p_material = new THREE.MeshPhysicalMaterial( {
    var p_material = new THREE.ShaderMaterial( {
      uniforms: p_uniforms,
      transparent: false,
      depthWrite: true,
      lights: true,
      vertexShader:   vertShader,
      fragmentShader: fragShader,
      bumpMap: renderer.getTexture( "buche_bump.jpg" ),
      bumpScale: 5
    });
    p_material.side = THREE.DoubleSide;
    p_material.defines.USE_MAP = '';
    p_material.defines.USE_BUMPMAP = '';

    /*renderer.registerEventCallback('render', function(data) {
      p_material.uniforms.time.value += 0.01;
    });*/

    p_material.onBeforeCompile = shader => {
      shader.fragmentShader = meshPhysicalFragShader.replace('#include <bumpmap_pars_fragment>', bumpMapParseFagment);
      shader.vertexShader = meshPhysicalVertShader;
    } 
    /********************************/
    const bumpTx = renderer.getTexture( "buche_bump.jpg" );
    const diffuseTx = renderer.getTexture( "earth.jpg" );
    bumpTx.wrapS = diffuseTx.wrapS = THREE.RepeatWrapping;
    bumpTx.wrapT = diffuseTx.wrapT = THREE.RepeatWrapping;
    const altMaterial = new THREE.MeshPhysicalMaterial({
      map: diffuseTx,
      bumpMap: bumpTx,
      bumpScale: 5
    });
    /********************************/

    /********************************/
    var terrain_material = new THREE.ShaderMaterial( {
      uniforms: p_uniforms,
      transparent: false,
      depthWrite: true,
      lights: true,
      vertexShader:   vertTerrainShader,
      fragmentShader: fragTerrainShader
    });
    terrain_material.side = THREE.DoubleSide;
    /********************************/

    const objLoader = new THREE.OBJLoader();
    const matLoader = new THREE.MTLLoader();
    matLoader.load(
        renderer.res + 'island1.mtl',
        loader => {
          //  objLoader.setMaterials(loader);
          objLoader.setMaterials({create: () => terrain_material});
          //objLoader.setMaterials({create: () => p_material});
          //objLoader.setMaterials({create: () => altMaterial});
        }   
    );
    var geometry = new THREE.BoxGeometry( 50, 50, 50 );
    geometry.computeFaceNormals();
    var material = new THREE.MeshStandardMaterial( { color: 0x444444 } );
    var cube = new THREE.Mesh( geometry, terrain_material );
    cube.castShadow = true;
    cube.position.set(-100, 130, 100);

    objLoader.load(renderer.res + 'island2.obj', obj => {
      obj.traverse(child => {
        if ( child instanceof THREE.Mesh ) {
          child.receiveShadow = true;
        }
      });
      
      // THREE.BufferGeometryUtils.computeTangents( obj.children[0].geometry );
      renderer.three.scene.add( obj );
      renderer.three.scene.add( cube );
    });
    var geometry = new THREE.CircleGeometry( 10000, 32 );
    var material = new THREE.MeshStandardMaterial( {color: 0x0000ff} );
    var plane = new THREE.Mesh( geometry, material );
    plane.rotation.x = -1.57;
    plane.receiveShadow = true;
    plane.position.set(0, 30, 0);
    renderer.three.scene.add( plane );
    renderer.three.scene.add( cube );
    
    renderer.start();
  });
});