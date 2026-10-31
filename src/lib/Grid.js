
const { Sprite, Pool } = kontra;

export default class Grid {
    constructor(config) {
        this.numberOfRows = config.numberOfRows;
        this.numberOfCols = config.numberOfCols;
        this.cellSize = config.cellSize;
        this.color = config.color;
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
            color: 'grey',
            width: this.width,
            height: this.height,
        });

        this.createGridLines();
    }

    createGridLines() {
        // Vertical lines, including the right border.
        for (let col = 0; col <= this.numberOfCols; col++) {
            this.gridSpritesPool.get({
                x: this.x + col * this.cellSize,
                y: this.y,
                color: this.color,
                width: 1,
                height: this.height,
            });
        }

        // Horizontal lines, including the bottom border.
        for (let row = 0; row <= this.numberOfRows; row++) {
            this.gridSpritesPool.get({
                x: this.x,
                y: this.y + row * this.cellSize,
                color: this.color,
                width: this.width,
                height: 1,
            });
        }
    }

    render() {
        if (this.backgroundSprite) {
            const context = this.backgroundSprite.context;
            const previousAlpha = context.globalAlpha;

            context.globalAlpha = 0.2;
            this.backgroundSprite.render();
            context.globalAlpha = previousAlpha;
        }

        this.gridSpritesPool.render();
    }
}
