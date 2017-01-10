window.GameEngine = (function() {
  'use strict';

  const DEBUG = CONST.DEBUG;

  const COLS = CONST.COLS;
  const ROWS = CONST.ROWS;

  const SND_INTRO_BG = 'bg-pump';
  const SND_MAIN_BG = 'bg-mellow';
  const SND_SCORE = 'ef-beat';
  const SND_WIN = 'ef-powerup';
  const SOUND_FILES = {
    [SND_INTRO_BG]: CONST.SOUND_FILES[SND_INTRO_BG],
    [SND_SCORE]: CONST.SOUND_FILES[SND_SCORE],
    [SND_MAIN_BG]: CONST.SOUND_FILES[SND_MAIN_BG],
    [SND_WIN]: CONST.SOUND_FILES[SND_WIN],
  };

  function GameEngine(container, connection, time) {
    this.connection = connection;
    this.time = time;
    this.board = new Board(container, COLS, ROWS);
    this.player1 = new Player(1, this.board);
    this.player2 = new Player(2, this.board);
    this.sound = new Sound();
    this.pendingMoves = {};
    this.lastMoveInfo = null;
    this.offlineMode = null;
    this.startTime = null;
    this.setPlayer(1);

    this.connection.on('keydown', this.handleKeyForOpponent.bind(this));
    this.connection.on('keydown_ack', this.handleKeyAck.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  GameEngine.prototype = new Eventer();

  GameEngine.prototype.loadSounds = function() {
    return Promise.all(Object.keys(SOUND_FILES).map(name => {
      return this.sound.loadSound(name, SOUND_FILES[name]);
    }));
  };

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
    this.startTime = this.time.now();
    this.board.displayTiles(tiles);
    this.startMainMusic();
  };

  GameEngine.prototype.reset = function() {
    this.startTime = null;
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

    player.startMove(move).then(() => {
      return this.endMoveForPlayer(player);
    }).then(() => {

      if (player.nextMove) {
        var key = player.nextMove;
        player.nextMove = null;
        this.handleKeyForOffline.bind(this, key);
      }
    });
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
    this.lastMoveInfo = {
      id: id,
      timestamp: now,
      position: this.me.getPosition(),
      acked: false,
      animated: false,
    };

    this.addPendingMove(id, this.lastMoveInfo);

    this.connection.send('keydown', `${id} ${key} ${now}`);
    this.me.startMove(move, Player.MoveDuration).then(() => {
      var moveInfo = this.getPendingMove(id);
      if (!moveInfo) {
        console.log('timeout, pending move not found');
        return;
      }

      moveInfo.animated = true;
      this.checkPendingMove(id);
    });
  };

  GameEngine.prototype.addPendingMove = function(id, moveInfo) {
    this.pendingMoves[id] = moveInfo;
    if (DEBUG) {
      this.logPendingMove(id, 'adding');
    }
  };

  GameEngine.prototype.getPendingMove = function(id) {
    return this.pendingMoves[id];
  };

  GameEngine.prototype.checkPendingMove = function(id) {
    if (DEBUG) {
      this.logPendingMove(id, 'checking');
    }
    var moveInfo = this.getPendingMove(id);
    if (moveInfo.acked && moveInfo.animated) {
      this.finishPendingMove(id);
    }
  };

  GameEngine.prototype.finishPendingMove = function(id) {
    this.endMoveForPlayer(this.me).then(() => {

      if (DEBUG) {
        this.logPendingMove(id, '--------------finishing-delete');
      }

      delete this.pendingMoves[id];
      if (this.me.nextMove) {
        var key = this.me.nextMove;
        this.me.nextMove = null;
        this.handleKeyForMe(key);
      }
    });
  };

  GameEngine.prototype.rollbackPendingMove = function(id) {
    var moveInfo = this.getPendingMove(id);
    var move = this.pendingMoves[id];
    console.log('rolling back move', move);
    this.me.setPosition(move.position.x, move.position.y);
    if (DEBUG) {
      this.logPendingMove(id, '--------------finishing-rollingback');
    }
    delete this.pendingMoves[id];
    this.endMoveForPlayer(this.me, true);
  };

  GameEngine.prototype.logPendingMove = function(id, message) {
    var info = this.getPendingMove(id);
    if (!info) {
      console.log('could not find move to log', id, message);
      return;
    }

    var elapsed = this.time.now() - info.timestamp;
    console.log(id.substr(0, 6), elapsed, message && message.toUpperCase(),
      `acked=${info.acked}, animated=${info.animated}`);
  };

  GameEngine.prototype.ackOpponentMove = function(accepted, id, timestamp) {
    accepted = accepted ? 1 : 0; // Convert to int.
    this.connection.send('keydown_ack', `${id} ${accepted} ${timestamp}`);
  };

  GameEngine.prototype.handleKeyForOpponent = function(payload) {
    var key, id, timestamp;
    [id, key, timestamp] = payload.split(' ');

    if (DEBUG) {
      console.log('handling opponent key', id, key);
    }

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
      if (!this.me.isMoving() || timestamp > this.lastMoveInfo.timestamp) {
        // We moved first, tell peer to rollback.
        this.ackOpponentMove(false, id, timestamp);
        return;
      }

      // Here we rollback our pending move, but ack peer's.
      this.rollbackPendingMove(this.lastMoveInfo.id);
    }

    // If we got here, we can ack the move and run it locally.
    this.ackOpponentMove(true, id, timestamp);
    this.opponent.startMove(move, duration).then(() => {
      return this.endMoveForPlayer(this.opponent);
    });
  };

  GameEngine.prototype.endMoveForPlayer = function(player, isRollback) {
    return player.endMove(isRollback).then(scored => {
      if (isRollback || !scored) {
        return null;
      }

      if (scored) {
        this.sound.play(SND_SCORE);

        if (this.board.isGameOver()) {
          this.endGame();
        }
      }
    });
  };

  GameEngine.prototype.handleKeyAck = function(payload) {
    var id, result, timestamp;
    [id, result, timestamp] = payload.split(' ');

    this.trigger('ping', this.time.now() - timestamp);

    var moveInfo = this.getPendingMove(id);
    if (!moveInfo) {
      console.log('pending move not found', id);
      return;
    }

    if (result !== '1') {
      this.rollbackPendingMove(id);
      return;
    }

    // Move must be both acked and animated before completion.
    moveInfo.acked = true;
    this.checkPendingMove(id);
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
    this.sound.play(SND_WIN);
    this.trigger('gameover', winner);
  };

  GameEngine.prototype.startIntroMusic = function() {
    this.sound.playBackground(SND_INTRO_BG);

    // TODO(polish): make ths bg layered effect work on chrome.
    // this.sound.playBackground(SND_INTRO_BG, {
    //   delay: 11.3,
    //   double: true,
    //   volume: 0.01,
    // });
  };

  GameEngine.prototype.startMainMusic = function() {
    this.sound.playBackground(SND_MAIN_BG);
  };

  return GameEngine;
})();
