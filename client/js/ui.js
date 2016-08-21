window.UI = (function() {
  'use strict';

  function UI(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'ui';
    this.status = document.createElement('p');
    this.status.id = 'status';
  }

  UI.prototype.init = function() {
    this.el.appendChild(this.status);
    document.body.appendChild(this.el);
  };

  UI.prototype.setStatus = function(text) {
    this.status.textContent = text;
  };

  return UI;
})();
