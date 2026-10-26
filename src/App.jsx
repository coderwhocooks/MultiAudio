import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import RoutingCanvas from './components/RoutingCanvas';
import AppNode from './components/AppNode';
import DeviceNode from './components/DeviceNode';
import MiniMixer from './components/MiniMixer';
import SystemTrayPopup from './components/SystemTrayPopup';
import LatencyCalibrator from './components/LatencyCalibrator';
import BluetoothHealthMonitor from './components/BluetoothHealthMonitor';
import RulesModal from './components/RulesModal';
import TechArchitectureModal from './components/TechArchitectureModal';
import CaptureDrawer from './components/CaptureDrawer';
import DualOutputModal from './components/DualOutputModal';
import StartupSplash from './components/StartupSplash';
import { 
  REAL_SYSTEM_APPS, 
  REAL_SYSTEM_DEVICES, 
  REAL_SYSTEM_CONNECTIONS, 
  REAL_SYSTEM_CAPTURE_DEVICES,
  STUDIO_APPS, 
  STUDIO_DEVICES, 
  STUDIO_CONNECTIONS, 
  PRESET_PROFILES 
} from './types';
import { soundEngine } from './services/soundEngine';
import { 
  Plus, 
  Volume2, 
  Sliders, 
  Headphones, 
  Share2, 
  Sparkles, 
  Layers, 
  Check, 
  Info,
  RefreshCw,
  Laptop
} from 'lucide-react';

export default function App() {
  const [hardwareMode, setHardwareMode] = useState('system'); // 'system' (real PC hardware) | 'studio' (demo bluetooth)
  const [apps, setApps] = useState(REAL_SYSTEM_APPS);
  const [devices, setDevices] = useState(REAL_SYSTEM_DEVICES);
  const [captureDevices, setCaptureDevices] = useState(REAL_SYSTEM_CAPTURE_DEVICES);
  const [connections, setConnections] = useState(REAL_SYSTEM_CONNECTIONS);
  const [profiles, setProfiles] = useState(PRESET_PROFILES);
  const [activeProfile, setActiveProfile] = useState('profile-pc-default');

  // App UI States
  const [theme, setTheme] = useState('dark');
  const [osPlatform, setOsPlatform] = useState('Windows 11 (WASAPI)');
  const [isAudioLive, setIsAudioLive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isMiniMixerOpen, setIsMiniMixerOpen] = useState(false);
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [silentDiscoActive, setSilentDiscoActive] = useState(false);

  // Modals
  const [activeCalibrateDeviceId, setActiveCalibrateDeviceId] = useState(null);
  const [isBluetoothHealthOpen, setIsBluetoothHealthOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isTechSpecOpen, setIsTechSpecOpen] = useState(false);
  const [isAddAppOpen, setIsAddAppOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isDualTransferOpen, setIsDualTransferOpen] = useState(false);
  const [dualTransferInitialSource, setDualTransferInitialSource] = useState(null);
  const [minimizeToTray, setMinimizeToTray] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // New App / Device form state
  const [newAppName, setNewAppName] = useState('');
  const [newDevName, setNewDevName] = useState('');
  const [newDevType, setNewDevType] = useState('bluetooth');

  // Toasts
  const [toast, setToast] = useState(null);

  // Dragging patch cable state
  const [dragState, setDragState] = useState({
    isDragging: false,
    sourceId: null,
    currentX: 0,
    currentY: 0,
  });

  // Selected port for click-to-connect mode
  const [selectedAppPort, setSelectedAppPort] = useState(null);

  // Audio meter reactivity
  const [meterData, setMeterData] = useState({});

  const containerRef = useRef(null);

  // Toast helper
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  // Toggle dark/light theme
  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.body.className = `${next}-theme`;
    showToast(`Switched to ${next === 'dark' ? 'Audiophile Obsidian' : 'Studio Console White'} theme`);
  };

  // Query live Windows hardware devices & active application audio streams
  const scanSystemAudio = async (userInitiated = true) => {
    setIsScanning(true);
    let synced = false;
    let appCount = 0;
    let devCount = 0;

    try {
      // 1. Electron IPC Bridge
      if (window.electronAudio?.getSystemAudio) {
        try {
          const sys = await window.electronAudio.getSystemAudio();
          if (sys?.devices && sys.devices.length > 0) {
            setDevices(sys.devices);
            devCount = sys.devices.length;
            if (sys.apps && sys.apps.length > 0) {
              setApps(sys.apps);
              appCount = sys.apps.length;
            }
            if (sys.captureDevices && sys.captureDevices.length > 0) {
              setCaptureDevices(sys.captureDevices);
            }
            if (sys.initialConnections && sys.initialConnections.length > 0) {
              setConnections(prev => prev.length > 0 ? prev : sys.initialConnections);
            }
            synced = true;
          }
        } catch (err) {
          console.warn('Electron audio scan error:', err);
        }
      }

      // 2. Browser Web Audio API fallback
      if (!synced && navigator.mediaDevices?.enumerateDevices) {
        try {
          const mediaDevices = await navigator.mediaDevices.enumerateDevices();
          const outputs = mediaDevices.filter(d => d.kind === 'audiooutput' && d.label);
          if (outputs.length > 0) {
            const mapped = outputs.map((d, i) => ({
              id: `dev-browser-${i}`,
              name: d.label || `Audio Output ${i + 1}`,
              type: d.label.toLowerCase().includes('headphone') ? 'wired' : 'builtin',
              icon: d.label.toLowerCase().includes('headphone') ? 'headphones' : 'speaker',
              codec: 'Windows MMDevice Endpoint',
              codecRate: '48.0 kHz',
              codecQuality: 'Hardware Output Line',
              battery: null,
              rssi: null,
              signalQuality: 'Hardware Connected',
              bandwidthUsageKbps: 0,
              volume: 80,
              muted: false,
              delayMs: 10,
              eqPreset: 'Flat Reference',
              isDefault: i === 0,
            }));
            setDevices(mapped);
            devCount = mapped.length;
            synced = true;
          }
        } catch (e) {
          // ignore
        }
      }

      if (userInitiated) {
        showToast(synced 
          ? `✓ Rescan Complete: Found ${appCount} active audio app${appCount !== 1 ? 's' : ''} & ${devCount} output device${devCount !== 1 ? 's' : ''}` 
          : 'Audio endpoints synced.'
        );
      }
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    // Initial scan on load
    scanSystemAudio(false);

    // Periodic live sync when in real PC hardware mode
    const pollInterval = setInterval(() => {
      if (hardwareMode === 'system' && window.electronAudio?.getSystemAudio) {
        window.electronAudio.getSystemAudio().then(sys => {
          if (sys?.devices?.length) {
            setDevices(sys.devices);
          }
          if (sys?.apps?.length) {
            setApps(sys.apps);
          }
          if (sys?.captureDevices?.length) {
            setCaptureDevices(sys.captureDevices);
          }
        }).catch(() => {});
      }
    }, 6000);

    return () => clearInterval(pollInterval);
  }, [hardwareMode]);

  // Capture / Microphone control handlers
  const handleToggleCaptureMute = (id) => {
    const cap = captureDevices.find(c => c.id === id);
    if (!cap) return;
    const newMuted = !cap.muted;
    setCaptureDevices(captureDevices.map(c => c.id === id ? { ...c, muted: newMuted } : c));
    if (cap.cmdId && window.electronAudio?.setDeviceMute) {
      window.electronAudio.setDeviceMute(cap.cmdId, newMuted);
    }
    showToast(`${cap.name} ${newMuted ? 'muted' : 'unmuted'}`);
  };

  const handleCaptureSetDefault = (id) => {
    const cap = captureDevices.find(c => c.id === id);
    if (!cap) return;
    setCaptureDevices(captureDevices.map(c => ({ ...c, isDefault: c.id === id })));
    if (cap.cmdId && window.electronAudio?.setDefaultDevice) {
      window.electronAudio.setDefaultDevice(cap.cmdId);
    }
    showToast(`Set default microphone: ${cap.name}`);
  };

  const handleCaptureVolume = (id, vol) => {
    setCaptureDevices(captureDevices.map(c => c.id === id ? { ...c, volume: vol } : c));
    const cap = captureDevices.find(c => c.id === id);
    if (cap?.cmdId && window.electronAudio?.setDeviceVolume) {
      window.electronAudio.setDeviceVolume(cap.cmdId, vol);
    }
  };

  // Hardware mode switch (PC Real Hardware vs Studio Demo)
  const handleToggleHardwareMode = () => {
    if (hardwareMode === 'system') {
      setHardwareMode('studio');
      setApps(STUDIO_APPS);
      setDevices(STUDIO_DEVICES);
      setConnections(STUDIO_CONNECTIONS);
      showToast('Switched to Studio Demo Setup (Multi-Bluetooth LDAC, AAC, aptX)');
    } else {
      setHardwareMode('system');
      setApps(REAL_SYSTEM_APPS);
      setDevices(REAL_SYSTEM_DEVICES);
      setConnections(REAL_SYSTEM_CONNECTIONS);
      scanSystemAudio(false);
      showToast('Switched to Active PC Hardware (Realtek Headphones, Laptop Speakers, Voicemod)');
    }
  };

  // Sync minimize to tray setting with Electron main process
  useEffect(() => {
    if (window.electronAudio?.getMinimizeToTray) {
      window.electronAudio.getMinimizeToTray().then(val => {
        if (typeof val === 'boolean') setMinimizeToTray(val);
      });
      window.electronAudio.onMinimizeToTrayChanged?.((val) => {
        setMinimizeToTray(val);
      });
    }
  }, []);

  const handleToggleMinimizeToTray = async () => {
    const next = !minimizeToTray;
    setMinimizeToTray(next);
    if (window.electronAudio?.setMinimizeToTray) {
      await window.electronAudio.setMinimizeToTray(next);
    }
    showToast(next ? '✓ Window close will minimize to system tray' : '✕ Window close will exit application');
  };

  // Subscribe to real-time audio meters
  useEffect(() => {
    const unsubscribe = soundEngine.subscribeMeters((levels) => {
      setMeterData(levels);
    });
    return unsubscribe;
  }, []);

  // Audio Engine synthesis toggle
  const handleToggleAudioLive = () => {
    if (isAudioLive) {
      soundEngine.stopDemoAudio();
      setIsAudioLive(false);
      showToast('Audio synthesis engine stopped.');
    } else {
      soundEngine.startDemoAudio();
      setIsAudioLive(true);
      showToast('Live Audio Engine active: real-time synthesis & dynamic reactive meters running!');
    }
  };

  // App volume, mute, solo controls with real Windows OS audio integration
  const handleAppVolume = (id, vol) => {
    setApps(apps.map(a => a.id === id ? { ...a, volume: vol } : a));
    const target = apps.find(a => a.id === id);
    if (target && window.electronAudio?.setAppVolume) {
      window.electronAudio.setAppVolume(target.processName || target.name, vol, target.pid);
    }
  };

  const handleToggleAppMute = (id) => {
    const target = apps.find(a => a.id === id);
    if (!target) return;
    const newMuted = !target.muted;
    setApps(apps.map(a => a.id === id ? { ...a, muted: newMuted } : a));
    if (window.electronAudio?.setAppMute) {
      window.electronAudio.setAppMute(target.processName || target.name, newMuted, target.pid);
    }
    showToast(`${target.name} ${newMuted ? 'muted' : 'unmuted'}`);
  };

  const handleToggleAppSolo = (id) => {
    const target = apps.find(a => a.id === id);
    if (!target) return;
    const newSolo = !target.solo;
    setApps(apps.map(a => {
      if (a.id === id) return { ...a, solo: newSolo, muted: false };
      return { ...a, muted: newSolo };
    }));
    showToast(newSolo ? `Soloing ${target.name}` : 'Solo cancelled');
  };

  // Device volume, mute, delay, EQ controls with real Windows OS audio integration
  const handleDeviceVolume = (id, vol) => {
    setDevices(devices.map(d => d.id === id ? { ...d, volume: vol } : d));
    const dev = devices.find(d => d.id === id);
    if (dev?.cmdId && window.electronAudio?.setDeviceVolume) {
      window.electronAudio.setDeviceVolume(dev.cmdId, vol);
    }
  };

  const handleToggleDeviceMute = (id) => {
    const dev = devices.find(d => d.id === id);
    if (!dev) return;
    const newMuted = !dev.muted;
    setDevices(devices.map(d => d.id === id ? { ...d, muted: newMuted } : d));
    if (dev.cmdId && window.electronAudio?.setDeviceMute) {
      window.electronAudio.setDeviceMute(dev.cmdId, newMuted);
    }
    showToast(`${dev.name} ${newMuted ? 'muted' : 'unmuted'}`);
  };

  const handleDeviceDelay = (id, delayMs) => {
    setDevices(devices.map(d => d.id === id ? { ...d, delayMs } : d));
  };

  const handleDeviceEq = (id, eqPreset) => {
    setDevices(devices.map(d => d.id === id ? { ...d, eqPreset } : d));
    const dev = devices.find(d => d.id === id);
    showToast(`${dev.name}: EQ profile changed to ${eqPreset}`);
  };

  // Drag and drop cable interactions
  const handleStartDrag = (appId, e) => {
    setDragState({
      isDragging: true,
      sourceId: appId,
      currentX: e.clientX,
      currentY: e.clientY,
    });
    setSelectedAppPort(appId);
  };

  const handleMouseMove = (e) => {
    if (dragState.isDragging) {
      setDragState(prev => ({
        ...prev,
        currentX: e.clientX,
        currentY: e.clientY,
      }));
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        sourceId: null,
        currentX: 0,
        currentY: 0,
      });
    }
  };

  // Connect cable on drop & immediately apply to Windows Audio Policy
  const handleDropOnDevice = async (deviceId) => {
    const sourceId = dragState.sourceId || selectedAppPort;
    if (!sourceId) return;

    // Check if route exists
    const exists = connections.some(c => c.sourceId === sourceId && c.targetId === deviceId);
    const app = apps.find(a => a.id === sourceId);
    const dev = devices.find(d => d.id === deviceId);

    if (exists) {
      showToast(`${app?.name} is already routed to ${dev?.name}`);
    } else {
      const newConn = {
        id: `conn-${Date.now()}`,
        sourceId,
        targetId: deviceId,
        active: true,
        color: app?.color || 'var(--accent-indigo)',
      };
      // Allow multi-routing so an app can connect to multiple physical outputs simultaneously
      const existingConns = connections.filter(c => c.sourceId === sourceId);
      const isMultiRoute = existingConns.length > 0;
      setConnections(prev => [...prev, newConn]);
      showToast(isMultiRoute 
        ? `Dual Audio Linked: ${app?.name} ➔ ${dev?.cleanName || dev?.name} (Multi-Output)` 
        : `Routing ${app?.name} ➔ ${dev?.name}...`
      );

      // Apply to Windows OS Audio Policy via SoundVolumeView
      if (window.electronAudio?.routeAppToDevice && app && (dev?.cmdId || dev?.cleanName || dev?.name)) {
        try {
          const res = await window.electronAudio.routeAppToDevice(
            app.processName || app.name,
            dev.cmdId || dev.cleanName || dev.name,
            app.pid
          );
          if (res?.success) {
            showToast(`✓ Windows Policy Applied: ${app.name} ➔ ${dev.cleanName || dev.name}`);
          }
        } catch (err) {
          console.warn('Windows Audio Route Error:', err);
        }
      }
    }

    setDragState({ isDragging: false, sourceId: null, currentX: 0, currentY: 0 });
    setSelectedAppPort(null);
  };

  // Port click (click source port, then click destination port)
  const handlePortClickApp = (appId) => {
    if (selectedAppPort === appId) {
      setSelectedAppPort(null);
    } else {
      setSelectedAppPort(appId);
      showToast(`Selected ${apps.find(a => a.id === appId)?.name}. Now click an output device jack to connect.`);
    }
  };

  const handlePortClickDevice = (deviceId) => {
    if (selectedAppPort) {
      handleDropOnDevice(deviceId);
    }
  };

  // Disconnect a specific route & return app to Windows default audio device
  const handleDisconnectRoute = async (routeId) => {
    const conn = connections.find(c => c.id === routeId);
    if (!conn) return;
    const app = apps.find(a => a.id === conn.sourceId);
    const dev = devices.find(d => d.id === conn.targetId);
    setConnections(prev => prev.filter(c => c.id !== routeId));
    showToast(`Disconnected ${app?.name} from ${dev?.name}`);

    if (window.electronAudio?.routeAppToDevice && app) {
      const defDev = devices.find(d => d.isDefault) || devices[0];
      if (defDev?.cmdId) {
        window.electronAudio.routeAppToDevice(
          app.processName || app.name,
          defDev.cmdId,
          app.pid
        );
      }
    }
  };

  // Calculate how many input sources currently have 2+ active routes
  const sourceRouteCounts = {};
  connections.forEach(c => {
    sourceRouteCounts[c.sourceId] = (sourceRouteCounts[c.sourceId] || 0) + 1;
  });
  const activeDualCount = Object.values(sourceRouteCounts).filter(cnt => cnt >= 2).length;

  const handleOpenDualTransfer = (sourceId = null, sourceType = 'app') => {
    if (sourceId) {
      setDualTransferInitialSource({ id: sourceId, type: sourceType });
    } else {
      setDualTransferInitialSource({ id: apps[0]?.id || '', type: 'app' });
    }
    setIsDualTransferOpen(true);
  };

  const handleApplyDualTransfer = async ({
    sourceId,
    sourceType,
    sourceName,
    deviceAId,
    deviceBId,
    volA,
    volB,
    delayMs
  }) => {
    const app = apps.find(a => a.id === sourceId);
    const cap = captureDevices.find(c => c.id === sourceId);
    const devA = devices.find(d => d.id === deviceAId) || devices[0];
    const devB = devices.find(d => d.id === deviceBId) || devices[1] || devices[0];

    const sourceColor = app?.color || (sourceType === 'capture' ? '#ea4335' : 'var(--accent-indigo)');

    // 1. Update connections matrix: remove existing connections for sourceId, add both deviceA and deviceB
    const newConnA = {
      id: `conn-dual-a-${Date.now()}`,
      sourceId,
      targetId: deviceAId,
      active: true,
      color: sourceColor,
    };
    const newConnB = {
      id: `conn-dual-b-${Date.now() + 1}`,
      sourceId,
      targetId: deviceBId,
      active: true,
      color: 'var(--accent-purple)',
    };

    setConnections(prev => [...prev.filter(c => c.sourceId !== sourceId), newConnA, newConnB]);

    // 2. Update device volumes & latency compensation
    setDevices(prev => prev.map(d => {
      if (d.id === deviceAId) return { ...d, volume: volA };
      if (d.id === deviceBId) return { ...d, volume: volB, delayMs: Math.max(d.delayMs, delayMs) };
      return d;
    }));

    // 3. Audio synthesis engine sync
    soundEngine.setDualOutput(sourceId, deviceAId, deviceBId, delayMs, volA, volB);

    // 4. Native Windows OS Audio Policy Bridge
    if (window.electronAudio?.transferDualOutput) {
      try {
        const res = await window.electronAudio.transferDualOutput({
          target: app ? (app.processName || app.name) : (cap ? (cap.name || cap.cmdId) : sourceName),
          deviceCmdId: devA?.cmdId || devA?.cleanName || devA?.name,
          secondaryDeviceCmdId: devB?.cmdId || devB?.cleanName || devB?.name,
          pid: app?.pid || 0,
          isCapture: sourceType === 'capture'
        });
        if (res?.success) {
          showToast(`✓ Windows Dual Audio Applied: ${sourceName} ➔ ${devA?.cleanName || devA?.name} + ${devB?.cleanName || devB?.name}`);
          return;
        }
      } catch (err) {
        console.warn('Native Dual Transfer error:', err);
      }
    }

    showToast(`✓ 1 ➔ 2 Dual Transfer Active: ${sourceName} transferred to ${devA?.cleanName || devA?.name} + ${devB?.cleanName || devB?.name}!`);
  };

  const handleDisconnectDualTransfer = async (sourceId) => {
    const existing = connections.filter(c => c.sourceId === sourceId);
    if (existing.length > 1) {
      setConnections(prev => prev.filter(c => c.id !== existing[1].id));
    }
    soundEngine.removeDualOutput(sourceId);
    const app = apps.find(a => a.id === sourceId);
    const cap = captureDevices.find(c => c.id === sourceId);
    showToast(`Dual transfer disconnected for ${app?.name || cap?.name || 'source'}. Reverted to single destination.`);
  };

  const handleClearAllRoutes = async () => {
    setConnections([]);
    showToast('All patch cables disconnected. Routed apps returned to Windows default.');

    if (window.electronAudio?.routeAppToDevice) {
      const defDev = devices.find(d => d.isDefault) || devices[0];
      const targetDevId = defDev?.cmdId || defDev?.cleanName || defDev?.name;
      if (targetDevId) {
        for (const app of apps) {
          try {
            await window.electronAudio.routeAppToDevice(
              app.processName || app.name,
              targetDevId,
              app.pid
            );
          } catch (err) {}
        }
      }
    }
  };

  const handleResetDefaultRoutes = async () => {
    const defaultConns = hardwareMode === 'system' ? REAL_SYSTEM_CONNECTIONS : STUDIO_CONNECTIONS;
    setConnections(defaultConns);
    showToast('Routes reset to default matrix.');

    if (window.electronAudio?.routeAppToDevice && hardwareMode === 'system') {
      for (const conn of defaultConns) {
        const app = apps.find(a => a.id === conn.sourceId);
        const dev = devices.find(d => d.id === conn.targetId);
        const devIdStr = dev?.cmdId || dev?.cleanName || dev?.name;
        if (app && devIdStr) {
          try {
            await window.electronAudio.routeAppToDevice(
              app.processName || app.name,
              devIdStr,
              app.pid
            );
          } catch (err) {}
        }
      }
    }
  };

  // Add custom audio application
  const handleAddApp = (e) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    const newApp = {
      id: `app-custom-${Date.now()}`,
      name: newAppName,
      processName: `${newAppName.toLowerCase().replace(/\s+/g, '')}.exe`,
      pid: Math.floor(1000 + Math.random() * 9000),
      category: 'browser',
      icon: 'sliders',
      color: '#38bdf8',
      format: '48.0 kHz • Active Process Stream',
      volume: 85,
      muted: false,
      solo: false,
      currentTrack: 'Process Audio Output',
      activeLevel: 0.65,
      frequencyData: [35, 50, 70, 80, 65, 45, 30, 25],
    };
    setApps(prev => [...prev, newApp]);
    setNewAppName('');
    setIsAddAppOpen(false);
    showToast(`Added process: "${newApp.name}"`);
  };

  // Add custom output device
  const handleAddDevice = (e) => {
    e.preventDefault();
    if (!newDevName.trim()) return;
    const isBt = newDevType === 'bluetooth';
    const newDev = {
      id: `dev-custom-${Date.now()}`,
      name: newDevName,
      type: newDevType,
      icon: isBt ? 'headphones' : (newDevType === 'builtin' ? 'speaker' : 'radio'),
      codec: isBt ? 'AAC / SBC' : 'Direct PCM',
      codecRate: '48.0 kHz / 24-bit',
      codecQuality: isBt ? 'Standard Bluetooth Audio' : 'Hardware Stream',
      battery: isBt ? 85 : null,
      rssi: isBt ? -58 : null,
      signalQuality: isBt ? 'Good' : 'Zero Loss',
      bandwidthUsageKbps: isBt ? 320 : 0,
      volume: 80,
      muted: false,
      delayMs: isBt ? 160 : 5,
      eqPreset: 'Flat Reference',
      isDefault: false,
    };
    setDevices(prev => [...prev, newDev]);
    setNewDevName('');
    setIsAddDeviceOpen(false);
    showToast(`Added output device: "${newDev.name}"`);
  };

  // Profiles
  const handleSelectProfile = async (profileId) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    setActiveProfile(profileId);

    const newConns = [];
    for (const r of profile.routes) {
      const app = apps.find(a => a.id === r.sourceId);
      const dev = devices.find(d => d.id === r.targetId);
      if (app && dev) {
        newConns.push({
          id: `conn-p-${r.sourceId}-${Date.now()}`,
          sourceId: r.sourceId,
          targetId: r.targetId,
          active: true,
          color: app.color || '#6366f1',
        });
      }
    }

    setConnections(newConns);
    showToast(`Activated Profile: "${profile.name}"`);

    // Real Windows Audio Routing for profile
    if (window.electronAudio?.routeAppToDevice && hardwareMode === 'system') {
      for (const conn of newConns) {
        const app = apps.find(a => a.id === conn.sourceId);
        const dev = devices.find(d => d.id === conn.targetId);
        if (app && dev?.cmdId) {
          try {
            await window.electronAudio.routeAppToDevice(
              app.processName || app.name,
              dev.cmdId,
              app.pid
            );
          } catch (err) {}
        }
      }
    }
  };

  // Silent Disco Mode
  const handleToggleSilentDisco = () => {
    if (silentDiscoActive) {
      setSilentDiscoActive(false);
      handleSelectProfile('profile-pc-default');
      showToast('Silent Disco mode turned off.');
    } else {
      setSilentDiscoActive(true);
      // Route primary audio app to all available devices simultaneously
      const primaryAppId = apps[0]?.id || 'app-spotify';
      const silentRoutes = devices.map((d, i) => ({
        id: `conn-sd-${i}`,
        sourceId: primaryAppId,
        targetId: d.id,
        active: true,
        color: apps[0]?.color || '#1db954',
      }));
      setConnections(silentRoutes);
      showToast(`🪩 Silent Disco Active: ${apps[0]?.name} streaming across all outputs in sync!`);
    }
  };

  // Bandwidth auto-optimize
  const handleOptimizeBandwidth = () => {
    setDevices(devices.map(d => {
      if (d.codec === 'LDAC') return { ...d, bandwidthUsageKbps: 660, codecRate: '660 kbps (Optimized)' };
      if (d.codec === 'aptX Adaptive') return { ...d, bandwidthUsageKbps: 280, codecRate: '280 kbps (Standard)' };
      return d;
    }));
    setIsBluetoothHealthOpen(false);
    showToast('Bandwidth optimized: Bitrates adapted to prevent Bluetooth HCI saturation.');
  };

  const activeCalibrateDevice = devices.find(d => d.id === activeCalibrateDeviceId);

  return (
    <div 
      className="app-container" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Toast Banner */}
      {toast && (
        <div className="toast-banner">
          <Sparkles size={16} color="var(--accent-cyan)" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        profiles={profiles}
        isAudioLive={isAudioLive}
        onToggleAudioLive={handleToggleAudioLive}
        isMiniMixerOpen={isMiniMixerOpen}
        onToggleMiniMixer={() => setIsMiniMixerOpen(!isMiniMixerOpen)}
        isTrayOpen={isTrayOpen}
        onToggleTray={() => setIsTrayOpen(!isTrayOpen)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenCalibrator={() => setActiveCalibrateDeviceId(devices[0]?.id || 'dev-realtek-headphone')}
        onOpenBluetoothHealth={() => setIsBluetoothHealthOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenTechSpec={() => setIsTechSpecOpen(true)}
        osPlatform={osPlatform}
        onChangePlatform={(p) => {
          setOsPlatform(p);
          showToast(`Switched active OS driver engine profile to ${p}`);
        }}
        silentDiscoActive={silentDiscoActive}
        onToggleSilentDisco={handleToggleSilentDisco}
        hardwareMode={hardwareMode}
        onToggleHardwareMode={handleToggleHardwareMode}
        onScanHardware={() => scanSystemAudio(true)}
        isScanning={isScanning}
        onOpenCapture={() => setIsCaptureOpen(true)}
        isCaptureOpen={isCaptureOpen}
        minimizeToTray={minimizeToTray}
        onToggleMinimizeToTray={handleToggleMinimizeToTray}
        onReplayStartup={() => setShowSplash(true)}
        onOpenDualTransfer={handleOpenDualTransfer}
        activeDualCount={activeDualCount}
      />

      {/* Workspace Area: Apps (Left) — Patch Canvas (Center) — Devices (Right) */}
      <main className="workspace-container">
        {/* Left: Apps Column */}
        <section className="node-column">
          <div className="column-header">
            <div className="column-title">
              <Sliders size={16} color="var(--accent-indigo)" />
              <span>Audio Sources (Apps)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="count-badge">{apps.length} Active</span>
              <button
                className="nudge-btn"
                onClick={() => scanSystemAudio(true)}
                disabled={isScanning}
                title="Search & refresh active application audio streams"
                style={{ padding: '2px 8px', color: 'var(--accent-indigo)', borderColor: 'rgba(99, 102, 241, 0.4)', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={11} className={isScanning ? 'spin-icon' : ''} />
                <span>Refresh</span>
              </button>
              <button
                className="nudge-btn"
                onClick={() => setIsAddAppOpen(true)}
                title="Add a running application or process (.exe)"
                style={{ padding: '2px 8px', color: 'var(--accent-indigo)', borderColor: 'rgba(99, 102, 241, 0.4)' }}
              >
                + Add App
              </button>
            </div>
          </div>

          {apps.map(app => (
            <AppNode
              key={app.id}
              app={app}
              connections={connections}
              devices={devices}
              onVolumeChange={handleAppVolume}
              onToggleMute={handleToggleAppMute}
              onToggleSolo={handleToggleAppSolo}
              onStartDrag={handleStartDrag}
              isDraggingSource={dragState.sourceId === app.id || selectedAppPort === app.id}
              onPortClick={handlePortClickApp}
              meterData={meterData[app.id]}
              isAudioLive={isAudioLive}
              onOpenDualTransfer={handleOpenDualTransfer}
            />
          ))}
        </section>

        {/* Center: Interactive SVG Patch Bay Routing Canvas */}
        <RoutingCanvas
          connections={connections}
          apps={apps}
          devices={devices}
          isAudioLive={isAudioLive}
          dragState={dragState}
          onDisconnectRoute={handleDisconnectRoute}
          onClearAllRoutes={handleClearAllRoutes}
          onResetDefaultRoutes={handleResetDefaultRoutes}
          onScanHardware={() => scanSystemAudio(true)}
          isScanning={isScanning}
          onOpenDualTransfer={handleOpenDualTransfer}
        />

        {/* Right: Output Devices Column */}
        <section className="node-column">
          <div className="column-header">
            <div className="column-title">
              <Headphones size={16} color="var(--accent-cyan)" />
              <span>Output Receivers</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="count-badge">{devices.length} Connected</span>
              <button
                className="nudge-btn"
                onClick={() => scanSystemAudio(true)}
                disabled={isScanning}
                title="Search & refresh connected headphones, speakers, and Bluetooth receivers"
                style={{ padding: '2px 8px', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.4)', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RefreshCw size={11} className={isScanning ? 'spin-icon' : ''} />
                <span>Refresh</span>
              </button>
              <button
                className="nudge-btn"
                onClick={() => setIsAddDeviceOpen(true)}
                title="Add a Bluetooth headphone, USB DAC, or Virtual Cable"
                style={{ padding: '2px 8px', color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.4)' }}
              >
                + Add Device
              </button>
            </div>
          </div>

          {devices.map(device => (
            <DeviceNode
              key={device.id}
              device={device}
              connections={connections}
              apps={apps}
              onVolumeChange={handleDeviceVolume}
              onToggleMute={handleToggleDeviceMute}
              onDelayChange={handleDeviceDelay}
              onEqChange={handleDeviceEq}
              onPortClick={handlePortClickDevice}
              onPortMouseUp={handleDropOnDevice}
              isTargetCandidate={dragState.isDragging || selectedAppPort !== null}
              onTriggerCalibration={(id) => setActiveCalibrateDeviceId(id)}
            />
          ))}
        </section>
      </main>

      {/* Add Application Modal */}
      {isAddAppOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddAppOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Plus size={18} color="var(--accent-indigo)" />
                <span>Add Audio Application (.exe)</span>
              </div>
            </div>
            <form onSubmit={handleAddApp}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Application or Process Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. VLC Media Player, Steam, Valorant"
                  value={newAppName}
                  onChange={e => setNewAppName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="nudge-btn"
                  onClick={() => setIsAddAppOpen(false)}
                  style={{ padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--accent-indigo)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 16px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Add Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Device Modal */}
      {isAddDeviceOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddDeviceOpen(false)}>
          <div className="modal-card" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Plus size={18} color="var(--accent-cyan)" />
                <span>Add Audio Output Device</span>
              </div>
            </div>
            <form onSubmit={handleAddDevice}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Device Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Galaxy Buds2, JBL Flip 6, USB Soundcard"
                  value={newDevName}
                  onChange={e => setNewDevName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 12px',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '0.85rem'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  Connection Interface
                </label>
                <select
                  value={newDevType}
                  onChange={e => setNewDevType(e.target.value)}
                  className="eq-select"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.8rem' }}
                >
                  <option value="bluetooth">Bluetooth Wireless (AAC / SBC / LDAC)</option>
                  <option value="usb">USB Interface / DAC</option>
                  <option value="wired">Wired 3.5mm Headphone Jack</option>
                  <option value="builtin">Built-in Desktop / Laptop Speakers</option>
                  <option value="virtual">Virtual Audio Cable (OBS / Discord Stream)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="nudge-btn"
                  onClick={() => setIsAddDeviceOpen(false)}
                  style={{ padding: '6px 14px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'var(--accent-cyan)',
                    border: 'none',
                    color: '#000000',
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 16px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Add Receiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mini-Mixer Floating Window */}
      {isMiniMixerOpen && (
        <MiniMixer
          apps={apps}
          devices={devices}
          connections={connections}
          onVolumeChange={handleAppVolume}
          onToggleMute={handleToggleAppMute}
          onClose={() => setIsMiniMixerOpen(false)}
          onRestoreHero={() => setIsMiniMixerOpen(false)}
        />
      )}

      {/* System Tray Flyout Simulator */}
      {isTrayOpen && (
        <SystemTrayPopup
          apps={apps}
          devices={devices}
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={handleSelectProfile}
          onClose={() => setIsTrayOpen(false)}
          onOpenFullApp={() => setIsTrayOpen(false)}
          onVolumeChange={handleDeviceVolume}
          onToggleMute={handleToggleDeviceMute}
          onRouteAppToDevice={(appId, devId) => {
            const app = apps.find(a => a.id === appId);
            const dev = devices.find(d => d.id === devId);
            const newConn = {
              id: `conn-tray-${Date.now()}`,
              sourceId: appId,
              targetId: devId,
              active: true,
              color: app?.color || '#6366f1'
            };
            setConnections(prev => [...prev.filter(c => c.sourceId !== appId), newConn]);
            if (window.electronAudio?.routeAppToDevice && app && (dev?.cmdId || dev?.cleanName || dev?.name)) {
              window.electronAudio.routeAppToDevice(
                app.processName || app.name,
                dev.cmdId || dev.cleanName || dev.name,
                app.pid
              );
              showToast(`✓ Windows Policy Applied: ${app.name} ➔ ${dev.cleanName || dev.name}`);
            }
          }}
        />
      )}

      {/* Latency Acoustic Calibrator Modal */}
      {activeCalibrateDevice && (
        <LatencyCalibrator
          device={activeCalibrateDevice}
          onClose={() => setActiveCalibrateDeviceId(null)}
          onApplyLatency={(id, delayMs) => {
            handleDeviceDelay(id, delayMs);
            showToast(`Applied +${delayMs}ms acoustic latency compensation to ${activeCalibrateDevice.name}`);
          }}
        />
      )}

      {/* Bluetooth Bandwidth & RF Health Modal */}
      {isBluetoothHealthOpen && (
        <BluetoothHealthMonitor
          devices={devices}
          onClose={() => setIsBluetoothHealthOpen(false)}
          onOptimizeBandwidth={handleOptimizeBandwidth}
        />
      )}

      {/* Rules & Automation Modal */}
      {isRulesOpen && (
        <RulesModal
          onClose={() => setIsRulesOpen(false)}
        />
      )}

      {/* Technical Architecture Modal */}
      {isTechSpecOpen && (
        <TechArchitectureModal
          osPlatform={osPlatform}
          onClose={() => setIsTechSpecOpen(false)}
        />
      )}

      {/* Recording Devices & Microphones Drawer */}
      <CaptureDrawer
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        captureDevices={captureDevices}
        onToggleMute={handleToggleCaptureMute}
        onSetDefault={handleCaptureSetDefault}
        onVolumeChange={handleCaptureVolume}
        onOpenDualTransfer={handleOpenDualTransfer}
      />

      {/* 1 Input Source to 2 Output Sources Dual Transfer Modal */}
      <DualOutputModal
        isOpen={isDualTransferOpen}
        onClose={() => setIsDualTransferOpen(false)}
        apps={apps}
        devices={devices}
        captureDevices={captureDevices}
        connections={connections}
        initialSource={dualTransferInitialSource}
        onApplyDualTransfer={handleApplyDualTransfer}
        onDisconnectDualTransfer={handleDisconnectDualTransfer}
        showToast={showToast}
      />

      {/* Minimal Startup Reveal Animation */}
      {showSplash && (
        <StartupSplash onComplete={() => setShowSplash(false)} />
      )}
    </div>
  );
}
