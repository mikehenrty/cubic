document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var ui = new UI(document.body);
  ui.init();

  var engine = new Engine(document.body);
  engine.init();

  var connection = new Connection();

  var clientId = 0;
  var player = 0;

  function peerAlreadyExists() {
    return !!Utility.getPeerId();
  }

  function weArePlayerOne() {
    player = 1;
    ui.showPeerLink(clientId);
  }

  function weArePlayerTwo() {
    player = 2;
    var peerId = Utility.getPeerId();
    ui.setStatus('Connecting to peer...');
    connection.connect(peerId).catch(err => {
      ui.setStatus(`Error connecting to peer!`);
    });
  }

  function handleJoin(peerId) {
    ui.setStatus(`You are Player ${player}`);
  }

  connection.init().then(id => {
    clientId = id;
    connection.onPeerConnect(handleJoin);

    if (peerAlreadyExists()) {
      weArePlayerTwo();
    } else {
      weArePlayerOne();
    }

  }).catch(err => {
    console.log('connection error', err);
    ui.setStatus('Connection error');
  });
});

