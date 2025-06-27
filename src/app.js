// Main application module
const { app, session } = require('electron');
const { createWindow, getMainWindow } = require('./window');
const { handleProtocol } = require('./protocol-handler');
const { setupAutoUpdater } = require('./updater');
const { stopAllTimers, ping} = require('./http-service');
let pingInterval = null;

function initApp() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
        app.quit();
        return;
    }

    // Handle second instance
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        handleProtocol(commandLine.pop().slice(0, -1));
    });

    // Create mainWindow, load the rest of the app, etc...
    app.whenReady().then(() => {
        // Set headers for all requests
        session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
            details.requestHeaders['X-Electron-App'] = 'true';
            details.requestHeaders['X-Electron-APP-Platform'] = process.platform !== 'darwin' ? 'win' : 'mac';

            callback({requestHeaders: details.requestHeaders});
        });

        createWindow();
        setupAutoUpdater();

        if (pingInterval) {
            clearInterval(pingInterval);
        }

        pingInterval = setInterval(async () => {
            await ping()
        }, 1000 * 60)

        app.on('activate', function () {
            // On macOS it's common to re-create a window when the dock icon is clicked
            if (getMainWindow() === null) createWindow();
        });
    });

    // Handle custom protocol
    app.on('open-url', (event, url) => {
        handleProtocol(url);
    });

    // Quit when all windows are closed, except on macOS
    app.on('window-all-closed', function () {
        if (process.platform !== 'darwin') app.quit();
    });

    // Clean up before quitting
    app.on('before-quit', async (event) => {
        // Prevent the default quit behavior
        event.preventDefault();

        // Stop all timers
        await stopAllTimers();

        // Now we can quit the app
        app.exit();
    });
}

module.exports = {
    initApp
};
