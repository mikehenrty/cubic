window.Cube = (function() {
  'use strict';

  const DEBUG = CONST.DEBUG;

  // Positions on the cube.
  const TOP    = 0;
  const NORTH  = 1;
  const EAST   = 2;
  const SOUTH  = 3;
  const WEST   = 4;
  const BOTTOM = 5;

  const COLORS = [
    'red',
    'blue',
    'yellow',
    'orange',
    'white',
    'green'
  ];

  function Cube(el) {
    this.el = el;
    this.sides = COLORS.slice(0); // Clone.
    this.update();
  }

  Cube.prototype.update = function() {
    var style = this.el.style;
    style.backgroundColor = this.sides[TOP];
    style.borderTopColor = this.sides[NORTH];
    style.borderBottomColor = this.sides[SOUTH];
    style.borderLeftColor = this.sides[WEST];
    style.borderRightColor = this.sides[EAST];
    DEBUG && this.logColors();
  };

  Cube.prototype.cpSide = function(src, dest) {
    this.sides[dest] = this.sides[src];
  };

  Cube.prototype.moveUp = function(){
    var oldTop = this.sides[TOP];
    this.cpSide(SOUTH, TOP);
    this.cpSide(BOTTOM, SOUTH);
    this.cpSide(NORTH, BOTTOM);
    this.sides[NORTH] = oldTop;
    this.update();
  };

  Cube.prototype.moveDown = function(){
    var oldTop = this.sides[TOP];
    this.cpSide(NORTH, TOP);
    this.cpSide(BOTTOM, NORTH);
    this.cpSide(SOUTH, BOTTOM);
    this.sides[SOUTH] = oldTop;
    this.update();
  };

  Cube.prototype.moveLeft = function(){
    var oldTop = this.sides[TOP];
    this.cpSide(EAST, TOP);
    this.cpSide(BOTTOM, EAST);
    this.cpSide(WEST, BOTTOM);
    this.sides[WEST] = oldTop;
    this.update();
  };

  Cube.prototype.moveRight = function(){
    var oldTop = this.sides[TOP];
    this.cpSide(WEST, TOP);
    this.cpSide(BOTTOM, WEST);
    this.cpSide(EAST, BOTTOM);
    this.sides[EAST] = oldTop;
    this.update();
  };

  Cube.prototype.logColors = function() {
    console.log('TOP', this.sides[TOP]);
    console.log('NORTH', this.sides[NORTH]);
    console.log('EAST', this.sides[EAST]);
    console.log('SOUTH', this.sides[SOUTH]);
    console.log('WEST', this.sides[WEST]);
    console.log('BOTTOM', this.sides[BOTTOM]);
  };

  return Cube;
})();