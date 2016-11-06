document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var controller = new Controller(document.body);
  controller.init().then(() => {
    console.log('Initialized!');
  });
});
