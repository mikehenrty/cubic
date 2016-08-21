'use strict';

var path = require('path');
var fs = require('fs');
var http = require('http');
var Utility = require('./utility.js');

const BASE_PATH = path.resolve(__dirname, '../../');
const SITE_PATH = path.resolve(BASE_PATH, 'client');

function serveFile(req, res) {
  var p = Utility.getPathFromUrl(req.url);
  var filePath = path.resolve(SITE_PATH, './' + p);
  var fileStream = fs.createReadStream(filePath);
  fileStream.on('error', err => {
    if (err.code === 'ENOENT') {
      res.writeHead(404);
      res.end(`404: File not found, ${p}`);
    } else {
      res.writeHead(500);
      res.end(`500: Unknown Server Error`);
    }
  });
  res.writeHead(200);
  fileStream.pipe(res);
}

function createServer(port) {
  var server = http.createServer(serveFile);
  server.listen(port);
  return server;
}

module.exports = {
  create: createServer
};
