window.UI = (function() {
  'use strict';

  function UI(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'ui';
    this.content = document.createElement('div');
    this.content.id = 'content';
    this.linkInput = document.createElement('input');
    this.linkInput.className = 'peer-link';
    this.linkButton = document.createElement('button');
    this.linkButton.className = 'link-button';
    this.linkButton.textContent = 'Copy Link';

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
    this.offlineButton.onclick = this.hide.bind(this);
  }

  UI.prototype.init = function() {
    this.content.appendChild(this.linkInput);
    this.content.appendChild(this.linkButton);
    this.content.appendChild(this.offlineButton);
    this.el.appendChild(this.content);
    this.container.appendChild(this.el);
  };

  UI.prototype.show = function() {
    this.el.classList.add('show');
  };

  UI.prototype.hide = function() {
    this.el.classList.remove('show');
  };

  UI.prototype.showPeerLink = function(clientId) {
    this.linkInput.value = Utility.getPeerLink(clientId);
    this.show();
  }

  return UI;
})();
