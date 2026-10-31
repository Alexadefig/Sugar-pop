export default class Board {
    constructor(state, rows, cols, blockVariations, isDebug = false) {
        this.state = state;
        this.rows = rows;
        this.cols = cols;
        this.blockVariations = blockVariations;
        this.isDebug = isDebug;

        this.grid = [];
        this.reserveGrid = [];

        for (let i = 0; i < rows; i++) {
            this.grid.push([]);
            this.reserveGrid.push([]);
        }

        this.populateGrid();
        this.populateReserveGrid();
    }

    // Genera una cuadrícula inicial sin cadenas
    populateGrid() {
        const maxAttempts = 1000;
        let attempts = 0;

        do {
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this.grid[i][j] =
                        Math.floor(Math.random() * this.blockVariations) + 1;
                }
            }

            attempts++;

            if (this.findAllChains().length === 0) {
                return;
            }
        } while (attempts < maxAttempts);

        throw new Error(
            `No se pudo generar una cuadrícula sin cadenas después de ${maxAttempts} intentos.`
        );
    }

    // Genera la cuadrícula de reserva
    populateReserveGrid() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.reserveGrid[i][j] =
                    Math.floor(Math.random() * this.blockVariations) + 1;
            }
        }
    }

    consoleLog() {
        if (!this.isDebug) return;

        const reserve = this.reserveGrid
            .map((row) => row.join(' '))
            .join('\n');

        const separator = Array(this.cols).fill('-').join(' ');

        const grid = this.grid
            .map((row) => row.join(' '))
            .join('\n');

        console.log(`${reserve}\n${separator}\n${grid}`);
    }

    swap(source, target) {
        const temp = this.grid[target.row][target.col];

        this.grid[target.row][target.col] =
            this.grid[source.row][source.col];

        this.grid[source.row][source.col] = temp;

        const tempRow = source.row;
        const tempCol = source.col;

        source.row = target.row;
        source.col = target.col;

        target.row = tempRow;
        target.col = tempCol;
    }

    checkAdjacent(source, target) {
        const diffRow = Math.abs(source.row - target.row);
        const diffCol = Math.abs(source.col - target.col);

        return (
            (diffRow === 1 && diffCol === 0) ||
            (diffRow === 0 && diffCol === 1)
        );
    }

    // Comprueba si un bloque pertenece a una cadena de tres
    isChained({ row, col }) {
        const variation = this.grid[row]?.[col];

        if (variation == null || variation === 0) {
            return false;
        }

        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
        ];

        for (const [dr, dc] of directions) {
            for (let offset = -2; offset <= 0; offset++) {
                const startRow = row + offset * dr;
                const startCol = col + offset * dc;

                const endRow = startRow + 2 * dr;
                const endCol = startCol + 2 * dc;

                if (
                    this.grid[startRow]?.[startCol] === variation &&
                    this.grid[startRow + dr]?.[startCol + dc] === variation &&
                    this.grid[endRow]?.[endCol] === variation
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    findAllChains() {
        const chained = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.isChained({ row, col })) {
                    chained.push({ row, col });
                }
            }
        }

        return chained;
    }

    clearChains() {
        const chainedBlocks = this.findAllChains();

        for (const block of chainedBlocks) {
            this.grid[block.row][block.col] = 0;
            this.state.getBlockFromColRow(block).kill();
        }
    }

    dropBlock(sourceRow, targetRow, col) {
        this.grid[targetRow][col] = this.grid[sourceRow][col];
        this.grid[sourceRow][col] = 0;

        this.state.dropBlock(sourceRow, targetRow, col);
    }

    dropReserveBlock(sourceRow, targetRow, col) {
        this.grid[targetRow][col] = this.reserveGrid[sourceRow][col];
        this.reserveGrid[sourceRow][col] = 0;

        this.state.dropReserveBlock(sourceRow, targetRow, col);
    }

    updateGrid() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.grid[row][col] !== 0) continue;

                let sourceRow = row - 1;

                while (
                    sourceRow >= 0 &&
                    this.grid[sourceRow][col] === 0
                ) {
                    sourceRow--;
                }

                if (sourceRow >= 0) {
                    this.dropBlock(sourceRow, row, col);
                    continue;
                }

                sourceRow = this.rows - 1;

                while (
                    sourceRow >= 0 &&
                    this.reserveGrid[sourceRow][col] === 0
                ) {
                    sourceRow--;
                }

                if (sourceRow >= 0) {
                    this.dropReserveBlock(sourceRow, row, col);
                }
            }
        }

        this.populateReserveGrid();
    }
}