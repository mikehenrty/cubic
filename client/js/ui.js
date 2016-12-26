window.UI = (function() {
  'use strict';

  function UI(container) {
    this.container = container;
    this.handlers = {};
  }

  UI.prototype.init = function() {
    this.el = document.createElement('div');
    this.el.id = 'ui';
    this.content = document.createElement('div');
    this.content.id = 'content';
    this.welcomeContainer = document.createElement('p');
    this.changeNameButton = document.createElement('button');
    this.changeNameButton.textContent = 'Change Name';
    this.linkInput = document.createElement('input');
    this.linkInput.className = 'peer-link';
    this.linkButton = document.createElement('button');
    this.linkButton.className = 'link-button';
    this.linkButton.textContent = 'Copy Link';

    this.changeNameButton.onclick = evt => {
      var newName = prompt('New name?');
      this.trigger('rename', newName);
    };

    this.linkButton.onclick = evt => {
      this.linkInput.focus();
      this.linkInput.select();
      document.execCommand('copy');
    };

    document.addEventListener('copy', (evt) => {
      this.linkButton.textContent = 'Copied!!!!';
      setTimeout(() => {
        this.linkButton.textContent = 'Copy Link';
        this.linkInput.blur();
      }, 1000);
    });

    this.offlineButton = document.createElement('button');
    this.offlineButton.id = 'offline';
    this.offlineButton.textContent = 'Play Offline';
    this.offlineButton.onclick = this.trigger.bind(this, 'offline');

    this.content.appendChild(this.welcomeContainer);
    this.content.appendChild(this.changeNameButton);
    this.content.appendChild(this.linkInput);
    this.content.appendChild(this.linkButton);
    this.content.appendChild(this.offlineButton);
    this.el.appendChild(this.content);
    this.container.appendChild(this.el);
  };

  UI.prototype.registerHandler = function(type, cb) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(cb);
  };

  UI.prototype.trigger = function(type, payload) {
    this.handlers[type] && this.handlers[type].forEach(handler => {
      handler(payload);
    });
  };

  UI.prototype.show = function(options) {
    if (options.clientId) {
      this.linkInput.value = Utility.getPeerLink(options.clientId);
    }
    if (options.clientName) {
      this.welcomeContainer.textContent = `Hello ${options.clientName}`;
    }
    this.el.classList.add('show');
  };

  UI.prototype.hide = function() {
    this.el.classList.remove('show');
  };

  return UI;
})();
