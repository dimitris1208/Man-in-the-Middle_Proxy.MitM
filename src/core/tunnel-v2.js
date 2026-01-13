const net = require('net');
const { Interceptorv2 } = require('../modules/interceptor-v2');

function createTunnel(clientSocket, destination, initialData) {
    const serverSocket = new net.Socket();
    const remoteHost = destination.hostname || destination.host;

    serverSocket.connect(destination.port, remoteHost, () => {
        console.log(`Tunnel established to ${remoteHost}:${destination.port}`);

        const reqModifier = new Interceptorv2({ type: 'upload' });
        const resModifier = new Interceptorv2({ type: 'download' });

        // Push the first packet through our modifier
        reqModifier.write(initialData);
        
        // 1. Client -> Modifier -> Server
        // We rely on pipe() to handle closing. When client closes, serverSocket gets closed.
        clientSocket
            .pipe(reqModifier)
            .pipe(serverSocket);

        // 2. Server -> Modifier -> Client
        // When server closes, resModifier finishes, then clientSocket closes.
        serverSocket
            .pipe(resModifier)
            .pipe(clientSocket);
            
        clientSocket.resume();
    });

    // --- ERROR HANDLING ONLY ---
    // (We removed the 'close' and 'end' listeners to prevent cutting off data)

    serverSocket.on('error', (err) => {
        // Only log real errors, ignore "Connection Reset" which is common
        if (err.code !== 'ECONNRESET') {
            console.error(`Target Error (${remoteHost}):`, err.message);
        }
        clientSocket.end();
    });

    clientSocket.on('error', (err) => {
        if (err.code !== 'ECONNRESET') {
            console.error('Client Error:', err.message);
        }
        serverSocket.end();
    });
}

module.exports = { createTunnel };