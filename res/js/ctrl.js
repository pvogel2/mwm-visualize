document.addEventListener("DOMContentLoaded", function(event) {
  window.mdc.autoInit();

  var fabMenuEl = document.querySelector('#fab_menu');
  var fabMenu = new mdc.menu.MDCMenu(fabMenuEl);

  var neCtrlCardEl = document.querySelector('#ne-ctrl-card');
  var wbCtrlCardEl = document.querySelector('#wb-ctrl-card');

  window.toggleFabMenu = function(evt) {
    fabMenu.open = !fabMenu.open;
  };

  fabMenuEl.addEventListener('MDCMenu:selected', function(evt) {
     var detail = evt.detail;
     if (detail.index === 1) {
       neCtrlCardEl.style.display="block";
       wbCtrlCardEl.style.display="none";
     }
     if (detail.index === 2) {
       wbCtrlCardEl.style.display="block";
       neCtrlCardEl.style.display="none";
     }
  });
});

var ne = {
  toggleCities: elem => {
    if(elem.MDCSwitch.checked) {
      loadCities(getWorldSphere(), 0x00ff33);
    } else {
      removeCities();
    }
  },
  toggleRivers: elem => {
    if(elem.MDCSwitch.checked) {
      loadFeature(getWorldSphere(), 0x0044ff, 'rivers','three');
    } else {
      removeFeature('rivers');
    }
  },
  toggleLakes: elem => {
    if(elem.MDCSwitch.checked) {
          loadFeature(getWorldSphere(), 0x0000aa, 'lakes','three');
    } else {
      removeFeature('lakes');
    }
  },
  toggleGeolines: elem => {
    if(elem.MDCSwitch.checked) {
      loadFeature(getWorldSphere(), 0x999999, 'geolines','three');
    } else {
      removeFeature('geolines');
    }
    
  }
};

var wb = {
  setData: json => {
    wb.data = json;
    wb.map = {};
    wb.data.forEach(item => {
      //wb.map[item.ISO3136.toLowerCase()] = item;
      wb.map[item.iso2Code.toLowerCase()] = item;
    });
  },
  togglePopulation: elem => {
    loadPopulation(getWorldSphere(), 0x0000dd);
  },
  toggleRefugees: elem => {
  },
  toggleRefugeesOrigin: elem => {
  }
};
