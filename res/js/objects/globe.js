class GlobeTemplate {
  constructor(config = {}) {
    this.color = config.color ? config.color : 0x090909;
    this.radius = 20;
    this.rotationSpeed = 0.002;
    this._createGeometry();
  }

  get geometry() {
    return this._geometry;
  }

  _createGeometry() {
    this._geometry = new THREE.SphereGeometry( this.radius, 64, 64 );
  }

  getMesh(renderer) {
    const wMaterial = new THREE.MeshPhongMaterial({color: this.color});
    const mesh = new THREE.Mesh( this._geometry, wMaterial );

    const axGeometry = new THREE.Geometry();

    axGeometry.vertices.push(
      new THREE.Vector3( 0, -5 - this.radius, 0 ),
      new THREE.Vector3( 0, 5 + this.radius, 0 )
    );
    const axMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      lights: false,
    });

    const axis = new THREE.Line( axGeometry, axMaterial );
    mesh.add(axis);

    mesh.userData.rotate = true;
    mesh.userData.rotationSpeed = this.rotationSpeed;
    mesh.onAfterRender = function() {
      if (mesh.userData.rotate) {
        this.rotateY(this.userData.rotationSpeed);
      }
    };

    return mesh;
  }
}