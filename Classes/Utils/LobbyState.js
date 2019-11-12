module.exports = class LobbyState {
    constructor(){
        //Predifine states like enum
        this.GAME = "Game";
        this.LOBBY = "Lobby";
        this.ENDGAME = "EndGame";

        this.currentState = this.LOBBY;
    }
}