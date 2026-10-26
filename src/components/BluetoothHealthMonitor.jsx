import React from 'react';
import { 
  X, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Wifi, 
  Battery, 
  Cpu, 
  Layers,
  ArrowRight
} from 'lucide-react';

export default function BluetoothHealthMonitor({
  devices,
  onClose,
  onOptimizeBandwidth,
}) {
  const btDevices = devices.filter(d => d.type === 'bluetooth');
  const totalBandwidth = btDevices.reduce((sum, d) => sum + (d.bandwidthUsageKbps || 0), 0);
  const maxSafeBandwidth = 1500; // Typical single BT 5.0-5.3 controller ACL packet throughput ceiling
  const usagePercent = Math.min(100, Math.round((totalBandwidth / maxSafeBandwidth) * 100));
  const isSaturated = totalBandwidth > 1300;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Radio size={20} color={isSaturated ? '#f59e0b' : 'var(--accent-cyan)'} />
            <span>Bluetooth RF & Bandwidth Health</span>
          </div>
          <button 
            className="action-icon-btn" 
            style={{ border: 'none', background: 'transparent' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Bandwidth Usage Meter */}
        <div style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          border: '1px solid var(--border-subtle)',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              HCI Adapter Bandwidth Pool (Single Bluetooth Chip)
            </span>
            <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.8rem', 
              fontWeight: 700,
              color: isSaturated ? '#f43f5e' : '#10b981'
            }}>
              {totalBandwidth} / {maxSafeBandwidth} kbps ({usagePercent}%)
            </span>
          </div>

          <div style={{
            height: 10,
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${usagePercent}%`,
              background: isSaturated 
                ? 'linear-gradient(90deg, #10b981 0%, #f59e0b 60%, #f43f5e 100%)' 
                : 'linear-gradient(90deg, #06b6d4, #10b981)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Streaming to multiple Bluetooth receivers simultaneously shares the same 2.4 GHz antenna. Bitrates over 1,300 kbps can trigger packet loss, jitter, and buffer underruns.
          </div>
        </div>

        {/* Saturation Warning Banner */}
        {isSaturated && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12
          }}>
            <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fbbf24' }}>
                High Bandwidth Warning: Audio Dropouts Likely
              </div>
              <div style={{ fontSize: '0.74rem', color: '#fef3c7', marginTop: 2, lineHeight: 1.4 }}>
                LDAC (990 kbps) + secondary streams exceed comfortable single-dongle capacity. MultiAudio can automatically downgrade secondary streams to AAC (256 kbps) or adapt dynamic bitrate.
              </div>
              <button
                onClick={onOptimizeBandwidth}
                style={{
                  marginTop: 8,
                  background: '#f59e0b',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '5px 14px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Auto-Optimize Codec Allocation
              </button>
            </div>
          </div>
        )}

        {/* Per-Device Details */}
        <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Connected Receivers Health
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {btDevices.map(d => (
            <div 
              key={d.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                  {d.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Codec: <span style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{d.codec}</span> ({d.bandwidthUsageKbps} kbps)
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Wifi size={12} color={d.rssi > -65 ? '#10b981' : '#f59e0b'} />
                    {d.rssi} dBm
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {d.signalQuality}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Battery size={12} color={d.battery < 20 ? '#f43f5e' : '#10b981'} />
                    {d.battery}%
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Buffer: +{d.delayMs}ms
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-full)',
              padding: '7px 20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
