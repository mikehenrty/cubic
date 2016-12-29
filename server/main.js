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
  console.debug(`LIST: ${Utility.guidToNicename(Object.keys(clients))}`);
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
    console.debug(`disconnect ${Utility.guidToNicename(socket.clientId)}`);
    delete clients[socket.clientId];
    Utility.deleteGuid(socket.clientId);
    debugClientList();
  });
});

function handleMessage(socket, message) {
  var sender = socket.clientId || '';
  var parts = message.split(' ');
  var type = parts.shift();
  var recipient = parts.shift();
  var payload = parts.join(' ');

  console.debug('\n', type, Utility.guidToNicename(sender),
    Utility.guidToNicename(recipient), payload);

  // Register is the only message handled by the server.
  if (type === 'register') {
    var newClientId = Utility.guid();
    var clientName = Utility.guidToNicename(newClientId, payload);
    clients[newClientId] = socket;
    socket.clientId = newClientId;
    socket.send(`register_ack ${sender} ${newClientId} ${clientName}`);
    return;
  }

  if (type === 'list') {
    var listInfo = Object.keys(clients).map((clientId) => {
      return {
        clientId: clientId,
        clientName: Utility.guidToNicename(clientId)
      };
    });
    socket.send(`list_ack ${sender} ${JSON.stringify(listInfo)}`);
    return;
  }

  if (type === 'setname') {
    if (!Utility.setNicename(sender, payload)) {
      console.debug(`name ${sender} ${payload}`);
      socket.send(`error ${type}_ack ${recipient} ${payload}`);
      return;
    }

    socket.send(`setname_ack ${sender} ${recipient} ${payload}`);
    return;
  }

  // Pass message on to recipient, whatever it may mean.
  if (!clients[recipient]) {
    console.debug(`unrecognized ${recipient} ${Object.keys(clients)}\n`);
    socket.send(`error ${type}_ack ${recipient} ${payload}`);
    return;
  }

  // Append client's nicename to ask requests.
  if (type === 'ask') {
    payload = Utility.guidToNicename(sender);
  }

  var message = `${type} ${sender} ${payload}`;
  console.debug(`sending ${message}\n`);
  clients[recipient].send(message);
}
