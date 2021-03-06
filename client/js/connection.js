window.Connection = (function() {
  'use strict';

  const FAKE_LATENCY = CONST.FAKE_LATENCY;

  // List of events that happen on socket rather than rtc connection.
  const SOCKET_EVENTS = ['ask', 'list_update'];

  function Connection() {
    this.socket = new Socket();
    this.webRTC = new WebRTC(this.socket);

    SOCKET_EVENTS.forEach(type => {
      this.socket.on(type, this.handleSocketEvent.bind(this, type));
    });
  }

  Connection.prototype = new Eventer();

  Connection.prototype.isConnected = function() {
    return this.webRTC && this.webRTC.isConnected();
  };

  Connection.prototype.register = function(id) {
    return this.socket.sendCommand('register', null, id).then(payload => {
      var parts = payload.split(' ');
      return {
        clientId: parts[0],
        clientName: parts[1],
        socketId: parts[2],
      };
    });
  };

  Connection.prototype.askToConnect = function(peerId) {
    this.webRTC.authorizePeer(peerId);
    return this.socket.sendCommand('ask', peerId).then(response => {
      if (response !== 'yes') {
        throw new Error('peer rejected connection');
      }
      return peerId;
    });
  };

  Connection.prototype.handleSocketEvent = function(type, err, sender, payload) {
    if (err) {
      console.log('socket message error', type, err, sender, payload);
      return;
    }

    switch (type) {
      case 'list_update':
        this.trigger(type, JSON.parse(payload));
        break;

      case 'ask':
        this.trigger(type, sender, payload);
        break;
    }
  };

  Connection.prototype.allowPeer = function(peerId) {
    this.webRTC.authorizePeer(peerId);
    this.socket.send('ask_ack', peerId, 'yes');
  };

  Connection.prototype.rejectPeer = function(peerId) {
    this.socket.send('ask_ack', peerId, 'no');
  };

  Connection.prototype.connectToPeer = function(peerId) {
    this.webRTC.connect(peerId);
  };

  Connection.prototype.on = function(type, cb) {
    // Use whitelist for events that will come from the web socket.
    if (SOCKET_EVENTS.includes(type)) {
      Eventer.prototype.on.call(this, type, cb);
      return;
    }
    // Otherwise, forward all connection handlers to webRTC events.
    this.webRTC.on(type, cb);
  };

  Connection.prototype.getList = function() {
    return this.socket.sendCommand('list').then(listData => {
      return JSON.parse(listData);
    });
  };

  Connection.prototype.setName = function(name) {
    return this.socket.sendCommand('setname', null, name);
  };

  Connection.prototype.sendReport = function(report) {
    var msg = JSON.stringify(report);
    return Promise.all([
      this.socket.send('report', null, msg),
      this.webRTC.send('report', msg),
    ]);
  };

  // Tell server when we are in game, and when we leave game.
  Connection.prototype.setClientStatus = function(status) {
    return this.socket.sendCommand('setstatus', null, status);
  };

  Connection.prototype.send = function(type, payload) {
    if (!this.webRTC.isConnected()) {
      console.log('cannot send message, p2p not connected');
      return;
    }
    if (FAKE_LATENCY) {
      setTimeout(this.webRTC.send.bind(this.webRTC, type, payload),
                 FAKE_LATENCY);
      return;
    }
    this.webRTC.send(type, payload);
  };

  Connection.prototype.reset = function() {
    this.webRTC.disconnect();
  };

  return Connection;
})();
