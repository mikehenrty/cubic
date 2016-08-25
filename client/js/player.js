window.Player = (function() {
  'use strict';

  function Player(playerNumber, board) {
    this.playerNumber = playerNumber;
    this.board = board;
    this.container = board.el;
    this.el = document.createElement('div');
    this.el.className = `piece player-${playerNumber}`;
  }

  Player.prototype.init = function() {
    this.container.appendChild(this.el);
    this.squareHeight = Utility.getPixelHeight('.square');
    this.reset();
  };

  Player.prototype.update = function() {
    this.el.style.transform =
      'translateY(' + this.y * this.squareHeight + 'px) ' +
      'translateX(' + this.x * this.squareHeight + 'px)';
  };

  Player.prototype.moveUp = function() {
    if (this.y > 0) {
      --this.y;
      this.update();
    }
  };

  Player.prototype.moveDown = function() {
    if (this.y + 1 < this.board.cols) {
      ++this.y;
      this.update();
    }
  };

  Player.prototype.moveLeft = function() {
    if (this.x > 0) {
      --this.x;
      this.update();
    }
  };

  Player.prototype.moveRight = function() {
    if (this.x + 1 < this.board.rows) {
      ++this.x;
      this.update();
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
