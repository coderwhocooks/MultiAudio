import React from 'react';
import { Mic, MicOff, Volume2, Check, Radio, Sparkles, X, Share2 } from 'lucide-react';

export default function CaptureDrawer({
  isOpen,
  onClose,
  captureDevices,
  onToggleMute,
  onSetDefault,
  onVolumeChange,
  onOpenDualTransfer,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 120 }}>
      <div 
        className="modal-card" 
        style={{ maxWidth: 640, width: '92%' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(234, 67, 53, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ea4335'
            }}>
              <Mic size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                Recording Devices & Microphones
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Live Windows Audio Capture Endpoints (WASAPI) • Transfer to Dual Outputs
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {captureDevices.map(cap => (
            <div
              key={cap.id}
              style={{
                background: 'var(--bg-card)',
                border: cap.isDefault ? '1px solid rgba(234, 67, 53, 0.4)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: cap.isDefault ? '0 0 15px rgba(234, 67, 53, 0.12)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: cap.muted ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cap.muted ? '#ef4444' : '#10b981'
                  }}>
                    {cap.muted ? <MicOff size={16} /> : <Mic size={16} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {cap.name}
                      {cap.isDefault && (
                        <span style={{
                          fontSize: '0.62rem',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(234, 67, 53, 0.2)',
                          color: '#f87171',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontWeight: 700
                        }}>
                          DEFAULT MIC
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {cap.cmdId || 'Active Input Endpoint'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Transfer to 2 Outputs button */}
                  <button
                    className="nudge-btn"
                    onClick={() => {
                      if (onOpenDualTransfer) onOpenDualTransfer(cap.id, 'capture');
                    }}
                    style={{
                      padding: '3px 9px',
                      fontSize: '0.70rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'var(--accent-cyan)',
                      borderColor: 'rgba(6, 182, 212, 0.4)'
                    }}
                    title="Transfer this microphone audio to 2 output devices (e.g. Headphones & Speakers/OBS)"
                  >
                    <Share2 size={11} />
                    <span>1 ➔ 2 Outputs</span>
                  </button>

                  {!cap.isDefault && (
                    <button
                      className="nudge-btn"
                      onClick={() => onSetDefault && onSetDefault(cap.id)}
                      style={{ padding: '3px 10px', fontSize: '0.72rem', borderColor: 'rgba(255,255,255,0.2)' }}
                      title="Set as Windows Default Communication & Recording Device"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    className={`mini-mute-btn ${cap.muted ? 'muted' : ''}`}
                    onClick={() => onToggleMute && onToggleMute(cap.id)}
                    style={{ width: 30, height: 30 }}
                    title={cap.muted ? 'Unmute Microphone' : 'Mute Microphone'}
                  >
                    {cap.muted ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                </div>
              </div>

              {/* Volume Slider & Meter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 45 }}>
                  Level
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cap.muted ? 0 : (cap.volume !== undefined ? cap.volume : 85)}
                  onChange={(e) => onVolumeChange && onVolumeChange(cap.id, parseInt(e.target.value, 10))}
                  className="custom-fader"
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', width: 36, textAlign: 'right' }}>
                  {cap.muted ? '0%' : `${cap.volume !== undefined ? cap.volume : 85}%`}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="nudge-btn"
            onClick={onClose}
            style={{ padding: '6px 16px', background: 'var(--bg-card)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
