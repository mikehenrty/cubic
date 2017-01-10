window.UI = (function() {
  'use strict';

  const STATUS_TIMEOUT = 3000;

  function UI(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'ui';
    this.content = document.createElement('div');
    this.content.id = 'content';
    this.titleContainer = document.createElement('div');
    this.titleContainer.id = 'title';

    'CUBIC'.split('').forEach(letter => {
      var el = document.createElement('div');
      el.className = 'title-letter';
      el.textContent = letter;
      this.titleContainer.appendChild(el);
    });

    this.welcomeContainer = document.createElement('p');
    this.welcomeContainer.id = 'welcome';
    this.welcomeContainer.textContent = 'Welcome, ';
    this.nameContainer = document.createElement('span');
    this.nameContainer.id = 'name-container';
    this.nameContainer.classList.add('color-change');
    this.changeNameButton = document.createElement('a');
    this.changeNameButton.textContent = 'Rename';
    this.welcomeContainer.appendChild(this.nameContainer);
    this.welcomeContainer.appendChild(this.changeNameButton);

    this.status = document.createElement('p');
    this.status.id = 'ui-status';
    this.statusTimeout = null;

    this.actionButtons = document.createElement('p');
    this.actionButtons.id = 'action-buttons';
    this.linkInput = document.createElement('input');
    this.linkInput.className = 'peer-link';
    this.linkButton = document.createElement('button');
    this.linkButton.className = 'link-button';
    this.linkButton.textContent = 'Invite Link';
    this.offlineButton = document.createElement('button');
    this.offlineButton.id = 'offline';
    this.offlineButton.textContent = 'Play Offline';
    this.offlineButton.onclick = this.trigger.bind(this, 'offline');
    this.actionButtons.appendChild(this.linkInput);
    this.actionButtons.appendChild(this.linkButton);
    this.actionButtons.appendChild(this.offlineButton);

    var listHeader = document.createElement('p');
    listHeader.id = 'list-header';
    listHeader.textContent = 'People Online';
    this.listContainer = document.createElement('div');
    this.listContainer.id = 'list-container';

    this.changeNameButton.onclick = this.trigger.bind(this, 'rename');

    this.linkButton.onclick = evt => {
      this.linkInput.focus();
      this.linkInput.select();
      document.execCommand('copy');
    };
    document.addEventListener('copy', (evt) => {
      this.setStatus('Link copied to clipboard');
    });

    this.content.appendChild(this.titleContainer);
    this.content.appendChild(this.welcomeContainer);
    this.content.appendChild(this.status);
    this.content.appendChild(this.actionButtons);
    this.content.appendChild(listHeader);
    this.content.appendChild(this.listContainer);
    this.el.appendChild(this.content);
    this.container.appendChild(this.el);
  }

  UI.prototype = new Eventer();

  UI.prototype.show = function(options) {
    if (options.clientId) {
      this.linkInput.value = Utility.getPeerLink(options.clientId);
    }
    if (options.clientName) {
      this.nameContainer.textContent = options.clientName;
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
          var clientName = document.createElement('span');
          clientName.className = 'color-change';
          clientName.textContent = clientInfo.clientName;
          clientRow.appendChild(clientName);
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

  UI.prototype.setStatus = function(text) {
    this.status.textContent = text;
    this.status.classList.add('fade-in-out');
    this.statusTimeout && clearTimeout(this.statusTimeout);
    this.statusTimeout = setTimeout(() => {
      this.status.textContent = '';
      this.status.classList.remove('fade-in-out');
    }, STATUS_TIMEOUT);
  };

  return UI;
})();
