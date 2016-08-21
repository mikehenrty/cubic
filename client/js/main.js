document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var ui = new UI(document.body);
  ui.init();
  ui.setStatus('Initializing...');

  var engine = new Engine(document.body);
  engine.init();

  var connection = new Connection();
  connection.init().then(clientId => {
    var peerId = Utility.getPeerId();
    if (!peerId) {
      ui.setStatus(Utility.getPeerLink(clientId));
      connection.listen().then(peerId => {
        ui.setStatus('Got a connection!');
      });
    } else {
      ui.setStatus('Connecting to peer...');
      connection.connect(peerId).then(() => {
        ui.setStatus('Connected!!!!!!');
      });
    }
  }, (err) => {
    console.log('connection error', err);
    ui.Server('Connection error');
  });
});

