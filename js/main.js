document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var container = document.getElementById('container');
  var engine = new Engine(container);
  engine.init();
});

