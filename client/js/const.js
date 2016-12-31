window.CONST = (function() {
  'use strict';

  return {
    DEBUG: false,

    // Simulated latency.
    FAKE_LATENCY: 0,
    // miliseconds of piece movement.
    MOVE_DURATION: 200,

    COLS: 10,
    ROWS: 10,
    STARTING_TILES: 1,

    CUBE_SIDES: {
      TOP   : 0,
      NORTH : 1,
      EAST  : 2,
      SOUTH : 3,
      WEST  : 4,
      BOTTOM: 5
    },

    CUBE_COLORS: [
      'red',
      'blue',
      'yellow',
      'orange',
      'white',
      'green'
    ]
  };
})();
