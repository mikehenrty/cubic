window.Dialog = (() => {
  'use strict';

  function Dialog(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'dialog';
    this.el.className = 'hide';
    this.dialogBox = document.createElement('div');
    this.dialogBox.id = 'dialog-box';

    this.title = document.createElement('div');
    this.title.id = 'dialog-title';
    this.input = document.createElement('input');
    this.inputContainer = document.createElement('div');
    this.inputContainer.id = 'input-container';
    this.inputContainer.appendChild(this.input);

    this.cancel = document.createElement('button');
    this.cancel.textContent = 'Cancel';
    this.cancel.onclick = this.onResponse.bind(this, false);
    this.confirm = document.createElement('button');
    this.confirm.textContent = 'Accept';
    this.confirm.onclick = this.onResponse.bind(this, true);
    this.buttons = document.createElement('div');
    this.buttons.appendChild(this.cancel);
    this.buttons.appendChild(this.confirm);

    this.dialogBox.appendChild(this.title);
    this.dialogBox.appendChild(this.inputContainer);
    this.dialogBox.appendChild(this.buttons);
    this.el.appendChild(this.dialogBox);
    this.container.appendChild(this.el);

    this.pendingDeferred = null;
  }

  Dialog.prototype = new Eventer();

  Dialog.prototype.isShowing = function() {
    return !this.el.classList.contains('hide');
  };

  Dialog.prototype.showPrompt = function(message) {
    if (this.isShowing()) {
      return false;
    }

    return new Promise((res, rej) => {
      this.pendingDeferred = {
        res: res,
        rej: rej
      };

      this.title.textContent = message;
      this.el.classList.add('prompt');
      this.el.classList.remove('hide');
    });
  };

  Dialog.prototype.showConfirm = function(message) {
    if (this.isShowing()) {
      return false;
    }

    this.el.classList.remove('hide', 'prompt');
  };

  Dialog.prototype.onResponse = function(result) {
    if (!this.pendingDeferred) {
      console.log('got dialog response without pending deferred', result);
      return;
    }

    var deferred = this.pendingDeferred;
    this.pendingDeferred = null;

    this.hide();
    deferred.res(result);
  };

  Dialog.prototype.hide = function() {
    this.el.classList.add('hide');
  };

  return Dialog;
})();
