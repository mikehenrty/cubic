window.TimeSync = (function () {
  'use strict';

  const NUM_SAMPLES = 5;

  function getOffset(sentTime, serverTime, currentTime) {
    var ping = currentTime - sentTime;
    var latency = Math.round(ping / 2);
    return serverTime - currentTime + latency;
  }

  function TimeSync(connection) {
    this.connection = connection;
    this.ready = false;
    this.offset = 0;
    this.samples = null;
    this.connection.on('timesync', this.handleSync.bind(this));
  }

  TimeSync.prototype.sync = function() {
    return new Promise((res, rej) => {
      this.connection.on('timesync_ack', payload => {
        var sentTime, serverTime;
        var now = this.now();
        [sentTime, serverTime] = payload.split(' ');
        var offset = getOffset(sentTime, serverTime, now);

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

        // Return the initial latency value
        res(now - sentTime);
      });

      this.connection.send('timesync', this.now());
    });
  };

  TimeSync.prototype.handleSync = function(payload) {
    this.connection.send('timesync_ack', `${payload} ${this.now()}`);
  };

  TimeSync.prototype.now = function() {
    return Date.now() + this.offset;
  };

  return TimeSync;
})();
