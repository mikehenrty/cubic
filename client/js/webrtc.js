window.WebRTC = (function() {
  'use strict';

  window.RTCPeerConnection = window.RTCPeerConnection ||
                             window.webkitRTCPeerConnection;

  const CHANNEL_LABEL = 'p2p';

  function WebRTC(clientId, socket) {
    this.clientId = clientId;
    this.socket = socket;
    this.peerId = null;
    this.authorizedPeer = null;
    this.dataChannel = null;
    this.handlers = {};
    this.queue = new Utility.Queue();
    this.connectHandlers = new Utility.Handlers();
    this.disconnectHandler = null;

    this.socket.registerHandler('signaling', this.signalHandler.bind(this));
    this.socket.registerHandler('ask', this.askHandler.bind(this));
  }

  WebRTC.prototype.isConnected = function() {
    return this.dataChannel && this.dataChannel.readyState === 'open';
  };

  WebRTC.prototype.setAuthorizedPeer = function(peerId, nicename) {
    // Null peerId clears authorized peer.
    this.authorizedPeer = peerId && {
      peerId: peerId,
      nicename: nicename
    };
  };

  WebRTC.prototype.initPeerConnection = function(peerId) {
    if (this.peerId && this.peerId !== peerId) {
      this.cleanUp();
    }
    this.peerId = peerId;
    this.peerConnection = new RTCPeerConnection({
      'iceServers': [
        { 'urls': ['stun:stun.l.google.com:19302'] }
      ]
    });
    this.peerConnection.onicecandidate =
      this.candidateHandler.bind(this);
    this.peerConnection.oniceconnectionstatechange =
      this.stateChangeHandler.bind(this);
    this.peerConnection.ondatachannel =
      this.dataChannelHandler.bind(this);
  };

  WebRTC.prototype.connect = function(peerId, nicename) {
    return this.socket.sendCommand('ask', peerId, nicename).then((response) => {
      if (response !== 'yes') {
        var err = new Error('peer will not play you');
        throw err;
      }

      this.setAuthorizedPeer(peerId);
      this.initPeerConnection(peerId);
      this.dataChannel = this.peerConnection.createDataChannel(CHANNEL_LABEL);
      this.dataChannel.onopen = this.dataChannel.onclose =
        this.dataChannelStateChange.bind(this);
      this.dataChannel.onmessage = this.onMessage.bind(this);

      return this.peerConnection.createOffer().then(offer => {
        this.peerConnection.setLocalDescription(offer);
        this.sendSignal('offer', offer);
        return this.promiseNextConnection(peerId);
      }).catch(err => {
        this.connectHandlers.fail(err);
        throw err;
      });
    });
  };

  WebRTC.prototype.promiseNextConnection = function(originalPeerId) {
    return new Promise((res, rej) => {
      // Note: memory leak. Change to de-register this if we ever use it often.
      this.connectHandlers.add(Utility.once((err, peerId) => {
        if (err) {
          rej(err);
        } else if (peerId !== originalPeerId) {
          rej(new Error(`connected to unintended peer, ${peerId}`));
        } else {
          res(peerId);
        }
      }));
    });
  };

  WebRTC.prototype.onConnection = function(cb) {
    this.connectHandlers.add(cb);
  };

  WebRTC.prototype.registerHandler = function(type, cb) {
    if (!this.handlers[type]) {
      this.handlers[type] = [];
    }
    this.handlers[type].push(cb);
  };

  WebRTC.prototype.send = function(type, payload) {
    if (!this.dataChannel) {
      console.log('error, tried to call send when data channel null');
      return;
    }
    this.dataChannel.send(`${type} ${payload}`);
  };

  WebRTC.prototype.trigger = function(type, payload) {
    this.handlers[type] && this.handlers[type].forEach(handler => {
      handler(type, payload);
    });
  };

  WebRTC.prototype.onMessage = function(evt) {
    var parts = evt.data.split(' ');
    var type = parts.shift();
    var payload = parts.join(' ');
    this.trigger(type, payload);
  };


  WebRTC.prototype.candidateHandler = function(evt) {
    if (evt.candidate) {
      this.sendSignal('candidate', evt.candidate);
    }
  };

  WebRTC.prototype.sendSignal = function(signal, data) {
    var payload = `${signal}|${JSON.stringify(data)}`;
    this.socket.send('signaling', this.peerId, payload);
  };

  WebRTC.prototype.signalHandler = function(err, peerId, message) {
    if (err) {
      console.log('signaling error', err, peerId, message);
      // If signaling failed while connecting, call handler with error.
      if (peerId === this.peerId) {
        this.connectHandlers.fail(err);
      }
      return;
    }

    if (!this.authorizedPeer || this.authorizedPeer.peerId !== peerId) {
      console.log('attempted signal from unauthorized peer', peerId, message);
      return;
    }

    if (peerId !== this.peerId) {
      this.initPeerConnection(peerId);
    }
    var parts = message.split('|');
    var type = parts.shift();
    try {
      var data = JSON.parse(parts.join('|'));
    } catch (err) {
      console.log('could not parse signaling message', err);
      return;
    }

    switch (type) {
      case 'candidate':
        this.queue.add(this.handleSignalCandidate.bind(this, data));
        break;

      case 'offer':
        this.queue.add(this.handleSignalOffer.bind(this, data));
        break;

      case 'answer':
        this.queue.add(this.handleSignalAnswer.bind(this, data));
        break;

      default:
        console.log('unrecognized signaling message', type);
        break;
    }
  };

  WebRTC.prototype.askHandler = function(err, peerId, nicename) {
    if (err) {
      console.log('could not send ask', peerId, nicename, err);
      return;
    }

    if (confirm(`${nicename} is asking to play you`)) {
      this.setAuthorizedPeer(peerId, nicename);
      this.socket.send('ask_ack', peerId, 'yes');
    } else {
      this.socket.send('ask_ack', peerId, 'no');
    }
  };


  WebRTC.prototype.handleSignalAnswer = function(data, cb) {
    this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(data)
    ).then(() => {
      cb && cb(null);
    }).catch(err => {
      console.log('error setting answer');
      cb && cb(err);
    });
  };

  WebRTC.prototype.handleSignalOffer = function(data, cb) {
    this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(data)
    ).then(() => {
      return this.peerConnection.createAnswer();
    }).then(answer => {
      return this.peerConnection.setLocalDescription(answer);
    }).then(() => {
      this.sendSignal('answer',
        this.peerConnection.localDescription);
      cb && cb(null);
    }).catch(err => {
      console.log('error creating answer', err);
      cb && cb(err);
    });
  };

  WebRTC.prototype.handleSignalCandidate = function(data, cb) {
    this.peerConnection.addIceCandidate(
      new RTCIceCandidate(data)
    ).then(() => {
      cb && cb(null);
    }).catch((err) => {
      console.log('error adding ice candidate', err, data);
      cb && cb(err);
    });
  };


  WebRTC.prototype.stateChangeHandler = function() {
    switch (this.peerConnection.iceConnectionState) {
      case 'connected':
        console.log('connected to', this.peerId);
        break;

      case 'disconnected':
      case 'failed':
      case 'closed':
        console.log('new webrtc state',
          this.peerConnection.iceConnectionState);
        this.trigger('disconnect');
        break;

      default:
        console.log('unknown webrtc state',
          this.peerConnection.iceConnectionState);
    };
  };

  WebRTC.prototype.dataChannelHandler = function(evt) {
    this.dataChannel = evt.channel;
    this.dataChannel.onopen = this.dataChannel.onclose =
      this.dataChannelStateChange.bind(this);
    this.dataChannel.onmessage = this.onMessage.bind(this);
  };

  WebRTC.prototype.dataChannelStateChange = function(evt) {
    console.log('data channel state change', this.dataChannel.readyState);
    if (this.dataChannel.readyState === 'open') {
      this.connectHandlers.succeed(this.peerId);
    }
  };

  WebRTC.prototype.cleanUp = function() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel.onopen = null;
      this.dataChannel.onclose = null;
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection.onicecandidate = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.ondatachannel = null;
      this.peerConnection = null;
    }
  };

  return WebRTC;
})();
