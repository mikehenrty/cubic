'use strict';

var clientCount = 0;
var clientNames = {};

function guidToNiceName(guid) {
  if (guid === '') {
    return '---';
  }
  if (clientNames[guid]) {
    return clientNames[guid]
  }
  clientNames[guid] = 'client_' + ++clientCount;
  return clientNames[guid];
}

module.exports = {
  guidToNiceName: function(guid) {
    if (Array.isArray(guid)) {
      return guid.map(id => {
        return guidToNiceName(id);
      });
    }

    return guidToNiceName(guid);
  },

  guid: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  },

  getPathFromUrl: function(url) {
    url = url.split('?')[0];
    if (url.endsWith('/')) {
      url += 'index.html';
    }
    return url;
  }
};
