// http://localhost:8080/index.html

const emu = true;

const http = require('http');
const fs = require('fs');
const ws = require("ws");
const spawn = require('child_process').spawn;
const dgram = require('dgram');

// HTTP and streaming ports
const HTTP_PORT = 8080;
const SOCKET_PORT = 8081
const FFMPEG_PORT = 8083
const STREAM_PORT = 8082

// HostPC's ID and Port
const HOST_IP = '0.0.0.0'
const HOST_PORT = 8890

// Tello's ID and Port
const TELLO_IP = '192.168.10.1'
const TELLO_PORT = 8889

// -----------------
// HTTP serverを作る 
// -----------------
const httpServer = http.createServer(function(request, response) {
	console.log('HTTP:' + HTTP_PORT
		+ ' from ' + request.socket.remoteAddress
		+ ' from ' + request.url);
	fs.readFile(__dirname + '/html/' + request.url, function (err,data) {
		if (err) {
			response.writeHead(404);
			response.end(JSON.stringify(err));
			return;
		}
		response.writeHead(200);
		response.end(data);
	});
});
httpServer.listen(HTTP_PORT);
console.log("Create HTTP server " + HTTP_PORT);

// ----------------------
// Websocket serverを作る
// ----------------------
var connect = null;
var lastcmd = null;
const wsServer = new ws.Server({ port: SOCKET_PORT});
const wsMessage = (client, data) => {
	if(data == "connect") {
		if(connect == null) {
			let req = client.remoteAddress;
			wsServer.clients.forEach((cl) => {
				if (cl.readyState == ws.OPEN) {
					if(cl.remoteAddress == client.remoteAddress) {
						connect = client.remoteAddress;
						cl.send("connect ok");
						wsServer.clients.forEach((cl2) => {
							if (cl2.readyState == ws.OPEN) {
								if(cl2.remoteAddress != req) {
									cl2.send("lock " + req);
								}
							}
						});
						return;
					}
				}
			});
		}
		return;
	}
	if(data == "disconnect") {
		if(connect != null) {
			let req = connect;
			wsServer.clients.forEach((cl) => {
				if (cl.readyState == ws.OPEN) {
					if(connect == client.remoteAddress) {
						connect = null;
						client.send("disconnect ok");
						wsServer.clients.forEach((cl2) => {
							if (cl2.readyState == ws.OPEN) {
								if(req != cl2.remoteAddress) {
									cl2.send("lock no");
								}
							}
						});
						return;
					}
				}
			});
		}
		return;
	}
	if(connect == client.remoteAddress) {
		if(lastcmd == "command") {
			lastcmd = null;
		}
		if(tello_timer != null)
			clearTimeout(tello_timer);
		if(lastcmd == null) {
			lastcmd = data;
			if(emu) {
				udpMessage("ok");
			} else {
				tello_send(data);
			}
		} else {
			client.send("budy: " + data);
		}
	}
};
wsServer.on('connection', (client, request) => {
	console.log("WS connect: "
			+ ' from ' + request.socket.remoteAddress);
	client.remoteAddress = request.socket.remoteAddress;
	client.on('close', () => {
		console.log("WS close: "
				+ ' from ' + client.remoteAddress);
		if(connect == client.remoteAddress) {
			connect = null;
		}
	});
	client.on('message', (data) => {
		console.log("WS recv: " + data
				+ ' from ' + client.remoteAddress);
		wsMessage(client, data);
	});
});
console.log("Create WS server " + SOCKET_PORT);

// --------------------
// Stream serverを作る 
// --------------------
const streamServer = http.createServer((request, response) => {
	console.log(
		'Stream:' + FFMPEG_PORT
		+ ' from ' + request.socket.remoteAddress);
	request.on('data', function(data) {
		wsServer.clients.forEach((cl) => {
			if (cl.readyState == ws.OPEN
			&&  cl.readyStream != true) {
				cl.readyStream = true;
				cl.send("streamon ok");
			}
		});
		wsStreamServer.clients.forEach((cl) => {
			if (cl.readyState == ws.OPEN) {
				cl.send(data);
			}
		});
	});
	request.on('connect', function() {
		console.log('Stream connect:'
			+ ' from ' + request.socket.remoteAddress);
	});
	request.on('close', function() {
		console.log('Stream close:'
			+ ' from ' + request.socket.remoteAddress);
		wsServer.clients.forEach((cl) => {
			if (cl.readyState == ws.OPEN
			&&  cl.readyStream == true) {
				cl.send("streamoff ok");
			}
			cl.readyStream = false;
		});
	});
}).listen(FFMPEG_PORT);
console.log("Create Stream HTTP server " + FFMPEG_PORT);
const wsStreamServer = new ws.Server({ port: STREAM_PORT});
console.log("Create Stream WS server " + STREAM_PORT);

// ----------------------
// TELLOとのUDP通信を作る
// ----------------------
const tello_cb = (error, bytes) => {  if (error) console.log(error); };
const tello_send = (cmd) => {
	if(udpClient != null) {
		console.log("Send: " + cmd + " to UDP");
	 	udpClient.send(cmd, TELLO_PORT, TELLO_IP, tello_cb);
		tello_command();
	}
};
let tello_timer = null;
const udpClient = dgram.createSocket('udp4');
const udpMessage = (message) => {
	if(lastcmd != null) {
		message = lastcmd + " " + message;
		lastcmd = null;
	}
	lastcmd = null;
	if(tello_timer != null) {
		clearTimeout(tello_timer);
	}
	wsServer.clients.forEach((client) => {
		if (client.readyState == ws.OPEN) {
			client.send(message);
		}
	});
	tello_timer = setTimeout(tello_command, 5000);
	return message;
};
udpClient.on('message', (message, remote) => {
	message = "" + message;
	if(message.startsWith("pitch:")) {
		wsServer.clients.forEach((client) => {
			if (client.readyState == ws.OPEN) {
				client.send(message);
			}
		});
		return;
	}
	message = udpMessage(message);
	console.log("UDP: " + remote.address + ':' + remote.port + ' ' + message);
});
udpClient.bind(HOST_PORT, HOST_IP);
console.log("Open UDP " + HOST_IP + " " + HOST_PORT);
const tello_command = () => {
	if(tello_timer != null)
		clearTimeout(tello_timer);
	if(lastcmd == "command")
		lastcmd = null;
	if(lastcmd == null) {
		lastcmd = "command";
		console.log("Send: " + lastcmd + " to UDP");
	 	udpClient.send(lastcmd, TELLO_PORT, TELLO_IP, tello_cb);
	}
	tello_timer = setTimeout(tello_command, 5000);
};

// ----------------
// FFMPEGを起動する
// ----------------
var argc = [
	"-f", 'vfwcap',
	"-i", '0',// 入力ファイルのパス
	"-r", "30",					// フレームレート
	"-s", "640x360",			// "size" にリサイズ
	"-codec:v", "mpeg1video",	// 映像コーデック
	"-b", "400k",				// ビデオレート指定(bits/s 単位) デフォルト200kbit/s
	"-t","06:00:00",
	//"-vf","scale=iw/2:-1",
	"-f", "mpegts",				// 指定フォーマットで出力
	"http://127.0.0.1:" + FFMPEG_PORT + "/stream"// 出力ファイルのパス
];
var args = [
	"-i", "udp://0.0.0.0:11111",// 入力ファイルのパス
	"-r", "30",					// フレームレート
	"-s", "640x360",			// "size" にリサイズ
	"-codec:v", "mpeg1video",	// 映像コーデック
	"-b", "400k",				// ビデオレート指定(bits/s 単位) デフォルト200kbit/s
	"-t","06:00:00",
	//"-vf","scale=iw/2:-1",
	"-f", "mpegts",				// 指定フォーマットで出力
	"http://127.0.0.1:" + FFMPEG_PORT + "/stream"// 出力ファイルのパス
];
if(emu) argv = argc;
var streamer = spawn('ffmpeg', argv);
streamer.stderr.pipe(process.stderr);
streamer.on("exit", function(code){
	console.log("ffmpeg failure:", code);
});
console.log("Start FFMPEG");

tello_command();
