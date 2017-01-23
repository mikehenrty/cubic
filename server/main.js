'use strict';

var os = require('os');
var path = require('path');
var ws = require('ws');
var http = require('http');
var nodeStatic = require('node-static')
var console = require('./lib/console_debug.js');
var ClientList = require('./lib/client_list.js');

const DEBUG = false;  // set to true for debug logging.
const PORT = 8021;
const WS_PORT = 8022;
const BASE_URL = `http:\/\/${os.hostname()}:${PORT}\/`;
const BASE_PATH = path.resolve(__dirname, '../');
const SITE_PATH = path.resolve(BASE_PATH, 'client');

const SERVER_COMMANDS = [
  'register', 'list', 'setname'
];


var server, staticFile, websockets;
var clients = new ClientList();
console.setDebug(DEBUG);

// Web Server.
staticFile = new nodeStatic.Server(SITE_PATH, { cache: false});
server = http.createServer((req, res) => {
  req.addListener('end', staticFile.serve.bind(staticFile, req, res)).resume();
}).listen(PORT);
console.log(`Listening on ${BASE_URL}`);

// WebSocket Server.
websockets = new ws.Server({ server: server, port: WS_PORT });
websockets.on('connection', socket => {
  socket.on('message', message => {
    handleMessage(socket, message);
    DEBUG && clients.printList();
  });

  socket.on('close', () => {
    console.debug(`disconnect ${clients.getName(socket.clientId)}`);
    clients.remove(socket.clientId);
    broadcastListUpdate(socket);
    DEBUG && clients.printList();
  });
});

function handleMessage(socket, message) {
  var sender = socket.clientId || '';
  var parts = message.split(' ');
  var type = parts.shift();
  var recipient = parts.shift();
  var payload = parts.join(' ');

  console.debug(type, clients.getName(sender),
    clients.getName(recipient), payload);

  // First, process messages meant for the server rather than peers.
  if (SERVER_COMMANDS.indexOf(type) !== -1) {
    handleServerCommand(type, payload, socket);
    return;
  }

  // Make sure the recipienct exists.
  if (!clients.exists(recipient)) {
    console.debug(`unrecognized ${recipient} ${clients.getIdList()}`);
    socket.send(`error ${type}_ack ${recipient} ${payload}`);
    return;
  }

  // Append client's name to ask requests.
  if (type === 'ask') {
    payload = clients.getName(sender);
  }

  // Pass message on to recipient, whatever it may mean.
  var message = `${type} ${sender} ${payload}`;
  console.debug(`sending ${message}`);
  clients.send(recipient, message);
}

function handleServerCommand(type, payload, socket) {
  var sender = socket.clientId || '';
  var response = '';

  switch (type) {
    case 'register':
      var client = clients.add(socket, payload);
      socket.clientId = client.id;
      response = `${client.id} ${client.name}`;
      break;

    case 'list':
      response = clients.getListAsString();
      break;

    case 'setname':
      if (!clients.setName(sender, payload)) {
        console.debug(`name ${sender} ${payload}`);
        socket.send(`error setname_ack ${null} ${payload}`);
        return;
      }
      response = `${null} ${payload}`;
      break;
  }

  socket.send(`${type}_ack ${sender} ${response}`);

  if (type !== 'list') {
    broadcastListUpdate(socket);
  }
}

function broadcastListUpdate(excludedSocket) {
  var list = clients.getListAsString();
  clients.getSocketList().forEach(socket => {
    if (socket !== excludedSocket) {
      socket.send(`list_update ${null} ${list}`);
    }
  });
}
