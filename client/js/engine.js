window.Engine = (function() {
  'use strict';

  const COLS = 10;
  const ROWS = 10;

  const START_DELAY = 1000;

  function Engine(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.ui = new UI(container);
    this.el.id = 'screen';
    this.connection = new Connection();
    this.time = new TimeSync();
    this.board = new Board(this, COLS, ROWS);
    this.player1 = new Player(1, this.board);
    this.player2 = new Player(2, this.board);
    this.setPlayer(1);
    this.pendingMoves = {};
    this.nextMoveKey = null;
    this.lastMove = null;
    this.disconnectHandler = null;
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
      this.connection.registerHandler('disconnect',
                                      this.handleDisconnect.bind(this));
      this.connection.registerHandler('ready', this.handleReady.bind(this));
      this.connection.registerHandler('start', this.handleStart.bind(this));
      this.time.init(this.connection);
      this.ui.init();
      this.board.init();
      this.player1.init();
      this.player2.init();
      return id;
    });
  };

  Engine.prototype.onDisconnect = function(cb) {
    this.disconnectHandler = cb;
  };

  Engine.prototype.connectToPeer = function(peerId) {
    this.ui.setStatus('Connecting to peer...');
    this.setPlayer(2);
    return this.connection.connect(peerId).then(() => {
      return this.time.sync();
    }).then(ping => {
      this.setReadyStatus(ping);
      this.connection.send('ready', ping);
    }).catch(err => {
      this.setPlayer(1);
      throw err;
    });
  };

  Engine.prototype.setReadyStatus = function(ping) {
    this.ui.setStatus(`Ready... ping ${ping}ms`);
  };

  Engine.prototype.handleStart = function(type, payload) {
    var startTime, tiles
    [startTime, tiles] = payload.split(' ');
    tiles = JSON.parse(tiles);
    setTimeout(this.start.bind(this, tiles), startTime - this.time.now());
  };

  Engine.prototype.handleReady = function(type, ping) {
    this.setReadyStatus(ping);
    var tiles = this.board.generateTiles();
    var startTime = this.time.now() + START_DELAY;
    this.connection.send('start', `${startTime} ${JSON.stringify(tiles)}`);
    setTimeout(this.start.bind(this, tiles), START_DELAY);
  };

  Engine.prototype.start = function(tiles) {
    this.ui.setStatus('Go!!!');
    this.reset();
    this.board.displayTiles(tiles);
  };

  Engine.prototype.getClientId = function() {
    return this.connection.clientId;
  };

  Engine.prototype.getPlayerNumber = function() {
    return this.playerNumber;
  };

  Engine.prototype.setPlayer = function(playerNumber) {
    if (playerNumber === 1) {
      this.playerNumber = 1;
      this.me = this.player2.opponent = this.player1;
      this.opponentNumber = 2;
      this.opponent = this.me.opponent = this.player2;
    } else {
      this.playerNumber = 2;
      this.me = this.player1.opponent = this.player2;
      this.opponentNumber = 1;
      this.opponent = this.me.opponent = this.player1;
    }
  };

  Engine.prototype.finishPendingMove = function(id) {
    this.me.endMove();
    delete this.pendingMoves[id];
    if (this.nextMoveKey) {
      var key = this.nextMoveKey;
      this.nextMoveKey = null;
      setTimeout(this.handleKeyForMe.bind(this, key), 0);
    }
  };

  Engine.prototype.rollbackMoveForPlayer = function(player, position) {
    player.setPosition(position.x, position.y, 10);
    player.endMove(true);
  };

  Engine.prototype.rollbackPendingMove = function(id) {
    var move = this.pendingMoves[id];
    this.rollbackMoveForPlayer(this.me, move.position);
    delete this.pendingMoves[id];
  };

  Engine.prototype.addPendingMove = function(id, position, timestamp) {
    this.lastMove = {
      id: id,
      timestamp: timestamp,
      acked: false,
      animated: false,
      position: position
    };
    this.pendingMoves[id] = this.lastMove;

    // To be run approximately when animation completes.
    setTimeout(() => {
      // If we don't have a connection, we can just finish moves immediately.
      if (!this.connection.isConnected()) {
        this.finishPendingMove(id);
        return;
      }

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
    var id, result, timestamp;
    [id, result, timestamp] = payload.split(' ');

    this.ui.setStatus(`Go!!! ping ${this.time.now() - timestamp}ms`);

    var move = this.pendingMoves[id];
    if (!move) {
      console.log('pending move not found', id);
      return;
    }

    if (result !== '1') {
      this.rollbackPendingMove(id);
      return;
    }

    // Move must be both acked and animated before completion.
    if (move.animated) {
      this.finishPendingMove(id);
    } else {
      move.acked = true;
    }
  };

  Engine.prototype.handleDisconnect = function() {
    this.reset();
    this.disconnectHandler && this.disconnectHandler();
  };

  Engine.prototype.handleKeyForOpponent = function(type, payload) {
    var key, id, timestamp;
    [id, key, timestamp] = payload.split(' ');

    var move = this.getMove(key);
    if (!move) {
      return;
    }

    timestamp = parseInt(timestamp, 10);
    var now = this.time.now();
    var duration = (timestamp + Player.MoveDuration) - now;

    // Make sure we have enough time for animation to complete,
    // otherwise we reject the move.
    if (duration < 0) {
      this.connection.send('keydown_ack', `${id} 0 ${timestamp}`);
      return;
    }

    var oldPos = this.opponent.getPosition();
    this.opponent.startMove(move, duration);

    // Move causes conflict, figure out who gets the contested sqaure.
    if (this.arePositionsConflicting()) {
      if (!this.me.isMoving() || timestamp > this.lastMove.timestamp) {
        // We moved first, tell peer to rollback.
        this.connection.send('keydown_ack', `${id} 0 ${timestamp}`);
        this.rollbackMoveForPlayer(this.opponent, oldPos);
        return;
      }

      // Here we rollback our pending move, but ack peer's.
      this.rollbackPendingMove(this.lastMove.id);
    }

    setTimeout(() => {
      this.opponent.endMove();
    }, duration);

    this.connection.send('keydown_ack', `${id} 1 ${timestamp}`);
  };

  Engine.prototype.handleKeyForMe = function(key) {
    // Only process one move at a time.
    if (this.me.isMoving()) {
      this.nextMoveKey = key;
      return;
    }

    var move = this.getMove(key);
    if (!move) {
      return;
    }

    var position = this.me.getMovePosition(move);
    if (!position) {
      return false;
    }

    var now = this.time.now();
    var id = Utility.guid();
    this.addPendingMove(id, this.me.getPosition(), now);
    this.connection.send('keydown', `${id} ${key} ${now}`);
    this.me.startMove(move);
  };

  Engine.prototype.getMove = function(key) {
    return Player.KEY_MAP[key];
  };

  Engine.prototype.arePositionsConflicting = function() {
    return this.me.x === this.opponent.x && this.me.y === this.opponent.y;
  };

  Engine.prototype.reset = function() {
    this.board.reset();
    this.player1.reset();
    this.player2.reset();
  };

  return Engine;
})();
