// Load environment variables from .env file
require('dotenv').config();

const {app, BrowserWindow, protocol, session, Tray, Menu, dialog, shell, globalShortcut} = require('electron');
const path = require('path');
const nodepath = require('node:path');
const url = require('url');
const windowStateKeeper = require('electron-window-state');
const positioner = require('electron-traywindow-positioner');
const {autoUpdater} = require('electron-updater');

// Get URL from environment variables
const targetUrl = process.env.URL || 'https://monday-timer.siteapp.hu';

// Custom protocol registration
const PROTOCOL = 'monday-timer';

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;
let tray = null;
let menuWindow = null;

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('electron-fiddle', process.execPath, [path.resolve(process.argv[1])]);
    }
} else {
    app.setAsDefaultProtocolClient('electron-fiddle');
}

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
        //createTray();

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
        titleBarStyle: 'hidden',
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

    // Register keyboard shortcuts for DevTools
    // F12 shortcut
    globalShortcut.register('F12', () => {
        if (mainWindow) {
            mainWindow.webContents.toggleDevTools();
        }
    });

    // Ctrl+Shift+I (Windows/Linux) or Command+Option+I (macOS)
    globalShortcut.register(process.platform === 'darwin' ? 'Command+Option+I' : 'Control+Shift+I', () => {
        if (mainWindow) {
            mainWindow.webContents.toggleDevTools();
        }
    });

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
        if (menuWindow && menuWindow.isVisible()) {
            menuWindow.close();
            menuWindow = null;
            return;
        }


        menuWindow = new BrowserWindow({
            width: 444,
            height: 250,
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
        positioner.position(menuWindow, tray.getBounds());

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
app.on('before-quit', () => {
    // Unregister all shortcuts
    globalShortcut.unregisterAll();

    if (tray) {
        tray.destroy();
        tray = null;
    }
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
