window.Controller = (function() {
  'use strict';

  function Controller(container) {
    this.container = container;
    this.engine = new Engine(container);
    this.ui = new UI(container);
  }

  Controller.prototype.showPeerLink = function() {
    this.ui.showPeerLink(this.engine.getClientId());
  };

  Controller.prototype.init = function() {
    // Play offline.
    this.ui.registerHandler('offline', () => {
      this.engine.playOffline();
      this.ui.hide();
    });

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
      console.log('Engine init error', err);
      this.showPeerLink();
    });
  };

  return Controller;
})();
