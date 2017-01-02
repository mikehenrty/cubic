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
    this.input.onkeydown = this.onKeyDown.bind(this);
    this.inputContainer = document.createElement('div');
    this.inputContainer.id = 'input-container';
    this.inputContainer.appendChild(this.input);

    this.cancel = document.createElement('button');
    this.cancel.id = 'cancel-button';
    this.cancel.textContent = 'Cancel';
    this.cancel.onclick = this.onResponse.bind(this, false);
    this.confirm = document.createElement('button');
    this.confirm.id = 'confirm-button';
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

  Dialog.prototype.isPrompt = function() {
    return this.el.classList.contains('prompt');
  };

  Dialog.prototype.debounce = function() {
    if (this.pendingDeferred) {
      var deferred = this.pendingDeferred;
      this.pendingDeferred = null;
      deferred.rej(new Error('showed new prompt before old done'));
    }
  };

  Dialog.prototype.onKeyDown = function(evt) {
    if (!this.isShowing() || !this.pendingDeferred || !this.isPrompt()) {
      console.log('keydown event without showing prompt');
      return;
    }

    // Handle 'enter' key.
    if (evt.keyCode === 13) {
      this.onResponse(true);
    }
  };

  Dialog.prototype.showPrompt = function(message) {
    this.debounce();

    return new Promise((res, rej) => {
      this.pendingDeferred = {
        res: res,
        rej: rej
      };

      this.input.value = '';
      this.title.textContent = message;
      this.el.className = ('prompt');
      this.input.focus();
    });
  };

  Dialog.prototype.showConfirm = function(message) {
    this.debounce();

    return new Promise((res, rej) => {
      this.pendingDeferred = {
        res: res,
        rej: rej
      };

      this.title.textContent = message;
      this.el.className = '';
    });
  };

  Dialog.prototype.showAlert = function(message) {
    var promise = this.showConfirm(message);
    this.el.className = 'alert';
    return promise;
  };

  Dialog.prototype.onResponse = function(result) {
    if (!this.pendingDeferred) {
      console.log('got dialog response without pending deferred', result);
      return;
    }

    var deferred = this.pendingDeferred;
    this.pendingDeferred = null;

    this.hide();
    if (this.isPrompt()) {
      deferred.res(result && this.input.value);
    } else {
      deferred.res(result);
    }
  };

  Dialog.prototype.hide = function() {
    this.el.classList.add('hide');
    if (this.pendingDeferred) {
      var deferred = this.pendingDeferred;
      this.pendingDeferred = null;
      rej(new Error('hide called before user interacted with dialog'));
    }
  };

  return Dialog;
})();
