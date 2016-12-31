document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var container = document.body;
  var controller = new Controller(container);
  controller.init();
  controller.run();
});
