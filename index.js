// Load environment variables from .env file
require('dotenv').config();

const {app, BrowserWindow, protocol, session, Tray, Menu} = require('electron');
const path = require('path');
const url = require('url');
const windowStateKeeper = require('electron-window-state');
const positioner = require('electron-traywindow-positioner');

// Get URL from environment variables
const targetUrl = process.env.URL || 'https://monday-timer.siteapp.hu';

// Custom protocol registration
const PROTOCOL = 'monday-timer';

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let tray = null;
let menuWindow = null;

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
        titleBarStyle: 'hidden',
        ...(process.platform !== 'darwin' ? {titleBarOverlay: true} : {}),
        trafficLightPosition: { x: 16, y: 24 },
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

    // Open DevTools in development mode
    // if (process.env.NODE_ENV === 'development') {
    //   mainWindow.webContents.openDevTools();
    // }

    // Emitted when the window is closed
    mainWindow.on('closed', function () {
        // Dereference the window object
        mainWindow = null;
    });
}

function createTray() {
    // Create the tray icon
    const iconPath = process.platform === 'darwin'
        ? path.join(__dirname, 'icons', 'tray-32x32@2x.png')
        : path.join(__dirname, 'icons', 'favicon.ico');

    tray = new Tray(iconPath);
    tray.setToolTip('Monday Timer');

    // Add click handler to open menu window
    tray.on('click', () => {
        if (menuWindow) {
            menuWindow.focus();
            return;
        }

        menuWindow = new BrowserWindow({
            width: 300,
            height: 400,
            show: false,
            frame: false,
            resizable: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false
            }
        });

        // Load the menu URL
        const menuUrl = new URL('/menu', targetUrl).toString();
        menuWindow.loadURL(menuUrl, {
            userAgent: 'monday-timer-app'
        });

        // Position the window near the tray icon
        positioner.position(menuWindow, tray.getBounds())

        menuWindow.once('ready-to-show', () => {
            menuWindow.show();
        });

        menuWindow.on('blur', () => {
            menuWindow.close();
        });

        menuWindow.on('closed', () => {
            menuWindow = null;
        });
    });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    // Register the custom protocol
    app.setAsDefaultProtocolClient(PROTOCOL);

    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['X-Electron-App'] = 'true';
        details.requestHeaders['X-Electron-APP-Platform'] = process.platform !== 'darwin' ? 'win' : 'mac';

        callback({requestHeaders: details.requestHeaders});
    });

    createWindow();
    createTray();

    app.on('activate', function () {
        // On macOS it's common to re-create a window when the dock icon is clicked
        if (mainWindow === null) createWindow();
    });
});

// Handle custom protocol
app.on('open-url', (event, url) => {
    event.preventDefault();

    // Parse the URL and handle it accordingly
    const urlObj = new URL(url);
    if (urlObj.protocol === `${PROTOCOL}:`) {
        // Handle the custom protocol URL here
        console.log('Custom protocol URL:', url);

        // If the window is already open, focus it
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        } else {
            createWindow();
        }
    }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Clean up before quitting
app.on('before-quit', () => {
    if (tray) {
        tray.destroy();
        tray = null;
    }
});

// Handle macOS protocol activation
app.on('will-finish-launching', () => {
    app.on('open-url', (event, url) => {
        event.preventDefault();
        // Same handling as above
        const urlObj = new URL(url);
        if (urlObj.protocol === `${PROTOCOL}:`) {
            console.log('Custom protocol URL (macOS):', url);
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            } else {
                createWindow();
            }
        }
    });
});
