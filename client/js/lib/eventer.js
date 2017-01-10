window.Eventer = (() => {
  'use strict';

  function Eventer() {
    this.handlers = {};
  }

  Eventer.prototype.on = function(type, cb) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(cb);
  };

  Eventer.prototype.trigger = function(type) {
    this.handlers[type] && this.handlers[type].forEach(handler => {
      handler.apply(null, Array.prototype.slice.call(arguments, 1));
    });
  };

  Eventer.prototype.forward = function(type, eventer) {
    eventer.on(type, this.trigger.bind(this, type));
  };

  return Eventer;
})();
