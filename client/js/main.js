document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var ui = new UI(document.body);
  ui.init();
  ui.setStatus('Initializing...');

  var engine = new Engine(document.body);
  engine.init();

  var connection = new Connection();
  connection.init().then(clientId => {
    ui.showPeerLink(clientId);

    connection.onPeerConnect(peerId => {
      ui.setStatus('Got a connection!');
    });

    var peerId = Utility.getPeerId();
    if (peerId) {
      ui.setStatus('Connecting to peer...');
      connection.connect(peerId);
    }

  }).catch(err => {
    console.log('connection error', err);
    ui.setStatus('Connection error');
  });
});

