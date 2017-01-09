window.Player = (function() {
  'use strict';

  const MOVE_DURATION = CONST.MOVE_DURATION;

  const CUBE_SIDES = CONST.CUBE_SIDES;

  const KEY_MAP = {
    'a': 'moveLeft',
    'w': 'moveUp',
    'd': 'moveRight',
    's': 'moveDown',
    'ArrowLeft': 'moveLeft',
    'ArrowUp': 'moveUp',
    'ArrowRight': 'moveRight',
    'ArrowDown': 'moveDown'
  };

  const PLAYER_1_KEYS = [
    'a', 'w', 'd', 's'
  ];

  const PLAYER_2_KEYS = [
    'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'
  ];

  function Player(playerNumber, board) {
    this.playerNumber = playerNumber;
    this.board = board;
    this.container = board.el;
    this.cube = new Cube(this.container, this.playerNumber);

    this.scoreEl = document.createElement('div');
    this.scoreEl.className = 'score';
    this.scoreEl.id = `player-${this.playerNumber}`;
    this.container.appendChild(this.scoreEl);

    this.moves = [];
    this.nextMove = null;
    this.reset();
  }

  Player.MoveDuration = MOVE_DURATION;

  Player.KEY_MAP = KEY_MAP;

  Player.whichPlayerKey = function(key) {
    if (PLAYER_1_KEYS.indexOf(key) !== -1) {
      return 1;
    } else if (PLAYER_2_KEYS.indexOf(key) !== -1) {
      return 2;
    } else {
      return 0;
    }
  };

  Player.prototype.startMove = function(move, duration) {
    this.moves.push(move);
    this.cube.setMoving(move);

    var position = this.getMovePosition(move);
    this.setPosition(position.x, position.y);
    this.cube.setMoveDuration(duration);
  };

  // Returns true if points were added on this move.
  Player.prototype.endMove = function(isRollback) {
    var move = this.moves.shift();
    this.cube.setNotMoving(move);
    if (isRollback) {
      return false;
    }

    this.cube.move(move);

    // TODO: move this logic into engine
    if (this.cube.sides[CONST.CUBE_SIDES.BOTTOM] ===
        this.board.getColor(this.cube.x, this.cube.y)) {
      this.board.pickUpTile(this.cube.x, this.cube.y)
      this.addPoint();
      return true;
    }
    return false;
  };

  Player.prototype.addPoint = function() {
    ++this.points;
    this.scoreEl.textContent = this.points;
  };

  Player.prototype.isMoving = function() {
    return this.moves.length > 0;
  };

  Player.prototype.getPosition = function() {
    return {
      x: this.cube.x,
      y: this.cube.y
    };
  };

  Player.prototype.setPosition = function(x, y, duration) {
    this.cube.x = x;
    this.cube.y = y;
  };

  Player.prototype.getMovePosition = function(move) {
    var x = this.cube.x;
    var y = this.cube.y;
    var bottomColor;

    switch (move) {
      case 'moveUp':
        bottomColor = this.cube.sides[CUBE_SIDES.NORTH];
        --y;
        if (y < 0) {
          return false;
        }
        break;
      case 'moveDown':
        bottomColor = this.cube.sides[CUBE_SIDES.SOUTH];
        ++y;
        if (y >= this.board.cols) {
          return false;
        }
        break;
      case 'moveLeft':
        bottomColor = this.cube.sides[CUBE_SIDES.WEST];
        --x;
        if (x < 0) {
          return false;
        }
        break;
      case 'moveRight':
        bottomColor = this.cube.sides[CUBE_SIDES.EAST];
        ++x;
        if (x >= this.board.rows) {
          return false;
        }
        break;
      default:
        console.log('unrecognized move', move);
        break;
    }

    var color = this.board.getColor(x, y);
    if (color && color !== bottomColor) {
      return false;
    }

    return { x: x, y: y };
  };

  Player.prototype.reset = function() {
    var x, y;
    if (this.playerNumber === 1) {
      x = 0;
      y = 0;
    } else {
      x = this.board.rows - 1;
      y = this.board.cols - 1;
    }
    this.moves = [];
    this.points = 0;
    this.scoreEl.textContent = this.points;
    this.cube.reset(x, y);
  };

  return Player;
})();
