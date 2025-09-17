// Window management module
const { BrowserWindow, shell } = require('electron');
const path = require('path');
const windowStateKeeper = require('electron-window-state');

// Get URL from environment variables
const targetUrl = process.env.URL || 'https://timer.intren.hu';

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

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
        icon: path.join(__dirname, '../icons', 'favicon.ico'),
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

    // Emitted when the window is closed
    mainWindow.on('closed', function () {
        // Dereference the window object
        mainWindow = null;
    });

    return mainWindow;
}

function getMainWindow() {
    return mainWindow;
}

module.exports = {
    createWindow,
    getMainWindow
};
