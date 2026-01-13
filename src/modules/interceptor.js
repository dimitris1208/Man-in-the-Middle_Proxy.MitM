const { Transform } = require('stream');

class Interceptor extends Transform {
    constructor() {
        super();
    }

    /**
     * This method runs for each chunk of data passing through the stream
     * @param {Buffer} chunk - The chunk of data to process (binary)
     * @param {string} encoding - The encoding type (usually 'buffer')
     * @param {Function} callback - The callback to signal that processing is done
     */
    _transform(chunk, encoding, callback) {

        // Convert binary to string for inspection
        const dataString = chunk.toString();

        // Simple "Sniffer" logic
        // Look for interesting keywords
        if (dataString.includes('password') ||
            dataString.includes('user') ||
            dataString.includes('login') ||
            dataString.includes('POST') || 
            dataString.includes('pass') ||
            dataString.includes('username')
        ) {
            console.log('--- Potential Sensitive Data Detected ---');
            console.log(dataString);
            console.log('----------------------------------------');
        }

        // Pass the chunk along unmodified
        // If we dont call this, the data stops here and the website never loads!
        // this.push(chunk) sends the data forward
        this.push(chunk);

        // Signal that the processing for this chunk is done, Ready for next chunk
        callback();
    }
}

module.exports = { Interceptor };