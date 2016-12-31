window.Status = (() => {
  'use strict';

  function Status(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'status';
    this.status = document.createElement('p');
    this.status.id = 'status-text';
    this.againButton = document.createElement('a');
    this.againButton.id = 'play-again';
    this.againButton.classList.add('color-change');
    this.againButton.textContent = 'Play again?';
    this.bottomStatus = document.createElement('div');
    this.bottomStatus.id = 'bottom-status';
    this.el.appendChild(this.status);
    this.container.appendChild(this.el);
    this.container.appendChild(this.bottomStatus);

    this.againButton.onclick = this.trigger.bind(this, 'again');
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
    this.status.appendChild(this.againButton);
  };

  Status.prototype.handleAgain = function() {
    this.againHandler && this.againHandler();
  };

  return Status;
})();
