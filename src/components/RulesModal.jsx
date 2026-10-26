import React, { useState } from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Check, 
  Plus, 
  VolumeX, 
  Volume2, 
  Zap, 
  Clock, 
  Wifi, 
  Headphones, 
  ArrowRight
} from 'lucide-react';

export default function RulesModal({
  onClose,
}) {
  const [rules, setRules] = useState([
    {
      id: 'rule-ducking',
      title: 'Priority Ducking on Discord Calls',
      condition: 'When Discord receives active audio stream',
      action: 'Duck Spotify & Chrome volume by -14 dB',
      enabled: true,
      category: 'priority'
    },
    {
      id: 'rule-spotify-launch',
      title: 'Auto-Route Spotify to Sony WH-1000XM5',
      condition: 'When Spotify.exe audio session creates',
      action: 'Route directly to Sony WH-1000XM5 (LDAC)',
      enabled: true,
      category: 'routing'
    },
    {
      id: 'rule-work-network',
      title: 'Office Profile on Work Wi-Fi',
      condition: 'When connected to SSID "Office-5GHz"',
      action: 'Switch active profile to "Work Focus" & mute speakers',
      enabled: true,
      category: 'environment'
    },
    {
      id: 'rule-game-launch',
      title: 'Game Launch Priority',
      condition: 'When any DirectSound / WASAPI Exclusive game launches',
      action: 'Route Game to primary Headset & pause background browser audio',
      enabled: false,
      category: 'routing'
    }
  ]);

  const toggleRule = (id) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <SlidersHorizontal size={20} color="var(--accent-indigo)" />
            <span>Automation & Priority Ducking Rules</span>
          </div>
          <button 
            className="action-icon-btn" 
            style={{ border: 'none', background: 'transparent' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          Set event-driven rules to dynamically route sound streams, duck background music when speech begins, or switch setups based on network.
        </div>

        {/* Rule List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {rules.map(r => (
            <div 
              key={r.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${r.enabled ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ 
                  fontSize: '0.82rem', 
                  fontWeight: 700, 
                  color: r.enabled ? 'var(--text-primary)' : 'var(--text-muted)' 
                }}>
                  {r.title}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                  <span style={{ color: 'var(--text-muted)' }}>IF:</span> {r.condition}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowRight size={10} /> {r.action}
                </div>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => toggleRule(r.id)}
                style={{
                  background: r.enabled ? 'var(--accent-indigo)' : 'rgba(255,255,255,0.1)',
                  width: 44,
                  height: 24,
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#ffffff',
                  transform: r.enabled ? 'translateX(20px)' : 'translateX(0)',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              color: '#ffffff',
              borderRadius: 'var(--radius-full)',
              padding: '8px 22px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
