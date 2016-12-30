window.Status = (() => {
  'use strict';

  function Status(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'status';
    this.status = document.createElement('p');
    this.status.id = 'status-text';
    this.againButton = document.createElement('button');
    this.againButton.textContent = 'Play again?';
    this.againButton.onclick = this.handleAgain.bind(this);
    this.againHandler = null;
  }

  Status.prototype.init = function() {
    this.el.appendChild(this.status);
    this.container.appendChild(this.el);
  };

  Status.prototype.setStatus = function(text) {
    this.status.innerHTML = '';
    this.status.textContent = text;
  };

  Status.prototype.setGameOverStatus = function(text) {
    this.setStatus(text);
    this.status.appendChild(this.againButton);
  };

  Status.prototype.handleAgain = function() {
    this.againHandler && this.againHandler();
  };

  Status.prototype.onAgain = function(cb) {
    this.againHandler = cb;
  };

  return Status;
})();
