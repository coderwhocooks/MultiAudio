const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const logFile = path.join(__dirname, '../electron_debug.log');
function log(msg) {
  try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`); } catch (e) {}
}

process.on('uncaughtException', (err) => {
  log(`UNCAUGHT: ${err.stack || err}`);
});

process.on('exit', (code) => {
  log(`process exit with code: ${code}`);
});

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

log('Starting main.cjs...');

// Set application identity for Windows taskbar grouping and icon display
app.setName('MultiAudio');
app.setAppUserModelId('com.multiaudio.desktop');

// Ensure clean cache switches
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-gpu-cache');
app.commandLine.appendSwitch('disable-features', 'DawnGraphite,PersistentCache');

let mainWindow = null;
let tray = null;

function restoreAndFocusWindow() {
  log('restoreAndFocusWindow called');
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (!mainWindow.isVisible()) mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);
}

// Ensure only a single instance of MultiAudio runs
const gotTheLock = app.requestSingleInstanceLock();
log(`requestSingleInstanceLock: ${gotTheLock}`);
if (!gotTheLock) {
  log('Did not get single instance lock, quitting.');
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  log('app second-instance event received');
  restoreAndFocusWindow();
});

// Helper to execute PowerShell control script
function runAudioControl(args) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '../scripts/control-audio.ps1');
    const argList = Object.entries(args)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `-${k} "${String(v).replace(/"/g, '`"')}"`)
      .join(' ');
    
    exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}" ${argList}`, (err, stdout) => {
      if (err || !stdout) {
        resolve({ success: false, error: err ? err.message : 'No output' });
        return;
      }
      try {
        const res = JSON.parse(stdout);
        resolve(res);
      } catch (e) {
        resolve({ success: true, raw: stdout });
      }
    });
  });
}

// IPC handler to query real active audio devices and running apps from Windows
ipcMain.handle('get-system-audio', async () => {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, '../scripts/get-audio-info.ps1');
    exec(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { maxBuffer: 1024 * 1024 * 5 }, (err, stdout) => {
      if (err || !stdout) {
        console.warn('get-system-audio failed:', err);
        resolve(null);
        return;
      }
      try {
        const data = JSON.parse(stdout);
        resolve(data);
      } catch (e) {
        console.warn('JSON parse error in get-system-audio:', e);
        resolve(null);
      }
    });
  });
});

// Real-time Audio Routing handler
ipcMain.handle('route-app-to-device', async (e, { target, deviceCmdId, pid }) => {
  return runAudioControl({
    Action: 'route-app',
    Target: target,
    Device: deviceCmdId,
    PidNum: pid || 0
  });
});

// App Volume control handler
ipcMain.handle('set-app-volume', async (e, { target, volume, pid }) => {
  return runAudioControl({
    Action: 'set-app-volume',
    Target: target,
    Value: volume,
    PidNum: pid || 0
  });
});

// App Mute control handler
ipcMain.handle('set-app-mute', async (e, { target, muted, pid }) => {
  return runAudioControl({
    Action: 'set-app-mute',
    Target: target,
    Value: muted ? '1' : '0',
    PidNum: pid || 0
  });
});

// Device Volume control handler
ipcMain.handle('set-device-volume', async (e, { deviceCmdId, volume }) => {
  return runAudioControl({
    Action: 'set-device-volume',
    Device: deviceCmdId,
    Value: volume
  });
});

// Device Mute control handler
ipcMain.handle('set-device-mute', async (e, { deviceCmdId, muted }) => {
  return runAudioControl({
    Action: 'set-device-mute',
    Device: deviceCmdId,
    Value: muted ? '1' : '0'
  });
});

// Default Device handler
ipcMain.handle('set-default-device', async (e, { deviceCmdId }) => {
  return runAudioControl({
    Action: 'set-default-device',
    Device: deviceCmdId
  });
});

// Dual Output Transfer handler (1 Input Source ➔ 2 Output Sources)
ipcMain.handle('transfer-dual-output', async (e, { target, deviceCmdId, secondaryDeviceCmdId, pid, isCapture }) => {
  return runAudioControl({
    Action: 'transfer-dual-output',
    Target: target,
    Device: deviceCmdId,
    SecondaryDevice: secondaryDeviceCmdId,
    PidNum: pid || 0,
    IsCapture: isCapture ? '1' : '0'
  });
});

// Listen to this device handler (Microphone loopback)
ipcMain.handle('set-listen-device', async (e, { target, deviceCmdId, enabled }) => {
  return runAudioControl({
    Action: 'set-listen-device',
    Target: target,
    Device: deviceCmdId,
    Value: enabled ? '1' : '0'
  });
});

// Minimize to Tray settings and lifecycle
let minimizeToTray = true;
ipcMain.handle('get-minimize-to-tray', () => minimizeToTray);
ipcMain.handle('set-minimize-to-tray', (e, enabled) => {
  minimizeToTray = !!enabled;
  updateTrayMenu();
  return minimizeToTray;
});

let appIconPath = null;

function updateTrayMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open MultiAudio',
      click: () => {
        restoreAndFocusWindow();
      }
    },
    {
      label: 'Minimize to Tray on Close',
      type: 'checkbox',
      checked: minimizeToTray,
      click: (item) => {
        minimizeToTray = item.checked;
        if (mainWindow?.webContents) {
          mainWindow.webContents.send('minimize-to-tray-changed', minimizeToTray);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit MultiAudio',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}

function createTray() {
  if (tray) return;
  try {
    const iconPath = path.join(__dirname, '../public/tray-icon.ico');

    log(`Creating Tray with icon: ${iconPath}`);
    tray = new Tray(iconPath);
    tray.setToolTip('MultiAudio — Per-App Audio Router & Sync Mixer');
    updateTrayMenu();

    tray.on('click', () => {
      restoreAndFocusWindow();
    });

    tray.on('double-click', () => {
      restoreAndFocusWindow();
    });
    log('Tray created successfully.');
  } catch (err) {
    log(`Tray creation error: ${err.stack || err}`);
  }
}

function createWindow() {
  log('createWindow() called');
  try {
    const iconIco = path.join(__dirname, '../public/icon.ico');
    const iconPng = path.join(__dirname, '../public/icon.png');
    const iconPath = fs.existsSync(iconIco) ? iconIco : iconPng;

    log('Creating BrowserWindow...');
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 840,
      minWidth: 960,
      minHeight: 640,
      title: 'MultiAudio — Desktop Audio Router & Mixer',
      backgroundColor: '#080b11',
      autoHideMenuBar: true,
      show: true,
      icon: iconPath,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.cjs'),
        webSecurity: false,
      },
    });

    mainWindow.once('ready-to-show', () => {
      log('mainWindow ready-to-show fired');
      mainWindow.show();
      mainWindow.focus();
    });

    Menu.setApplicationMenu(null);

    const distPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(distPath)) {
      log(`Loading dist bundle: ${distPath}`);
      mainWindow.loadFile(distPath);
    } else {
      log('Loading localhost dev server URL: http://localhost:5173');
      mainWindow.loadURL('http://localhost:5173');
    }

    try {
      createTray();
    } catch (e) {
      log(`createTray error: ${e.stack || e}`);
    }

    // Intercept window close event to minimize to tray instead
    mainWindow.on('close', (event) => {
      log(`mainWindow close event. isQuitting: ${app.isQuitting}, minimizeToTray: ${minimizeToTray}`);
      if (!app.isQuitting && minimizeToTray) {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    mainWindow.on('closed', () => {
      log('mainWindow closed event');
      mainWindow = null;
    });
  } catch (err) {
    log(`createWindow FATAL ERROR: ${err.stack || err}`);
  }
}

app.on('before-quit', () => {
  log('app before-quit event');
  app.isQuitting = true;
});

app.whenReady().then(() => {
  log('app whenReady fired');
  createWindow();

  app.on('activate', () => {
    log('app activate event');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      restoreAndFocusWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (!minimizeToTray && process.platform !== 'darwin') {
    app.quit();
  }
});
