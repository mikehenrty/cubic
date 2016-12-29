'use strict';

var os = require('os');
var path = require('path');
var ws = require('ws');
var http = require('http');
var nodeStatic = require('node-static')
var console = require('./lib/console_debug.js');
var Utility = require('./lib/utility.js');

const DEBUG = false;  // set to true for debug logging.
const PORT = 8021;
const WS_PORT = 8022;
const BASE_URL = `http:\/\/${os.hostname()}:${PORT}\/`;
const BASE_PATH = path.resolve(__dirname, '../');
const SITE_PATH = path.resolve(BASE_PATH, 'client');

var server, staticFile, websockets;
var clients = {}; // websocket clients
console.setDebug(DEBUG);

function debugClientList() {
  console.debug(`LIST: ${Utility.guidToNicename(Object.keys(clients))}`);
}

// Web Server.
staticFile = new nodeStatic.Server(SITE_PATH);
server = http.createServer((req, res) => {
  req.addListener('end', staticFile.serve.bind(staticFile, req, res)).resume();
}).listen(PORT)

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
