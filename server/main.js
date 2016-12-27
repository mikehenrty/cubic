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

var server, websockets;
var clients = {}; // websocket clients
console.setDebug(DEBUG);

function debugClientList() {
  console.debug(`LIST: ${Utility.guidToNiceName(Object.keys(clients))}`);
}


// Web Server.
server = StaticServer.create(PORT);
console.log(`Listening on ${BASE_URL}`);

// WebSocket Server.
websockets = new ws.Server({ server: server, port: WS_PORT });
websockets.on('connection', socket => {
  socket.on('message', message => {
    handleMessage(socket, message);
    debugClientList();
  });

  socket.on('close', () => {
    console.debug(`disconnect ${Utility.guidToNiceName(socket.clientId)}`);
    delete clients[socket.clientId];
    debugClientList();
  });
});

function handleMessage(socket, message) {
  var sender = socket.clientId || '';
  var parts = message.split(' ');
  var type = parts.shift();
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
    socket.send(`register_ack ${newClientId} ${clientName}`);
    return;
  }

  if (type === 'list') {
    var listInfo = Object.keys(clients).map((clientId) => {
      return {
        clientId: clientId,
        clientName: Utility.guidToNiceName(clientId)
      };
    });
    socket.send(`list_ack ${JSON.stringify(listInfo)}`);
    return;
  }

  if (type === 'setname') {
    if (!Utility.setNiceName(sender, payload)) {
      console.debug(`name ${sender} ${payload}`);
      socket.send(`error ${type} ${recipient} ${payload}`);
      return;
    }

    socket.send(`setname_ack ${sender} ${recipient} ${payload}`);
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
}
