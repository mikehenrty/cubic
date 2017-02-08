'use strict';

var os = require('os');
var ws = require('ws');
var http = require('http');
var nodeStatic = require('node-static');

var console = require('./lib/console_debug.js');
var ClientList = require('./lib/client_list.js');

const CONST = require('./const');
const BASE_URL = `http:\/\/${os.hostname()}:${CONST.PORT}\/`;
const SERVER_COMMANDS = [
  'register', 'list', 'setname', 'setstatus'
];

var server, staticFile, websockets;
var clients = new ClientList();
console.setDebug(CONST.DEBUG);

// Web Server.
staticFile = new nodeStatic.Server(CONST.SITE_PATH, { cache: false});
server = http.createServer((req, res) => {
  req.addListener('end', staticFile.serve.bind(staticFile, req, res)).resume();
}).listen(CONST.PORT);
console.log(`Listening on ${BASE_URL}`);

// WebSocket Server.
websockets = new ws.Server({ server: server, port: CONST.WS_PORT });
websockets.on('connection', socket => {
  socket.on('message', message => {
    handleMessage(socket, message);
    if (CONST.DEBUG) { clients.printList(); }
  });

  socket.on('close', () => {
    console.debug(`disconnect ${clients.getName(socket)}`);
    clients.remove(socket);
    broadcastListUpdate(socket);
    if (CONST.DEBUG) { clients.printList(); }
  });
});

function handleMessage(socket, message) {
  var parts = message.split(' ');
  var type = parts.shift();
  var recipient = parts.shift();
  var payload = parts.join(' ');

  console.debug(type, clients.getName(socket),
    clients.getName(recipient), payload);

  // First, process messages meant for the server rather than peers.
  if (SERVER_COMMANDS.indexOf(type) !== -1) {
    handleServerCommand(type, payload, socket);
    return;
  }

  // Make sure the recipienct exists.
  var client = clients.get(recipient);
  if (!client) {
    console.debug(`unrecognized ${recipient} ${clients.getIdList()}`);
    socket.send(`error ${type}_ack ${recipient} ${payload}`);
    return;
  }

  // Append client's name to ask requests.
  if (type === 'ask') {
    payload = clients.getName(socket);
  }

  // Pass message on to recipient, whatever it may mean.
  var response = `${type} ${clients.getId(socket)} ${payload}`;
  console.debug(`sending ${response}`);
  client.socket.send(response);
}

function handleServerCommand(type, payload, socket) {
  var response = '';

  switch (type) {
    case 'register':
      var client = clients.add(socket, payload);
      response = `${client.clientId} ${client.name}`;
      break;

    case 'list':
      response = clients.getListAsString();
      break;

    case 'setname':
      if (!clients.setName(socket, payload)) {
        console.debug(`name ${clients.getId(socket)} ${payload}`);
        socket.send(`error setname_ack ${null} ${payload}`);
        return;
      }

      response = `${clients.getName(socket)}`;
      break;

    case 'setstatus':
      if (!clients.setStatus(socket, payload)) {

      }
      response = `${null} ${payload}`;
      break;
  }

  socket.send(`${type}_ack ${clients.getId(socket)} ${response}`);

  if (type !== 'list') {
    broadcastListUpdate(socket);
  }
}

function broadcastListUpdate(excludedSocket) {
  var list = clients.getListAsString();
  clients.getInfoList().forEach(client => {
    if (client.status !== 'playing' && client.socket !== excludedSocket) {
      client.socket.send(`list_update ${null} ${list}`);
    }
  });
}
