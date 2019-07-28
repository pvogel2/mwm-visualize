class NECtrl {
  constructor(element) {
    this.worker = new Worker('/res/js/assets/worldworker.js');

    this.element_ = element;

    this.features = {
      cities: {color: 0x00ff33, dbType: 'dbase', dbId: 'populatedplaces'},
      rivers: {color: 0x0044ff, dbType: 'three', dbId: 'rivers'},
      lakes: {color: 0x0000aa, dbType: 'three', dbId: 'lakes'},
      geolines: {color: 0x999999, dbType: 'three', dbId: 'geolines'},
      coastline: {color: 0xffffff, dbType: 'three', dbId: 'coastline'},
      boundariesland: {color: 0x666666, dbType: 'three', dbId: 'boundariesland'}
    };

    this.worker.addEventListener('message', this);

    this.citiesSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#ne-cities-switch'));
    this.citiesSwitch.nativeControl_.addEventListener('change', event => {
      if(this.citiesSwitch.checked) {
        this.loadFeature('cities');
      } else {
        this.unloadFeature('cities');
      }
    });

    this.riversSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#ne-rivers-switch'));
    this.riversSwitch.nativeControl_.addEventListener('change', event => {
      if(this.riversSwitch.checked) {
        this.loadFeature('rivers');
      } else {
        this.unloadFeature('rivers');
      }
    });

    this.lakesSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#ne-lakes-switch'));
    this.lakesSwitch.nativeControl_.addEventListener('change', event => {
      if(this.lakesSwitch.checked) {
        this.loadFeature('lakes');
      } else {
        this.unloadFeature('lakes');
      }
    });
    this.geolinesSwitch = new mdc.switchControl.MDCSwitch(this.element_.querySelector('#ne-geolines-switch'));
    this.geolinesSwitch.nativeControl_.addEventListener('change', event => {
      if(this.geolinesSwitch.checked) {
        this.loadFeature('geolines');
      } else {
        this.unloadFeature('geolines');
      }
    });
  }

  handleEvent(event) {
    switch(event.type) {
      case 'message':
        const neEvent = new CustomEvent('NE:featureLoaded', { detail: event.data });
        document.dispatchEvent(neEvent);
        break;
      default:;
    }
  }

  loadFeature(id) {
    const feature = this.features[id];
    this.worker.postMessage(feature);
  }

  unloadFeature(id) {
    const feature = this.features[id];
    const neEvent = new CustomEvent('NE:unloadFeature', { detail: feature.dbId });
    document.dispatchEvent(neEvent);
  }
};
