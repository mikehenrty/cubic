window.Controller = (function() {
  'use strict';

  function Controller(container) {
    this.container = container;
    this.engine = new Engine(container);
    this.ui = new UI(container);
  }

  Controller.prototype.showPeerLink = function() {
    // TODO: move peer link outside of engine ui.
    this.ui.showPeerLink(this.engine.getClientId());
  };

  Controller.prototype.init = function() {
    this.ui.init();
    this.engine.onDisconnect(this.showPeerLink.bind(this));
    this.engine.onConnect(this.ui.hide.bind(this.ui));

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
