// pingService.js
const { powerSaveBlocker, powerMonitor } = require('electron');

let canceled = false;
let psbId = null;
let periodMs = 60_000;
let pingFn = null;

async function loop() {
    let next = Date.now() + periodMs;

    while (!canceled) {
        const wait = Math.max(0, next - Date.now());
        await new Promise(r => setTimeout(r, wait));

        try {
            await pingFn();
        } catch (e) {
            console.error('[PingService] Ping error:', e);
        }

        const now = Date.now();
        if (now - next > periodMs * 2) {
            // nagy csúszás → valószínű sleep után ébredtünk
            next = now + periodMs;
        } else {
            next += periodMs;
        }
    }
}

function start(pingCallback, intervalMs = 60_000) {
    if (typeof pingCallback !== 'function') {
        throw new Error('PingService: pingCallback must be a function');
    }
    if (!intervalMs || intervalMs < 1000) {
        throw new Error('PingService: interval must be >= 1000 ms');
    }

    // ha már fut, előbb állítsuk le
    stop();

    canceled = false;
    pingFn = pingCallback;
    periodMs = intervalMs;

    // megakadályozzuk az OS throttlingját
    psbId = powerSaveBlocker.start('prevent-app-suspension');

    // ébredéskor azonnali ping
    powerMonitor.on('resume', async () => {
        try {
            await pingFn();
        } catch (e) {
            console.error('[PingService] Ping error on resume:', e);
        }
    });

    loop();
    console.log('[PingService] Started, interval =', periodMs, 'ms');
}

function stop() {
    canceled = true;

    if (psbId && powerSaveBlocker.isStarted(psbId)) {
        powerSaveBlocker.stop(psbId);
        psbId = null;
    }

    // leiratkozás a resume eseményről
    powerMonitor.removeAllListeners('resume');

    console.log('[PingService] Stopped');
}

module.exports = {
    start,
    stop
};
