const net = require('net');
const { parseRequestDetails } = require('../modules/parser');
const { createTunnel } = require('./tunnel-v2');

// This function acts as the factory for the server instance 
function createServer() {

    // Create the TCP server
    const server = net.createServer((clientSocket) => {
        console.log('---New client connected---');

        // Error Handling for client socket
        clientSocket.on('error', (err) => {
            console.error('Client Socket Error:', err.message);
        });
        
        // Listen for the first packet only
        clientSocket.once('data', (data) => {

            // Pause the stream
            clientSocket.pause();

            // Parse the request details
            const destination = parseRequestDetails(data);

            if (!destination) {
                console.error('Failed to parse request details. Closing connection.');
                clientSocket.end();
                return;
            }

            console.log(`Routing to ${destination.hostname}:${destination.port} (HTTPS: ${destination.isConnect})`);

            // Establish the tunnel
            // We pass:
            // The users socker
            // The target website details (host, port)
            // The first packet we already received
            createTunnel(clientSocket, destination, data);
        

        });
    });

    return server;
}

module.exports = { createServer };