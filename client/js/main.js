document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var ui = new UI(document.body);
  var engine = new Engine(document.body);

  function handleErr(message, err) {
    console.log(message, err);
    ui.setStatus(message);
  }

  function peerAlreadyExists() {
    return !!Utility.getPeerId();
  }

  engine.onReady(() => {
    ui.setStatus(`You are ${engine.getPlayerColor()}`);
  });

  engine.init().then(clientId => {
    ui.init();

    if (peerAlreadyExists()) {
      ui.setStatus('Connecting to peer...');
      engine.connectToPeer(Utility.getPeerId()).catch(err => {
        handleErr('Peer connect error', err);
        ui.showPeerLink(clientId);
      });
    } else {
      ui.showPeerLink(clientId);
    }
  }).catch(err => {
    handleErr('Engine init error', err);
  });
});

