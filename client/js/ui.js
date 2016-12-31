window.UI = (function() {
  'use strict';

  function UI(container) {
    this.container = container;
  }

  UI.prototype = new Eventer();

  UI.prototype.init = function() {
    this.el = document.createElement('div');
    this.el.id = 'ui';
    this.content = document.createElement('div');
    this.content.id = 'content';
    this.welcomeContainer = document.createElement('p');
    this.changeNameButton = document.createElement('a');
    this.changeNameButton.textContent = 'Change Name';

    this.actionButtons = document.createElement('p');
    this.actionButtons.id = 'action-buttons';
    this.linkInput = document.createElement('input');
    this.linkInput.className = 'peer-link';
    this.linkButton = document.createElement('button');
    this.linkButton.className = 'link-button';
    this.linkButton.textContent = 'Invite Friends';
    this.offlineButton = document.createElement('button');
    this.offlineButton.id = 'offline';
    this.offlineButton.textContent = 'Play Offline';
    this.offlineButton.onclick = this.trigger.bind(this, 'offline');
    this.actionButtons.appendChild(this.linkInput);
    this.actionButtons.appendChild(this.linkButton);
    this.actionButtons.appendChild(this.offlineButton);

    this.listContainer = document.createElement('div');
    this.listContainer.id = 'list-container';

    this.changeNameButton.onclick = evt => {
      var newName = prompt('New name?');
      if (newName) {
        this.trigger('rename', newName);
      }
    };

    this.linkButton.onclick = evt => {
      this.linkInput.focus();
      this.linkInput.select();
      document.execCommand('copy');
    };

    document.addEventListener('copy', (evt) => {
      var buttonText = this.linkButton.textContent;
      this.linkButton.textContent = 'Copied!!!!';
      setTimeout(() => {
        this.linkButton.textContent = buttonText;
        this.linkInput.blur();
      }, 1000);
    });


    this.content.appendChild(this.welcomeContainer);
    this.content.appendChild(this.actionButtons);
    this.content.appendChild(this.listContainer);
    this.el.appendChild(this.content);
    this.container.appendChild(this.el);
    this.hide();
  };

  UI.prototype.show = function(options) {
    if (options.clientId) {
      this.linkInput.value = Utility.getPeerLink(options.clientId);
    }
    if (options.clientName) {
      this.welcomeContainer.textContent = `You are: ${options.clientName}`;
      this.welcomeContainer.appendChild(this.changeNameButton);
    }
    if (options.clientList) {
      this.listContainer.innerHTML = '';
      if (options.clientList.length > 1) {
        options.clientList.forEach(clientInfo => {
          if (clientInfo.clientId === options.clientId) {
            // Don't show link to join self.
            return;
          }
          var clientRow = document.createElement('p');
          clientRow.textContent = clientInfo.clientName;
          var joinButton = document.createElement('a');
          joinButton.textContent = 'Join';
          joinButton.href = Utility.getPeerLink(clientInfo.clientId);
          joinButton.onclick = evt => {
            evt.preventDefault();
            this.trigger('join', clientInfo.clientId);
          };

          clientRow.appendChild(joinButton);
          this.listContainer.appendChild(clientRow);
        });
      } else {
        var emptyRow = document.createElement('p');
        emptyRow.textContent = 'No one else is currently online';
        this.listContainer.appendChild(emptyRow);
      }
    }

    this.el.classList.remove('hide');
  };

  UI.prototype.hide = function() {
    this.el.classList.add('hide');
  };

  return UI;
})();
