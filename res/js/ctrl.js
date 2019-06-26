document.addEventListener("DOMContentLoaded", function(event) {
  window.mdc.autoInit();

  window.controls = {
    date: '2017'
    
  };
  var fabMenuEl = document.querySelector('#fab_menu');
  var fabMenu = new mdc.menu.MDCMenu(fabMenuEl);

  var neCtrlCardEl = document.querySelector('#ne-ctrl-card');
  var wbCtrlCardEl = document.querySelector('#wb-ctrl-card');
  var indCtrlCardEl = document.querySelector('#ind-ctrl-card');

  var textinput = indCtrlCardEl.querySelector('#indicator-text-field');
  var icon = indCtrlCardEl.querySelector('.mdc-text-field__icon');
  window._indicators_ = ['SP.POP.TOTL', 'SM.POP.REFG', 'SM.POP.REFG.OR'];
  icon.addEventListener('click', function(evt) {
    console.log(textinput.value);
    window._indicators_.push(textinput.value);
  });

  window.toggleFabMenu = function(evt) {
    fabMenu.open = !fabMenu.open;
  };

  const slider = new mdc.slider.MDCSlider(document.querySelector('.mdc-slider'));
  window._controls_ = {
      date: ('' + slider.value)
  }

  slider.listen('MDCSlider:change', () => {
    console.log(`Value changed to ${slider.value}`);
    window._controls_.date = slider.value;
  });

  fabMenuEl.addEventListener('MDCMenu:selected', function(evt) {
     var detail = evt.detail;
     if (detail.index === 1) {
       neCtrlCardEl.style.display="block";
       wbCtrlCardEl.style.display="none";
       indCtrlCardEl.style.display="none";
     }
     if (detail.index === 2) {
       wbCtrlCardEl.style.display="block";
       neCtrlCardEl.style.display="none";
       indCtrlCardEl.style.display="none";
     }
     if (detail.index === 3) {
       indCtrlCardEl.style.display="block";
       neCtrlCardEl.style.display="none";
       wbCtrlCardEl.style.display="none";
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
