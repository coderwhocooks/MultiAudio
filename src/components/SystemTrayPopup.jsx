import React from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Headphones, 
  Speaker, 
  Settings, 
  Layers, 
  Radio, 
  Check, 
  Sliders, 
  ArrowRightCircle,
  ExternalLink
} from 'lucide-react';

export default function SystemTrayPopup({
  apps,
  devices,
  profiles,
  activeProfile,
  onSelectProfile,
  onClose,
  onOpenFullApp,
  onVolumeChange,
  onToggleMute,
  onRouteAppToDevice,
}) {
  return (
    <div className="system-tray-flyout">
      {/* Header */}
      <div className="tray-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ 
            width: 24, 
            height: 24, 
            borderRadius: 6, 
            background: 'linear-gradient(135deg, #6366f1, #06b6d4)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Layers size={14} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              MultiAudio Tray
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Windows Audio Session Router
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            className="action-icon-btn"
            style={{ width: 22, height: 22, border: 'none', background: 'transparent' }}
            onClick={onOpenFullApp}
            title="Open Full MultiAudio Hero Window"
          >
            <ExternalLink size={12} />
          </button>
          <button
            className="action-icon-btn"
            style={{ width: 22, height: 22, border: 'none', background: 'transparent' }}
            onClick={onClose}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      <div className="tray-body">
        {/* Profile Switcher Row */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Quick Profile
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            {profiles.slice(0, 3).map(p => (
              <button
                key={p.id}
                onClick={() => onSelectProfile(p.id)}
                style={{
                  background: activeProfile === p.id ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.04)',
                  color: activeProfile === p.id ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 4px',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Master Output Volumes */}
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Output Master Levels
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {devices.slice(0, 3).map(dev => (
              <div 
                key={dev.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <button
                  className={`mini-mute-btn ${dev.muted ? 'muted' : ''}`}
                  onClick={() => onToggleMute(dev.id)}
                  style={{ padding: '2px 4px' }}
                >
                  {dev.muted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dev.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--accent-cyan)' }}>
                      {dev.volume}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={dev.muted ? 0 : dev.volume}
                    onChange={(e) => onVolumeChange(dev.id, parseInt(e.target.value, 10))}
                    className="custom-fader"
                    style={{ height: 3, marginTop: 4 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Move Focused App Quick Action */}
        <div style={{ 
          marginTop: 4, 
          padding: '8px 10px', 
          borderRadius: 'var(--radius-sm)', 
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)' 
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowRightCircle size={12} /> Hotkey: Move Focused App
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            Press <kbd style={{ background: '#1e293b', padding: '1px 4px', borderRadius: 3, color: '#ffffff' }}>Ctrl+Shift+M</kbd> to cycle current window audio to next device
          </div>
        </div>
      </div>
    </div>
  );
}
