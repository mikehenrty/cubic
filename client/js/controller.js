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

  Controller.prototype.showGame = function() {
    this.ui.hide();
    this.engine.showBoard();
  };

  Controller.prototype.init = function() {
    this.ui.on('offline', this.startOfflineGame.bind(this));
    this.ui.on('rename', this.renamePlayer.bind(this));
    this.ui.on('join', this.attemptConnect.bind(this));

    // this.engine.onAsk??
    this.engine.onDisconnect(this.showUI.bind(this));
    this.engine.onConnect(this.showGame.bind(this));

    this.ui.init();
    return this.engine.init(this.fetchName()).then(clientId => {
      this.storeName(this.engine.getClientName());
      var peerId = Utility.getPeerId();
      if (peerId) {
        // Take peerId out of the URL.
        history.replaceState(null, document.title, '/');
        return this.attemptConnect(peerId);
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
    console.log('attempting to connect', peerId);
    this.showGame();
    return this.engine.connectToPeer(peerId).catch(err => {
      console.log('could not connect', err, peerId);
      this.showUI();
    });
  };

  Controller.prototype.startOfflineGame = function() {
    this.showGame();
    this.engine.startOffline();
  };

  Controller.prototype.renamePlayer = function(name) {
    this.ui.show({ clientName: '...' }); // Temporarily display elipses
    this.engine.setName(name).then(() => {
      this.storeName(name);
      this.showUI();
    }).catch((err) => {
      console.log('Name set error', err);
      this.showUI();
    });
  };

  return Controller;
})();
