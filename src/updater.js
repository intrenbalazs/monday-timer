// Auto-updater module
const { dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

// Function to check for updates
function checkForUpdates() {
    autoUpdater.checkForUpdatesAndNotify();
}

function setupAutoUpdater() {
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

    // Check for updates immediately
    checkForUpdates();

    // Set up hourly update checks
    setInterval(checkForUpdates, 1000 * 60 * 60); // Check every hour
}

module.exports = {
    setupAutoUpdater
};
