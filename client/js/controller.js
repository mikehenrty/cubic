window.Controller = (function() {
  'use strict';

  function Controller(container) {
    this.container = container;
    this.engine = new Engine(container);
  }

  Controller.prototype.showPeerLink = function() {
    // TODO: move peer link outside of engine ui.
    this.engine.ui.showPeerLink(this.engine.getClientId());
  };

  Controller.prototype.init = function() {
    this.engine.onDisconnect(this.showPeerLink.bind(this));

    return this.engine.init().then(clientId => {
      var peerId = Utility.getPeerId();
      if (!peerId) {
        this.showPeerLink();
        return;
      }
      return this.engine.connectToPeer(peerId);
    }).catch(err => {
      // TODO: move peer link outside of engine ui.
      console.log('Engine init error', err);
      this.showPeerLink();
    });
  };

  return Controller;
})();
