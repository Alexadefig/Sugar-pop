const { Sprite } = kontra;



//indican en qué fila y columna del tablero está la pieza, representan la posición a la que debe moverse, se representa la posición que debe moverse.
export default class Block extends Sprite.class {
    constructor(props = {}) {

        super(props);

        this.row = props.row || 0;
        this.col = props.col || 0;
        this.targetX = null;
        this.targetY = null;
    }


    //llama primero a la actualización de Sprite y luego acerca la pieza un 25 % a su posición objetivo en cada actualización, produciendo un movimiento suave.
    update(dt){
        super.update(dt);

        if (this.targetX !==null) {
            this.x +=(this.targetX - this.x)*0.25;
        }

        if(this.targetY!==null){
            this.y +=(this.targetY-this.y)*0.25;
        }
    }

    //pone ttl en 0 para marcar la pieza como eliminada.

    kill() {
        this.ttl = 0;
    }
}