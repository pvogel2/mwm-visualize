var renderer;

document.addEventListener("DOMContentLoaded", function(event) {
  renderer = new MWM.appl();
  renderer.addGrid(100, 10);
  renderer.addAxes(10, 10);
  loadData();
});

function loadData() {
  fetch('parse').then(function(response) {
    console.log(response.json());
    renderer.start();
  }).catch(function(err) {
    console.log('err');
  });
};