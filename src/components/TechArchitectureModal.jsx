import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Server, 
  Layers, 
  Terminal, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Zap,
  ExternalLink
} from 'lucide-react';

export default function TechArchitectureModal({
  osPlatform,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('diagram');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 840 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Cpu size={22} color="var(--accent-indigo)" />
            <span>Technical Architecture & OS Audio Subsystems</span>
          </div>
          <button 
            className="action-icon-btn" 
            style={{ border: 'none', background: 'transparent' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
          <button
            onClick={() => setActiveTab('diagram')}
            className={`nudge-btn ${activeTab === 'diagram' ? 'active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: activeTab === 'diagram' ? '#ffffff' : 'var(--text-secondary)',
              background: activeTab === 'diagram' ? 'var(--accent-indigo)' : 'transparent',
              borderColor: activeTab === 'diagram' ? 'var(--accent-indigo)' : 'var(--border-subtle)'
            }}
          >
            System Architecture Diagram
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            className={`nudge-btn ${activeTab === 'platforms' ? 'active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: activeTab === 'platforms' ? '#ffffff' : 'var(--text-secondary)',
              background: activeTab === 'platforms' ? 'var(--accent-indigo)' : 'transparent',
              borderColor: activeTab === 'platforms' ? 'var(--accent-indigo)' : 'var(--border-subtle)'
            }}
          >
            Per-Platform Implementation & APIs
          </button>
          <button
            onClick={() => setActiveTab('realtime')}
            className={`nudge-btn ${activeTab === 'realtime' ? 'active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: activeTab === 'realtime' ? '#ffffff' : 'var(--text-secondary)',
              background: activeTab === 'realtime' ? 'var(--accent-indigo)' : 'transparent',
              borderColor: activeTab === 'realtime' ? 'var(--accent-indigo)' : 'var(--border-subtle)'
            }}
          >
            Live Low-Level Diagnostics
          </button>
        </div>

        {/* TAB 1: ARCHITECTURE DIAGRAM */}
        {activeTab === 'diagram' && (
          <div>
            <div style={{
              background: '#090d16',
              borderRadius: 'var(--radius-md)',
              padding: 20,
              border: '1px solid var(--border-subtle)',
              marginBottom: 16
            }}>
              <div style={{ textAlign: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  MultiAudio High-Throughput Audio Pipeline & Driver Architecture
                </span>
              </div>

              {/* Graphical Stack Diagram */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Layer 1: UI */}
                <div style={{
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: 8,
                  padding: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#c7d2fe' }}>Layer 1: Presentation & Routing Canvas (Tauri / WebKit / Web Audio)</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Drag-and-drop bezier matrix, live VU meters, mini-mixer window, tray flyout</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-indigo)' }}>60 FPS UI</span>
                </div>

                {/* Arrow */}
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  ↓ Zero-Copy IPC Commands & Shared Memory Ring Buffers (Tauri / Neon) ↓
                </div>

                {/* Layer 2: Core Native Engine */}
                <div style={{
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  borderRadius: 8,
                  padding: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#a5f3fc' }}>Layer 2: Native Audio Core Engine (Rust / C++)</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Dynamic Delay Compensation Resampler • Per-device Circular Ring Buffers • EQ Biquad Filters • Acoustic Calibrator
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>&lt; 2.6 ms Latency</span>
                </div>

                {/* Arrow */}
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  ↓ Platform Abstraction Layer (PAL) Audio Endpoints ↓
                </div>

                {/* Layer 3: OS Audio Subsystems */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 10
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#60a5fa' }}>Windows 10 / 11</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      • WASAPI Audio Sessions<br />
                      • IPolicyConfigVista COM API<br />
                      • Virtual Cable Kernel Driver
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 10
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#f472b6' }}>macOS (13+ Ventura/Sonoma)</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      • ScreenCaptureKit Audio Tap<br />
                      • CoreAudio Audio Server Plugin (HAL)<br />
                      • Bundled BlackHole Loopback
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 10
                  }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#4ade80' }}>Linux (Modern Distros)</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      • Native PipeWire Graph Router<br />
                      • PulseAudio Compatibility Layer<br />
                      • Zero Drivers Required
                    </div>
                  </div>
                </div>

                {/* Layer 4: Output Hardware */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: 8,
                  padding: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#6ee7b7' }}>Layer 4: Hardware Endpoints & Bluetooth HCI Controller</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      Sony LDAC (990kbps), AirPods AAC, Bose aptX, Schiit USB DAC Lossless 192kHz, Virtual Stream Cable (OBS)
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-emerald)' }}>Hardware Sync</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PER-PLATFORM IMPLEMENTATION */}
        {activeTab === 'platforms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <h4 style={{ color: '#60a5fa', fontSize: '0.88rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={15} color="#60a5fa" /> Windows Architecture Strategy (Phase 1 Target)
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Windows 10/11 supports per-app routing natively via Windows Sound Settings using the undocumented but rock-solid COM interface <code>IPolicyConfigVista::SetPersistedDefaultAudioEndpoint()</code>. MultiAudio invokes this to switch any running app's output target with zero driver installs! For multi-streaming one app to 2+ devices, MultiAudio runs a lightweight WASAPI loopback tap.
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <h4 style={{ color: '#f472b6', fontSize: '0.88rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={15} color="#f472b6" /> macOS Strategy & Sandboxing Solution
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                macOS lacks native per-app routing in system preferences. MultiAudio pairs a userland <strong>CoreAudio HAL Audio Server Plugin</strong> (similar to BlackHole/Loopback) with macOS 13+'s <code>ScreenCaptureKit</code> per-process audio taps. This captures individual application audio streams without requiring kernel extensions (KEXTs).
              </p>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: 14
            }}>
              <h4 style={{ color: '#4ade80', fontSize: '0.88rem', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={15} color="#4ade80" /> Linux PipeWire Implementation
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Linux provides the cleanest native routing architecture. Using <code>libpipewire</code>, MultiAudio inspects the multimedia graph nodes, creates virtual filter sinks, and dynamically updates link ports using <code>pw-link</code> with zero added latency.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE LOW-LEVEL DIAGNOSTICS */}
        {activeTab === 'realtime' && (
          <div className="tech-spec-container">
            <div style={{ marginBottom: 10, color: '#f8fafc', fontWeight: 700 }}>
              WASAPI & Audio Engine Runtime State:
            </div>
            <div>[CORE] Sample Rate: 48,000 Hz | Buffer Size: 128 frames (2.67ms)</div>
            <div>[WASAPI] IAudioSessionEnumerator: 5 active process sessions identified</div>
            <div>[WASAPI] IPolicyConfig COM Interface: Initialized & Bound</div>
            <div>[SYNC] Dynamic Bluetooth Delay Compensation: Active (Sony: 140ms, AirPods: 180ms)</div>
            <div>[BT-HCI] Total Bandwidth Utilization: 1,410 / 1,500 kbps (Safe Range)</div>
            <div>[DRIVER] MultiAudio Virtual Audio Cable: Ready (GUID {`{6a4e3b12-9c1a-4d22-8d75-4f32e9871101}`})</div>
            <div>[OBS] Loopback Endpoint: Running in Shared Render Mode</div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
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
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
