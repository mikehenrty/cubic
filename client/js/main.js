document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  var engine = new Engine(document.body);

  function showPeerLink() {
    // TODO: move peer link outside of engine ui.
    engine.ui.showPeerLink(engine.getClientId());
  }

  engine.onDisconnect(() => {
    showPeerLink();
  });

  engine.init().then(clientId => {
    var peerId = Utility.getPeerId();
    if (!peerId) {
      showPeerLink();
      return;
    }
    return engine.connectToPeer(peerId);
  }).catch(err => {
    // TODO: move peer link outside of engine ui.
    console.log('Engine init error', err);
    showPeerLink();
  });
});

