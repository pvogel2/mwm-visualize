var renderer;

document.addEventListener("DOMContentLoaded", function(event) {
  renderer = new MWM.appl();
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
  //var w = new Walker();
  var state = new THREE.Group();
  state.name = 'File';
  window.acorn.walk.recursive(ast, state, Walker);
  console.log(state);
  renderer.addObject('File', state);

  renderer.registerEventCallback("render", (event, intersections) => {
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
    for (var i = 0; i < Walker.labels.length; i ++) {
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
  });

  renderer.start();
}