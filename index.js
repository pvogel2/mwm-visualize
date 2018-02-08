const express = require('express')
const app = express()

app.get('/', (req, res) => res.sendFile(__dirname + '/res/html/index.html'));
app.use('/res/js/three/', express.static('node_modules/three/'));
app.use('/res/js/assets/', express.static('res/js/'));

app.use('/parse', function(req, res){
  res.setHeader("Content-Type", "application/json");
  res.send({a:0});
});

app.listen(3000, () => console.log('App listening on port 3000!'))