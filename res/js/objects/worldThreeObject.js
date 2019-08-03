class WorldThreeObject {
  constructor(config) {
    this.color = config.color || 0xffffff;
    this.id = config.id || Math.random();
    this.data = config.data || [];
    this.objId = `WorldThreeObject${this.id}`;

    this.renderer = null;
    this.mesh = null;
  }

  async attach(renderer, parent) {
  }

  async update(config) {
  }

  detach() {
    if (this.renderer) {
      this.renderer.removeObject(this.objId);
    } else {
      console.log('WBThreeIndicator: renderer not defined.');
    }
  }

  calcSphericalFromLatLongRad(lat, long, r) {
    const phi   = (90-lat)*(Math.PI/180);
    const theta = (long+180)*(Math.PI/180);
    return new THREE.Spherical(r, phi, theta - Math.PI * 0.5);
  }

  pushOrientationFromSpherical(s, target) {
    /**currently inversion needed to compensate a inversion problem from using quaternions*/
    const a = -1 * s.phi;
    const b = -1 * s.theta;
    /**multiplication of two quaternions rotating phi and theta*/
    target.push( Math.cos(a/2)*Math.cos(b/2) );
    target.push( -1*Math.sin(a/2)*Math.sin(b/2) );
    target.push( Math.cos(a/2)*Math.sin(b/2) );
    target.push( Math.sin(a/2)*Math.cos(b/2) );
  }
}
