const net = require('net');
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
    serverSocket.connect(destination.port, destination.host, () => {
        console.log(`Tunnel established to ${destination.host}:${destination.port}`);

        // Replay the first packet 
        // We already read the first packet (to find the hostname)
        // We need to write the data to the server manually
        serverSocket.write(initialData);

        // The PIPELINE 
        // "Whatever comes from the user, send it to the website"
        // "Whatever comes from the website, send it to the user"
        clientSocket.pipe(serverSocket);
        serverSocket.pipe(clientSocket);

        // Resume the client stream (we paused it earlier)
        clientSocket.resume();
    });

    // -- ERROR HANDLING --
    // If one side hangs up , we must close the other side too

    serverSocket.on('error', (err) => {
        console.error(`Target Connection Error (${destination.host}): ${err.message}`);
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