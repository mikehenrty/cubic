window.Engine = (function() {
  'use strict';

  const COLS = CONST.COLS;
  const ROWS = CONST.ROWS;

  const START_DELAY = 1000;

  function Engine(container) {
    this.clientId = null;
    this.clientName = null;

    this.container = container;
    this.el = document.createElement('div');
    this.status = new Status(this.el);
    this.el.id = 'screen';
    this.connection = new Connection();
    this.time = new TimeSync(this.connection);
    this.board = new Board(this, COLS, ROWS);
    this.player1 = new Player(1, this.board);
    this.player2 = new Player(2, this.board);
    this.setPlayer(1);
    this.pendingMoves = {};
    this.lastMove = null;
    this.offlineMode = false;
    this.time.init();
    this.status.init();
    this.board.init();
    this.hideBoard();
    this.player1.init();
    this.player2.init();

    this.forward('reject', this.connection);
    this.status.on('again', this.handleAgainButton.bind(this));
    this.connection.on('keydown', this.handleKeyForOpponent.bind(this));
    this.connection.on('keydown_ack', this.handleKeyAck.bind(this));
    this.connection.on('disconnect', this.handleDisconnect.bind(this));
    this.connection.on('readyPlayerOne', this.handleReadyPlayerOne.bind(this));
    this.connection.on('start', this.handleStart.bind(this));
    this.connection.on('peer', this.handlePeerConnection.bind(this));
    this.container.appendChild(this.el);

    document.addEventListener('keydown', evt => {
      this.handleKeyForMe(evt.key);
    });
  }

  Engine.prototype = new Eventer();

  Engine.prototype.hideBoard = function() {
    this.el.classList.add('hide');
  };

  Engine.prototype.showBoard = function() {
    this.el.classList.remove('hide');
  };

  Engine.prototype.setName = function(name) {
    return this.connection.setName(name);
  };

  Engine.prototype.getList = function() {
    return this.connection.getList();
  };

  Engine.prototype.register = function(name) {
    return this.connection.register(name).then(clientInfo => {
      this.clientId = clientInfo.clientId;
      this.clientName = clientInfo.clientName;
    });
  };

  Engine.prototype.connectToPeer = function(peerId) {
    this.setPlayer(2);
    this.connection.connectToPeer(peerId);
  };

  Engine.prototype.handlePeerConnection = function(peerId) {
    console.log('got peer connection', peerId);
    if (this.playerNumber === 1) {
      this.time.sync().then(ping => {
        this.setReadyStatus();
        this.connection.send('readyPlayerOne');
        // For fairness, delay triggering ready for half a ping.
        setTimeout(this.trigger.bind(this, 'ready'), ping / 2);
      }).catch(err => {
        this.status.setStatus('Could not sync time');
        this.setPlayer(1);
        throw err;
      });
    }
  };

  Engine.prototype.handleReadyPlayerOne = function() {
    this.setReadyStatus();
    this.trigger('ready');
    var tiles = this.board.generateTiles();
    var startTime = this.time.now() + START_DELAY;
    this.connection.send('start', `${startTime} ${JSON.stringify(tiles)}`);
    setTimeout(this.start.bind(this, tiles), START_DELAY);
  };

  Engine.prototype.setReadyStatus = function() {
    this.status.setStatus(`Ready...`);
  };

  Engine.prototype.handleStart = function(payload) {
    var startTime, tiles
    [startTime, tiles] = payload.split(' ');
    tiles = JSON.parse(tiles);
    setTimeout(this.start.bind(this, tiles), startTime - this.time.now());
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
    return this.clientId;
  };

  Engine.prototype.getClientName = function() {
    return this.clientName;
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

  Engine.prototype.handleKeyAck = function(payload) {
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

  Engine.prototype.handleDisconnect = function() {
    this.reset();
    this.trigger('disconnect');
  };

  Engine.prototype.handleKeyForOpponent = function(payload) {
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
      this.status.setGameOverStatus('It\'s a tie');
    } else {
      var winner = this.player1.points > this.player2.points ?
                     this.player1 : this.player2;
      if (this.offlineMode) {
        this.status.setGameOverStatus(`Player ${winner.playerNumber} wins!`);
      } else {
        this.status.setGameOverStatus(`You ${winner === this.me ?
          'win' : 'lose'}`);
      }
    }
    this.reset();
  };

  Engine.prototype.handleAgainButton = function() {
    if (this.offlineMode) {
      this.startOffline();
      return;
    }

    // TODO: online restart logic, wait for both to be ready
  };

  Engine.prototype.reset = function() {
    this.pendingMoves = {};
    this.board.reset();
    this.player1.reset();
    this.player2.reset();
  };

  return Engine;
})();
