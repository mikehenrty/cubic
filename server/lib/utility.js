'use strict';

var clientCount = 0;
var clientNames = {};
var clientIds = {};

function guidToNicename(guid, suggestedNicename) {
  if (guid === undefined || guid === '') {
    return '---';
  }
  if (clientNames[guid]) {
    // YUCK
    suggestedNicename && module.exports.setNicename(guid, suggestedNicename);
    return clientNames[guid];
  }

  // Make sure the suggested nicename is not in use.
  var name = (suggestedNicename && !clientIds[suggestedNicename]) ?
    suggestedNicename : 'Player_' + ++clientCount;
  clientNames[guid] = name;
  clientIds[name] = guid;

  return name;
}

module.exports = {
  guidToNicename: function(guid, suggestedNicename) {
    if (Array.isArray(guid)) {
      return guid.map(id => {
        return guidToNicename(id, suggestedNicename);
      });
    }

    return guidToNicename(guid, suggestedNicename);
  },

  // TODO: Bad practic, refactor to Name manager.
  deleteGuid: function(guid) {
    delete clientIds[clientNames[guid]];
    delete clientNames[guid];
  },

  setNicename: function(guid, name) {
    if (!clientNames[guid] || clientIds[name]) {
      return false;
    }

    // Remove old name.
    delete clientIds[clientNames[guid]];
    clientNames[guid] = name;
    clientIds[name] = guid;
    return true;
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
