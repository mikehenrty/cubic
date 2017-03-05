window.Controller = (function() {
  'use strict';

  function Controller(container) {
    this.container = container;
    this.game = new GameController(container);
    this.ui = new UI(container);
    this.dialog = new Dialog(container);
    this.clientList = {};

    this.ui.on('offline', this.startOfflineGame.bind(this));
    this.ui.on('rename', this.renamePlayer.bind(this));
    this.ui.on('join', this.askToConnect.bind(this));

    this.game.on('ask', this.confirmConnection.bind(this));
    // TODO: move logic for starting game into this handler.
    // ie. here we call game.startGame or something.
    this.game.on('ready', this.showGame.bind(this));
    this.game.on('confirm', this.showConfirmation.bind(this));
    this.game.on('reject', this.showRejection.bind(this));
    this.game.on('disconnect', this.handleDisconnect.bind(this));
    this.game.on('gameover', this.showPlayAgain.bind(this));
    this.game.on('list_update', this.updatePeerList.bind(this));
  }

  Controller.prototype.createClientList = function(list) {
    this.clientList = {};
    list.forEach(info => {
      this.clientList[info.socketId] = info.clientName;
    });
  };

  Controller.prototype.updatePeerList = function(list) {
    this.createClientList(list);
    if (this.game.isBoardShowing()) {
      return;
    }

    this.ui.show({
      clientId: this.game.getClientId(),
      clientName: this.game.getClientName(),
      socketId: this.game.getSocketId(),
      clientList: list,
    });
  };

  Controller.prototype.showUI = function() {
    this.dialog.hide();
    this.game.hideBoard();
    this.game.getList().then(list => {
      this.updatePeerList(list);
      this.game.engine.startIntroMusic();
    });
  };

  Controller.prototype.showGame = function() {
    this.dialog.hide();
    this.ui.hide();
    this.game.showBoard();
  };

  Controller.prototype.askToConnect = function(peer) {
    console.log('asking to connect to peer', peer);
    this.dialog.showAlert(`Asking ${peer.clientName} to connect...`);
    this.game.askToConnect(peer.socketId);
  };

  Controller.prototype.confirmConnection = function(peerId, name) {
    if (this.game.isBoardShowing()) {
      this.game.rejectPeer(peerId);
      return;
    }

    this.dialog.showConfirm(`${name} is asking to play you`).then(result => {
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

  Controller.prototype.handleDisconnect = function(peerId) {
    var peer = this.clientList[peerId] || peerId;
    this.ui.setStatus(`${peer} disconnected`);
    this.game.teardownGame();
    this.showUI();
  };

  Controller.prototype.start = function() {
    this.ui.setStatus('Loading...');
    Promise.all([
      this.game.register(Utility.fetchId()),
      this.game.loadAssets(),
    ]).then(() => {
      this.ui.activate();
      this.ui.setStatus('READY!!!');
      Utility.storeId(this.game.getClientId());

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

  Controller.prototype.showPlayAgain = function(status) {
    this.dialog.showConfirm(`${status}. Play again?`).then(result => {
      if (result) {
        // restart game
        this.game.playAgain();
      } else {
        this.game.teardownGame();
        this.showUI();
      }
    });
  };

  Controller.prototype.renamePlayer = function() {
    this.dialog.showPrompt('What is your name?').then(name => {
      if (!name) {
        return;
      }

      this.ui.show({ clientName: '...' }); // Temporarily display elipses
      this.game.setName(name).then(() => {
        this.ui.setStatus('Name changed');
        this.showUI();
      }).catch((err) => {
        console.log('Name set error', err);
        this.ui.setStatus('Could not change name');
        this.showUI();
      });
    });
  };

  return Controller;
})();
