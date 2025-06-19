// Protocol handler module
const { getMainWindow } = require('./window');

function handleProtocol(url) {
    const urlObj = new URL(url);
    switch (urlObj.hostname) {
        case 'open':
            const mainWindow = getMainWindow();
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            } else {
                const { createWindow } = require('./window');
                createWindow();
            }
            break;
    }
}

module.exports = {
    handleProtocol
};
