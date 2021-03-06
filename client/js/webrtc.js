window.WebRTC = (function() {
  'use strict';

  window.RTCPeerConnection = window.RTCPeerConnection ||
                             window.webkitRTCPeerConnection;

  const CHANNEL_LABEL = 'p2p';

  function WebRTC(socket) {
    this.socket = socket;
    this.peerId = null;
    this.authorizedPeer = null;
    this.dataChannel = null;
    this.queue = new Utility.Queue();

    this.socket.on('signaling', this.signalHandler.bind(this));
  }

  WebRTC.prototype = new Eventer();

  WebRTC.prototype.isConnected = function() {
    return this.dataChannel && this.dataChannel.readyState === 'open';
  };

  WebRTC.prototype.authorizePeer = function(peerId) {
    this.authorizedPeer = peerId;
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

  WebRTC.prototype.connect = function(peerId) {
    this.authorizePeer(peerId);
    this.initPeerConnection(peerId);
    this.dataChannel = this.peerConnection.createDataChannel(CHANNEL_LABEL, {
      ordered: false,
      maxRetransmits: 0
    });
    this.dataChannel.onopen = this.dataChannel.onclose =
      this.dataChannelStateChange.bind(this);
    this.dataChannel.onmessage = this.onMessage.bind(this);

    this.peerConnection.createOffer().then(offer => {
      this.peerConnection.setLocalDescription(offer);
      this.sendSignal('offer', offer);
    });
  };

  WebRTC.prototype.send = function(type, payload) {
    if (!this.dataChannel) {
      console.log('error, tried to call send when data channel null');
      return;
    }
    this.dataChannel.send(`${type} ${payload || ''}`);
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
      return;
    }

    if (!this.authorizedPeer || this.authorizedPeer !== peerId) {
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

    } catch (e) {
      console.log('could not parse signaling message', e);
      return;
    }

  };

  WebRTC.prototype.handleSignalAnswer = function(data, cb) {
    this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(data)
    ).then(() => {
      if (cb) { cb(null); }
    }).catch(e => {
      console.log('error setting answer');
      if (cb) { cb(e); }
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
      if (cb) { cb(null); }
    }).catch(e => {
      console.log('error creating answer', err);
      if (cb) { cb(e); }
    });
  };

  WebRTC.prototype.handleSignalCandidate = function(data, cb) {
    this.peerConnection.addIceCandidate(
      new RTCIceCandidate(data)
    ).then(() => {
      if (cb) { cb(null); }
    }).catch((e) => {
      console.log('error adding ice candidate', err, data);
      if (cb) { cb(e); }
    });
  };


  WebRTC.prototype.stateChangeHandler = function() {
    switch (this.peerConnection.iceConnectionState) {
      case 'completed':
        console.log('connection complete!', this.peerId);
        break;

      case 'connected':
        console.log('connected to', this.peerId);
        break;

      case 'disconnected':
        console.log('got the "official" disconnect message');
        this.disconnect();
        break;

      case 'failed':
      case 'closed':
        console.log('disconnect from webrtc state change',
          this.peerConnection.iceConnectionState);
        break;

      default:
        console.log('webrtc state change',
          this.peerConnection.iceConnectionState);
        break;
    }
  };

  WebRTC.prototype.dataChannelHandler = function(evt) {
    this.dataChannel = evt.channel;
    this.dataChannel.onopen = this.dataChannel.onclose =
      this.dataChannelStateChange.bind(this);
    this.dataChannel.onmessage = this.onMessage.bind(this);
  };

  WebRTC.prototype.dataChannelStateChange = function(evt) {
    console.log('data channel state change', this.dataChannel.readyState);
    switch (this.dataChannel.readyState) {
      case 'open':
        this.trigger('peer', this.peerId);
        break;

      case 'closed':
        console.log('disconnect from data channel state change');
        break;

      default:
        break;
    }
  };

  WebRTC.prototype.disconnect = function() {
    console.log('webrtc disconnect', this.peerId);
    this.cleanUp();
    if (this.peerId) {
      var peerId = this.peerId;
      this.peerId = null;
      this.trigger('disconnect', peerId);
    }
  };

  WebRTC.prototype.cleanUp = function() {
    if (this.dataChannel) {
      this.dataChannel.onopen = null;
      this.dataChannel.onclose = null;
      this.dataChannel.close();
      this.dataChannel = null;
    }

    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.oniceconnectionstatechange = null;
      this.peerConnection.ondatachannel = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
  };

  return WebRTC;
})();
