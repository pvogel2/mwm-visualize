var renderer;

document.addEventListener("DOMContentLoaded", function(event) {
  renderer = new MWM.Renderer();
  renderer.res = '/res/obj/';
  renderer.addGrid(100, 10);
  renderer.addAxes(10, 10);
  loadAst();
});

function loadAst() {
  fetch('parse').then(
    response => response.json()
  ).then(json => {
    walkAst(json);  
  }).catch(function(err) {
    console.log('err', err);
  });
};

function walkAst(ast) {
  // var w = new Walker();
  const state = new THREE.Group();
  state.name = 'File';
  renderer.addObject('File', state);

  // renderer.three.scene.updateMatrixWorld();
  // Walker.initPointsCloud(state);
  // Walker.addPointsCloud();

  renderer.registerEventCallback("render", (event, intersections) => {
    console.log('render animation frame');
    var offset = 0; // renderer.three.renderer.domElement.offset();
    var widthHalf = 0.5 * renderer.three.renderer.context.canvas.width;
    var heightHalf = 0.5 * renderer.three.renderer.context.canvas.height;

    var frustum = new THREE.Frustum();
    frustum.setFromMatrix(
      new THREE.Matrix4().multiplyMatrices(
        renderer.three.camera.projectionMatrix,
        renderer.three.camera.matrixWorldInverse
      )
    );
    for (let i = 0; i < Walker.labels.length; i ++) {
      var div = Walker.labels[i];
      var ref = div.walker.ref;
      var vector = ref.position.clone().setFromMatrixPosition( ref.matrixWorld );
      if(frustum.containsPoint( vector )){
        vector.project(renderer.three.camera);

        vector.x = ( vector.x * widthHalf ) + widthHalf + 10;
        vector.y = - ( vector.y * heightHalf ) + heightHalf - 3;

        div.style.top = `${Math.floor(vector.y)}px`;
        div.style.left = `${Math.floor(vector.x)}px`;
        div.style.display = 'block';
      } else {
        div.style.display = 'none';
      }
    }
    for (let i = 0; i < Walker.animations.length; i ++) {
      var obj = Walker.animations[i];
      if (obj.position.x != obj.userData.position.x) {
        if(obj.userData.position.x < 0) {
          obj.position.x -= 0.01;
          obj.position.x = Math.max(obj.position.x, obj.userData.position.x);
        } else if (obj.userData.position.x > 0) {
          obj.position.x += 0.01;
          obj.position.x = Math.min(obj.position.x, obj.userData.position.x);
        }
      }
      if (obj.position.y != obj.userData.position.y) {
        if(obj.userData.position.y < 0) {
          obj.position.y -= 0.01;
          obj.position.y = Math.max(obj.position.y, obj.userData.position.y);
        } else if (obj.userData.position.y > 0) {
          obj.position.y += 0.01;
          obj.position.y = Math.min(obj.position.y, obj.userData.position.y);
        }
      }
      if (obj.position.z != obj.userData.position.z) {
        if(obj.userData.position.z < 0) {
          obj.position.z -= 0.01;
          obj.position.z = Math.max(obj.position.z, obj.userData.position.z);
        } else if (obj.userData.position.z > 0) {
          obj.position.z += 0.01;
          obj.position.z = Math.min(obj.position.z, obj.userData.position.z);
        }
      }
    }
  });

  document.querySelector('.mwm-loading').style.display = 'none';

  console.log('render start');
  renderer.start();
  window.acorn.walk.recursive(ast, state, Walker);
}