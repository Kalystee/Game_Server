let ServerItem = require('../Utils/ServerItem');
let Vector2 = require('../Vector2');
module.exports = class AIBase extends ServerItem{
    constructor(){
        super();
        this.username = "AI_Base";
        this.health = new Number(100);
        this.isDead = false;
        this.respawnTicker = new Number(0);
        this.respawnTime = new Number(0);
    }

    onUpdate(onUpdatePosition){
        //Calculate StateMachine
    }

    respawnCounter(){
        this.respawnTicker = this.respawnTicker +1;
        if(this.respawnTicker >= 10){
            this.respawnTicker = new Number(0);
            this.respawnTime = this.respawnTime + 1;

            //3s respawn
            if(this.respawnTime >= 3){
                console.log("Respawning player id:"+this.id);
                this.isDead = false;
                this.respawnTicker = new Number(0);
                this.respawnTime = new Number(0);
                this.health = new Number(100);
                this.position = new Vector2(0,0); //Respawn point

                return true;
            }
        }
        return false;
    }
    dealDamage(amount = Number){
        //Adjust Health
        this.health = this.health - amount;

        //Check if dead
        if(this.health <= 0){
            this.isDead = true;
            this.respawnTicker = new Number(0);
            this.respawnTime = new Number(0);
        }
        return this.isDead;
    }
}