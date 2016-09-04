window.Player = (function() {
  'use strict';

  // miliseconds of piece movement.
  const MOVE_DURATION = 250;

  function Player(playerNumber, board) {
    this.playerNumber = playerNumber;
    this.board = board;
    this.container = board.el;
    this.el = document.createElement('div');
    this.el.className = `piece player-${playerNumber}`;
  }

  Player.MoveDuration = MOVE_DURATION;

  Player.prototype.init = function() {
    this.container.appendChild(this.el);
    this.squareHeight = Utility.getPixelHeight('.square');
    this.reset();
  };

  Player.prototype.update = function(duration) {
    this.el.style.transitionDuration = (duration || MOVE_DURATION) + 'ms';
    this.el.style.transform =
      'translateY(' + this.y * this.squareHeight + 'px) ' +
      'translateX(' + this.x * this.squareHeight + 'px)';
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
