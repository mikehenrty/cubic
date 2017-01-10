window.Status = (() => {
  'use strict';

  function Status(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'status';
    this.status = document.createElement('p');
    this.status.id = 'status-text';
    this.bottomStatus = document.createElement('div');
    this.bottomStatus.id = 'bottom-status';
    this.el.appendChild(this.status);
    this.container.appendChild(this.el);
    this.container.appendChild(this.bottomStatus);
  }

  Status.prototype = new Eventer();

  Status.prototype.setStatus = function(text) {
    this.status.innerHTML = '';
    this.status.textContent = text;
  };

  Status.prototype.setBottomStatus = function(text) {
    this.bottomStatus.textContent = text;
  };

  Status.prototype.setGameOverStatus = function(text) {
    this.setStatus(text);
  };

  Status.prototype.handleAgain = function() {
    if (this.againHandler) {
      this.againHandler();
    }
  };

  return Status;
})();
