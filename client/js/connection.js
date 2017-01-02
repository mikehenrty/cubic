window.Connection = (function() {
  'use strict';

  const FAKE_LATENCY = CONST.FAKE_LATENCY;

  // List of events that happen on socket rather than rtc connection.
  const SOCKET_EVENTS = ['ask', 'confirm', 'reject'];

  function Connection() {
    this.socket = new Socket();
    this.webRTC = new WebRTC(this.socket);
    this.socket.on('ask', this.handleAsk.bind(this));
  }

  Connection.prototype = new Eventer();

  Connection.prototype.isConnected = function() {
    return this.webRTC && this.webRTC.isConnected();
  };

  Connection.prototype.register = function(name) {
    return this.socket.sendCommand('register', null, name).then(payload => {
      var parts = payload.split(' ');
      return {
        clientId: parts[0],
        clientName: parts[1]
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

  Connection.prototype.handleAsk = function(err, peerId, name) {
    if (err) {
      console.log('ask error', err, peerId);
      return;
    }
    this.trigger('ask', peerId, name);
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

  return Connection;
})();
