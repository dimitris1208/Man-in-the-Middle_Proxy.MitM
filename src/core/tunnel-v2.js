const net = require('net');
const { Interceptor } = require('../modules/interceptor-v2');
/**
 * Establishes the connection between the User and the website 
 * @param {net.Socket} clientSocket - The socket connected to the user
 * @param {Object} destination - The parsed {host, port} of the target website
 * @param {Buffer} initialData - The first packet (headers) we already received
 */
function createTunnel(clientSocket, destination, initialData) {

    // Create a NEW socket for the connection to the target website (e.g. google.com)
    const serverSocket = new net.Socket();


    // Connect to the target website
    serverSocket.connect(destination.port, destination.hostname, () => {
        console.log(`Tunnel established to ${destination.hostname}:${destination.port}`);

        // -- ATTACK SETUP --

        // Request Modifier Interceptor
        const requestModifier = new Interceptor({ type: 'upload' });

        // Response Modifier Interceptor
        const responseModifier = new Interceptor({ type: 'download' });

        // We must process the 'initialData' through the Modifier too!
        // If we don't, the first packet containing headers might slip by unmodified
        requestModifier.write(initialData);


        // Wire: Client -> UploadInterceptor -> Server
        clientSocket.pipe(uploadInterceptor).pipe(serverSocket);

        // Wire: Server -> DownloadInterceptor -> Client
        serverSocket.pipe(downloadInterceptor).pipe(clientSocket);

        // Resume the client stream (we paused it earlier)
        clientSocket.resume();
    });

    // -- ERROR HANDLING --
    // If one side hangs up , we must close the other side too

    serverSocket.on('error', (err) => {
        console.error(`Target Connection Error (${destination.hostname}): ${err.message}`);
        clientSocket.end();
    });

    clientSocket.on('error', (err) => {
        console.error(`Client Connection Error: ${err.message}`);
        serverSocket.end();
    });

    serverSocket.on('close', () => {
        console.log('Client disconnected from target');
        clientSocket.end();
    });
}    

module.exports = {
    createTunnel
};