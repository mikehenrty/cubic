window.Engine = (function() {
  'use strict';

  const COLS = 10;
  const ROWS = 10;

  const KEY_MAP = {
    'a': 'moveLeft',
    'w': 'moveUp',
    'd': 'moveRight',
    's': 'moveDown'
  };

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
    this.pendingMoves = {};
    this.nextMove = null;
  }

  Engine.prototype.init = function() {
    return this.connection.init().then(id => {
      this.container.appendChild(this.el);
      document.addEventListener('keydown', evt => {
        this.handleKeyForMe(evt.key);
      });
      this.connection.registerHandler('keydown',
                                      this.handleKeyForOpponent.bind(this));
      this.connection.registerHandler('keydown_ack',
                                      this.handleKeyAck.bind(this));
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
  };

  Engine.prototype.finishPendingMove = function(id) {
    this.me.endMove();
    delete this.pendingMoves[id];
    if (this.nextMove) {
      var key = this.nextMove;
      this.nextMove = null;
      this.handleKeyForMe(key);
    }
  };

  Engine.prototype.addPendingMove = function(id, position) {
    this.pendingMoves[id] = {
      acked: false,
      animated: false,
      position: position
    };

    // To be run approximately when animation completes.
    setTimeout(() => {
      var move = this.pendingMoves[id];
      if (!this.pendingMoves[id]) {
        console.log('timeout, pending move not found');
        return;
      }

      // Move must be both acked and animated before completion.
      if (move.acked) {
        this.finishPendingMove(id);
      } else {
        move.animated = true;
      }
    }, Player.MoveDuration);
  };

  Engine.prototype.handleKeyAck = function(type, payload) {
    var id, result;
    [id, result] = payload.split(' ');

    var move = this.pendingMoves[id];
    if (!move) {
      console.log('pending move not found', id);
      return;
    }

    if (result !== '1') {
      console.log('peer says no, rolling back');
      this.me.setPosition(move.position.x,
                          move.position.y, 10);
      this.me.endMove();
      delete this.pendingMoves[id];
      return;
    }

    // Move must be both acked and animated before completion.
    if (move.animated) {
      this.finishPendingMove(id);
    } else {
      move.acked = true;
    }
  };

  Engine.prototype.handleKeyForOpponent = function(type, payload) {
    var key, id, timestamp;
    [id, key, timestamp] = payload.split(' ');
    if (!this.isValidKey(key)) {
      return;
    }

    var now = this.time.now();
    var duration = (parseInt(timestamp, 10) + Player.MoveDuration) - now;

    // Make sure we have enough time for animation to complete,
    // otherwise we reject the move.
    if (duration < 0) {
      this.connection.send('keydown_ack', `${id} 0`);
    } else {
      this.connection.send('keydown_ack', `${id} 1`);
      this.processKey(this.opponentNumber, key, duration);
    }
  };

  Engine.prototype.handleKeyForMe = function(key) {
    // Only process one move at a time.
    if (this.me.isMoving()) {
      this.nextMove = key;
      return;
    }

    if (!this.isValidKey(key)) {
      return;
    }

    this.me.startMove();
    var id = Utility.guid();
    this.addPendingMove(id, this.me.getPosition());

    this.connection.send('keydown', `${id} ${key} ${this.time.now()}`);
    this.processKey(this.playerNumber, key);
  };

  Engine.prototype.isValidKey = function(key) {
    return !!KEY_MAP[key];
  };

  Engine.prototype.processKey = function(playerNumber, key, duration) {
    var player = playerNumber === 1 ? this.player1 : this.player2;
    if (this.isValidKey(key)) {
      player[KEY_MAP[key]](duration);
    }
  };

  Engine.prototype.reset = function() {
    this.player1.reset();
    this.player2.reset();
  };

  return Engine;
})();
