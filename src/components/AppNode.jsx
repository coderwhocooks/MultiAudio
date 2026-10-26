import React from 'react';
import { 
  Music, 
  Globe, 
  MessageSquare, 
  Gamepad2, 
  Sliders, 
  Volume2, 
  VolumeX, 
  Disc,
  Radio, 
  ArrowRight,
  Terminal,
  Share2,
  Sparkles
} from 'lucide-react';

const ICON_MAP = {
  music: Music,
  globe: Globe,
  'message-square': MessageSquare,
  'gamepad-2': Gamepad2,
  sliders: Sliders,
  disc: Disc,
  radio: Radio,
  terminal: Terminal
};

export default function AppNode({
  app,
  connections,
  devices = [],
  onVolumeChange,
  onToggleMute,
  onToggleSolo,
  onStartDrag,
  isDraggingSource,
  isTargetCandidate,
  onPortClick,
  meterData,
  isAudioLive,
  onOpenDualTransfer,
}) {
  const IconComponent = ICON_MAP[app.icon] || Music;
  const appConnections = connections.filter(c => c.sourceId === app.id);
  const isRouted = appConnections.length > 0;
  const isDualRouted = appConnections.length >= 2;
  
  // Find names of devices this app is routed to
  const routedDestinations = appConnections
    .map(c => devices.find(d => d.id === c.targetId)?.name || 'Audio Output')
    .filter(Boolean);

  // Real-time audio reactive levels
  const rms = meterData?.rms !== undefined ? meterData.rms : (isAudioLive ? app.activeLevel : 0.05);
  const bands = meterData?.bands || (isAudioLive ? app.frequencyData : [10, 15, 12, 10, 8, 12, 14, 10]);

  return (
    <div 
      className={`app-card ${isRouted ? 'routed' : ''} ${isDualRouted ? 'dual-routed' : ''}`}
      id={`node-${app.id}`}
      style={{
        borderColor: isDraggingSource 
          ? 'var(--accent-cyan)' 
          : (isDualRouted ? 'rgba(6, 182, 212, 0.45)' : undefined),
        boxShadow: isDraggingSource 
          ? '0 0 20px var(--glow-cyan)' 
          : (isDualRouted ? '0 0 16px rgba(6, 182, 212, 0.15)' : undefined),
      }}
    >
      {/* Top Header */}
      <div className="card-top">
        <div className="app-info-group">
          <div 
            className="app-icon-wrapper"
            style={{ backgroundColor: app.color }}
          >
            <IconComponent size={20} />
          </div>
          <div>
            <div className="app-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{app.name}</span>
              <span className="app-pid">PID {app.pid}</span>
              {isDualRouted && (
                <span 
                  style={{
                    fontSize: '0.58rem',
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(6, 182, 212, 0.2)',
                    color: 'var(--accent-cyan)',
                    padding: '1px 5px',
                    borderRadius: 4,
                    fontWeight: 700,
                    border: '1px solid rgba(6, 182, 212, 0.35)'
                  }}
                  title="Audio stream transferred to 2 output devices simultaneously"
                >
                  1 ➔ 2 DUAL
                </span>
              )}
            </div>
            <div className="app-now-playing" title={app.currentTrack}>
              {app.currentTrack}
            </div>
          </div>
        </div>

        {/* Action Buttons: 1-to-2 Splitter + Solo + Mute */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Quick Dual Output Transfer Option */}
          <button
            type="button"
            className={`dual-route-chip ${isDualRouted ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenDualTransfer) onOpenDualTransfer(app.id, 'app');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 7px',
              borderRadius: 'var(--radius-full)',
              border: isDualRouted ? '1px solid rgba(6, 182, 212, 0.55)' : '1px solid var(--border-subtle)',
              background: isDualRouted ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              color: isDualRouted ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontSize: '0.62rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isDualRouted ? '0 0 8px rgba(6, 182, 212, 0.25)' : 'none'
            }}
            title="Transfer or split this application to 2 output sources"
          >
            <Share2 size={10} />
            <span>{isDualRouted ? '1 ➔ 2' : '1 ➔ 2'}</span>
          </button>

          <button
            className={`mini-mute-btn ${app.solo ? 'active' : ''}`}
            onClick={() => onToggleSolo(app.id)}
            style={{
              color: app.solo ? '#facc15' : undefined,
              borderColor: app.solo ? '#facc15' : undefined,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '2px 5px'
            }}
            title="Solo this application audio"
          >
            S
          </button>
          <button
            className={`mini-mute-btn ${app.muted ? 'muted' : ''}`}
            onClick={() => onToggleMute(app.id)}
            title={app.muted ? 'Unmute' : 'Mute'}
          >
            {app.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>
      </div>

      {/* Frequency spectrum visualizer */}
      <div className="audio-meter-row">
        <div className="frequency-spectrum">
          {bands.map((val, idx) => (
            <div
              key={idx}
              className="freq-bar"
              style={{
                height: app.muted ? '2px' : `${Math.max(4, Math.min(100, val * (app.volume / 100)))}%`,
                opacity: app.muted ? 0.3 : 1
              }}
            />
          ))}
        </div>
        <div className="rms-peak-indicator">
          {app.muted ? 'MUTED' : `${Math.round(rms * (app.volume / 100) * 100)}%`}
        </div>
      </div>

      {/* Volume Fader */}
      <div className="fader-control-row">
        <input
          type="range"
          min="0"
          max="100"
          value={app.muted ? 0 : app.volume}
          onChange={(e) => onVolumeChange(app.id, parseInt(e.target.value, 10))}
          className="custom-fader"
          title={`App Volume: ${app.volume}%`}
        />
        <div className="fader-val-label">{app.volume}%</div>
      </div>

      {/* Route Status footer */}
      <div style={{
        marginTop: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        color: 'var(--text-muted)'
      }}>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{app.format}</span>
        <span style={{ 
          color: isDualRouted ? 'var(--accent-cyan)' : (isRouted ? 'var(--accent-indigo)' : 'var(--text-muted)'),
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          maxWidth: '58%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={isRouted ? `Routed to: ${routedDestinations.join(', ')}` : 'Tracking Windows Default Endpoint'}
        >
          {isRouted ? (
            <>
              <ArrowRight size={10} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {routedDestinations.length > 0 
                  ? routedDestinations.map(d => d.split('(')[0].trim()).join(' + ') 
                  : 'Routed'}
              </span>
            </>
          ) : 'System Default'}
        </span>
      </div>

      {/* Output Audio Patch Jack */}
      <div 
        className={`port-jack ${isRouted ? 'connected' : ''} ${isDraggingSource ? 'dragging' : ''}`}
        id={`port-source-${app.id}`}
        title="Drag cable to an output device or click to route (Drag to multiple devices to transfer to 2 outputs)"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartDrag(app.id, e);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onPortClick(app.id);
        }}
      >
        <div className="port-jack-inner" />
      </div>
    </div>
  );
}
