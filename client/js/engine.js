window.Engine = (function() {
  'use strict';

  const COLS = 10;
  const ROWS = 10;

  function Engine(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'screen';
    this.connection = new Connection();
    this.time = new TimeSync();
    this.board = new Board(this, COLS, ROWS);
    this.player1 = new Player(1, this.board);
    this.player2 = new Player(2, this.board);
    this.setPlayer(1);
    this.ready = false;
    this.readyHandler = null;
  }

  Engine.prototype.init = function() {
    return this.connection.init().then(id => {
      this.container.appendChild(this.el);
      document.addEventListener('keydown', this.handleKeyForMe.bind(this));
      this.connection.registerHandler('keydown',
                                     this.handleKeyForOpponent.bind(this));
      this.connection.registerHandler('ready', this.handleReady.bind(this));
      this.time.init(this.connection);
      this.board.init();
      this.player1.init();
      this.player2.init();
      return id;
    });
  };

  Engine.prototype.connectToPeer = function(peerId) {
    this.setPlayer(2);
    return this.connection.connect(peerId).then(() => {
      return this.time.sync();
    }).then(() => {
      this.connection.send('ready');
      this.handleReady();
    }).catch(err => {
      this.setPlayer(1);
      throw err;
    });
  };

  Engine.prototype.onReady = function(cb) {
    if (this.ready) {
      return cb && cb();
    }
    this.readyHandler = cb;
  };

  Engine.prototype.handleReady = function() {
    this.reset();
    this.ready = true;
    this.readyHandler && this.readyHandler();
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
    var key, id, timestamp;
    [id, key, timestamp] = payload.split(' ');
    var now = this.time.now();
    var duration = (parseInt(timestamp, 10) + Player.MoveDuration) - now;
    this.handleKeyforPlayer(this.opponentNumber, key, duration);
    this.connection.send('keydown_ack', id);
  };

  Engine.prototype.handleKeyForMe = function(evt) {
    this.connection.send('keydown',
                         `${Utility.guid()} ${evt.key} ${this.time.now()}`);
    this.handleKeyforPlayer(this.playerNumber, evt.key);
  };

  Engine.prototype.handleKeyforPlayer = function(playerNumber, key, duration) {
    var player = playerNumber === 1 ? this.player1 : this.player2;
    switch (key) {
      case 'a':
        player.moveLeft(duration);
        break;

      case 'w':
        player.moveUp(duration);
        break;

      case 'd':
        player.moveRight(duration);
        break;

      case 's':
        player.moveDown(duration);
        break;
    }
  };

  Engine.prototype.reset = function() {
    this.player1.reset();
    this.player2.reset();
  };

  return Engine;
})();
