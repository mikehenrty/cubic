window.CONST = (function() {
  'use strict';

  return {
    DEBUG: false,

    MUTE: false,

    // Simulated latency.
    FAKE_LATENCY: 0,

    // miliseconds of piece movement.
    MOVE_DURATION: 175,

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

    SCORE_SIDE: 5, // Bottom

    CUBE_COLORS: [
      'red',
      'blue',
      'yellow',
      'orange',
      'white',
      'green'
    ],

    SOUND_FILES: {
      'bg-pump': '/sound/pumpup.ogg',
      'bg-mellow': '/sound/mellow.ogg',
      'ef-bump': '/sound/bump.ogg',
      'ef-powerup': '/sound/powerup.ogg',
    },

    // Merge obj with CONST, overriding any existing keys.
    override: function(obj) {
      Object.getOwnPropertyNames(obj).forEach(key => {
        this[key] = obj[key];
      });
    },
  };
})();
