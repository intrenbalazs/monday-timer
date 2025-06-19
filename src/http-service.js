// HTTP service module
const { net, session, app } = require('electron');

// Get URL from environment variables
const targetUrl = process.env.URL || 'https://monday-timer.siteapp.hu';

function stopAllTimers() {
    // Prevent the default quit behavior
    return new Promise((resolve) => {
        // Get all cookies from session
        session.defaultSession.cookies.get({})
            .then((cookies) => {
                // Format cookies for the Cookie header
                const cookieHeader = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

                // Create the request with cookies
                const request = net.request({
                    method: 'GET',
                    url: `${targetUrl}/timers/stop-all`
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
            })
            .catch((error) => {
                console.error('Error getting cookies:', error);
                // If there's an error getting cookies, still make the request without cookies
                const request = net.request({
                    method: 'GET',
                    url: `${targetUrl}/timers/stop-all`
                });

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
            });
    });
}

module.exports = {
    stopAllTimers
};
