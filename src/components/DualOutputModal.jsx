import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  X, 
  Volume2, 
  VolumeX, 
  Clock, 
  Sparkles, 
  Check, 
  Sliders, 
  Headphones, 
  Speaker, 
  Mic, 
  Music, 
  Globe, 
  Gamepad2, 
  Radio, 
  ArrowRight,
  Disc,
  Play,
  RotateCcw
} from 'lucide-react';
import { soundEngine } from '../services/soundEngine';

export default function DualOutputModal({
  isOpen,
  onClose,
  apps = [],
  devices = [],
  captureDevices = [],
  connections = [],
  initialSource = null, // { id, type: 'app' | 'capture' }
  onApplyDualTransfer,
  onDisconnectDualTransfer,
  showToast
}) {
  if (!isOpen) return null;

  // Selected input source type: 'app' or 'capture'
  const [sourceType, setSourceType] = useState(initialSource?.type || 'app');
  // Selected input source ID
  const [selectedSourceId, setSelectedSourceId] = useState(
    initialSource?.id || (sourceType === 'app' ? (apps[0]?.id || '') : (captureDevices[0]?.id || ''))
  );

  // Output 1 (Primary) and Output 2 (Secondary)
  const [deviceAId, setDeviceAId] = useState(devices[0]?.id || '');
  const [deviceBId, setDeviceBId] = useState(devices[1]?.id || devices[0]?.id || '');

  // Independent Volumes
  const [volumeA, setVolumeA] = useState(85);
  const [volumeB, setVolumeB] = useState(80);
  const [mutedA, setMutedA] = useState(false);
  const [mutedB, setMutedB] = useState(false);

  // Latency Sync Offset for Output B (0ms to 500ms)
  const [delayMs, setDelayMs] = useState(35);

  // Test preview state
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  // Sync state if initialSource changes or on open
  useEffect(() => {
    if (initialSource?.type) {
      setSourceType(initialSource.type);
    }
    if (initialSource?.id) {
      setSelectedSourceId(initialSource.id);
    }
  }, [initialSource]);

  // Check if the current selected source is already routed to 2 outputs
  const existingConns = connections.filter(c => c.sourceId === selectedSourceId);
  const isCurrentlyDual = existingConns.length >= 2;

  // Pre-fill existing devices if already connected
  useEffect(() => {
    if (existingConns.length >= 1 && devices.some(d => d.id === existingConns[0].targetId)) {
      setDeviceAId(existingConns[0].targetId);
    }
    if (existingConns.length >= 2 && devices.some(d => d.id === existingConns[1].targetId)) {
      setDeviceBId(existingConns[1].targetId);
    }
  }, [selectedSourceId, connections]);

  // Get active source object
  const currentApp = sourceType === 'app' ? apps.find(a => a.id === selectedSourceId) : null;
  const currentCap = sourceType === 'capture' ? captureDevices.find(c => c.id === selectedSourceId) : null;
  const sourceName = currentApp ? currentApp.name : (currentCap ? currentCap.name : 'Input Source');

  const devA = devices.find(d => d.id === deviceAId) || devices[0];
  const devB = devices.find(d => d.id === deviceBId) || devices[1] || devices[0];

  const handleApply = () => {
    if (!selectedSourceId || !deviceAId || !deviceBId) {
      showToast?.('Please choose an input source and two output destinations.');
      return;
    }

    if (deviceAId === deviceBId) {
      showToast?.('Notice: Output A and Output B are set to the same device. For dual audio, choose two distinct receivers.');
    }

    onApplyDualTransfer({
      sourceId: selectedSourceId,
      sourceType,
      sourceName,
      deviceAId,
      deviceBId,
      volA: mutedA ? 0 : volumeA,
      volB: mutedB ? 0 : volumeB,
      delayMs,
    });

    onClose();
  };

  const handleDisconnect = () => {
    if (onDisconnectDualTransfer) {
      onDisconnectDualTransfer(selectedSourceId);
    }
    onClose();
  };

  // 1-Click Quick Presets
  const applyPreset = (type) => {
    if (type === 'shared-listening') {
      // Find two headphones or top two devices
      const headphones = devices.filter(d => d.type === 'bluetooth' || d.type === 'wired');
      if (headphones.length >= 2) {
        setDeviceAId(headphones[0].id);
        setDeviceBId(headphones[1].id);
      } else if (devices.length >= 2) {
        setDeviceAId(devices[0].id);
        setDeviceBId(devices[1].id);
      }
      setSourceType('app');
      if (apps.length > 0) setSelectedSourceId(apps[0].id);
      setVolumeA(85);
      setVolumeB(85);
      setDelayMs(25);
      showToast?.('Preset loaded: Dual Headphones / Shared Listening');
    } else if (type === 'mic-monitor') {
      // Set to microphone input -> headphones + secondary speakers/output
      setSourceType('capture');
      if (captureDevices.length > 0) setSelectedSourceId(captureDevices[0].id);
      const hp = devices.find(d => d.type === 'wired' || d.name.toLowerCase().includes('headphone')) || devices[0];
      const spk = devices.find(d => d.id !== hp?.id) || devices[1] || devices[0];
      if (hp) setDeviceAId(hp.id);
      if (spk) setDeviceBId(spk.id);
      setVolumeA(90);
      setVolumeB(75);
      setDelayMs(0);
      showToast?.('Preset loaded: Microphone Direct Monitor & Dual Broadcast');
    } else if (type === 'room-headset') {
      // Speakers + Bluetooth Headset
      const spk = devices.find(d => d.type === 'builtin' || d.name.toLowerCase().includes('speaker')) || devices[0];
      const bt = devices.find(d => d.type === 'bluetooth' || d.id !== spk?.id) || devices[1] || devices[0];
      if (spk) setDeviceAId(spk.id);
      if (bt) setDeviceBId(bt.id);
      setVolumeA(75);
      setVolumeB(80);
      setDelayMs(45);
      showToast?.('Preset loaded: Room Speakers + Wireless Headset');
    }
  };

  // Play test impulse across both channels
  const handleTestAudio = () => {
    setIsPlayingTest(true);
    soundEngine.playCalibrationTone(() => {
      setIsPlayingTest(false);
    });
    showToast?.(`Testing dual audio balance: ${devA?.name || 'Output 1'} & ${devB?.name || 'Output 2'}`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 110 }}>
      <div 
        className="modal-card" 
        style={{ maxWidth: 740, width: '94%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-cyan)'
            }}>
              <Share2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Dual Output Transfer & Splitter</span>
                <span style={{
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: 'var(--accent-cyan)',
                  padding: '1px 7px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 700,
                  border: '1px solid rgba(6, 182, 212, 0.35)'
                }}>
                  1 INPUT ➔ 2 OUTPUTS
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Transfer any application or microphone input stream to two physical audio output receivers simultaneously
              </div>
            </div>
          </div>
          <button 
            className="action-icon-btn" 
            onClick={onClose}
            style={{ width: 28, height: 28 }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div style={{ 
          marginTop: 14, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.02)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={12} color="var(--accent-cyan)" /> Quick 1-Click Presets:
          </span>
          <button 
            type="button" 
            className="nudge-btn" 
            onClick={() => applyPreset('shared-listening')}
            style={{ padding: '3px 9px', fontSize: '0.72rem' }}
          >
            🎧 Dual Headphones
          </button>
          <button 
            type="button" 
            className="nudge-btn" 
            onClick={() => applyPreset('mic-monitor')}
            style={{ padding: '3px 9px', fontSize: '0.72rem' }}
          >
            🎙️ Mic Monitor & Broadcast
          </button>
          <button 
            type="button" 
            className="nudge-btn" 
            onClick={() => applyPreset('room-headset')}
            style={{ padding: '3px 9px', fontSize: '0.72rem' }}
          >
            🔊 Room Speakers + Headset
          </button>
        </div>

        {/* Step 1: Input Source Selection */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step 1: Choose 1 Input Source
            </label>
            {/* Category switcher */}
            <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 2, borderRadius: 'var(--radius-full)' }}>
              <button
                type="button"
                onClick={() => {
                  setSourceType('app');
                  if (apps.length > 0) setSelectedSourceId(apps[0].id);
                }}
                style={{
                  background: sourceType === 'app' ? 'var(--accent-indigo)' : 'transparent',
                  color: sourceType === 'app' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Applications ({apps.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceType('capture');
                  if (captureDevices.length > 0) setSelectedSourceId(captureDevices[0].id);
                }}
                style={{
                  background: sourceType === 'capture' ? 'var(--accent-rose)' : 'transparent',
                  color: sourceType === 'capture' ? '#ffffff' : 'var(--text-muted)',
                  border: 'none',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.70rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Microphones & Capture ({captureDevices.length})
              </button>
            </div>
          </div>

          {/* Source Dropdown / Selector Card */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: currentApp?.color || (sourceType === 'capture' ? '#ea4335' : 'var(--accent-indigo)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                {sourceType === 'capture' ? <Mic size={18} /> : <Sliders size={18} />}
              </div>
              <div style={{ flex: 1 }}>
                <select
                  value={selectedSourceId}
                  onChange={e => setSelectedSourceId(e.target.value)}
                  className="eq-select"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.84rem', fontWeight: 600 }}
                >
                  {sourceType === 'app' ? (
                    apps.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.name} (PID {app.pid}) • {app.currentTrack || 'Active Stream'}
                      </option>
                    ))
                  ) : (
                    captureDevices.map(cap => (
                      <option key={cap.id} value={cap.id}>
                        {cap.name} {cap.isDefault ? '• [DEFAULT MIC]' : ''}
                      </option>
                    ))
                  )}
                </select>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  {sourceType === 'app' 
                    ? `Process: ${currentApp?.processName || 'App'} • Format: ${currentApp?.format || '48 kHz WASAPI'}` 
                    : `Audio Input: ${currentCap?.cmdId || 'Direct Hardware Microphone'}`
                  }
                </div>
              </div>
            </div>

            {isCurrentlyDual && (
              <span style={{
                fontSize: '0.65rem',
                fontFamily: 'var(--font-mono)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                whiteSpace: 'nowrap'
              }}>
                ✓ 2 OUTPUTS LINKED
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Visual Router Flow Diagram */}
        <div style={{
          marginTop: 16,
          background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.8) 0%, rgba(8, 11, 17, 0.95) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.04em' }}>
            Signal Flow Routing Architecture
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr auto 1.8fr', alignItems: 'center', gap: 12 }}>
            {/* Input Node Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px'
            }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--accent-indigo)', fontWeight: 700, textTransform: 'uppercase' }}>
                1 Source (Input)
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sourceName}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                {sourceType === 'app' ? 'Audio Stream' : 'Recording Bus'}
              </div>
            </div>

            {/* Fork Graphic */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.4)',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)'
              }}>
                <Share2 size={13} />
              </div>
              <span style={{ fontSize: '0.60rem', color: 'var(--accent-cyan)', fontWeight: 700, marginTop: 4 }}>
                DUAL SPLIT
              </span>
            </div>

            {/* Dual Destination Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Output A mini status */}
              <div style={{
                background: 'rgba(6, 182, 212, 0.06)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.62rem', background: 'var(--accent-cyan)', color: '#000000', fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>
                    A
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {devA?.cleanName || devA?.name || 'Output 1'}
                  </span>
                </div>
                <span style={{ fontSize: '0.70rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {mutedA ? 'MUTED' : `${volumeA}%`}
                </span>
              </div>

              {/* Output B mini status */}
              <div style={{
                background: 'rgba(139, 92, 246, 0.06)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.62rem', background: 'var(--accent-purple)', color: '#ffffff', fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>
                    B
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {devB?.cleanName || devB?.name || 'Output 2'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)' }}>
                    +{delayMs}ms
                  </span>
                  <span style={{ fontSize: '0.70rem', fontFamily: 'var(--font-mono)', color: '#ffffff', fontWeight: 700 }}>
                    {mutedB ? 'MUTED' : `${volumeB}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2 & 3: Dual Output Matrix Columns */}
        <div style={{ marginTop: 18 }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 8 }}>
            Step 2: Configure 2 Output Destinations
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Output Destination 1 (Primary) */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    background: 'var(--accent-cyan)',
                    color: '#000000',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    DESTINATION A
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>Primary Output</span>
                </div>
                <button
                  className={`mini-mute-btn ${mutedA ? 'muted' : ''}`}
                  onClick={() => setMutedA(!mutedA)}
                  title={mutedA ? 'Unmute Output A' : 'Mute Output A'}
                >
                  {mutedA ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
              </div>

              {/* Device Selector */}
              <div>
                <select
                  value={deviceAId}
                  onChange={e => setDeviceAId(e.target.value)}
                  className="eq-select"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.80rem' }}
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.isDefault ? '(Default Device)' : ''}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Type: {devA?.type?.toUpperCase() || 'AUDIO'} • {devA?.codec || 'PCM'}
                </div>
              </div>

              {/* Volume Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Volume Level</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {mutedA ? '0% (Muted)' : `${volumeA}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mutedA ? 0 : volumeA}
                  onChange={e => setVolumeA(parseInt(e.target.value, 10))}
                  className="custom-fader"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Output Destination 2 (Secondary) */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    background: 'var(--accent-purple)',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4
                  }}>
                    DESTINATION B
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>Secondary Output</span>
                </div>
                <button
                  className={`mini-mute-btn ${mutedB ? 'muted' : ''}`}
                  onClick={() => setMutedB(!mutedB)}
                  title={mutedB ? 'Unmute Output B' : 'Mute Output B'}
                >
                  {mutedB ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
              </div>

              {/* Device Selector */}
              <div>
                <select
                  value={deviceBId}
                  onChange={e => setDeviceBId(e.target.value)}
                  className="eq-select"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.80rem' }}
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.id === deviceAId ? '(Same as A)' : ''}
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Type: {devB?.type?.toUpperCase() || 'AUDIO'} • {devB?.codec || 'PCM'}
                </div>
              </div>

              {/* Volume Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.70rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Volume Level</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', fontWeight: 700 }}>
                    {mutedB ? '0% (Muted)' : `${volumeB}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={mutedB ? 0 : volumeB}
                  onChange={e => setVolumeB(parseInt(e.target.value, 10))}
                  className="custom-fader"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Sync Latency Offset Slider */}
              <div style={{ 
                marginTop: 2, 
                padding: '8px 10px', 
                background: 'rgba(0,0,0,0.25)', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255,255,255,0.06)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} color="var(--accent-purple)" /> Latency Sync Offset:
                  </span>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-purple)', fontWeight: 700 }}>
                    +{delayMs} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={delayMs}
                  onChange={e => setDelayMs(parseInt(e.target.value, 10))}
                  className="delay-slider"
                  style={{ width: '100%' }}
                  title="Compensate for Bluetooth audio buffer latency difference"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="nudge-btn" onClick={() => setDelayMs(Math.max(0, delayMs - 10))} style={{ padding: '1px 6px', fontSize: '0.62rem' }}>-10ms</button>
                    <button type="button" className="nudge-btn" onClick={() => setDelayMs(Math.min(500, delayMs + 10))} style={{ padding: '1px 6px', fontSize: '0.62rem' }}>+10ms</button>
                    <button type="button" className="nudge-btn" onClick={() => setDelayMs(0)} style={{ padding: '1px 6px', fontSize: '0.62rem' }}>0ms</button>
                  </div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {delayMs > 30 ? 'Bluetooth Sync' : 'Direct Sync'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          marginTop: 22,
          paddingTop: 14,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10
        }}>
          {/* Test tone button */}
          <button
            type="button"
            className="nudge-btn"
            onClick={handleTestAudio}
            disabled={isPlayingTest}
            style={{
              padding: '6px 14px',
              fontSize: '0.74rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--accent-cyan)',
              borderColor: 'rgba(6, 182, 212, 0.4)'
            }}
          >
            <Play size={12} />
            <span>{isPlayingTest ? 'Playing Pulse...' : 'Audition Balance Test'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isCurrentlyDual && (
              <button
                type="button"
                className="nudge-btn"
                onClick={handleDisconnect}
                style={{ padding: '6px 14px', color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.4)' }}
              >
                Disconnect Dual Route
              </button>
            )}

            <button
              type="button"
              className="nudge-btn"
              onClick={onClose}
              style={{ padding: '6px 14px' }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                border: 'none',
                color: '#ffffff',
                borderRadius: 'var(--radius-full)',
                padding: '7px 20px',
                fontSize: '0.80rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 0 16px rgba(6, 182, 212, 0.4)'
              }}
            >
              <Check size={14} />
              <span>Activate Dual Transfer (1 ➔ 2)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
