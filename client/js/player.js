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

  function Player(playerNumber, board) {
    this.playerNumber = playerNumber;
    this.board = board;
    this.container = board.el;
    this.el = document.createElement('div');
    this.el.className = `piece player-${playerNumber}`;
    this.cube = new Cube(this.el);
    this.opponent = null;
    this.moves = [];
    this.points = 0;
    this.scoreEl = document.createElement('div');
    this.scoreEl.className = 'score';
    this.scoreEl.id = `player-${this.playerNumber}`;
    this.scoreEl.textContent = this.points;
  }

  Player.MoveDuration = MOVE_DURATION;

  Player.KEY_MAP = KEY_MAP;

  Player.prototype.init = function() {
    this.container.appendChild(this.el);
    this.container.appendChild(this.scoreEl);
    this.squareHeight = Utility.getPixelHeight('.square');
    this.reset();
  };

  Player.prototype.startMove = function(move, duration) {
    this.moves.push(move);
    this.el.classList.add('moving', move);
    this.setMovePosition(move, duration);
  };

  Player.prototype.endMove = function() {
    var move = this.moves.shift();
    this.el.classList.remove('moving', move);
    this.el.style.transitionDuration = '0ms';
    this.cube.move(move);
    if (this.cube.sides[CONST.CUBE_SIDES.TOP] ===
        this.board.getColor(this.x, this.y)) {
      this.board.pickUpTile(this.x, this.y)
      this.addPoint();
    }
  };

  Player.prototype.addPoint = function() {
    ++this.points;
    this.scoreEl.textContent = this.points;
  };

  Player.prototype.isMoving = function() {
    return this.moves.length > 0;
  };

  Player.prototype.update = function(duration) {
    duration = (typeof duration !== 'undefined' ? duration : MOVE_DURATION)
    this.el.style.transitionDuration = duration + 'ms';
    this.el.style.transform =
      'translateY(' + this.y * this.squareHeight + 'px) ' +
      'translateX(' + this.x * this.squareHeight + 'px)';
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
    this.update(duration);
  };

  Player.prototype.getMovePosition = function(move) {
    var x = this.x;
    var y = this.y;
    var topColor;

    switch (move) {
      case 'moveUp':
        topColor = this.cube.sides[CUBE_SIDES.SOUTH];
        --y;
        if (y < 0) {
          return false;
        }
        break;
      case 'moveDown':
        topColor = this.cube.sides[CUBE_SIDES.NORTH];
        ++y;
        if (y >= this.board.cols) {
          return false;
        }
        break;
      case 'moveLeft':
        topColor = this.cube.sides[CUBE_SIDES.EAST];
        --x;
        if (x < 0) {
          return false;
        }
        break;
      case 'moveRight':
        topColor = this.cube.sides[CUBE_SIDES.WEST];
        ++x;
        if (x >= this.board.rows) {
          return false;
        }
        break;
      default:
        console.log('unrecognized move', move);
        break;
    }

    if (x === this.opponent.x && y === this.opponent.y) {
      return false;
    }

    var color = this.board.getColor(x, y);
    if (color && color !== topColor) {
      return false;
    }

    return { x: x, y: y };
  };

  Player.prototype.setMovePosition = function(move, duration) {
    var position = this.getMovePosition(move);
    if (!position) {
      return false;
    }
    this.setPosition(position.x, position.y, duration);
  };

  Player.prototype.reset = function() {
    if (this.playerNumber === 1) {
      this.x = 0;
      this.y = 0;
    } else {
      this.x = this.board.rows - 1;
      this.y = this.board.cols - 1;
    }
    this.points = 0;
    this.cube.reset();
    this.update();
  };

  return Player;
})();
