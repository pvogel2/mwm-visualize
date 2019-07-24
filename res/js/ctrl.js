document.addEventListener("DOMContentLoaded", function(event) {
  window.mdc.autoInit();

  window.controls = {
    date: '2017'
    
  };

  window.ipcc = new IPCC(document.querySelector('#ipcc-ctrl-card'));

  window.wbCtrl = new WBCtrl(document.querySelector('#wb-card'));


  var fabMenuEl = document.querySelector('#fab_menu');
  var fabMenu = new mdc.menu.MDCMenu(fabMenuEl);
  var fabMenuBtn = document.querySelector('#main_menu_btn');

  var neCtrlCardEl = document.querySelector('#ne-ctrl-card');
  var indCtrlCardEl = document.querySelector('#ind-ctrl-card');

  var textinput = indCtrlCardEl.querySelector('#indicator-text-field');
  var icon = indCtrlCardEl.querySelector('.mdc-text-field__icon');

  fabMenuBtn.addEventListener('mouseenter', evt => {
    fabMenu.open = true;
  });

  fabMenuEl.addEventListener('MDCMenu:selected', function(evt) {
     var detail = evt.detail;
     if (detail.index === 1) {
       neCtrlCardEl.style.display="block";
       wbCtrl.hide();
       indCtrlCardEl.style.display="none";
       ipcc.hide();
     }
     if (detail.index === 2) {
       wbCtrl.show();
       neCtrlCardEl.style.display="none";
       indCtrlCardEl.style.display="none";
       ipcc.hide();
     }
     if (detail.index === 3) {
       indCtrlCardEl.style.display="block";
       neCtrlCardEl.style.display="none";
       wbCtrl.hide();
       ipcc.hide();
     }
     if (detail.index === 4) {
       indCtrlCardEl.style.display="none";
       neCtrlCardEl.style.display="none";
       wbCtrl.hide();
       ipcc.loadStructure();
     }
  });

  window.togglePopulation = function (elem) {
    if(elem.MDCSwitch.checked) {
      console.log("load Population");
      window.loadPopulation();
    } else {
      window.unloadPopulation();
    }
  }

  window.toggleRefugees = function (elem) {
    if(elem.MDCSwitch.checked) {
      console.log("load Refugees");
      window.loadRefugees();
    } else {
      window.unloadRefugees();
    }
  }

  window.toggleRefugeesOrigin = function (elem) {
    if(elem.MDCSwitch.checked) {
      console.log("load RefugeesOrigin");
      window.loadRefugeesOrigin();
    } else {
      window.unloadRefugeesOrigin();
    }
  }
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
