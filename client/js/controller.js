window.Controller = (function() {
  'use strict';

  function Controller(container) {
    this.container = container;
    this.engine = new Engine(container);
    this.ui = new UI(container);

    this.ui.on('offline', this.startOfflineGame.bind(this));
    this.ui.on('rename', this.renamePlayer.bind(this));
    this.ui.on('join', this.attemptToConnect.bind(this));

    // TODO: move logic for starting game into this handler.
    // ie. here we call engine.startGame or something.
    this.engine.on('ready', this.showGame.bind(this));
    // TODO: set status message of peer rejection.
    this.engine.on('reject', peerId => {
      alert(`${peerId} rejected you`);
      this.showUI();
    });
    // TODO: set status message of peer disconnection.
    this.engine.on('disconnect', this.showUI.bind(this));
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

  Controller.prototype.start = function() {
    this.engine.register(Utility.fetchName()).then(() => {
      Utility.storeName(this.engine.getClientName());

      var peerId = Utility.getPeerId();
      if (peerId) {
        history.replaceState(null, document.title, '/');
        // TODO: set status of connecting to peer.
        this.attemptToConnect(peerId);
        return;
      }

      // Game is ready.
      this.showUI();

    }).catch(err => {
      console.log('Error connecting to server', err);
      this.showUI();
    });
  };

  Controller.prototype.attemptToConnect = function(peerId) {
    console.log('connecting to peer', peerId);
    this.engine.connectToPeer(peerId);
  };

  Controller.prototype.startOfflineGame = function() {
    this.showGame();
    this.engine.startOffline();
  };

  Controller.prototype.renamePlayer = function(name) {
    this.ui.show({ clientName: '...' }); // Temporarily display elipses
    this.engine.setName(name).then(() => {
      Utility.storeName(name);
      this.showUI();
    }).catch((err) => {
      console.log('Name set error', err);
      this.showUI();
    });
  };

  return Controller;
})();
