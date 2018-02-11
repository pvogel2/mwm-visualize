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
  renderer.start();
}