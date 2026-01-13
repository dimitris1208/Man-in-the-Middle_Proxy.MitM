// index.js
const {createServer} = require('./src/core/server');

const PORT = 8080;

// Create the server instance
const server = createServer();

// Start listening on the specified port
server.listen(PORT, () => {
    console.log(`Proxy server is running on port ${PORT}`);
    console.log('Ready for incoming connections...');
});
