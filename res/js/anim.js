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
  renderer.registerEventCallback("render", (event, intersections) => {
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
});

  const base = new THREE.Group();
  renderer.addObject('Base', base);
  const initial = 20;
  for (var i = 0; i < 5; i++) {
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