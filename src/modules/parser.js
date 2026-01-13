/**
 * src/modules/parser.js
 * * Role: Parser Module
 * 1. Takes raw binary data as input from browser
 * 2. Peeks into the data to determine the address
 * 3. Tells server where to route 
 */

function parseRequestDetails(buffer) {
    //  Convert raw binary bytes into readable text 
    const requestString = buffer.toString();

    //  Prepare an empty address book entry
    const details = {
        hostname: null,  // where the user want to go; "example.com"
        port: 80,        // standard port
        isConnect: false // is this a secure https tunnel;        
    };

    //  Check for the Https Handshake (CONNECT Method) 
    //  HTTPS requests start with "CONNECT"
    if (requestString.startsWith("CONNECT")) {
        details.isConnect = true;
        details.port = 443; // default port for HTTPS
    }

    //  Find the hostname in header
    //  We look for the: "Host: <domain>"
    const hostMatch = requestString.match(/Host: ([a-z0-9\-\.:]+)/i);

    if (hostMatch) {
        // We found destination address
        const rawHost = hostMatch[1]; // e.g., "example.com:8080" or "example.com"
        
        // Check for specified port
        if (rawHost.includes(":")) {
            const split = rawHost.split(":");
            details.hostname = split[0];  // name 
            details.port = parseInt(split[1], 10); // port number
        } else {
            details.hostname = rawHost; // just the name
        }
    } else {
        // if no Host header found, we cannot route the request    
        return null;
    }

    return details;
}

module.exports = { parseRequestDetails };