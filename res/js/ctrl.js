document.addEventListener("DOMContentLoaded", function(event) {
  window.mdc.autoInit();

  /*window.controls = {
    date: '2017'
    
  };*/

  var fabMenuEl = document.querySelector('#fab_menu');
  var fabMenu = new mdc.menu.MDCMenu(fabMenuEl);
  var fabMenuBtn = document.querySelector('#main_menu_btn');

  var indCtrlCardEl = document.querySelector('#ind-ctrl-card');

  var textinput = indCtrlCardEl.querySelector('#indicator-text-field');
  var icon = indCtrlCardEl.querySelector('.mdc-text-field__icon');

  fabMenuBtn.addEventListener('mouseenter', evt => {
    fabMenu.open = true;
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
