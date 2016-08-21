window.Board = (function() {
  'use strict';

  function Board(engine, cols, rows) {
    this.engine = engine;
    this.container = engine.el;
    this.cols = cols;
    this.rows = rows;
    this.el = document.createElement('div');
    this.el.id = 'board';
    this.squares = [];
  }

  Board.prototype.init = function() {
    this.container.appendChild(this.el);

    // Add sqaures to the board.
    for (var c = 0; c < this.cols; c++) {
      for (var r = 0; r < this.rows; r++) {
        var square = document.createElement('div');
        square.className = 'square';
        this.squares.push(square);
        this.el.appendChild(square);
      }
    }
  };

  return Board;
})();
