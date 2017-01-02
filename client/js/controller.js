window.Controller = (function() {
  'use strict';

  function Controller(container) {
    this.container = container;
    this.game = new GameController(container);
    this.ui = new UI(container);
    this.dialog = new Dialog(container);
    this.clientList = null;

    this.ui.on('offline', this.startOfflineGame.bind(this));
    this.ui.on('rename', this.renamePlayer.bind(this));
    this.ui.on('join', this.askToConnect.bind(this));

    this.game.on('ask', this.confirmConnection.bind(this));
    // TODO: move logic for starting game into this handler.
    // ie. here we call game.startGame or something.
    this.game.on('ready', this.showGame.bind(this));
    this.game.on('confirm', this.showConfirmation.bind(this));
    this.game.on('reject', this.showRejection.bind(this));
    this.game.on('disconnect', this.showDisconnect.bind(this));
  }

  Controller.prototype.createClientList = function(list) {
    this.clientList = {};
    list.forEach(info => {
      this.clientList[info.clientId] = info.clientName;
    });
  };

  Controller.prototype.showUI = function() {
    this.game.getList().then(list => {
      this.createClientList(list);
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

  Controller.prototype.askToConnect = function(peerId) {
    console.log('asking to connect to peer', peerId);
    this.game.askToConnect(peerId);
  };

  Controller.prototype.confirmConnection = function(peerId, name) {
    this.dialog.showPrompt(`${name} is asking to play you`).then(result => {
      if (result) {
        this.game.allowPeer(peerId);
        this.game.connectToPeer(peerId);
      } else {
        this.game.rejectPeer(peerId);
      }
    });
  };

  Controller.prototype.showRejection = function(peerId) {
    var peer = this.clientList[peerId] || peerId;
    this.ui.setStatus(`${peer} rejected you`);
    this.showUI();
  };

  Controller.prototype.showConfirmation = function(peerId) {
    var peer = this.clientList[peerId] || peerId;
    this.ui.setStatus(`${peer} is connecting`);
    this.showUI();
  };

  Controller.prototype.showDisconnect = function(peerId) {
    var peer = this.clientList[peerId] || peerId;
    this.ui.setStatus(`${peer} disconnected`);
    this.showUI();
  };

  Controller.prototype.start = function() {
    this.game.register(Utility.fetchName()).then(() => {
      Utility.storeName(this.game.getClientName());

      var peerId = Utility.getPeerId();
      if (peerId) {
        history.replaceState(null, document.title, '/');
        // TODO: set status of connecting to peer.
        this.askToConnect(peerId);
        return;
      }

      // Game is ready.
      this.showUI();

    }).catch(err => {
      console.log('Error connecting to server', err);
      this.showUI();
    });
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
