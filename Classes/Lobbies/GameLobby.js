let LobbyBase = require("./LobbyBase");
let GameLobbySettings = require("./GameLobbySetting");
let Connection = require("../Connection");
let Bullet = require("../Bullet");

module.exports = class GameLobby extends LobbyBase {
    constructor(id,settings = GameLobbySettings){
        super(id);
        this.settings = settings;
        this.bullets = [];
    }

    onUpdate(){
        let lobby = this;

        lobby.updateBullets();
        lobby.updateDeadPlayers();
    }

    canEnterLobby(connection = Connection){
        let lobby = this;
        let maxPlayerCount = lobby.settings.maxPlayers;
        let currentPlayerCount = lobby.connections.length;

        return currentPlayerCount + 1 <= maxPlayerCount;

    }

    onEnterLobby(connection = Connection){
        console.log("EnterGameLobby");
        let lobby = this;
        super.onEnterLobby(connection);
        lobby.addPlayer(connection);
        //Handle spawning any server spawned object (loot, bullet etc)
    }

    onLeaveLobby(connection = Connection){
        let lobby = this;
        super.onLeaveLobby(connection);
        lobby.removePlayer(connection);
        //Handle unspawning any server spawned object (loot, bullet etc)
    }

    updateBullets() {
        let lobby = this;
        let bullets = lobby.bullets;
        let connections = lobby.connections;

        bullets.forEach(bullet => {
            let isDestroyed = bullet.onUpdate();

            if(isDestroyed) {
                lobby.despawnBullet(bullet);
            } else {
                var returnData = {
                    id: bullet.id,
                    position: {
                        x: bullet.position.x.toString(),
                        y: bullet.position.y.toString()
                    }
                };

                connections.forEach(connection => {
                    connection.socket.emit('updatePosition', returnData);
                });
            }
        });
    }

    updateDeadPlayers(){
        let lobby = this;
        let connections = lobby.connections;

        connections.forEach(connection => {
            let player = connection.player;

            if(player.isDead){
                let isRespawn = player.respawnCounter();
                if(isRespawn){
                    let socket = connection.socket;
                    let returnData = {
                        id: player.id,
                        position: {
                            x: player.position.x,
                            y: player.position.y
                        }
                    };

                    socket.emit('playerRespawn',returnData);
                    socket.broadcast.to(lobby.id).emit('playerRespawn',returnData);
                }
            }
        })
    }

    onFireBullet(connection = Connection, data) {
        let lobby = this;

        let bullet = new Bullet();
        bullet.name = 'Bullet';
        bullet.activator = data.activator;
        bullet.position.x = parseFloat(data.position.x);
        bullet.position.y = parseFloat(data.position.y);
        bullet.direction.x = parseFloat(data.direction.x);
        bullet.direction.y = parseFloat(data.direction.y);

        lobby.bullets.push(bullet);

        var returnData = {
            name: bullet.name,
            id: bullet.id,
            activator: bullet.activator,
            position: {
                x: bullet.position.x.toString(),
                y: bullet.position.y.toString()
            },
            direction: {
                x: bullet.direction.x.toString(),
                y: bullet.direction.y.toString()
            },
            speed: bullet.speed.toString()
        };

        connection.socket.emit('serverSpawn', returnData);
        connection.socket.broadcast.to(lobby.id).emit('serverSpawn', returnData); //Only broadcast to those in the same lobby as us
    }

    onCollisionDestroy(connection = Connection,data){
        let lobby = this;
        let returnBullets = lobby.bullets.filter(bullet => {
            return bullet.id === data.id;
        });

        returnBullets.forEach(bullet =>{
            let playerHit = false;

            lobby.connections.forEach(c =>{
                let player = c.player;
                if(bullet.activator !== player.id) {
                    let distance = bullet.position.Distance(player.position);

                    if (distance < 1.05) {
                        let isDead = player.dealDamage(50); //test deal damage
                        if (isDead) {
                            console.log("Player with id : " + player.id + " has died");
                            let returnData = {
                                id: player.id
                            };
                            c.socket.emit("playerDied", returnData);
                            c.socket.broadcast.to(lobby.id).emit("playerDied", returnData);
                        } else {
                            console.log("Player with id: " + player.id + " has (" + player.health + ") health left");
                        }
                        lobby.despawnBullet(bullet);
                    }
                }

            });
            if(!playerHit ){
                bullet.isDestroyed = true;
            }

        });

    }

    despawnBullet(bullet = Bullet){

        let lobby = this;
        let bullets = lobby.bullets;
        let connections = lobby.connections;
        console.log("Destroying bullet ("+bullet.id+')');
        var index = bullets.indexOf(bullet);
        if(index > -1){
            bullets.splice(index,1);

            var returnData = {
                id: bullet.id
            };

            connections.forEach(connection => {
                connection.socket.emit('serverUnspawn',returnData);
            });
        }
    }
    addPlayer(connection = Connection){
        let lobby = this;
        let connections = lobby.connections;
        let socket = connection.socket;

        var returnData = {
            id: connection.player.id
        };

        socket.emit("spawn",returnData);
        socket.broadcast.to(lobby.id).emit("spawn",returnData);

        //Tell myself about everyone else already in the lobby
        connections.forEach(c => {
           if(c.player.id !== connection.player.id){
               socket.emit("spawn",{
                   id: c.player.id
               });
           }
        });
    }

    removePlayer(connection = Connection){
        let lobby = this;

        connection.socket.broadcast.to(lobby.id).emit('disconnected',{
            id: connection.player.id
        })
    }
};