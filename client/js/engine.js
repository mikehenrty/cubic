window.Engine = (function() {
  'use strict';

  const COLS = 10;
  const ROWS = 10;

  const START_DELAY = 1000;

  function Engine(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.status = new Status(this.el);
    this.el.id = 'screen';
    this.connection = new Connection();
    this.time = new TimeSync();
    this.board = new Board(this, COLS, ROWS);
    this.player1 = new Player(1, this.board);
    this.player2 = new Player(2, this.board);
    this.setPlayer(1);
    this.pendingMoves = {};
    this.lastMove = null;
    this.connectHandler = null;
    this.disconnectHandler = null;
    this.offlineMode = false;
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
      this.connection.onPeerConnect(this.handleConnect.bind(this));
      this.connection.registerHandler('ready', this.handleReady.bind(this));
      this.connection.registerHandler('start', this.handleStart.bind(this));
      this.time.init(this.connection);
      this.status.init();
      this.board.init();
      this.hideBoard();
      this.player1.init();
      this.player2.init();
      return id;
    });
  };

  Engine.prototype.hideBoard = function() {
    this.el.classList.add('hide');
  };

  Engine.prototype.showBoard = function() {
    this.el.classList.remove('hide');
  };

  Engine.prototype.setName = function(name) {
    return this.connection.setName(name);
  };

  Engine.prototype.onConnect = function(cb) {
    this.connectHandler = cb;
  };

  Engine.prototype.onDisconnect = function(cb) {
    this.disconnectHandler = cb;
  };

  Engine.prototype.getList = function() {
    return this.connection.getList();
  };

  Engine.prototype.connectToPeer = function(peerId) {
    console.log('attempting to connect to', peerId);
    this.setPlayer(2);
    return this.connection.connect(peerId).then(() => {
      return this.time.sync();
    }).then(ping => {
      this.setReadyStatus(ping);
      this.connection.send('ready', ping);
    }).catch(err => {
      this.status.setStatus('');
      this.setPlayer(1);
      throw err;
    });
  };

  Engine.prototype.setReadyStatus = function(ping) {
    this.status.setStatus(`Ready... ping ${ping}ms`);
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
    this.status.setStatus('Go!!!');
    this.reset();
    this.board.displayTiles(tiles);
  };

  Engine.prototype.startOffline = function() {
    this.offlineMode = true;
    this.start(this.board.generateTiles());
  };

  Engine.prototype.getClientId = function() {
    return this.connection.clientId;
  };

  Engine.prototype.getClientName = function() {
    return this.connection.clientName;
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
    if (this.me.endMove() && this.board.isGameOver()) {
      this.endGame();
      return;
    }
    delete this.pendingMoves[id];
    if (this.me.nextMove) {
      var key = this.me.nextMove;
      this.me.nextMove = null;
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

    this.status.setStatus(`ping ${this.time.now() - timestamp}ms`);

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

  Engine.prototype.handleConnect = function() {
    this.connectHandler && this.connectHandler();
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
      if (this.opponent.endMove() && this.board.isGameOver()) {
        this.endGame();
        return;
      }
    }, duration);

    this.connection.send('keydown_ack', `${id} 1 ${timestamp}`);
  };

  Engine.prototype.handleKeyForMe = function(key) {
    if (this.offlineMode) {
      this.handleKeyForOffline(key);
      return;
    }

    // Only process one move at a time.
    if (this.me.isMoving()) {
      this.me.nextMove = key;
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

  Engine.prototype.handleKeyForOffline = function(key) {
    var playerNumber = Player.whichPlayerKey(key);
    if (playerNumber !== 1 && playerNumber !== 2) {
      return;
    }

    var player = playerNumber === 1 ? this.player1 : this.player2;
    if (player.isMoving()) {
      player.nextMove = key;
      return;
    }

    var move = this.getMove(key);
    if (!move) {
      return;
    }

    if (!player.getMovePosition(move)) {
      return;
    }

    player.startMove(move);
    setTimeout(() => {
      if (player.endMove() && this.board.isGameOver()) {
        this.endGame();
        return;
      }
      if (player.nextMove) {
        var key = player.nextMove;
        player.nextMove = null;
        setTimeout(this.handleKeyForOffline.bind(this, key), 0);
      }
    }, Player.MoveDuration);
  };

  Engine.prototype.getMove = function(key) {
    return Player.KEY_MAP[key];
  };

  Engine.prototype.arePositionsConflicting = function() {
    return this.me.x === this.opponent.x && this.me.y === this.opponent.y;
  };

  Engine.prototype.endGame = function() {
    if (this.player1.points === this.player2.points) {
      this.status.setStatus('It\'s a tie');
    } else {
      var winner = this.player1.points > this.player2.points ?
                     this.player1 : this.player2;
      if (this.offlineMode) {
        this.status.setStatus(`Player ${winner.playerNumber} wins!`);
      } else {
        this.status.setStatus(`You ${winner === this.me ? 'win' : 'lose'}`);
      }
    }
    this.reset();
  };

  Engine.prototype.reset = function() {
    this.pendingMoves = {};
    this.board.reset();
    this.player1.reset();
    this.player2.reset();
  };

  return Engine;
})();
