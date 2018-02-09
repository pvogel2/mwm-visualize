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
  var w = new MWM.walker();

  window.acorn.walk.recursive(ast, {}, w.functions);

  renderer.start();
}