window.Engine = (function() {
  'use strict';

  function Engine(container) {
    this.container = container;
    this.board = new Board(container);
  }

  Engine.prototype.init = function() {
    this.board.init();
  };

  return Engine;
})();
