const { Sprite, Pool } = kontra;

export default class Grid {
    constructor(config) {
        this.numberOfRows = config.numberOfRows;
        this.numberOfCols = config.numberOfCols;
        this.cellSize = config.cellSize;
        this.color = config.color;
        this.background = config.background;
        this.x = config.x;
        this.y = config.y;

        this.height = this.numberOfRows * this.cellSize;
        this.width = this.numberOfCols * this.cellSize;

        this.backgroundSprite = null;

        this.gridSpritesPool = Pool({
            create: Sprite,
        });

        this.init();
    }

    init() {
        this.backgroundSprite = Sprite({
            x: this.x,
            y: this.y,
            color: this.background,
            width: this.width,
            height: this.height,
        });

        this.createGridLines();
    }

    createGridLines() {
        // Líneas verticales, incluido el borde derecho.
        for (let col = 0; col <= this.numberOfCols; col++) {
            this.gridSpritesPool.get({
                x: this.x + col * this.cellSize,
                y: this.y,
                color: this.color,
                width: 2,
                height: this.height,
            });
        }

        // Lineas horizontales, incluyendo el borde inferior
        for (let row = 0; row <= this.numberOfRows; row++) {
            this.gridSpritesPool.get({
                x: this.x,
                y: this.y + row * this.cellSize,
                color: this.color,
                width: this.width,
                height: 2,
            });
        }
    }

    render() {
        if (this.backgroundSprite) {
            const context = this.backgroundSprite.context;
            const previousAlpha = context.globalAlpha;

            context.globalAlpha = 0.6;
            this.backgroundSprite.render();
            context.globalAlpha = previousAlpha;
        }

        this.gridSpritesPool.render();
    }
}
