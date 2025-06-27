// HTTP service module
const { net, session, app } = require('electron');

// Get URL from environment variables
const targetUrl = process.env.URL || 'https://monday-timer.siteapp.hu';

function makeRequest(endpoint) {
    return new Promise((resolve) => {
        // Get all cookies from session
        session.defaultSession.cookies.get({})
            .then((cookies) => {
                // Format cookies for the Cookie header
                const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

                // Make the request with cookies
                sendRequest(`${targetUrl}/${endpoint}`, cookieHeader, resolve);
            })
            .catch((error) => {
                console.error('Error getting cookies:', error);
            });
    });
}

/**
 * Sends an HTTP request to the specified URL with optional cookies
 * @param {string} url - The full URL to request
 * @param {string} cookieHeader - The cookie header string
 * @param {function} resolve - The promise resolve function
 */
function sendRequest(url, cookieHeader, resolve) {
    // Create the request
    const request = net.request({
        method: 'GET',
        url: url
    });

    // Set the Cookie header if we have cookies
    if (cookieHeader) {
        request.setHeader('Cookie', cookieHeader);
    }

    request.on('response', (response) => {
        console.log(`STATUS: ${response.statusCode}`);

        // Read the response data
        let responseData = '';
        response.on('data', (chunk) => {
            responseData += chunk;
        });

        // When response is complete, resolve the promise
        response.on('end', () => {
            console.log('Response completed:', responseData);
            resolve();
        });
    });

    request.on('error', (error) => {
        console.error('Request error:', error);
        resolve();
    });

    // End the request
    request.end();
}

function stopAllTimers() {
    // Prevent the default quit behavior
    return makeRequest('timers/stop-all');
}

function ping() {
    // Return a promise that resolves when the ping is complete
    return makeRequest('heartbeat', 'hearbreak');
}

module.exports = {
    stopAllTimers,
    ping
};
