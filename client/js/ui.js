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
    this.status.innerHTML = '';
    this.status.textContent = text;
  };

  UI.prototype.showPeerLink = function(clientId) {
    this.status.innerHTML = '';
    var linkInput = document.createElement('input');
    linkInput.className = 'peer-link';
    linkInput.value = Utility.getPeerLink(clientId);
    var linkButton = document.createElement('button');
    linkButton.className = 'link-button';
    linkButton.textContent = 'Copy Link';
    linkButton.onclick = evt => {
      linkInput.focus();
      linkInput.select();
      document.execCommand('copy');
    };
    document.addEventListener('copy', (evt) => {
      linkButton.textContent = 'Copied!!!!';
      setTimeout(() => {
        linkButton.textContent = 'Copy Link';
      }, 2000);
    });
    this.status.appendChild(linkInput);
    this.status.appendChild(linkButton);
  }

  return UI;
})();
