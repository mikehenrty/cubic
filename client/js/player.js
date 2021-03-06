window.Player = (function() {
  'use strict';

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

    this.moving = false;
    this.moves = [];
    this.nextMove = null;
    this.reset();
  }

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

  /**
   * @returns (Promise): resolves when animation is complete.
   */
  Player.prototype.startMove = function(move, duration) {
    this.moving = true;
    this.moves.push(move);
    this.setMovePosition(move);
    return this.cube.startMoving(move, duration);
  };

  // Returns true if points were added on this move.
  Player.prototype.endMove = function(isRollback) {
    var move = this.moves.shift();
    this.cube.stopMoving(move);
    if (!isRollback) {
      this.cube.move(move);
    }

    return Utility.nextFrame().then(() => {
      this.moving = false;
      var x = this.cube.x;
      var y = this.cube.y;
      var cubeColor = this.cube.getScoreSideColor();
      var tileColor = this.board.getColor(x, y);
      if (cubeColor === tileColor) {
        this.board.pickUpTile(x, y);
        this.addPoint();
        this.scoreEl.classList.add('animate');
        this.scoreEl.addEventListener('animationend', function onend(evt) {
          var el = evt.target;
          el.removeEventListener('animationend', onend);
          el.classList.remove('animate');
        });

        return true;
      }
      return false;
    });
  };

  Player.prototype.isMoving = function() {
    return !!this.moving;
  };

  Player.prototype.addPoint = function() {
    ++this.points;
    this.scoreEl.textContent = this.points;
  };

  Player.prototype.getPosition = function() {
    return {
      x: this.cube.x,
      y: this.cube.y
    };
  };

  Player.prototype.setPosition = function(x, y) {
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

  Player.prototype.setMovePosition = function(move) {
    var pos = this.getMovePosition(move);
    if (!pos) {
      console.log('could not set move', move);
      return null;
    }

    this.setPosition(pos.x, pos.y);
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
