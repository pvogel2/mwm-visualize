importScripts('/res/js/three/build/three.js');

function loadFeature(id, type, color) {
  fetch(`/data/openworld/${id}/${type}`).then(
    response => response.json()
  ).then(json => {
    postMessage({json:json, id: id, color: color});
  }).catch(function(err) {
    console.log('err', err);
    postMessage({json:null, id: id, color: color, err: err});
  });
}

onmessage = function(msg) {
  //console.log('Message received from main script', msg);
  const data = msg.data;
  loadFeature(data.id, data.type, data.color);
}