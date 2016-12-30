window.Controller = (function() {
  'use strict';

  function Controller(container) {
    this.container = container;
    this.engine = new Engine(container);
    this.ui = new UI(container);
  }

  Controller.prototype.showUI = function() {
    this.engine.getList().then(list => {
      this.engine.hideBoard();
      this.ui.show({
        clientId: this.engine.getClientId(),
        clientName: this.engine.getClientName(),
        clientList: list,
      });
    });
  };

  Controller.prototype.showBoard = function() {
    this.ui.hide();
    this.engine.showBoard();
  };

  Controller.prototype.init = function() {
    // Play offline.
    this.ui.registerHandler('offline', () => {
      this.showBoard();
      this.engine.startOffline();
    });

    this.ui.registerHandler('rename', newName => {
      // Hide name.
      this.ui.show({ clientName: '...' });
      this.engine.setName(newName).then(() => {
        this.storeName(newName);
        this.showUI();
      }).catch((err) => {
        console.log('Name set error', err);
        this.showUI();
      });
    });

    this.ui.registerHandler('join', peerId => {
      console.log('attempting to connect', peerId);
      this.attemptConnect(peerId);
    });

    this.ui.init();
    this.engine.onDisconnect(this.showUI.bind(this));
    this.engine.onConnect(this.showBoard.bind(this));

    return this.engine.init(this.fetchName()).then(clientId => {
      this.storeName(this.engine.getClientName());
      var peerId = Utility.getPeerId();
      if (peerId) {
        // Take peerId out of the URL.
        history.replaceState(null, document.title, '/');
        return this.attemptConnect(peerId);
        return;
      }

      this.showUI();
    }).catch(err => {
      console.log('Engine init error', err);
      this.showUI();
    });
  };

  Controller.prototype.storeName = function(name) {
    localStorage.name = name;
  };

  Controller.prototype.fetchName = function() {
    return localStorage.name;
  };

  Controller.prototype.attemptConnect = function(peerId) {
    this.showBoard();
    return this.engine.connectToPeer(peerId).catch(err => {
      console.log('could not connect', err, peerId);
      this.showUI();
    });
  };

  return Controller;
})();
