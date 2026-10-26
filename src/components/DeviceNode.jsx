import React from 'react';
import { 
  Headphones, 
  Speaker, 
  Disc, 
  Radio, 
  Volume2, 
  VolumeX, 
  Battery, 
  BatteryCharging, 
  Wifi, 
  Clock, 
  Plus, 
  Minus,
  Sparkles,
  Layers
} from 'lucide-react';
import { EQ_PRESETS } from '../types';

export default function DeviceNode({
  device,
  connections,
  apps,
  onVolumeChange,
  onToggleMute,
  onDelayChange,
  onEqChange,
  onPortClick,
  onPortMouseUp,
  isTargetCandidate,
  onTriggerCalibration,
}) {
  const deviceConnections = connections.filter(c => c.targetId === device.id);
  const isRouted = deviceConnections.length > 0;

  // Find routed app names
  const routedAppNames = deviceConnections
    .map(c => apps.find(a => a.id === c.sourceId)?.name)
    .filter(Boolean);

  const getCodecClass = (codec) => {
    if (codec.includes('LDAC')) return 'codec-badge';
    if (codec.includes('AAC')) return 'codec-badge aac';
    if (codec.includes('aptX')) return 'codec-badge aptx';
    return 'codec-badge pcm';
  };

  const renderDeviceIcon = () => {
    if (device.type === 'usb') return <Disc size={20} color="#10b981" />;
    if (device.type === 'virtual') return <Radio size={20} color="#8b5cf6" />;
    if (device.name.includes('AirPods')) return <Headphones size={20} color="#38bdf8" />;
    if (device.name.includes('Speaker') || device.name.includes('Bose')) return <Speaker size={20} color="#fbbf24" />;
    return <Headphones size={20} color="#f43f5e" />;
  };

  return (
    <div 
      className={`device-card ${isRouted ? 'routed' : ''}`}
      id={`node-${device.id}`}
      style={{
        boxShadow: isTargetCandidate ? '0 0 20px rgba(6, 182, 212, 0.4)' : undefined,
        borderColor: isTargetCandidate ? 'var(--accent-cyan)' : undefined,
        cursor: isTargetCandidate ? 'pointer' : undefined,
      }}
      onClick={() => {
        if (isTargetCandidate && onPortClick) {
          onPortClick(device.id);
        }
      }}
      onMouseUp={() => onPortMouseUp && onPortMouseUp(device.id)}
    >
      {/* Input Audio Patch Jack on the Left */}
      <div 
        className={`port-jack ${isRouted ? 'connected' : ''}`}
        id={`port-target-${device.id}`}
        title="Drop cable here to route audio to this device, or click to connect"
        onClick={(e) => {
          e.stopPropagation();
          onPortClick(device.id);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onPortMouseUp && onPortMouseUp(device.id);
        }}
      >
        <div className="port-jack-inner" />
      </div>

      {/* Top Header */}
      <div className="card-top">
        <div className="app-info-group">
          <div 
            className="app-icon-wrapper"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            {renderDeviceIcon()}
          </div>
          <div>
            <div className="app-title">
              {device.name}
              {device.isDefault && (
                <span 
                  style={{ 
                    fontSize: '0.62rem', 
                    fontFamily: 'var(--font-mono)', 
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '1px 5px',
                    borderRadius: 4
                  }}
                >
                  DEFAULT
                </span>
              )}
              {device.isPluggedIn === false && (
                <span 
                  style={{ 
                    fontSize: '0.58rem', 
                    fontFamily: 'var(--font-mono)', 
                    color: '#fbbf24',
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    fontWeight: 700
                  }}
                  title="3.5mm jack has no headphones plugged in. Realtek redirects playback to internal laptop speakers."
                >
                  JACK UNPLUGGED
                </span>
              )}
            </div>
            <div className="device-badges-row">
              <span className={getCodecClass(device.codec)}>{device.codec}</span>
              {device.battery !== null && (
                <span className="battery-tag">
                  <Battery size={11} color={device.battery < 20 ? '#f43f5e' : '#10b981'} />
                  {device.battery}%
                </span>
              )}
              {device.rssi !== null && (
                <span className="battery-tag" title={`Signal RSSI: ${device.rssi} dBm (${device.signalQuality})`}>
                  <Wifi size={11} color={device.rssi > -65 ? '#10b981' : '#f59e0b'} />
                  {device.rssi} dBm
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Master Mute */}
        <button
          className={`mini-mute-btn ${device.muted ? 'muted' : ''}`}
          onClick={() => onToggleMute(device.id)}
          title={device.muted ? 'Unmute Device' : 'Mute Device'}
        >
          {device.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>

      {/* Master Volume Slider */}
      <div className="fader-control-row">
        <input
          type="range"
          min="0"
          max="100"
          value={device.muted ? 0 : device.volume}
          onChange={(e) => onVolumeChange(device.id, parseInt(e.target.value, 10))}
          className="custom-fader"
          title={`Master Volume: ${device.volume}%`}
        />
        <div className="fader-val-label">{device.volume}%</div>
      </div>

      {/* Per-Device Latency Delay Compensation */}
      <div className="delay-control-box">
        <div className="delay-header">
          <div className="delay-label">
            <Clock size={12} />
            <span>Sync Latency Delay</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="delay-ms-val">+{device.delayMs} ms</span>
            <button
              className="nudge-btn"
              onClick={() => onTriggerCalibration(device.id)}
              title="Auto-detect acoustic latency using microphone tone"
              style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(6, 182, 212, 0.4)' }}
            >
              Auto-Calibrate
            </button>
          </div>
        </div>
        <input
          type="range"
          min="0"
          max="500"
          step="5"
          value={device.delayMs}
          onChange={(e) => onDelayChange(device.id, parseInt(e.target.value, 10))}
          className="delay-slider"
          title="Compensate for Bluetooth audio buffer latency"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div className="delay-nudge-group">
            <button className="nudge-btn" onClick={() => onDelayChange(device.id, Math.max(0, device.delayMs - 10))}>-10ms</button>
            <button className="nudge-btn" onClick={() => onDelayChange(device.id, Math.min(500, device.delayMs + 10))}>+10ms</button>
            <button className="nudge-btn" onClick={() => onDelayChange(device.id, 0)}>Reset (0ms)</button>
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {device.delayMs > 150 ? 'Compensated' : 'Low Latency'}
          </span>
        </div>
      </div>

      {/* Per-Device EQ Selector & Active Routes summary */}
      <div className="eq-selector-row">
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Sparkles size={11} /> EQ Profile:
        </span>
        <select
          value={device.eqPreset}
          onChange={(e) => onEqChange(device.id, e.target.value)}
          className="eq-select"
        >
          {EQ_PRESETS.map(eq => (
            <option key={eq} value={eq}>{eq}</option>
          ))}
        </select>
      </div>

      {/* Active Routed Apps Pill */}
      {isRouted ? (
        <div style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: '0.7rem',
          color: 'var(--text-secondary)'
        }}>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Receiving:</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {routedAppNames.join(', ')}
          </span>
        </div>
      ) : (
        <div style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '0.7rem',
          color: 'var(--text-muted)'
        }}>
          No streams routed yet. Drag an app cable here.
        </div>
      )}
    </div>
  );
}
