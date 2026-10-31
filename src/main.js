import { resize } from './resize.js';
import Game from './game.js';

(() => {
    // Define las dimensiones base del juego.
    const WIDTH = 640;
    const HEIGHT = 640;

    // Obtiene las pantallas y botones de la interfaz desde el HTML.
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const playButton = document.getElementById('play-button');
    const playAgainButton = document.getElementById('play-again-button');
    const homeButton = document.getElementById('home-button');

    let game = null;

    // Ajusta el tamaño del juego cuando cambia el tamaño de la ventana.
    function resizeHandler() {
        resize(WIDTH, HEIGHT);
    }

    // Muestra u oculta una pantalla usando la clase CSS correspondiente.
    function toggleScreen(screen, isVisible) {
        screen.classList.toggle(`${screen.dataset.block}--hidden`, !isVisible);
    }

    // Cambia a la pantalla de juego e inicia o reinicia la partida.
    function playHandler() {
        toggleScreen(startScreen, false);
        toggleScreen(endScreen, false);
        toggleScreen(gameScreen, true);

        game.start();
    }

    // Vuelve a la pantalla inicial y actualiza el récord mostrado.
    function homeHandler() {
        document.getElementById('start-record').textContent = game.record;

        toggleScreen(endScreen, false);
        toggleScreen(gameScreen, false);
        toggleScreen(startScreen, true);
    }

    // Muestra los resultados cuando termina la partida.
    function gameOverHandler(score, record, isNewRecord) {
        document.getElementById('final-score').textContent = score;
        document.getElementById('final-record').textContent = record;
        document.getElementById('new-record').hidden = !isNewRecord;

        toggleScreen(gameScreen, false);

        toggleScreen(endScreen, true);
    }

    // Crea el juego y conecta sus eventos con los controles de la interfaz.
    game = new Game(WIDTH, HEIGHT);
    game.onGameOver = gameOverHandler;

    resizeHandler();
    homeHandler();

    // Registra los eventos de redimensionamiento y clic de los botones.
    window.addEventListener('resize', resizeHandler);
    playButton.addEventListener('click', playHandler);
    playAgainButton.addEventListener('click', playHandler);
    homeButton.addEventListener('click', homeHandler);
})();
