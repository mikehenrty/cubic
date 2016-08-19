window.Engine = (function() {
  'use strict';

  const COLS = 10;
  const ROWS = 10;

  function Engine(container) {
    this.container = container;
    this.el = document.createElement('div');
    this.el.id = 'screen';
    this.board = new Board(this, COLS, ROWS);
    this.player = new Player(this.board);
  }

  Engine.prototype.init = function() {
    this.container.appendChild(this.el);
    this.board.init();
    this.player.init();
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  };

  Engine.prototype.handleKeydown = function(evt) {
    switch (evt.key) {
      case 'a':
        this.player.moveLeft();
        break;

      case 'w':
        this.player.moveUp();
        break;

      case 'd':
        this.player.moveRight();
        break;

      case 's':
        this.player.moveDown();
        break;
    }
  };

  return Engine;
})();
