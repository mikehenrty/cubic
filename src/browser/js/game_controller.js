window.GameController = (function() {
  'use strict';

  const DEBUG = CONST.DEBUG;

  const START_DELAY = 1000;

  const STATUS_PLAYING = 'playing';
  const STATUS_WAITING = 'waiting';

  function GameController(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'screen';
    this.el.className = 'hide';
    this.container.appendChild(this.el);

    this.clientId = null;
    this.clientName = null;
    this.peerId = null;
    this.gameId = null;
    this.gameReport = {};
    this.peerGameReport = {};
    this.readyAgain = false;
    this.peerReadyAgain = false;

    this.connection = new Connection();
    this.time = new TimeSync(this.connection);
    this.engine = new GameEngine(this.el, this.connection, this.time);
    this.engine.setPlayer(1);
    this.status = new Status(this.el);

    this.forward('ask', this.connection);
    this.forward('disconnect', this.connection);
    this.forward('list_update', this.connection);

    this.connection.on('again', this.handleAgainPeer.bind(this));
    this.connection.on('readyPlayerOne', this.handleReadyPlayerOne.bind(this));
    this.connection.on('start', this.handleStart.bind(this));
    this.connection.on('peer', this.handlePeerConnection.bind(this));
    this.connection.on('report', this.handleGameReport.bind(this));
    this.engine.on('gameover', this.displayGameOverStatus.bind(this));
    this.engine.on('ping', this.displayPing.bind(this));
    this.hideBoard();
  }

  GameController.STATUS_PLAYING = STATUS_PLAYING;
  GameController.STATUS_WAITING = STATUS_WAITING;

  GameController.prototype = new Eventer();

  GameController.prototype.loadAssets = function() {
    return this.engine.loadSounds();
  };


  GameController.prototype.hideBoard = function() {
    this.el.classList.add('hide');
  };

  GameController.prototype.showBoard = function() {
    this.el.classList.remove('hide');
  };

  GameController.prototype.isBoardShowing = function() {
    return !this.el.classList.contains('hide');
  };

  GameController.prototype.setName = function(name) {
    return this.connection.setName(name).then(name => {
      this.clientName = name;
    });
  };

  GameController.prototype.getList = function() {
    return this.connection.getList();
  };

  GameController.prototype.register = function(id) {
    return this.connection.register(id).then(clientInfo => {
      console.log('registered', clientInfo);
      this.clientId = clientInfo.clientId;
      this.clientName = clientInfo.clientName;
      this.socketId = clientInfo.socketId;
    });
  };

  GameController.prototype.askToConnect = function(peerId) {
    this.connection.askToConnect(peerId).then(() => {
      this.peerId = peerId;
      this.trigger('confirm', peerId);
    }).catch(err => {
      console.log('unable to connect', err, peerId);
      this.trigger('reject', peerId);
    });
  };

  GameController.prototype.allowPeer = function(peerId) {
    this.peerId = peerId;
    this.connection.allowPeer(peerId);
  };

  GameController.prototype.rejectPeer = function(peerId) {
    this.connection.rejectPeer(peerId);
  };

  GameController.prototype.connectToPeer = function(peerId) {
    this.engine.setPlayer(2);
    this.connection.connectToPeer(peerId);
  };

  GameController.prototype.handlePeerConnection = function(peerId) {
    // Only player 1 needs to sync timestamps.
    if (this.engine.playerNumber === 1) {
      this.time.sync().then(ping => {
        this.engine.setMoveDuration(ping);
        this.setReadyStatus();
        this.connection.send('readyPlayerOne', ping);
        // For fairness, delay triggering ready for half a ping.
        setTimeout(this.trigger.bind(this, 'ready'), ping / 2);
      }).catch(err => {
        this.status.setStatus('Could not sync time');
        this.engine.setPlayer(1);
        throw err;
      });
    }
  };

  GameController.prototype.handleReadyPlayerOne = function(ping) {
    this.gameId = Utility.guid();
    // If ping was not passed, keep current setting.
    if (ping) {
      this.engine.setMoveDuration(ping);
    }
    this.setReadyStatus();
    this.trigger('ready');
    var tiles = this.engine.generateTiles();
    var startTime = this.time.now() + START_DELAY;
    var msg = `${startTime} ${JSON.stringify(tiles)} ${this.gameId}`;
    this.connection.send('start', msg);
    setTimeout(this.startOnline.bind(this, tiles), START_DELAY);
  };

  GameController.prototype.setReadyStatus = function() {
    this.status.setStatus(`Ready...`);
  };

  GameController.prototype.handleStart = function(payload) {
    var startTime, tiles, gameId;
    [startTime, tiles, gameId] = payload.split(' ');
    this.gameId = gameId;
    tiles = JSON.parse(tiles);
    setTimeout(this.startOnline.bind(this, tiles), startTime - this.time.now());
  };

  GameController.prototype.prepareGame = function() {
    this.readyAgain = false;
    this.peerReadyAgain = false;
    this.status.setStatus('Go!!!');
    this.connection.setClientStatus(STATUS_PLAYING);
  };

  GameController.prototype.teardownGame = function() {
    this.engine.setPlayer(1);
    this.reset();
    this.connection.setClientStatus(STATUS_WAITING);
  };

  GameController.prototype.startOnline = function(tiles) {
    this.prepareGame();
    this.engine.startGame(tiles);
  };

  GameController.prototype.startOffline = function() {
    this.prepareGame();
    this.engine.startOffline();
  };

  GameController.prototype.attemptToStartAgain = function() {
    if (this.engine.playerNumber === 1 &&
        this.readyAgain && this.peerReadyAgain) {
      this.connection.send('readyPlayerOne');
    }
  };

  GameController.prototype.playAgain = function() {
    if (this.engine.offlineMode) {
      this.startOffline();
      return;
    }

    if (this.engine.playerNumber === 1) {
      this.readyAgain = true;
      this.attemptToStartAgain();
    } else {
      this.connection.send('again');
    }
  };

  GameController.prototype.getClientId = function() {
    return this.clientId;
  };

  GameController.prototype.getClientName = function() {
    return this.clientName;
  };

  GameController.prototype.getSocketId = function() {
    return this.socketId;
  };

  GameController.prototype.displayGameOverStatus = function(winner) {
    var status = '';
    this.status.setBottomStatus('');
    if (winner === 0) {
      status = 'It\'s a tie';
    } else {
      if (this.engine.offlineMode) {
        status = `Player ${winner} wins!`;
      } else {
        status = `You ${winner === this.engine.playerNumber ? 'win' : 'lose'}`;
      }
    }
    this.status.setGameOverStatus(status);
    this.sendGameReport();
    this.trigger('gameover', status);
  };

  GameController.prototype.displayPing = function(ping) {
    this.status.setBottomStatus(`(${ping}ms)`);
  };

  GameController.prototype.handleAgainPeer = function() {
    this.peerReadyAgain = true;
    this.attemptToStartAgain();
  };

  GameController.prototype.sendGameReport = function() {
    var playerOne, playerTwo;

    if (this.engine.playerNumber === 1) {
      playerOne = this.clientId;
      playerTwo = this.peerId;
    } else {
      playerOne = this.peerId;
      playerTwo = this.clientId;
    }

    this.gameReport = {
      gameId: this.gameId,
      playerOne,
      playerTwo,
      playerNumber: this.engine.playerNumber,
      moves: this.engine.moves.length,
      log: this.engine.moves,
    };

    if (DEBUG) {
      console.log('reporting game', this.gameReport.gameId);
    }

    if (this.peerGameReport.gameId === this.gameReport.gameId) {
      this.compareReports(this.gameReport, this.peerGameReport);
    }

    this.connection.sendReport(this.gameReport);
  };

  GameController.prototype.handleGameReport = function(report) {
    try {
      this.peerGameReport = JSON.parse(report);
    } catch (err) {
      console.error('unable to parse game report', err);
      this.peerGameReport = {};
    }

    if (this.peerGameReport.gameId === this.gameReport.gameId) {
      this.compareReports(this.gameReport, this.peerGameReport);
    }
  };

  GameController.prototype.compareReports = function(reportOne, reportTwo) {
    var matching = reportOne.log.every((itemOne, index) => {
      var itemTwo = reportTwo.log[index];
      return Object.keys(itemOne).every(key => {
        return itemOne[key] === itemTwo[key];
      });
    });

    if (DEBUG) {
      console.log('reports compares, matching?', matching);
    }

    if (!matching) {
      console.error('unmatching game reports', reportOne.log, reportTwo.log);
    }
  };

  GameController.prototype.reset = function() {
    this.engine.reset();
    this.connection.reset();
  };

  return GameController;
})();
