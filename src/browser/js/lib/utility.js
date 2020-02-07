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

  var peerCount = 0;
  var peerNames = {};
  function niceId(guid) {
    if (window.clientId && window.clientId === guid) {
      return 'Me';
    }
    if (peerNames[guid]) {
      return peerNames[guid];
    }
    ++peerCount;
    peerNames[guid] = 'peer_' + peerCount;
    return peerNames[guid];
  }

  return {
    guid: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    },

    sum: function(data) {
      return data.reduce((prev, cur) => prev + cur, 0);
    },

    mean: function(data) {
      if (data.length === 0) {
        return 0;
      }
      return Utility.sum(data) / data.length;
    },

    median: function(data) {
      data.sort( function(a,b) {return a - b;} );
      var half = Math.floor(data.length / 2);
      if(data.length % 2) {
        return data[half];
      } else {
        return (data[half-1] + data[half]) / 2.0;
      }
    },

    stddev: function(data) {
      if (data.length === 0) {
        return 0;
      }
      var mean = Utility.mean(data);
      var sumOfDistances = Utility.sum(data.map(result => {
        return Math.pow(mean - result, 2);
      }));
      return Math.sqrt(sumOfDistances / data.length);
    },

    random: function(min, max) {
      return min + Math.round(Math.random() * (max - min));
    },

    trimOutliers: function(data) {
      var median = Utility.median(data);
      var stddev = Utility.stddev(data);
      return data.filter(val => {
        return Math.abs(median - val) <= (stddev * 1.5);
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

    getCssVar: function(prop) {
      return window.getComputedStyle(document.body).getPropertyValue(prop);
    },

    storeId: function(id) {
      localStorage.id = id;
    },

    fetchId: function() {
      return localStorage.id;
    },

    nextFrame: function() {
      return new Promise(function(resolve, reject) {
        requestAnimationFrame(function() { resolve(); });
      });
    },

    niceId: niceId,
    Queue: Queue,
  };
})();
