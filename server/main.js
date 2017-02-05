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
    console.debug(`disconnect ${clients.getName(socket.clientId)}`);
    clients.remove(socket.clientId);
    broadcastListUpdate(socket);
    if (CONST.DEBUG) { clients.printList(); }
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
  var response = `${type} ${sender} ${payload}`;
  console.debug(`sending ${response}`);
  clients.send(recipient, response);
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
      response = `${clients.getName(sender)}`;
      break;

    case 'setstatus':
      if (!clients.setStatus(sender, payload)) {

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
  clients.getInfoList().forEach(info => {
    if (info.status !== 'playing' && info.socket !== excludedSocket) {
      info.socket.send(`list_update ${null} ${list}`);
    }
  });
}
