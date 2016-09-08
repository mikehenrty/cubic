document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var engine = new Engine(document.body);

  function peerAlreadyExists() {
    return !!Utility.getPeerId();
  }

  engine.onReady(() => {
    console.log('game ready');
  });

  engine.init().then(clientId => {

    if (peerAlreadyExists()) {
      engine.connectToPeer(Utility.getPeerId()).catch(err => {
        console.log('Peer connect error', err);
        // TODO: move peer link outside of engine ui.
        engine.ui.showPeerLink(clientId);
      });
    } else {
      // TODO: move peer link outside of engine ui.
      engine.ui.showPeerLink(clientId);
    }
  }).catch(err => {
    console.log('Engine init error', err);
  });
});

