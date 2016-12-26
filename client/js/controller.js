window.Controller = (function() {
  'use strict';

  function Controller(container) {
    this.container = container;
    this.engine = new Engine(container);
    this.ui = new UI(container);
  }

  Controller.prototype.showUI = function() {
    this.ui.show({
      clientId: this.engine.getClientId(),
      clientName: this.engine.getClientName()
    });
  };

  Controller.prototype.init = function() {
    // Play offline.
    this.ui.registerHandler('offline', () => {
      this.ui.hide();
      this.engine.startOffline();
    });

    this.ui.registerHandler('rename', newName => {
      // Hide name.
      this.ui.show({ clientName: '...' });
      this.engine.setName(newName).then(() => {
        this.showUI();
      }).catch((err) => {
        console.log('Name set error', err);
        this.showUI();
      });
    });

    this.ui.init();
    this.engine.onDisconnect(this.showUI.bind(this));
    this.engine.onConnect(this.ui.hide.bind(this.ui));

    return this.engine.init().then(clientId => {
      var peerId = Utility.getPeerId();
      if (!peerId) {
        this.showUI();
        return;
      }
      return this.engine.connectToPeer(peerId);
    }).catch(err => {
      console.log('Engine init error', err);
      this.showUI();
    });
  };

  return Controller;
})();
