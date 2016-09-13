window.Board = (function() {
  'use strict';

  const STARTING_TILES = 13;

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
    for (var r = 0; r < this.rows; r++) {
      this.squares.push([]);
      for (var c = 0; c < this.cols; c++) {
        var square = document.createElement('div');
        square.className = 'square';
        this.squares[r].push(square);
        this.el.appendChild(square);
      }
    }
  };

  Board.prototype.reset = function() {
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        var square = this.squares[r][c];
        square.style.backgroundColor = '';
      }
    }
  };

  Board.prototype.generateTiles = function() {
    var tiles = [];
    for (var i = 0; i < STARTING_TILES; i++) {
      tiles.push([Utility.random(0, this.cols - 1),
                  Utility.random(0, this.rows - 1),
                  CONST.CUBE_COLORS[
                    Utility.random(0, CONST.CUBE_COLORS.length - 1)
                  ]]);
    }
    return tiles;
  };

  Board.prototype.displayTiles = function(tiles) {
    tiles.forEach(tile => {
      this.squares[tile[0]][tile[1]].style.backgroundColor = tile[2];
    });
  };

  return Board;
})();
