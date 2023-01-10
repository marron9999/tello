var server = "127.0.0.1";
var ws;
function elm(id) {
	return document.getElementById(id);
}
function online(sw) {
	elm("connect1").style.display = (sw>0)? "none" : "inline-block";
	elm("takeoff0").style.display = (sw>0)? "none" : "inline-block";
	elm("stream0" ).style.display = (sw>0)? "none" : "inline-block";
	sw = (sw>0)? "inline-block" : "none";
	elm("connect0").style.display = sw;
	elm("stream1" ).style.display = sw;
	elm("poweroff").style.display = sw;
	elm("takeoff1").style.display = sw;
}
function offline(id) {
	return document.getElementById(id);
}
window.onload = function() {
	let canvas = elm('video-canvas');
	let url = 'ws://' + server + ':8081/stream';
	let player = new JSMpeg.Player(url, {canvas: canvas, audio: false});

	ws = new WebSocket('ws://' + server + ':8082');
	ws.onmessage = function (event) {
		if(event.data == "command ok") {
			return;
		}
		if(event.data == "connect ok") {
			connected(1);
		} else
		if(event.data == "disconnect ok") {
			connected(0);
		} else
		if(event.data == "streamon ok") {
			elm('video-canvas').style.display = "inline-block";
		} else
		if(event.data == "streamoff ok") {
			elm('video-canvas').style.display = "none";
		}
		let json = {};
		let er=1;
		try {
			eval("json = {" +  event.data.replace(/;/g, ",") + "};");
			er=0;
		} catch(e) { }
		for(let name in json) {
			let e = elm(name);
			if(e == null) er++;
			else {
				if(e.innerHTML == "" + json[name]) {
					e.style.backgroundColor = "#fff0";
				} else {
					e.style.backgroundColor = "#ff88";
					e.innerHTML = "" + json[name];
				}
			}
		}
		if(er>0) {
			let e = elm('tello-message');
			let p = e.innerHTML.indexOf("</div>");
			e.innerHTML = e.innerHTML.substr(p+6)
				+ "<div>" + event.data + "</div>";
			e.scrollBy(0, 9999);
		}
	}

	document.body.addEventListener("keydown", keydown);
	document.body.addEventListener("keyup", keyup);
}

var vkey = 0;
function keydown(event) {
	if(vkey != 0) return;
	if(event.code == "KeyW") {
		vkey = event.code;
		elm("ru").style.display = "inline-block";
		let cmd = "up 20";
		ws.send(cmd);
	}
	if(event.code == "KeyS") {
		vkey = event.code;
		elm("rd").style.display = "inline-block";
		let cmd = "down 20";
		ws.send(cmd);
	}
	if(event.code == "KeyA") {
		vkey = event.code;
		elm("rl").style.display = "inline-block";
		let cmd = "ccw 30";
		ws.send(cmd);
	}
	if(event.code == "KeyD") {
		vkey = event.code;
		elm("rr").style.display = "inline-block";
		let cmd = "cw 30";
		ws.send(cmd);
	}
	if(event.code == "ArrowUp") {
		vkey = event.code;
		elm("g0").style.display = "inline-block";
		let cmd = "forward 20";
		ws.send(cmd);
	}
	if(event.code == "ArrowDown") {
		vkey = event.code;
		elm("g6").style.display = "inline-block";
		let cmd = "back 20";
		ws.send(cmd);
	}
	if(event.code == "ArrowLeft") {
		vkey = event.code;
		elm("g9").style.display = "inline-block";
		let cmd = "left 20";
		ws.send(cmd);
	}
	if(event.code == "ArrowRight") {
		vkey = event.code;
		elm("g3").style.display = "inline-block";
		let cmd = "right 20";
		ws.send(cmd);
	}
}
function keyup(event) {
	if(vkey == 0) return;
	if(vkey != event.code) return;
	vkey = 0;
	if(event.code == "KeyW") {
		elm("ru").style.display = "none";
	}
	if(event.code == "KeyS") {
		elm("rd").style.display = "none";
	}
	if(event.code == "KeyA") {
		elm("rl").style.display = "none";
	}
	if(event.code == "KeyD") {
		elm("rr").style.display = "none";
	}
	if(event.code == "ArrowUp") {
		elm("g0").style.display = "none";
	}
	if(event.code == "ArrowDown") {
		elm("g6").style.display = "none";
	}
	if(event.code == "ArrowLeft") {
		elm("g9").style.display = "none";
	}
	if(event.code == "ArrowRight") {
		elm("g3").style.display = "none";
	}
}

function connect(sw) {
	if(sw > 0) {
		ws.send("connect");
		return;
	}
	ws.send("disconnect");
}
function connected(sw) {
	if(sw > 0) {
		elm("connect1").style.display = "none";
		elm("connect0").style.display = "inline-block";
		elm("stream0" ).style.display = "inline-block";
		elm("stream1" ).style.display = "inline-block";
		elm("takeoff1").style.display = "inline-block";
		elm("takeoff0").style.display = "inline-block";
		elm("poweroff").style.display = "inline-block";
		elm("table3").style.display = "inline-block";
		elm("tableG").style.display = "inline-block";
		return;
	}
	elm("connect1").style.display = "inline-block";
	elm("connect0").style.display = "none";
	elm("stream0" ).style.display = "none";
	elm("stream1" ).style.display = "none";
	elm("takeoff1").style.display = "none";
	elm("takeoff0").style.display = "none";
	elm("poweroff").style.display = "none";
	elm("table3").style.display = "none";
	elm("tableG").style.display = "none";
}
function stream(sw) {
	if(sw > 0) {
		ws.send("streamon");
		return;
	}
	ws.send("streamoff");
}
function takeoff(sw) {
	if(sw > 0) {
		ws.send("takeoff");
		elm("img1").className = "go";
		elm("img2").className = "go";
		elm("img3").className = "go";
		elm("img4").className = "go";
		return;
	}
	if(sw < 0) {
		ws.send("emergency");
		elm("img1").className = "";
		elm("img2").className = "";
		elm("img3").className = "";
		elm("img4").className = "";
		return;
	}
	ws.send("land");
	elm("img1").className = "";
	elm("img2").className = "";
	elm("img3").className = "";
	elm("img4").className = "";
}
