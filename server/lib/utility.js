'use strict';

module.exports = {
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
