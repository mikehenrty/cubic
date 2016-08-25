document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var connection = new Connection();
  var ui = new UI(document.body);
  var engine = new Engine(document.body);

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

  connection.onPeerConnect((peerId) => {
    engine.setPlayer(player);
    ui.setStatus(`You are Player ${player}`);
  });

  connection.init().then(id => {
    clientId = id;
    ui.init();
    engine.init(connection);

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

