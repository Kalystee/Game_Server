//ws://127.0.0.1:5252/socket.io/?EIO=4&transport=websocket
//ws://multiplayer-game-tank.herokuapp.com:80/socket.io/?EIO=4&transport=websocket


let io = require('socket.io')(process.env.PORT || 5252);
let Server = require("./Classes/Server");

console.log('Server has started');

let server = new Server();
setInterval(() => {
    server.onUpdate();
},100,0);

io.on("connection", function (socket) {
    let connection = server.onConnected(socket);
    connection.createEvents();
    connection.socket.emit('register',{'id':connection.player.id});
});