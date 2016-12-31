window.GameController = (function() {
  'use strict';

  const START_DELAY = 1000;

  function GameController(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'screen';
    this.container.appendChild(this.el);

    this.clientId = null;
    this.clientName = null;

    this.connection = new Connection();
    this.time = new TimeSync(this.connection);
    this.engine = new GameEngine(this.el, this.connection, this.time);
    this.status = new Status(this.el);

    this.forward('reject', this.connection);
    this.forward('disconnect', this.connection);
    this.status.on('again', this.handleAgainButton.bind(this));
    this.connection.on('readyPlayerOne', this.handleReadyPlayerOne.bind(this));
    this.connection.on('start', this.handleStart.bind(this));
    this.connection.on('peer', this.handlePeerConnection.bind(this));
    this.engine.on('gameover', this.displayGameOverStatus.bind(this));
    this.engine.on('ping', this.displayPing.bind(this));
    this.hideBoard();
  }

  GameController.prototype = new Eventer();

  GameController.prototype.hideBoard = function() {
    this.el.classList.add('hide');
  };

  GameController.prototype.showBoard = function() {
    this.el.classList.remove('hide');
  };

  GameController.prototype.setName = function(name) {
    return this.connection.setName(name).then(name => {
      this.clientName = name;
    });
  };

  GameController.prototype.getList = function() {
    return this.connection.getList();
  };

  GameController.prototype.register = function(name) {
    return this.connection.register(name).then(clientInfo => {
      console.log('registered', clientInfo);
      this.clientId = clientInfo.clientId;
      this.clientName = clientInfo.clientName;
    });
  };

  GameController.prototype.connectToPeer = function(peerId) {
    this.engine.setPlayer(2);
    this.connection.connectToPeer(peerId);
  };

  GameController.prototype.handlePeerConnection = function(peerId) {
    console.log('got peer connection', peerId);
    // Only player 1 needs to sync timestamps.
    if (this.engine.playerNumber === 1) {
      this.time.sync().then(ping => {
        this.setReadyStatus();
        this.connection.send('readyPlayerOne');
        // For fairness, delay triggering ready for half a ping.
        setTimeout(this.trigger.bind(this, 'ready'), ping / 2);
      }).catch(err => {
        this.status.setStatus('Could not sync time');
        this.engine.setPlayer(1);
        throw err;
      });
    }
  };

  GameController.prototype.handleReadyPlayerOne = function() {
    this.setReadyStatus();
    this.trigger('ready');
    var tiles = this.engine.generateTiles();
    var startTime = this.time.now() + START_DELAY;
    this.connection.send('start', `${startTime} ${JSON.stringify(tiles)}`);
    setTimeout(this.start.bind(this, tiles), START_DELAY);
  };

  GameController.prototype.setReadyStatus = function() {
    this.status.setStatus(`Ready...`);
  };

  GameController.prototype.handleStart = function(payload) {
    var startTime, tiles
    [startTime, tiles] = payload.split(' ');
    tiles = JSON.parse(tiles);
    setTimeout(this.start.bind(this, tiles), startTime - this.time.now());
  };

  GameController.prototype.start = function(tiles) {
    this.status.setStatus('Go!!!');
    this.engine.startGame(tiles);
  };

  GameController.prototype.startOffline = function() {
    this.status.setStatus('Go!!!');
    this.engine.startOffline();
  };

  GameController.prototype.getClientId = function() {
    return this.clientId;
  };

  GameController.prototype.getClientName = function() {
    return this.clientName;
  };

  GameController.prototype.displayGameOverStatus = function(winner) {
    if (winner === 0) {
      this.status.setGameOverStatus('It\'s a tie');
    } else {
      if (this.engine.offlineMode) {
        this.status.setGameOverStatus(`Player ${winner} wins!`);
      } else {
        this.status.setGameOverStatus(
          `You ${winner === this.engine.playerNumber ? 'win' : 'lose'}`);
      }
    }
  };

  GameController.prototype.displayPing = function(ping) {
    this.status.setStatus(`Ping ${ping}ms`);
  };

  GameController.prototype.handleAgainButton = function() {
    if (this.engine.offlineMode) {
      this.startOffline();
      return;
    }

    // TODO: online restart logic, wait for both to be ready
  };

  return GameController;
})();
