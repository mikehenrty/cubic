window.Status = (() => {
  'use strict';

  function Status(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'status';
    this.status = document.createElement('p');
    this.status.id = 'status-text';
  }

  Status.prototype.init = function() {
    this.el.appendChild(this.status);
    this.container.appendChild(this.el);
  };

  Status.prototype.setStatus = function(text) {
    this.status.innerHTML = '';
    this.status.textContent = text;
  };

  return Status;
})();
