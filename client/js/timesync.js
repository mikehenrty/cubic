window.TimeSync = (function () {
  'use strict';

  const NUM_SAMPLES = 5;

  function getOffset(sentTime, serverTime, currentTime) {
    var ping = currentTime - sentTime;
    var latency = ping / 2;
    return serverTime - currentTime + latency;
  }

  function TimeSync() {
    this.ready = false;
    this.connection = null;
    this.offset = 0;
    this.samples = null;
  }

  TimeSync.prototype.init = function(connection) {
    this.connection = connection;
    this.connection.registerHandler('timesync', this.handleSync.bind(this));
  };

  TimeSync.prototype.sync = function() {
    return new Promise((res, rej) => {
      this.connection.registerHandler('timesync_ack', (type, payload) => {
        var sentTime, serverTime;
        [sentTime, serverTime] = payload.split(' ');
        var offset = getOffset(sentTime, serverTime, this.now());

        if (!this.samples) {
          this.samples = [];
          this.offset = offset;
          this.connection.send('timesync', this.now());
          return;
        }

        this.samples.push(offset);
        if (this.samples.length < NUM_SAMPLES) {
          this.connection.send('timesync', this.now());
          return;
        }

        // Finished timesync samples, calculate results
        this.samples = Utility.trimOutliers(this.samples);
        this.offset += Math.round(Utility.mean(this.samples));
        res();
      });

      this.connection.send('timesync', this.now());
    });
  };

  TimeSync.prototype.handleSync = function(type, payload) {
    this.connection.send('timesync_ack', `${payload} ${this.now()}`);
  };

  TimeSync.prototype.now = function() {
    return Date.now() + this.offset;
  };

  return TimeSync;
})();
