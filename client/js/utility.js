window.Utility = (function() {
  'use strict';

  function Queue() {
    this.tasks = [];
    this.running = false;
    this.errorHandler = null;
    this.handleDone = this.handleDone.bind(this);
  }

  Queue.prototype.handleDone = function(err) {
    if (err) {
      console.log('queue callback error', err);
      // Only stop executing queue if error handler attached.
      if (this.errorHandler) {
        return this.errorHandler(err);
      }
    }

    this.running = false;
    if (this.tasks.length > 0) {
      this.runNextTask();
    }
  };

  Queue.prototype.runNextTask = function() {
    this.running = true;
    var task = this.tasks.shift();
    if (task.length === 1) {
      task(this.handleDone);
    } else {
      task();
      this.handleDone();
    }
  };

  Queue.prototype.add = function() {
    for (var i = 0; i < arguments.length; i++) {
      this.tasks.push(arguments[i]);
    }
    if (!this.running) {
      this.runNextTask();
    }
    return this;
  };

  Queue.prototype.catch = function(cb) {
    this.errorHandler = cb;
  };

  function Handlers() {
    this.handlers = [];
  }

  Handlers.prototype.add = function(handler) {
    this.handlers.push(handler);
  };

  Handlers.prototype.succeed = function(value) {
    this.handlers.forEach(handler => { handler(null, value); });
  };

  Handlers.prototype.fail = function(err) {
    this.handlers.forEach(handler => { handler(err); });
  };

  var peerCount = 0;
  var peerNames = {};
  function niceId(guid) {
    if (window.clientId && window.clientId === guid) {
      return 'Me';
    }
    if (peerNames[guid]) {
      return peerNames[guid]
    }
    peerNames[guid] = 'peer_' + ++peerCount;
    return peerNames[guid];
  }

  return {
    guid: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    },

    once: function(fn) {
      var called = false;
      return function() {
        if (!called) {
          called = true;
          return fn.apply(null, arguments);
        }
      };
    },

    getPeerLink: function(id) {
      var url = new URL(window.location.href);
      return `${url.protocol}\/\/${url.host}${url.pathname}?peer=${id}`;
    },

    getPeerId: function() {
      var url = new URL(window.location.href);
      return url.searchParams.get('peer');
    },

    getClientId: function() {
      if (!window.clientId) {
        window.clientId = Utility.guid();
        console.log('client id', window.clientId);
      }
      return window.clientId;
    },

    getPixelHeight: function(query) {
      var style = window.getComputedStyle(document.querySelector(query));
      return parseFloat(style.height.slice(0, -2));
    },

    niceId: niceId,
    Queue: Queue,
    Handlers: Handlers
  };
})();
