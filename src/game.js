
import Grid from './grid.js';
import Board from './board.js';
import Block from './block.js';

const { init, GameLoop, initPointer, track, load, on, Pool } = kontra;

const MOVES_PER_GAME = 20;
const RECORD_KEY = 'sugar-pop-record';

export default class Game {
    constructor(width, height) {
        // Guarda el tamaño del área de juego y configura las dimensiones del tablero.
        this.width = width;
        this.height = height;

        this.numberOfCols = 8;
        this.numberOfRows = 8;
        this.blockSize = 48;
        this.cellGap = 6;

        // Centra el tablero horizontalmente y deja espacio arriba para la interfaz.
        this.gridX = (width - this.numberOfCols * this.cellSize) / 2;
        this.gridY = (height - this.numberOfRows * this.cellSize) / 2 + 72;

        // Estado de selección, puntuación y control de la partida.
        this.selectedBlock = null;
        this.targetBlock = null;
        this.isBoardBlocked = false;
        this.score = 0;
        this.moves = MOVES_PER_GAME;
        this.record = this.loadRecord();
        this.isPlaying = false;
        this.onGameOver = null;
        this.gameLoopStarted = false;
        this.init();
    }

    init() {
        // Prepara el canvas, los controles del puntero, el bucle y la cuadrícula.
        const { canvas, context } = init();

        this.canvas = canvas;
        this.context = context;

        initPointer();

        this.gameLoop = GameLoop({
            update: () => this.update(),
            render: () => this.render(),
        });

        this.createGrid();
        this.load();
    }

    // Tamaño total de una celda, incluyendo el espacio entre bloques.
    get cellSize() {
        return this.blockSize + this.cellGap;
    }

    // Calcula la posición horizontal de un bloque según su columna.
    getBlockX(col) {
        return this.gridX + this.cellGap / 2 + col * this.cellSize;
    }

    // Calcula la posición vertical de un bloque según su fila.
    getBlockY(row) {
        return this.gridY + this.cellGap / 2 + row * this.cellSize;
    }

    render() {
        // Dibuja la cuadrícula y limita los bloques al área del tablero.
        this.grid.render();

        if (this.blockPool) {
            this.context.save();
            this.context.beginPath();
            this.context.rect(this.gridX, this.gridY, this.grid.width, this.grid.height);
            this.context.clip();
            for (const block of this.blockPool.getAliveObjects()) {
                block.context.globalAlpha = block.isSelected
                    ? 0.6 + Math.sin(Date.now() / 120) * 0.3
                    : 1;
                block.render();
                block.context.globalAlpha = 1;
            }
            this.context.restore();
        }
    }

    // Actualiza la animación de los bloques activos
    update() {
        this.blockPool?.update();
    }

    load() {
        // Conserva la ruta de cada imagen como identificador del recurso cargado.
        on('assetLoaded', this.handleAssetLoaded ??= (asset, url) => {
            asset.id = url;
        });

        // Carga las imágenes antes de crear los bloques.
        this.ready = load(
            'img/corazon.png',
            'img/estrella.png',
            'img/caramelo.png',
            'img/piruleta.png',
            'img/osito.png',
            'img/donut.png',
        )
            .then((assets) => {
                this.assets = assets;
            })
            .catch((error) => {
                console.error('Error loading game assets:', error);
                throw error;
            });
    }

    async start() {
        // Espera a que se carguen las imágenes antes de iniciar la partida.
        await this.ready;

        this.score = 0;
        this.moves = MOVES_PER_GAME;
        this.isPlaying = true;
        this.isBoardBlocked = true;
        this.selectedBlock = null;
        this.updateHud();

        this.createBoard();
        this.drawBoard();
        this.board.consoleLog();

        if (!this.gameLoopStarted) {
            this.gameLoop.start();
            this.gameLoopStarted = true;
        }

        // Evita interacciones mientras los bloques entran en el tablero.
        setTimeout(() => {
            this.isBoardBlocked = false;
        }, 600);
        }

    // Crea la cuadrícula visual que sirve de fondo al tablero.
    createGrid() {
        this.grid = new Grid({
            numberOfRows: this.numberOfRows,
            numberOfCols: this.numberOfCols,
            cellSize: this.cellSize,
            x: this.gridX,
            y: this.gridY,
            color: '#ffb3d1',
            background: '#fff0f6',
        });
    }

    // Crea la lógica del tablero y el conjunto reutilizable de bloques.
    createBoard() {
        this.board = new Board(
            this,
            this.numberOfRows,
            this.numberOfCols,
            6,
            false,
        );

        this.blockPool = Pool({
            create: () => new Block(),
        });
    }

    // Crea un bloque con la imagen correspondiente a su valor en la matriz.
    createBlock(row, col, startRow = row) {
        const block = this.blockPool.get({
            x: this.getBlockX(col),
            y: this.getBlockY(startRow),
            row,
            col,
            image: this.assets[this.board.grid[row][col] - 1],
            ttl: Infinity,
        });

        // La posición inicial puede estar fuera del tablero para animar la caída.
        block.targetX = this.getBlockX(col);
        block.targetY = this.getBlockY(row);
        block.isSelected = false;
        block.onDown = () => this.pickBlock(block);

        track(block);

        return block;
    }

    drawBoard() {
        // Coloca todos los bloques inicialmente por encima de sus posiciones finales.
            for (let row = 0; row < this.numberOfRows; row++) {
                for (let col = 0; col < this.numberOfCols; col++) {
                    this.createBlock(row, col, row - this.numberOfRows);
                }
            }
        }

        pickBlock(block) {
            // Ignora clics si la partida no está activa o el tablero está ocupado.
            if (this.isBoardBlocked || !this.isPlaying) return;

            // El primer clic selecciona el bloque.
            if (!this.selectedBlock) {
                block.isSelected = true;
                this.selectedBlock = block;
                return;
            }

            // Clicar otra vez el mismo bloque cancela la selección.
            if (block === this.selectedBlock) {
                this.clearSelection();
                return;
            }

            this.targetBlock = block;

            // Solo se permite intercambiar bloques que estén uno junto al otro.
            if (!this.board.checkAdjacent(this.selectedBlock, block)) {
                this.clearSelection();
                return;
            }

            this.isBoardBlocked = true;

            this.swapBlocks(this.selectedBlock, this.targetBlock);
        }

        // Cambia las posiciones de destino para animar visualmente el intercambio.
        swapVisualPositions(block1, block2) {
            [block1.targetX, block2.targetX] = [block2.targetX, block1.targetX];
            [block1.targetY, block2.targetY] = [block2.targetY, block1.targetY];
        }

        swapBlocks(block1, block2) {
            // Actualiza tanto la animación como la matriz lógica del tablero.
            this.swapVisualPositions(block1, block2);
            this.board.swap(block1, block2);

            const chains = this.board.findAllChains();

            // Un intercambio sin combinaciones se deshace; uno válido consume un movimiento.
            if (chains.length > 0) {
                this.moves--;
                this.updateHud();

                setTimeout(() => this.updateBoard(), 250);
                return;
            }

            setTimeout(() => {
                this.swapVisualPositions(block1, block2);
                this.board.swap(block1, block2);

                this.clearSelection();
            }, 250);
        }

        clearSelection() {
            // Quita el resaltado y permite volver a interactuar con el tablero.
            if (this.selectedBlock) {
                this.selectedBlock.isSelected = false;
            }

            this.selectedBlock = null;
            this.targetBlock = null;
            this.isBoardBlocked = false;
        }

        updateBoard(cascadeCount = 0) {
            // Busca combinaciones, las elimina y repite el proceso por las caídas en cadena.
            const chains = this.board.findAllChains();

            if (chains.length === 0 || cascadeCount >= 20) {
                this.clearSelection();

                if (this.moves <= 0) {
                    this.endGame();
                }
                return;
            }

            // Las cadenas consecutivas otorgan multiplicadores crecientes.
            this.score += chains.length * 10 * (cascadeCount + 1);
            this.updateHud();
            this.board.clearChains();
            this.board.updateGrid();

            if (this.board.isDebug) {
                this.board.consoleLog();
            }

            setTimeout(() => {
                this.updateBoard(cascadeCount + 1);
            }, 350);
        }

        updateHud() {
            // Sincroniza la puntuación, el récord y los movimientos con el HTML.
            document.getElementById('score').textContent = this.score;
            document.getElementById('record').textContent = Math.max(this.score, this.record);
            document.getElementById('moves').textContent = this.moves;
            document.getElementById('start-record').textContent = this.record;
        }

        endGame() {
            // Detiene la partida y guarda el récord si se ha superado.
            const isNewRecord = this.score > this.record;

            this.isPlaying = false;
            this.isBoardBlocked = true;

            if (isNewRecord) {
                this.record = this.score;
                this.saveRecord();
            }

            this.onGameOver?.(this.score, this.record, isNewRecord);
        }

        loadRecord() {
            // Recupera el récord guardado en el navegador; si no existe, empieza en cero.
            try {
                return Number(localStorage.getItem(RECORD_KEY)) || 0;
            } catch (error) {
                console.warn('No se pudo leer el récord guardado:', error);
                return 0;
            }
        }

        saveRecord() {
            // Persiste el récord para futuras partidas en este navegador.
            try {
                localStorage.setItem(RECORD_KEY, this.record);
            } catch (error) {
                console.warn('No se pudo guardar el récord:', error);
            }
        }

        getBlockFromColRow({ row, col }) {
            // Busca el bloque activo que ocupa una celda concreta.
            const blocks = this.blockPool.getAliveObjects();

            for (const block of blocks) {
                if (block.isAlive() && block.row === row && block.col === col) {
                    return block;
                }
            }

            return undefined;
        }

        dropBlock(sourceRow, targetRow, col) {
            // Mueve un bloque existente a otra fila y actualiza su destino visual.
            const block = this.getBlockFromColRow({
                row: sourceRow,
                col,
            });

            if (!block) {
                throw new Error(
                    `Block not found at row ${sourceRow}, col ${col}`,
                );
            }

            block.row = targetRow;
            block.targetY = this.getBlockY(targetRow);
        }

        dropReserveBlock(sourceRow, targetRow, col) {
            // Crea un bloque de reserva fuera del tablero para que caiga en la columna.
            return this.createBlock(targetRow, col, sourceRow - this.numberOfRows);
        }
    }
