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
    this.el = document.createElement('div');
    this.el.className = `piece player-${playerNumber}`;
    this.cube = new Cube(this.el);
    this.opponent = null;
    this.scoreEl = document.createElement('div');
    this.scoreEl.className = 'score';
    this.scoreEl.id = `player-${this.playerNumber}`;
    this.moves = [];
    this.nextMove = null;
    this.squareHeight = Utility.getCssVar('--square-dimension');
    this.reset();

    this.container.appendChild(this.el);
    this.container.appendChild(this.scoreEl);
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

  Player.prototype.init = function() {
  };

  Player.prototype.startMove = function(move, duration) {
    this.moves.push(move);
    this.el.classList.add('moving', move);
    var position = this.getMovePosition(move);
    this.setPosition(position.x, position.y);
    this.setMoveDuration(duration);
  };

  // Returns true if points were added on this move.
  Player.prototype.endMove = function(isRollback) {
    var move = this.moves.shift();
    this.el.classList.remove('moving', move);
    this.el.style.transitionDuration = '0ms';
    if (isRollback) {
      return false;
    }

    this.cube.move(move);
    this.update();

    // TODO: move this logic into engine
    if (this.cube.sides[CONST.CUBE_SIDES.BOTTOM] ===
        this.board.getColor(this.x, this.y)) {
      this.board.pickUpTile(this.x, this.y)
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

  Player.prototype.update = function() {
    this.el.style.top =`calc(${this.y} * ${this.squareHeight})`;
    this.el.style.left = `calc(${this.x} * ${this.squareHeight})`;
    // this.el.style.transform =
    //  `translateY(calc(${this.y} * ${this.squareHeight}))` +
    //  `translateX(calc(${this.x} * ${this.squareHeight}))`;
  };

  Player.prototype.getPosition = function() {
    return {
      x: this.x,
      y: this.y
    };
  };

  Player.prototype.setPosition = function(x, y, duration) {
    this.x = x;
    this.y = y;
  };

  Player.prototype.setMoveDuration = function(duration) {
    duration = (typeof duration !== 'undefined' ? duration : MOVE_DURATION)
    this.el.style.transitionDuration = duration + 'ms';
  };

  Player.prototype.getMovePosition = function(move) {
    var x = this.x;
    var y = this.y;
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


    // TODO: player should not need to know anything about opponent.
    // Move this logic into game engine.
    if (x === this.opponent.x && y === this.opponent.y) {
      return false;
    }

    var color = this.board.getColor(x, y);
    if (color && color !== bottomColor) {
      return false;
    }

    return { x: x, y: y };
  };

  Player.prototype.reset = function() {
    if (this.playerNumber === 1) {
      this.x = 0;
      this.y = 0;
    } else {
      this.x = this.board.rows - 1;
      this.y = this.board.cols - 1;
    }
    this.moves = [];
    this.points = 0;
    this.scoreEl.textContent = this.points;
    this.cube.reset();
    this.el.classList.remove('moving');
    this.update();
  };

  return Player;
})();
