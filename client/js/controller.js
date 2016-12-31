window.Controller = (function() {
  'use strict';

  function Controller(container) {
    this.container = container;
    this.game = new GameController(container);
    this.ui = new UI(container);

    this.ui.on('offline', this.startOfflineGame.bind(this));
    this.ui.on('rename', this.renamePlayer.bind(this));
    this.ui.on('join', this.attemptToConnect.bind(this));

    // TODO: move logic for starting game into this handler.
    // ie. here we call game.startGame or something.
    this.game.on('ready', this.showGame.bind(this));
    // TODO: set status message of peer rejection.
    this.game.on('reject', peerId => {
      alert(`${peerId} rejected you`);
      this.showUI();
    });
    // TODO: set status message of peer disconnection.
    this.game.on('disconnect', this.showUI.bind(this));
  }

  Controller.prototype.showUI = function() {
    this.game.getList().then(list => {
      this.game.hideBoard();
      this.ui.show({
        clientId: this.game.getClientId(),
        clientName: this.game.getClientName(),
        clientList: list,
      });
    });
  };

  Controller.prototype.showGame = function() {
    this.ui.hide();
    this.game.showBoard();
  };

  Controller.prototype.start = function() {
    this.game.register(Utility.fetchName()).then(() => {
      Utility.storeName(this.game.getClientName());

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
    this.game.connectToPeer(peerId);
  };

  Controller.prototype.startOfflineGame = function() {
    this.showGame();
    this.game.startOffline();
  };

  Controller.prototype.renamePlayer = function(name) {
    this.ui.show({ clientName: '...' }); // Temporarily display elipses
    this.game.setName(name).then(() => {
      Utility.storeName(name);
      this.showUI();
    }).catch((err) => {
      console.log('Name set error', err);
      this.showUI();
    });
  };

  return Controller;
})();
