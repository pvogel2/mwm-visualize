const express = require('express');
const app = express();
const acorn = require('acorn');
const fs = require('fs');

app.get('/', (req, res) => res.sendFile(__dirname + '/res/html/index.html'));
app.use('/res/js/three/', express.static('node_modules/three/'));
app.use('/res/js/assets/', express.static('res/js/'));

app.use('/parse', function(req, res){
  const file = fs.readFile(__dirname + '/data/systems.js', (err, data) => {
	  if (err) {
	    console.log(err);
	    res.statusCode = 500;
	    res.send(err);
	  } else {
	    const ast = acorn.parse(data.toString());
	    console.log(ast);
	    res.setHeader("Content-Type", "application/json");
	    res.send(ast);
	  }
  });
});

app.listen(3000, () => console.log('App listening on port 3000!'))