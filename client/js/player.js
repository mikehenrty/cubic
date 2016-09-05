window.Player = (function() {
  'use strict';

  // miliseconds of piece movement.
  const MOVE_DURATION = 1000;

  function Player(playerNumber, board) {
    this.playerNumber = playerNumber;
    this.board = board;
    this.container = board.el;
    this.el = document.createElement('div');
    this.el.className = `piece player-${playerNumber}`;
    this.cube = new Cube(this.el);
    this.direction = null;
  }

  Player.MoveDuration = MOVE_DURATION;

  Player.prototype.init = function() {
    this.container.appendChild(this.el);
    this.squareHeight = Utility.getPixelHeight('.square');
    this.reset();
  };

  Player.prototype.startMove = function(direction) {
    this.el.classList.add('moving', direction);
    this.direction = direction;
  };

  Player.prototype.endMove = function() {
    this.el.classList.remove('moving', this.direction);
    this.el.style.transitionDuration = '0ms';
    this.cube[this.direction]();
    this.direction = null;
  };

  Player.prototype.isMoving = function() {
    return !!this.direction;
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

  Player.prototype.moveUp = function(duration) {
    if (this.y > 0) {
      --this.y;
      this.update(duration);
    }
  };

  Player.prototype.moveDown = function(duration) {
    if (this.y + 1 < this.board.cols) {
      ++this.y;
      this.update(duration);
    }
  };

  Player.prototype.moveLeft = function(duration) {
    if (this.x > 0) {
      --this.x;
      this.update(duration);
    }
  };

  Player.prototype.moveRight = function(duration) {
    if (this.x + 1 < this.board.rows) {
      ++this.x;
      this.update(duration);
    }
  };

  Player.prototype.reset = function() {
    if (this.playerNumber === 1) {
      this.x = 0;
      this.y = 0;
    } else {
      this.x = this.board.rows - 1;
      this.y = this.board.cols - 1;
    }
    this.update();
  };

  return Player;
})();
