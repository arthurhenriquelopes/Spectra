const { app, BrowserWindow, globalShortcut, desktopCapturer, screen, ipcMain } = require('electron');
const path = require('path');
const { createServer } = require('./server/server');

// Process disguise (Braille blank space)
process.title = '\u2800';

let mainWindow = null;
let currentOpacity = 1.0;
let isGhostMode = false;
let isPanicHidden = false;

// Native screen capture implementation using Electron's desktopCapturer
async function captureNativeScreenshot() {
    try {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.bounds;

        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: Math.min(width, 1920), height: Math.min(height, 1080) }
        });

        if (!sources || sources.length === 0) {
            throw new Error('No screen capture sources available.');
        }

        const primarySource = sources[0];
        const dataUrl = primarySource.thumbnail.toDataURL();
        const size = primarySource.thumbnail.getSize();

        return {
            success: true,
            dataUrl,
            width: size.width,
            height: size.height
        };
    } catch (err) {
        console.error('[Capture] Screen capture failed:', err);
        throw err;
    }
}

let currentLocation = 'top-right';
const HUB_WIDTH = 485;
const CREATE_SESSION_WIDTH = 610;
const WINDOW_HEIGHT = 730;
let currentWindowWidth = HUB_WIDTH;
let moveOverlayWindow = null;
let currentServerPort = 8002;

function getSlotBounds(slot, workArea, targetW = currentWindowWidth, targetH = WINDOW_HEIGHT) {
    const margin = 16;
    const finalW = Math.min(targetW, workArea.width - margin * 2);
    const finalH = Math.min(targetH, workArea.height - margin * 2);

    let x = workArea.x + workArea.width - finalW - margin;
    let y = workArea.y + margin;

    switch (slot) {
        case 'top-left':
            x = workArea.x + margin;
            y = workArea.y + margin;
            break;
        case 'top-center':
            x = workArea.x + Math.round((workArea.width - finalW) / 2);
            y = workArea.y + margin;
            break;
        case 'top-right':
            x = workArea.x + workArea.width - finalW - margin;
            y = workArea.y + margin;
            break;
        case 'bottom-left':
            x = workArea.x + margin;
            y = workArea.y + workArea.height - finalH - margin;
            break;
        case 'bottom-center':
            x = workArea.x + Math.round((workArea.width - finalW) / 2);
            y = workArea.y + workArea.height - finalH - margin;
            break;
        case 'bottom-right':
            x = workArea.x + workArea.width - finalW - margin;
            y = workArea.y + workArea.height - finalH - margin;
            break;
        default:
            x = workArea.x + workArea.width - finalW - margin;
            y = workArea.y + margin;
    }

    return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(finalW),
        height: Math.round(finalH)
    };
}

function showMoveOverlay() {
    if (moveOverlayWindow && !moveOverlayWindow.isDestroyed()) {
        moveOverlayWindow.show();
        moveOverlayWindow.focus();
        return;
    }

    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.workArea;

    moveOverlayWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        hasShadow: false,
        type: 'panel',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false
        }
    });

    moveOverlayWindow.setContentProtection(true);
    moveOverlayWindow.setAlwaysOnTop(true, 'screen-saver');
    moveOverlayWindow.loadURL(`http://127.0.0.1:${currentServerPort}/move-overlay.html?current=${currentLocation}`);

    moveOverlayWindow.on('closed', () => {
        moveOverlayWindow = null;
    });
}

function closeMoveOverlay() {
    if (moveOverlayWindow && !moveOverlayWindow.isDestroyed()) {
        moveOverlayWindow.close();
        moveOverlayWindow = null;
    }
}

function setWindowMode(mode) {
    const targetWidth = (mode === 'create') ? CREATE_SESSION_WIDTH : HUB_WIDTH;
    if (currentWindowWidth === targetWidth) return;
    currentWindowWidth = targetWidth;

    if (mainWindow && !mainWindow.isDestroyed()) {
        const primaryDisplay = screen.getPrimaryDisplay();
        const bounds = getSlotBounds(currentLocation, primaryDisplay.workArea, currentWindowWidth, WINDOW_HEIGHT);
        mainWindow.setBounds(bounds);
        console.log(`[Window] Mode switched to ${mode.toUpperCase()} (width: ${currentWindowWidth}px)`);
    }
}

function applyLocation(location) {
    currentLocation = location;
    if (mainWindow && !mainWindow.isDestroyed()) {
        const primaryDisplay = screen.getPrimaryDisplay();
        const bounds = getSlotBounds(currentLocation, primaryDisplay.workArea, currentWindowWidth, WINDOW_HEIGHT);
        mainWindow.setBounds(bounds);
        mainWindow.focus();
    }
    closeMoveOverlay();
}

function createWindow(port) {
    currentServerPort = port;
    const primaryDisplay = screen.getPrimaryDisplay();
    const initialBounds = getSlotBounds(currentLocation, primaryDisplay.workArea, currentWindowWidth, WINDOW_HEIGHT);

    // Window options matching Parakeet AI 1:1
    mainWindow = new BrowserWindow({
        ...initialBounds,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        hasShadow: false,
        roundedCorners: false,
        icon: path.join(__dirname, '../assets/blank.ico'),
        type: 'panel',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            backgroundThrottling: false,
            spellcheck: false
        }
    });

    // 1:1 Parakeet AI Anti-Proctoring: Hardware-level Screen Capture Exclusion (WDA_EXCLUDEFROMCAPTURE)
    mainWindow.setContentProtection(true);

    // Initial opacity
    mainWindow.setOpacity(currentOpacity);

    // Set level to ensure always-on-top above full-screen browsers
    mainWindow.setAlwaysOnTop(true, 'screen-saver');

    // Load web interface from embedded local server
    mainWindow.loadURL(`http://127.0.0.1:${port}`);

    mainWindow.on('closed', () => {
        mainWindow = null;
        closeMoveOverlay();
    });

    // Register Global Shortcuts (1:1 operational ergonomics)
    registerShortcuts();
}

function toggleGhostMode() {
    if (!mainWindow) return;
    isGhostMode = !isGhostMode;
    // Parakeet 1:1: setIgnoreMouseEvents with forward: true for click-through
    mainWindow.setIgnoreMouseEvents(isGhostMode, { forward: true });
    console.log(`[Stealth] Ghost Mode (click-through): ${isGhostMode ? 'ENABLED' : 'DISABLED'}`);
}

function panicCloak() {
    if (!mainWindow) return;
    if (isPanicHidden) {
        mainWindow.show();
        mainWindow.setOpacity(currentOpacity);
        isPanicHidden = false;
        console.log('[Stealth] Restoring from Panic Cloak');
    } else {
        closeMoveOverlay();
        mainWindow.hide();
        isPanicHidden = true;
        console.log('[Stealth] EMERGENCY PANIC CLOAK TRIGGERED - Window hidden');
    }
}

function adjustOpacity(delta) {
    if (!mainWindow) return;
    currentOpacity = Math.max(0.15, Math.min(1.0, currentOpacity + delta));
    mainWindow.setOpacity(currentOpacity);
    console.log(`[Stealth] Opacity adjusted: ${(currentOpacity * 100).toFixed(0)}%`);
}

function registerShortcuts() {
    // Panic cloak hotkeys: Alt+Esc and Alt+`
    globalShortcut.register('Alt+Escape', panicCloak);
    globalShortcut.register('Alt+`', panicCloak);

    // Ghost click-through toggle: Ctrl+Shift+Space and Alt+C
    globalShortcut.register('CommandOrControl+Shift+Space', toggleGhostMode);
    globalShortcut.register('Alt+C', toggleGhostMode);

    // Reposition 6-slot overlay hotkey: Alt+M and Ctrl+Shift+M
    globalShortcut.register('CommandOrControl+Shift+M', showMoveOverlay);
    globalShortcut.register('Alt+M', showMoveOverlay);

    // Opacity adjustments: Ctrl+Shift+Up / Down
    globalShortcut.register('CommandOrControl+Shift+Up', () => adjustOpacity(0.1));
    globalShortcut.register('CommandOrControl+Shift+Down', () => adjustOpacity(-0.1));
}

// IPC handlers
ipcMain.on('toggle-ghost-mode', toggleGhostMode);
ipcMain.on('panic-cloak', panicCloak);
ipcMain.on('open-move-overlay', showMoveOverlay);
ipcMain.on('close-move-overlay', closeMoveOverlay);
ipcMain.on('select-location', (event, location) => {
    applyLocation(location);
});
ipcMain.handle('get-location', () => currentLocation);
ipcMain.on('set-window-mode', (event, mode) => {
    setWindowMode(mode);
});
let isPrivateMode = true;
ipcMain.on('set-private-mode', (event, enabled) => {
    isPrivateMode = Boolean(enabled);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setContentProtection(isPrivateMode);
        console.log(`[Stealth] Private Mode set to: ${isPrivateMode ? 'ENABLED (Hidden from capture)' : 'DISABLED (Visible in screenshots)'}`);
    }
});
ipcMain.handle('get-private-mode', () => isPrivateMode);
ipcMain.on('close-app', () => {
    app.quit();
});
ipcMain.on('minimize-app', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.minimize();
    }
});
ipcMain.on('set-opacity', (event, opacity) => {
    if (mainWindow && typeof opacity === 'number') {
        currentOpacity = opacity;
        mainWindow.setOpacity(opacity);
    }
});
ipcMain.handle('capture-screen', async () => {
    return await captureNativeScreenshot();
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

function listenAvailablePort(server, initialPort = 8002) {
    return new Promise((resolve, reject) => {
        let currentPort = initialPort;
        const onError = (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`[Host] Port ${currentPort} in use, trying ${currentPort + 1}...`);
                currentPort++;
                server.listen(currentPort, '127.0.0.1');
            } else {
                reject(err);
            }
        };

        server.on('error', onError);
        server.listen(currentPort, '127.0.0.1', () => {
            server.removeListener('error', onError);
            resolve(currentPort);
        });
    });
}

// App startup
app.whenReady().then(async () => {
    const requestedPort = parseInt(process.env.PORT || '8002', 10);
    const { server } = createServer({
        captureNativeScreenshot,
        setOpacity: (val) => {
            if (mainWindow) {
                currentOpacity = val;
                mainWindow.setOpacity(val);
            }
        },
        setAlwaysOnTop: (val) => {
            if (mainWindow) {
                mainWindow.setAlwaysOnTop(val, 'screen-saver');
            }
        }
    });

    try {
        const activePort = await listenAvailablePort(server, requestedPort);
        console.log(`[Host] Spectra Electron Server listening on http://127.0.0.1:${activePort}`);
        createWindow(activePort);
    } catch (err) {
        console.error('[Host] Failed to start server:', err);
        app.quit();
    }
});

app.on('window-all-closed', () => {
    globalShortcut.unregisterAll();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
