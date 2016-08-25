window.Engine = (function() {
  'use strict';

  const COLS = 10;
  const ROWS = 10;

  function Engine(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'screen';
    this.board = new Board(this, COLS, ROWS);
    this.player1 = new Player(1, this.board);
    this.player2 = new Player(2, this.board);
    this.me = this.player1; // use player1 as default, but this could change.
    this.opponent = null;
  }

  Engine.prototype.init = function() {
    this.container.appendChild(this.el);
    this.board.init();
    this.player1.init();
    this.player2.init();
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  };

  Engine.prototype.setPlayer = function(playerNumber) {
    this.me = playerNumber === 1 ? this.player1 : this.player2;
  }


  Engine.prototype.handleKeydown = function(evt) {
    switch (evt.key) {
      case 'a':
        this.me.moveLeft();
        break;

      case 'w':
        this.me.moveUp();
        break;

      case 'd':
        this.me.moveRight();
        break;

      case 's':
        this.me.moveDown();
        break;
    }
  };

  Engine.prototype.reset = function() {
    this.player1.reset();
    this.player2.reset();
  };

  return Engine;
})();
