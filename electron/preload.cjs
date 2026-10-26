const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAudio', {
  isElectron: true,
  getSystemAudio: () => ipcRenderer.invoke('get-system-audio'),
  routeAppToDevice: (target, deviceCmdId, pid) => 
    ipcRenderer.invoke('route-app-to-device', { target, deviceCmdId, pid }),
  setAppVolume: (target, volume, pid) => 
    ipcRenderer.invoke('set-app-volume', { target, volume, pid }),
  setAppMute: (target, muted, pid) => 
    ipcRenderer.invoke('set-app-mute', { target, muted, pid }),
  setDeviceVolume: (deviceCmdId, volume) => 
    ipcRenderer.invoke('set-device-volume', { deviceCmdId, volume }),
  setDeviceMute: (deviceCmdId, muted) => 
    ipcRenderer.invoke('set-device-mute', { deviceCmdId, muted }),
  setDefaultDevice: (deviceCmdId) => 
    ipcRenderer.invoke('set-default-device', { deviceCmdId }),
  transferDualOutput: (data) =>
    ipcRenderer.invoke('transfer-dual-output', data),
  setListenDevice: (target, deviceCmdId, enabled) =>
    ipcRenderer.invoke('set-listen-device', { target, deviceCmdId, enabled }),
  getMinimizeToTray: () => 
    ipcRenderer.invoke('get-minimize-to-tray'),
  setMinimizeToTray: (enabled) => 
    ipcRenderer.invoke('set-minimize-to-tray', enabled),
  onMinimizeToTrayChanged: (callback) => {
    ipcRenderer.on('minimize-to-tray-changed', (_, val) => callback(val));
  },
});
