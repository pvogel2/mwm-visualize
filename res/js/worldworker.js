function loadFeature(id, type, color) {
  fetch(`/data/openworld/${id}/${type}`).then(
    response => response.json()
  ).then(json => {
    postMessage({
      json, id, color
    });
  }).catch(function(err) {
    console.log('err', err);
    const json = null;

    postMessage({
      json, id, color, err
    });
  });
}

onmessage = function(msg) {
  //console.log('Message received from main script', msg);
  const data = msg.data;
  loadFeature(data.dbId, data.dbType, data.color);
}