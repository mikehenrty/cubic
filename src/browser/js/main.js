(() => {
  'use strict';

  window.addEventListener('load', () => {
    var container = document.body;
    var controller = new Controller(container);
    controller.start();
  });
})();
