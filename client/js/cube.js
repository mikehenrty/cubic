window.Cube = (function() {
  'use strict';

  const DEBUG = CONST.DEBUG;

  // Positions on the cube.
  const TOP    = CONST.CUBE_SIDES.TOP;
  const NORTH  = CONST.CUBE_SIDES.NORTH;
  const EAST   = CONST.CUBE_SIDES.EAST;
  const SOUTH  = CONST.CUBE_SIDES.SOUTH;
  const WEST   = CONST.CUBE_SIDES.WEST;
  const BOTTOM = CONST.CUBE_SIDES.BOTTOM;

  const COLORS = CONST.CUBE_COLORS;

  function Cube(el) {
    this.el = el;
    this.top = document.createElement('div');
    this.top.className = 'top';
    this.north = document.createElement('div');
    this.north.className = 'north';
    this.east = document.createElement('div');
    this.east.className = 'east';
    this.south = document.createElement('div');
    this.south.className = 'south';
    this.west = document.createElement('div');
    this.west.className = 'west';
    this.bottom = document.createElement('div');
    this.bottom.className = 'bottom';

    this.el.appendChild(this.bottom);
    this.el.appendChild(this.north);
    this.el.appendChild(this.east);
    this.el.appendChild(this.west);
    this.el.appendChild(this.south);
    this.el.appendChild(this.top);

    this.sides = null;
    this.reset();
  }

  Cube.prototype.move = function(move) {
    if (!this[move]) {
      console.log('unrecognized cube direction', move);
      return;
    }
    this[move]();
  };

  Cube.prototype.update = function() {
    this.setSideColor('top', this.sides[TOP]);
    this.setSideColor('north', this.sides[NORTH]);
    this.setSideColor('south', this.sides[SOUTH]);
    this.setSideColor('west', this.sides[WEST]);
    this.setSideColor('east', this.sides[EAST]);
    this.setSideColor('bottom', this.sides[BOTTOM]);

    // TODO: check if this is faster.
    // this.top.className  = `north ${this.sides[TOP]}`;
    // this.north.className  = `north ${this.sides[TOP]}`;
    // this.south.className  = `north ${this.sides[SOUTH]}`;
    // this.west.className  = `north ${this.sides[WEST]}`;
    // this.east.className  = `north ${this.sides[EAST]}`;
    // this.bottom.className  = `north ${this.sides[BOTTOM]}`;
  };

  Cube.prototype.setSideColor = function(prop, color) {
    this[prop].style.backgroundColor = `var(--cube-color-${color})`;
  };

  Cube.prototype.reset = function() {
    this.sides = COLORS.slice(0); // Clone.
    this.update();
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
