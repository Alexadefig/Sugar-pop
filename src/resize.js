export function resize(gameWidth, gameHeight) {
    // Obtiene el canvas y las dimensiones actuales de la ventana.
    const canvas = document.getElementById('canvas');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const windowRatio = width / height;
    const gameWindowRatio = gameWidth / gameHeight;

    // Ajusta el canvas al espacio disponible sin deformar la proporción del juego.
    if (gameWindowRatio < windowRatio) {
        canvas.style.width = `${height * gameWindowRatio}px`;
        canvas.style.height = `${height}px`;
    } else {
        canvas.style.width = `${width}px`;
        canvas.style.height = `${width / gameWindowRatio}px`;
    }

    // Escala el texto de la interfaz en función del ancho del canvas.
    canvas.parentElement.style.fontSize = `${parseFloat(canvas.style.width) / 40}px`;
}
