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
  const animations = [];
  renderer = new MWM.Renderer();
  renderer.res = '/res/obj/';
  renderer.addGrid(100, 10);
  renderer.addAxes(10, 10);

  const D = 0.06;
  const L = 10;

/*  renderer.registerEventCallback("render", (event, intersections) => {
    let averageX = 0;
    const vAverage = new THREE.Vector3();
    const repulsionConst = 0.5;
    const attractionConst = 2;
    const time = renderer.three.clock.getElapsedTime();
    let vForce = new THREE.Vector3();

    if (time === 0) return;

    animations.forEach(curSphere => {
      vForce = new THREE.Vector3();
      if (curSphere.userData.fixed === 1) {
        return;
      }
      animations.forEach(othSphere => {
        if (curSphere.userData.id === othSphere.userData.id) {
          return;
        }
        const vDifference = new THREE.Vector3().subVectors(curSphere.position, othSphere.position);
        const _distance = vDifference.length();
        const vDirection = vDifference.clone().normalize();

        //const distance = Math.max(Math.abs(curSphere.position.x - othSphere.position.x), 1);

        //calc repulsion
        const fr = repulsionConst / (_distance * _distance);
        vForce.addScaledVector(vDirection, fr);

        //calc attraction
        const fa = attractionConst * Math.max(Math.abs(_distance - L), 0);
        vForce.addScaledVector(vDirection, (-1 * fa));
      });
      curSphere.userData.v3 = vForce.clone();
    });

    animations.forEach(curSphere => {
      curSphere.userData.positionNew = curSphere.position.clone().add(curSphere.userData.v3);// * time;
      if (!curSphere.userData.fixed3) {
        console.log("...");
      }
      if(curSphere.userData.positionNew.clone().sub(curSphere.position).length() < 0.001) {
        curSphere.userData.fixed3 = 1;
      } else {
                console.log(curSphere.userData.positionNew.length());
                console.log(vForce);
      };

      curSphere.position = curSphere.userData.positionNew.clone();
      vAverage.add(curSphere.position);
    });
    vAverage.multiplyScalar(1 / animations.length);
    animations.forEach(curSphere => {
      curSphere.position.sub(vAverage);
    });
});*/
  // INITIAL SETTINGS
  //https://www.khanacademy.org/partner-content/pixar/simulation/hair-simulation-code/pi/step-5-multiple-spring-mass-system
  var gravity = 5;
  var mass = 30;

  // Mass 1
  var mass1PositionY = 0;
  var mass1PositionX = 0;
  var mass1VelocityY = 0;
  var mass1VelocityX = 0;

  // Mass 2
  var mass2PositionY = 0;
  var mass2PositionX = 0;
  var mass2VelocityY = 0;
  var mass2VelocityX = 0;

  var timeStep = 0.28;
  var anchorX = 0;//209;
  var anchorY = 0;//53;
  var k = 2;
  var damping = 2;

  var myScale = 0.03;

  var positions = [
    [0, 0],[0, 0]
  ];
  var velocities = [
    [0, 0],[0, 0]
  ];

  var cb = function(event, intersections) {
    var forces = [];
    for (var p = 0; p < positions.length; p++) {
      var f = -k*p[i][1];
      forces.push(f);
    }
  }
  // DRAW FUNCTION
  renderer.registerEventCallback("render", (event, intersections) => {
       // Mass 1 Spring Force
       var mass1SpringForceY = -k*(mass1PositionY - anchorY);
       //var mass1SpringForceX = -k*(mass1PositionX - anchorX);
       
       // Mass 2 Spring Force
       var mass2SpringForceY = -k*(mass2PositionY - mass1PositionY);
       //var mass2SpringForceX = -k*(mass2PositionX - mass1PositionX);
       
       // Mass 1 daming
       var mass1DampingForceY = damping * mass1VelocityY;
       //var mass1DampingForceX = damping * mass1VelocityX;
       
       // Mass 2 daming
       var mass2DampingForceY = damping * mass2VelocityY;
       //var mass2DampingForceX = damping * mass2VelocityX;
       
       // Mass 1 net force
       var mass1ForceY = mass1SpringForceY + mass * gravity - mass1DampingForceY - mass2SpringForceY + mass2DampingForceY;
       
       //var mass1ForceX = mass1SpringForceX - mass1DampingForceX - mass2SpringForceX + mass2DampingForceX;
       
       // Mass 2 net force
       var mass2ForceY = mass2SpringForceY + mass * gravity - mass2DampingForceY;
       //var mass2ForceX = mass2SpringForceX - mass2DampingForceX;
       
       // Mass 1 acceleration
       var mass1AccelerationY = mass1ForceY/mass;
       //var mass1AccelerationX = mass1ForceX/mass;
       
       // Mass 2 acceleration
       var mass2AccelerationY = mass2ForceY/mass;
       //var mass2AccelerationX = mass2ForceX/mass;
       
       // Mass 1 velocity
       mass1VelocityY = mass1VelocityY + mass1AccelerationY * timeStep;
       //mass1VelocityX = mass1VelocityX + mass1AccelerationX * timeStep;
       
       // Mass 2 velocity
       mass2VelocityY = mass2VelocityY + mass2AccelerationY * timeStep;
       //mass2VelocityX = mass2VelocityX + mass2AccelerationX * timeStep;
       
       // Mass 1 position
       mass1PositionY = mass1PositionY + mass1VelocityY * timeStep;
       //mass1PositionX = mass1PositionX + mass1VelocityX * timeStep;
       
       // Mass 2 position
       mass2PositionY = mass2PositionY + mass2VelocityY * timeStep;
       //mass2PositionX = mass2PositionX + mass2VelocityX * timeStep;
      
       animations[0].position.z = 0;//mass1PositionX * 0.1;
       animations[0].position.y = mass1PositionY * myScale;
       animations[1].position.z = 0;//mass2PositionX * 0.1;
       animations[1].position.y = mass2PositionY * myScale;
       
       animations[0].position.x = animations[1].position.x = 0;       
  });

  const base = new THREE.Group();
  renderer.addObject('Base', base);
  const initial = 20;
  for (var i = 0; i < 2; i++) {
    const sphere = getDefaultGeometry();
    sphere.userData.id = i+2;
    sphere.userData.v = 0;
    sphere.userData.v3 = new THREE.Vector3();
    sphere.userData.positionNew = new THREE.Vector3();
    sphere.position.x = initial * Math.random() - initial * 0.5;
    sphere.position.z = initial * Math.random() - initial * 0.5;
    animations.push(sphere);
    base.add(sphere);
  }
/*  const sphere01 = getDefaultGeometry();
  sphere01.userData.id = 1;
  sphere01.userData.v = 0;
  const sphere02 = getDefaultGeometry();
  sphere02.userData.id = 2;
  sphere02.userData.v = 0;

  sphere01.position.x = 0.5;
  sphere02.position.x = -0.5;

  
  animations.push(sphere01);
  animations.push(sphere02);
  base.add(sphere01);
  base.add(sphere02);*/

  document.querySelector('.mwm-loading').style.display = 'none';

  renderer.start();
});