var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');

http.listen(3000);

app.use('/client', express.static(__dirname + '/client'));
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var clients = {};

var Client = function(uuid) {
  this.position = [0.0, 0.0, 0.0];
  this.uuid = uuid;
};

io.on('connection', function(socket) {
  var ip = socket.request.connection.remoteAddress;
  var client = new Client(uuid.v4());
  clients[client.uuid] = client;

  socket.broadcast.emit('newcon', client.uuid);
  socket.emit('register', client.uuid);
  console.log('new socket connection ' + client.uuid + 'with ip ' + ip);

  socket.on('disconnect', function() {
    io.emit('discon', client.uuid);
    console.log('disconnection from ' + client.uuid + 'with ip ' + ip);
    delete clients[client.uuid];
  });

  socket.on("coord update", function(data) {
    socket.broadcast.emit("coord update", JSON.stringify(data));
    console.log('coord update ' + JSON.stringify(data));
  });
});

setInterval(function() {
  console.log("connected users: " + Object.keys(clients).length);
}, 10000);
