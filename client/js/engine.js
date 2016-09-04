window.Engine = (function() {
  'use strict';

  const COLS = 10;
  const ROWS = 10;

  function Engine(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'screen';
    this.connection = new Connection();
    this.board = new Board(this, COLS, ROWS);
    this.player1 = new Player(1, this.board);
    this.player2 = new Player(2, this.board);
    this.setPlayer(1);
    this.readyHandler = null;
  }

  Engine.prototype.init = function() {
    return this.connection.init().then(id => {
      this.connection.registerHandler('keydown',
                                     this.handleKeyForOpponent.bind(this));
      this.connection.onPeerConnect(peerId => {
        this.readyHandler && this.readyHandler();
      });
      this.container.appendChild(this.el);
      this.board.init();
      this.player1.init();
      this.player2.init();
      document.addEventListener('keydown', this.handleKeyForMe.bind(this));
      return id;
    });
  };

  Engine.prototype.connectToPeer = function(peerId) {
    this.setPlayer(2);
    return this.connection.connect(peerId).catch(err => {
      this.setPlayer(1);
      throw err;
    });
  };

  Engine.prototype.onReady = function(cb) {
    this.readyHandler = cb;
  };

  Engine.prototype.getPlayerColor = function() {
    return this.playerNumber === 1 ? 'Red' : 'Blue';
  };

  Engine.prototype.getPlayerNumber = function() {
    return this.playerNumber;
  };

  Engine.prototype.setPlayer = function(playerNumber) {
    if (playerNumber === 1) {
      this.playerNumber = 1;
      this.me = this.player1;
      this.opponentNumber = 2;
      this.opponent = this.player2;
    } else {
      this.playerNumber = 2;
      this.me = this.player2;
      this.opponentNumber = 1;
      this.opponent = this.player1;
    }
  }

  Engine.prototype.handleKeyForOpponent = function(type, payload) {
    if (type === 'keydown') {
      this.handleKeyforPlayer(this.opponentNumber, payload);
    }
  };

  Engine.prototype.handleKeyForMe = function(evt) {
    this.connection.send('keydown', evt.key);
    this.handleKeyforPlayer(this.playerNumber, evt.key);
  };

  Engine.prototype.handleKeyforPlayer = function(playerNumber, key) {
    var player = playerNumber === 1 ? this.player1 : this.player2;
    switch (key) {
      case 'a':
        player.moveLeft();
        break;

      case 'w':
        player.moveUp();
        break;

      case 'd':
        player.moveRight();
        break;

      case 's':
        player.moveDown();
        break;
    }
  };

  Engine.prototype.reset = function() {
    this.player1.reset();
    this.player2.reset();
  };

  return Engine;
})();
