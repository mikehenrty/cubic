'use strict';

var os = require('os');
var ws = require('ws');
var StaticServer = require('./lib/static_server.js');
var Utility = require('./lib/utility.js');
var console = require('./lib/console_debug.js');

const DEBUG = false;  // set to true for debug logging.
const PORT = 8021;
const WS_PORT = 8022;
const BASE_URL = `http:\/\/${os.hostname()}:${PORT}\/`;

var server, clients, websockets;
console.setDebug(DEBUG);

server = StaticServer.create(PORT);
console.log(`Listening on ${BASE_URL}`);

// WebSockets
clients = {};
websockets = new ws.Server({ server: server, port: WS_PORT });
websockets.on('connection', socket => {
  socket.on('message', message => {
    var parts = message.split(' ');
    var type = parts.shift();
    var sender = parts.shift();
    var recipient = parts.shift();
    var payload = parts.join(' ');

    console.debug('\n', type, Utility.guidToNiceName(sender),
                  Utility.guidToNiceName(recipient), payload);

    // Register is the only message handled by the server.
    if (type === 'register') {
      var newClientId = Utility.guid();
      var clientName = Utility.guidToNiceName(newClientId);
      clients[newClientId] = socket;
      socket.clientId = newClientId;
      console.debug(`LIST: ${Utility.guidToNiceName(Object.keys(clients))}`);
      socket.send(`register_ack ${newClientId} ${clientName}`);
      return;
    }

    // Pass message on to recipient, whatever it may mean.
    if (!clients[recipient]) {
      console.debug(`unrecognized ${recipient} ${Object.keys(clients)}\n`);
      socket.send(`error ${type} ${recipient} ${payload}`);
      return;
    }

    console.debug(`sending ${type}\n`);
    clients[recipient].send(`${type} ${sender} ${payload}`);
  });

  socket.on('close', () => {
    console.debug(`disconnect ${socket.clientId}`);
    delete clients[socket.clientId];
  });
});
