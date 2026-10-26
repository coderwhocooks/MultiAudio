import React, { useState } from 'react';
import { 
  X, 
  Pin, 
  Volume2, 
  VolumeX, 
  Move, 
  Headphones, 
  Speaker, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function MiniMixer({
  apps,
  devices,
  connections,
  onVolumeChange,
  onToggleMute,
  onClose,
  onRestoreHero,
}) {
  const [pinned, setPinned] = useState(true);

  return (
    <div className="mini-mixer-floating">
      {/* Titlebar */}
      <div className="mini-mixer-titlebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.02em' }}>
            MultiAudio Mini-Mixer
          </span>
          <span style={{ 
            fontSize: '0.62rem', 
            fontFamily: 'var(--font-mono)', 
            background: 'rgba(255,255,255,0.08)',
            padding: '1px 5px',
            borderRadius: 4,
            color: 'var(--text-muted)'
          }}>
            Always-on-Top
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button 
            className="action-icon-btn" 
            style={{ width: 22, height: 22, border: 'none', background: 'transparent' }}
            onClick={() => setPinned(!pinned)}
            title={pinned ? 'Unpin window' : 'Pin Always-on-Top'}
          >
            <Pin size={12} color={pinned ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
          </button>
          <button 
            className="action-icon-btn" 
            style={{ width: 22, height: 22, border: 'none', background: 'transparent' }}
            onClick={onRestoreHero}
            title="Expand to Full Hero Window"
          >
            <ExternalLink size={12} />
          </button>
          <button 
            className="action-icon-btn" 
            style={{ width: 22, height: 22, border: 'none', background: 'transparent' }}
            onClick={onClose}
            title="Close Mini-Mixer"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Mini Mixer App Faders */}
      <div className="mini-mixer-body">
        <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          Active Audio Streams
        </div>

        {apps.slice(0, 4).map(app => {
          const appConns = connections.filter(c => c.sourceId === app.id);
          const dev = appConns.length > 0 ? devices.find(d => d.id === appConns[0].targetId) : null;

          return (
            <div 
              key={app.id} 
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 10px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: app.color }} />
                  {app.name}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ChevronRight size={10} /> {dev ? dev.name.split(' ')[0] : 'None'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className={`mini-mute-btn ${app.muted ? 'muted' : ''}`}
                  onClick={() => onToggleMute(app.id)}
                  style={{ padding: '2px 4px' }}
                >
                  {app.muted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={app.muted ? 0 : app.volume}
                  onChange={(e) => onVolumeChange(app.id, parseInt(e.target.value, 10))}
                  className="custom-fader"
                />
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', width: 28, textAlign: 'right' }}>
                  {app.volume}%
                </span>
              </div>
            </div>
          );
        })}

        {/* Master Output Quick Strip */}
        <div style={{ 
          marginTop: 6, 
          paddingTop: 8, 
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Master Output:</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
            Sony WH-1000XM5 (LDAC)
          </span>
        </div>
      </div>
    </div>
  );
}
