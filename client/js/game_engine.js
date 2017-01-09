window.GameEngine = (function() {
  'use strict';

  const COLS = CONST.COLS;
  const ROWS = CONST.ROWS;

  function GameEngine(container, connection, time) {
    this.connection = connection;
    this.time = time;
    this.board = new Board(container, COLS, ROWS);
    this.player1 = new Player(1, this.board);
    this.player2 = new Player(2, this.board);
    this.pendingMoves = {};
    this.lastMove = null;
    this.offlineMode = null;
    this.setPlayer(1);

    this.connection.on('keydown', this.handleKeyForOpponent.bind(this));
    this.connection.on('keydown_ack', this.handleKeyAck.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  GameEngine.prototype = new Eventer();

  GameEngine.prototype.setPlayer = function(playerNumber) {
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

  GameEngine.prototype.generateTiles = function() {
    return this.board.generateTiles();
  };

  GameEngine.prototype.startOffline = function() {
    this.offlineMode = true;
    this.startGame(this.board.generateTiles());
  };

  GameEngine.prototype.startGame = function(tiles) {
    this.reset();
    this.board.displayTiles(tiles);
  };

  GameEngine.prototype.reset = function() {
    this.pendingMoves = {};
    this.board.reset();
    this.player1.reset();
    this.player2.reset();
  };

  GameEngine.prototype.handleKeydown = function(evt) {
    if (!this.offlineMode) {
      this.handleKeyForMe(evt.key);
    } else {
      this.handleKeyForOffline(evt.key);
    }
  };

  GameEngine.prototype.handleKeyForOffline = function(key) {
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

    var newPosition = player.getMovePosition(move);
    if (!newPosition) {
      return;
    }

    var opponenet = playerNumber === 1 ? this.player2 : this.player1;
    if (this.arePositionsConflicting(newPosition, opponenet.getPosition())) {
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

  GameEngine.prototype.handleKeyForMe = function(key) {
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

    if (this.arePositionsConflicting(position, this.opponent.getPosition())) {
      return false;
    }

    var now = this.time.now();
    var id = Utility.guid();
    this.addPendingMove(id, this.me.getPosition(), now);
    this.connection.send('keydown', `${id} ${key} ${now}`);
    this.me.startMove(move);
  };

  GameEngine.prototype.ackOpponentMove = function(accepted, id, timestamp) {
    accepted = accepted ? 1 : 0; // Convert to int.
    this.connection.send('keydown_ack', `${id} ${accepted} ${timestamp}`);
  };

  GameEngine.prototype.handleKeyForOpponent = function(payload) {
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

    // TODO(polish): check if this move happened before my last move.
    //   If nothing happened in the meantime, gracefully allow this move.
    //   see: https://github.com/mikehenrty/cubic/issues/10
    if (duration < 0) {
      console.log('not enough time for opponent move', duration);
      this.ackOpponentMove(false, id, timestamp);
      return;
    }

    // Make sure move requested by opponenet is valid.
    var oppPosition = this.opponent.getMovePosition(move);
    if (!oppPosition) {
      console.log('opponent request invalid move', move);
      this.ackOpponentMove(false, id, timestamp);
      return;
    }

    // Check for move conflict.
    if (this.arePositionsConflicting(oppPosition, this.me.getPosition())) {
      // Move causes conflict, figure out who gets the contested sqaure.
      if (!this.me.isMoving() || timestamp > this.lastMove.timestamp) {
        console.log('move caused conflict', timestamp, this.lastMove);
        // We moved first, tell peer to rollback.
        this.ackOpponentMove(false, id, timestamp);
        return;
      }

      // Here we rollback our pending move, but ack peer's.
      console.log('peer moved first', timestamp, this.lastMove);
      this.rollbackPendingMove(this.lastMove.id);
    }

    // If we got here, we can ack the opponents move successfully.
    this.ackOpponentMove(true, id, timestamp);

    this.opponent.startMove(move, duration);
    setTimeout(() => {
      if (this.opponent.endMove() && this.board.isGameOver()) {
        this.endGame();
        return;
      }
    }, duration);
  };

  GameEngine.prototype.handleKeyAck = function(payload) {
    var id, result, timestamp;
    [id, result, timestamp] = payload.split(' ');

    this.trigger('ping', this.time.now() - timestamp);

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

  GameEngine.prototype.addPendingMove = function(id, position, timestamp) {
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

  GameEngine.prototype.finishPendingMove = function(id) {
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

  GameEngine.prototype.rollbackPendingMove = function(id) {
    var move = this.pendingMoves[id];
    this.rollbackMoveForPlayer(this.me, move.position);
    delete this.pendingMoves[id];
  };

  GameEngine.prototype.rollbackMoveForPlayer = function(player, position) {
    player.setPosition(position.x, position.y);
    player.endMove(true);
  };

  GameEngine.prototype.getMove = function(key) {
    return Player.KEY_MAP[key];
  };

  GameEngine.prototype.arePositionsConflicting = function(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  };

  GameEngine.prototype.endGame = function() {
    var winner;
    if (this.player1.points === this.player2.points) {
      winner = 0; // Tie.
    } else if (this.player1.points > this.player2.points) {
      winner = 1;
    } else {
      winner = 2;
    }
    this.trigger('gameover', winner);
  };

  return GameEngine;
})();
