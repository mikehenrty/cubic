document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var engine = new Engine(document.body);

  engine.init().then(clientId => {
    var peerId = Utility.getPeerId();
    if (!peerId) {
      // TODO: move peer link outside of engine ui.
      engine.ui.showPeerLink(clientId);
      return;
    }
    return engine.connectToPeer(peerId);
  }).catch(err => {
    // TODO: move peer link outside of engine ui.
    console.log('Engine init error', err);
    engine.ui.showPeerLink(clientId);
  });
});

