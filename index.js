// Load environment variables from .env file
require('dotenv').config();

const {app, BrowserWindow, session, Tray, dialog, shell, net} = require('electron');
const path = require('path');

const windowStateKeeper = require('electron-window-state');
const {autoUpdater} = require('electron-updater');

// Get URL from environment variables
const targetUrl = process.env.URL || 'https://monday-timer.siteapp.hu';

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        handleProtocol(commandLine.pop().slice(0, -1));
    });

    // Create mainWindow, load the rest of the app, etc...
    app.whenReady().then(() => {
        session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
            details.requestHeaders['X-Electron-App'] = 'true';
            details.requestHeaders['X-Electron-APP-Platform'] = process.platform !== 'darwin' ? 'win' : 'mac';

            callback({requestHeaders: details.requestHeaders});
        });

        createWindow();

        app.on('activate', function () {
            // On macOS it's common to re-create a window when the dock icon is clicked
            if (mainWindow === null) createWindow();
        });
    });

    app.on('open-url', (event, url) => {
        handleProtocol(url);
    });
}

function createWindow() {

    let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 800
    });
    // Create the browser window
    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        title: 'Monday Timer',
        icon: path.join(__dirname, 'icons', 'favicon.ico'),
        titleBarStyle: process.platform !== 'darwin'? 'default' : 'hidden',
        autoHideMenuBar: true,
        ...(process.platform !== 'darwin' ? {titleBarOverlay: true} : {}),
        trafficLightPosition: {x: 16, y: 24},
        webPreferences: {
            nodeIntegration: false, // For security reasons
            contextIsolation: true,
            enableRemoteModule: false
        }
    });

    mainWindowState.manage(mainWindow);

    // Load the URL from the .env file
    mainWindow.loadURL(targetUrl, {
        userAgent: 'monday-timer-app'
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http') || url.startsWith('https')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });


    autoUpdater.checkForUpdatesAndNotify();

    // Emitted when the window is closed
    mainWindow.on('closed', function () {
        // Dereference the window object
        mainWindow = null;
    });
}

function handleProtocol(url) {
    const urlObj = new URL(url);
    switch (urlObj.hostname) {
        case 'open':
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            } else {
                createWindow();
            }
            break;
    }
}

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Clean up before quitting
app.on('before-quit', (event) => {
    // Prevent the default quit behavior
    event.preventDefault();

    // Make HTTP request before quitting
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

                // When response is complete, quit the app
                response.on('end', () => {
                    console.log('Response completed:', responseData);
                    // Now we can quit the app
                    app.exit();
                });
            });

            request.on('error', (error) => {
                console.error('Request error:', error);
                // If there's an error, still quit the app
                app.exit();
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

                // When response is complete, quit the app
                response.on('end', () => {
                    console.log('Response completed:', responseData);
                    // Now we can quit the app
                    app.exit();
                });
            });

            request.on('error', (error) => {
                console.error('Request error:', error);
                // If there's an error, still quit the app
                app.exit();
            });

            // End the request
            request.end();
        });
});

autoUpdater.on('error', (err) => {
    console.error('Updater hiba:', err);
});

autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Frissítés elérhető',
        message: 'Egy új verzió elérhető. Letöltés folyamatban...',
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog
        .showMessageBox({
            type: 'question',
            buttons: ['Újraindítás most', 'Később'],
            defaultId: 0,
            title: 'Frissítés készen áll',
            message: 'A frissítés letöltődött. Újraindítod most?',
        })
        .then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
});
