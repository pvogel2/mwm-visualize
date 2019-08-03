class WorldApp {
  constructor() {
    this.renderer = new MWM.Renderer({
      fov: 45,
      cameraNear: 0.01,
      cameraFar: 500,
      position: {x: 0, y: 15, z: 70},
      target: {x: 0, y: 0, z: 0},
    });

    this.renderer.res = '/res/obj/';

    this.controls = {
      menu: document.querySelector('#fab_menu'),
      countrylabel: document.querySelector("#wb-three-country-label"),
      indicator: document.querySelector('#ind-ctrl-card'),
    }

    this.interactions = {
      px: null,
      py: null,
      dx: 0,
      dy: 0,
    }

    this.objects = {
      world: new GlobeTemplate().getMesh(),
      sunlight: (new THREE.DirectionalLight( 0xffffff, 0.5 ))
    }

    this.renderer.addObject('world', this.objects.world);
    this.renderer.addObject('sunlight', this.objects.sunlight);

    this.transitions = {
      cameraSlide: new Transition({
        duration: 0.4,
        callback: current => {
          this.renderer.three.camera.position.set(current, 15, 70);
          this.renderer.three.camera.lookAt(current, 0, 0);
        }
      })
    }

    this.ne = new NECtrl(document.querySelector('#ne-ctrl-card'));
    this.wb = new WBCtrl(document.querySelector('#wb-card'));
    this.ipcc = new IPCC(document.querySelector('#ipcc-ctrl-card'));

    this.renderer.registerEventCallback('render', this);
    this.renderer.registerEventCallback('mousemove', this);
    this.renderer.registerEventCallback("click", this);

    this.controls.menu.addEventListener('MDCMenu:selected', this);
    document.addEventListener('NE:featureLoaded', this);
    document.addEventListener('NE:unloadFeature', this);
    document.addEventListener('WB:indicatorLoaded', this);
    document.addEventListener('WB:unloadIndicator', this);
    document.addEventListener('WB:indicatorUpdated', this);
    document.addEventListener('IPCC:dataTextureLoaded', this);

    this.loadCountries();
    this.ne.loadFeature('coastline');
    this.ne.loadFeature('boundariesland');

    this.renderer.start();
  }

  handleEvent(event) {
    switch(event.type) {
      case 'MDCMenu:selected':
        this.transitions.cameraSlide.from = this.renderer.three.camera.position.x;
    
        switch (event.detail.index) {
          case 0:
            this.objects.world.userData.rotate = !this.objects.world.userData.rotate;
            break;
          case 1:
            this.ne.show();
            this.wb.hide();
            this.ipcc.hide();
            this.resetWorldTexture();
            this.controls.indicator.style.display = 'none';
            break;
          case 3: 
            this.transitions.cameraSlide.to = 0;
            this.ne.hide();
            this.wb.hide();
            this.ipcc.hide();
            this.resetWorldTexture();
            this.controls.indicator.style.display = '';
            break;
          case 2:
            this.transitions.cameraSlide.to = -10;
            this.ne.hide();
            this.wb.show();
            this.ipcc.hide();
            this.resetWorldTexture();
            this.controls.indicator.style.display = 'none';
            break;
          case 4: 
            this.transitions.cameraSlide.to = -10;
            this.ne.hide();
            this.wb.hide();
            this.ipcc.loadStructure();
            this.controls.indicator.style.display = 'none';
            break;
          default:;
        }
        break;
      case 'render':
        this.transitions.cameraSlide.update(event);
        break;
      case 'click':
        this.onClick(event);
        break;
      case 'NE:featureLoaded':
        const json = event.detail.json;
        const id = event.detail.id;
        const color = event.detail.color;
        const config = {
          id: id,
          data: json,
          color: color,
        }
        if (id === 'populatedplaces') {
          const cities = new NEThreeCities(config);
          this.objects[id] = cities;
          cities.attach(this.renderer, this.objects.world).catch((err) => {
            console.log('err', err);
          });
        } else {
          const feature = new NEThreeFeature(config);
          this.objects[id] = feature;
          feature.attach(this.renderer, this.objects.world).catch((err) => {
            console.log('err', err);
          });
        }
        break;
      case 'NE:unloadFeature':
        this.unloadNEFeature(event.detail);
        break;
      case 'mousemove':
        this.onMouseMove(event);
        break;
      case 'WB:indicatorLoaded':
        this.onWBIndicatorLoaded(event);
        break;
      case 'WB:unloadIndicator':
        this.unloadWBIndicator(event);
        break;
      case 'WB:indicatorUpdated':
        this.onWBIndicatorUpdated(event);
        break;
      case 'IPCC:dataTextureLoaded':
        this.onIPCCDataTextureLoaded(event);
        break;
      default:;
    }
  }

  unloadNEFeature(id) {
    const obj = this.objects[id];
    if (obj) {
      obj.detach();
    }
  }

  onClick(event) {
    let intersected;
    const intersections = this.renderer.intersections;
    if (intersections && intersections.length) {
      intersections.forEach(item => {
        if (!intersected || intersected.distanceToRay > item.distanceToRay) {
          intersected = item;
        }
      });
    }

    if (intersected && intersected.index != null) {
      intersected.object.geometry.attributes.size.array[intersected.index] = 400;
      intersected.object.geometry.attributes.size.needsUpdate = true;
      this.wb.setCountry(intersected.index);
    }
  }

  onMouseMove(event) {
    this.updateGlobe(event);
    this.updateCountryLabel(event);
  }

  updateGlobe(event) {
    if (event.buttons === 1 || event.buttons === 3) { // left mouse button

      if (this.interactions.px != null) {
        this.interactions.dx = this.interactions.px - event.screenX;
      }
      this.interactions.px = event.screenX;
      this.objects.world.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -1 * this.interactions.dx * 0.005);

      if (this.interactions.py != null) {
        this.interactions.dy = this.interactions.py - event.screenY;
      }
      this.interactions.py = event.screenY;
      this.objects.world.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -1 * this.interactions.dy * 0.005);
    }

    if (event.buttons === 2 || event.buttons === 3) {
      this.controls.countrylabel.classList.remove('active')

      if (this.interactions.py != null) {
        this.interactions.dy = this.interactions.py - event.screenY;
      }
      this.interactions.py = event.screenY;
      this.objects.world.position.z += this.interactions.dy * 0.05;
    }

    if (!event.buttons) {
      this.interactions.px = this.interactions.py = null;
      this.interactions.dx = this.interactions.dy = 0;
    };
  }

  loadCountries() {
    wb.loadCountries().then(() => {
      const config = {
        color: 0xffffff,
        data: wb.data,
      };
      const countries = new WBThreeCountries(config);
      this.objects['wbCountries'] = countries;
      countries.attach(this.renderer, this.objects.world).catch(function(err) {
        console.log('err', err);
      });
    }).catch(function(err) {
      console.log('err', err);
    });
  }

  updateCountryLabel(event) {
    const widthHalf = 0.5 * this.renderer.three.renderer.context.canvas.width;
    const heightHalf = 0.5 * this.renderer.three.renderer.context.canvas.height;
    
    let intersected;
    const intersections = this.renderer.intersections;

    if (intersections && intersections.length) {
      intersections.forEach(item => {
        if (!intersected || intersected.distanceToRay > item.distanceToRay) {
          intersected = item;
        }
      });
    }

    const div = this.controls.countrylabel;

    if (intersected && intersected.index != null) {
      const vector = intersected.point;
      const country = wb.getCountry(intersected.index);

      vector.project(this.renderer.three.camera);

      vector.x = ( vector.x * widthHalf ) + widthHalf + 20;
      vector.y = - ( vector.y * heightHalf ) + heightHalf + 5;

      div.innerText = `${country.name()} (${country.iso2()})`; 
      div.style.top = `${vector.y}px`;
      div.style.left = `${vector.x}px`;
      div.classList.add('active');
    } else {
      div.classList.remove('active');
      div.innerText = '';
    }
  }


  onWBIndicatorLoaded(event) {
    const data = event.detail.data;
    const id = event.detail.id;
    const year = event.detail.year;

    let config;
    let color;

    switch(id) {
      case window.wb.SP_POP_TOTL:
        config = {scale: 0.00000001, lat: 0.3, long:-0.33, color: 0x0000dd};
        break;
      case window.wb.SM_POP_REFG:
        config = {scale: 0.00001, lat: 0.3, long:-0.99, color: 0xdd0000};
        break;
      case window.wb.SM_POP_REFG_OR:
        config = {scale: 0.00001, lat: 0.3, long:-1.65, color: 0x00dd00};
        break;
      default:;
    }
    config.data = data;
    config.year = year;
    config.id = id;

    const ind = new WBThreeIndicator(config);
    this.objects[id.replace(/\./g, '_')] = ind;
    ind.attach(this.renderer, this.objects.world).catch(function(err) {
      console.log('err', err);
    });
  };

  unloadWBIndicator(event) {
    const id = event.detail.id;
    const obj = this.objects[id.replace(/\./g, '_')];
    if (obj) {
      obj.detach();
    }
  }

  onWBIndicatorUpdated(event) {
    const id = event.detail.id;

    const config = {
      data: event.detail.data,
      year: event.detail.year,
    };
 
    const obj = this.objects[id.replace(/\./g, '_')];
    if (obj) {
      obj.update(config);
    }
  }

  resetWorldTexture() {
    const world = this.objects.world;
    if (world.material.map) {
      world.material.map = null;
      world.material.color = new THREE.Color( 0x090909 );
      world.material.needsUpdate = true;
      world.geometry.uvsNeedUpdate = true;
    }
  }

  onIPCCDataTextureLoaded(event) {
    const world = this.objects.world;
    const texture = event.detail.texture;

    world.material.map = texture;
    world.material.color = new THREE.Color( 1, 1, 1);
    world.material.map.needsUpdate = true;
    world.material.needsUpdate = true;
    world.geometry.uvsNeedUpdate = true;
  }
}

document.addEventListener("DOMContentLoaded", function(event) {
  window.worldApp = new WorldApp();
});