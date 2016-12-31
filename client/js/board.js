window.Board = (function() {
  'use strict';

  const STARTING_TILES = CONST.STARTING_TILES;

  function Board(container, cols, rows) {
    this.container = container;
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
      for (var c = 0; c < this.cols; c++) {
        this.squares[c] || this.squares.push([]);
        var square = document.createElement('span');
        this.squares[c].push(square);
        this.el.appendChild(square);
      }
    }
  };

  Board.prototype.resetSquare = function(square) {
    square.className = '';
  };

  Board.prototype.reset = function() {
    for (var c = 0; c < this.cols; c++) {
      for (var r = 0; r < this.rows; r++) {
        this.resetSquare(this.squares[c][r]);
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
      this.squares[tile[0]][tile[1]].className = tile[2];
    });
  };

  Board.prototype.pickUpTile = function(x, y) {
    this.resetSquare(this.squares[x][y]);
  };

  Board.prototype.getColor = function(x, y) {
    return this.squares[x][y].className;
  };

  Board.prototype.isGameOver = function() {
    for (var r = 0; r < this.rows; r++) {
      for (var c = 0; c < this.cols; c++) {
        if (this.squares[c][r].className !== '') {
          return false;
        }
      }
    }
    return true;
  };

  return Board;
})();
