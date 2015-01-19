var express = require('express');
var app = express();
var port = 7780;
var io = require('socket.io').listen(app.listen(port, "0.0.0.0"));

app.set("view options", {layout: false});
app.use(express.static(__dirname))
   .use('/js', express.static(__dirname+'/js'))
   .use('/json', express.static(__dirname+'/json'))
   .use('/css', express.static(__dirname+'/css'))
   .get('/', function(request, response) {
       response.sendFile(__dirname+'/websocket-control-reference.html');
   });

var dgram = require("dgram");
var client = dgram.createSocket("udp4");

client.on("listening", function() {
	client.setBroadcast(true);
	client.addMembership("239.255.50.10");
});

client.on("message", function(message, remote) {
	console.log(message.length, message);
	io.sockets.emit('dcs-bios-data', message);
});

client.bind(5010, "127.0.0.1");

io.sockets.on('connection', function(socket) {
	socket.on('dcs-bios-send', function(data) {
		var message = new Buffer(data);
		 client.send(message, 0, message.length, 7778, "127.0.0.1");
	});
});

process.on('uncaughtException', function(err) {
    console.log("UNCAUGHT EXCEPTION: ", err.stack);
});
