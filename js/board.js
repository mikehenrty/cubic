window.Board = (function() {
  'use strict';

  function Board(container) {
    this.container = container;
    this.board = null;
    this.squares = [];
  }

  Board.prototype.init = function() {
    this.board = document.createElement('div');
    this.board.id = 'board';
    this.container.appendChild(this.board);

    for (var i = 0; i < 100; i++) {
      var square = document.createElement('div');
      square.className = 'square';
      this.board.appendChild(square);
      this.squares.push(square);
    }
  };

  return Board;
})();
