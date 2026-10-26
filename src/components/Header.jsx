import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Layers, 
  Maximize2, 
  Minimize2, 
  Sun, 
  Moon, 
  Radio, 
  Activity, 
  Cpu, 
  SlidersHorizontal,
  Zap,
  Play,
  Square,
  RefreshCw,
  Laptop,
  Mic,
  PanelBottom,
  ChevronDown,
  Settings,
  Check,
  Share2
} from 'lucide-react';

export default function Header({
  activeProfile,
  onSelectProfile,
  profiles,
  isAudioLive,
  onToggleAudioLive,
  isMiniMixerOpen,
  onToggleMiniMixer,
  isTrayOpen,
  onToggleTray,
  theme,
  onToggleTheme,
  onOpenCalibrator,
  onOpenBluetoothHealth,
  onOpenRules,
  onOpenTechSpec,
  osPlatform,
  onChangePlatform,
  silentDiscoActive,
  onToggleSilentDisco,
  hardwareMode,
  onToggleHardwareMode,
  onScanHardware,
  isScanning = false,
  onOpenCapture,
  isCaptureOpen,
  minimizeToTray,
  onToggleMinimizeToTray,
  onReplayStartup,
  onOpenDualTransfer,
  activeDualCount = 0,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="app-header">
      {/* Left: Brand & Hardware Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div className="brand-title-group">
            <h1>
              MultiAudio
              <span 
                className="badge-os"
                title="Click to cycle OS platform"
                onClick={() => {
                  const platforms = ['Windows 11 (WASAPI)', 'macOS (CoreAudio)', 'Linux (PipeWire)'];
                  const next = platforms[(platforms.indexOf(osPlatform) + 1) % platforms.length];
                  onChangePlatform(next);
                }}
                style={{ cursor: 'pointer' }}
              >
                {osPlatform.split(' ')[0]}
              </span>
            </h1>
            <div className="brand-subtitle">Session Audio Router</div>
          </div>
        </div>

        {/* Minimal Hardware Mode Badge */}
        <button
          onClick={onToggleHardwareMode}
          style={{
            background: hardwareMode === 'system' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
            border: `1px solid ${hardwareMode === 'system' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.35)'}`,
            color: hardwareMode === 'system' ? '#10b981' : '#a5b4fc',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.70rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s ease'
          }}
          title="Click to toggle between real PC hardware and studio demo"
        >
          <span style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            backgroundColor: hardwareMode === 'system' ? '#10b981' : '#818cf8',
            boxShadow: hardwareMode === 'system' ? '0 0 8px #10b981' : '0 0 8px #818cf8' 
          }} />
          <span>{hardwareMode === 'system' ? 'PC Hardware' : 'Studio Demo'}</span>
        </button>
      </div>

      {/* Center: Minimal Profile Switcher */}
      <div className="profile-pills-bar" style={{ padding: '2px 4px', borderRadius: 'var(--radius-full)' }}>
        {profiles.map(p => (
          <button
            key={p.id}
            className={`profile-pill-btn ${activeProfile === p.id ? 'active' : ''}`}
            onClick={() => onSelectProfile(p.id)}
            title={p.description}
            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
          >
            {p.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Right: Minimal Actions & Comprehensive Dropdown Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
        {/* Fast Refresh Button */}
        <button
          onClick={onScanHardware}
          disabled={isScanning}
          className="action-icon-btn"
          style={{
            width: 'auto',
            padding: '0 10px',
            height: 32,
            borderRadius: 'var(--radius-full)',
            gap: 6,
            background: isScanning ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            color: isScanning ? '#a5b4fc' : 'var(--text-secondary)'
          }}
          title="Scan Windows for new audio apps, plugged-in jacks, and Bluetooth endpoints"
        >
          <RefreshCw size={13} className={isScanning ? 'spin-icon' : ''} />
          <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>
            {isScanning ? 'Scanning...' : 'Refresh'}
          </span>
        </button>

        {/* Dedicated 1 Input to 2 Outputs Transfer Pill Button */}
        <button
          onClick={onOpenDualTransfer}
          className="action-icon-btn"
          style={{
            width: 'auto',
            padding: '0 11px',
            height: 32,
            borderRadius: 'var(--radius-full)',
            gap: 6,
            background: activeDualCount > 0 
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.25) 100%)' 
              : 'rgba(255, 255, 255, 0.05)',
            border: activeDualCount > 0 
              ? '1px solid rgba(6, 182, 212, 0.6)' 
              : '1px solid var(--border-subtle)',
            color: activeDualCount > 0 ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            boxShadow: activeDualCount > 0 ? '0 0 14px rgba(6, 182, 212, 0.3)' : 'none',
            cursor: 'pointer'
          }}
          title="Transfer 1 Input Source (App or Microphone) to 2 Output Destinations simultaneously"
        >
          <Share2 size={13} color={activeDualCount > 0 ? 'var(--accent-cyan)' : 'currentColor'} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>
            {activeDualCount > 0 ? `${activeDualCount} Dual Linked` : '1 ➔ 2 Transfer'}
          </span>
        </button>

        {/* Theme Switcher Button */}
        <button
          className="action-icon-btn"
          onClick={onToggleTheme}
          style={{ width: 32, height: 32 }}
          title={`Switch to ${theme === 'dark' ? 'Studio Console Light' : 'Audiophile Obsidian'} Theme`}
        >
          {theme === 'dark' ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#818cf8" />}
        </button>

        {/* Dropdown Options Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            background: isMenuOpen ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.08)',
            border: '1px solid ' + (isMenuOpen ? 'var(--accent-indigo)' : 'var(--border-subtle)'),
            color: '#ffffff',
            padding: '0 12px',
            height: 32,
            borderRadius: 'var(--radius-full)',
            fontSize: '0.74rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
            boxShadow: isMenuOpen ? '0 0 15px var(--glow-indigo)' : 'none'
          }}
          title="Open all audio engines, tools, views, and settings"
        >
          <Settings size={14} />
          <span>Options</span>
          <ChevronDown size={13} style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {/* Glassmorphic Dropdown Menu with ALL Options */}
        {isMenuOpen && (
          <div className="header-dropdown-menu" ref={menuRef}>
            {/* Section: Audio Tools & Engines */}
            <div className="dropdown-section-title">Audio Engine & Live Tools</div>

            {/* 1 Input to 2 Outputs Transfer Option */}
            <button 
              className={`dropdown-item-btn ${activeDualCount > 0 ? 'active' : ''}`}
              onClick={() => { onOpenDualTransfer(); setIsMenuOpen(false); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Share2 size={14} color="#06b6d4" />
                </div>
                <div>
                  <div className="dropdown-item-title">Dual Output Transfer (1 ➔ 2)</div>
                  <div className="dropdown-item-desc">Transfer 1 app or microphone to 2 outputs simultaneously</div>
                </div>
              </div>
              <span className={`dropdown-pill-badge ${activeDualCount > 0 ? 'active' : ''}`}>
                {activeDualCount > 0 ? `${activeDualCount} ACTIVE` : 'OPEN'}
              </span>
            </button>

            <button 
              className={`dropdown-item-btn ${isAudioLive ? 'active' : ''}`}
              onClick={() => { onToggleAudioLive(); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  {isAudioLive ? <Square size={13} color="#f43f5e" /> : <Play size={13} color="#10b981" />}
                </div>
                <div>
                  <div className="dropdown-item-title">Synthesize Audio Engine</div>
                  <div className="dropdown-item-desc">Live test audio streams & VU meters</div>
                </div>
              </div>
              <span className={`dropdown-pill-badge ${isAudioLive ? 'active' : ''}`}>
                {isAudioLive ? 'LIVE' : 'OFF'}
              </span>
            </button>

            <button 
              className={`dropdown-item-btn ${isCaptureOpen ? 'active' : ''}`}
              onClick={() => { onOpenCapture(); setIsMenuOpen(false); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Mic size={14} color="#ea4335" />
                </div>
                <div>
                  <div className="dropdown-item-title">Microphones & Inputs</div>
                  <div className="dropdown-item-desc">Windows WASAPI recording capture endpoints</div>
                </div>
              </div>
              <span className="dropdown-pill-badge">OPEN</span>
            </button>

            <button 
              className={`dropdown-item-btn ${silentDiscoActive ? 'active' : ''}`}
              onClick={() => { onToggleSilentDisco(); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Sparkles size={14} color="#f59e0b" />
                </div>
                <div>
                  <div className="dropdown-item-title">Silent Disco Mode</div>
                  <div className="dropdown-item-desc">Broadcast audio to all outputs simultaneously</div>
                </div>
              </div>
              <span className={`dropdown-pill-badge ${silentDiscoActive ? 'active' : ''}`}>
                {silentDiscoActive ? 'ACTIVE' : 'OFF'}
              </span>
            </button>

            <button 
              className="dropdown-item-btn"
              onClick={() => { onOpenCalibrator(); setIsMenuOpen(false); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Activity size={14} color="#06b6d4" />
                </div>
                <div>
                  <div className="dropdown-item-title">Latency Acoustic Calibrator</div>
                  <div className="dropdown-item-desc">Auto-align Bluetooth delay with acoustic pulse</div>
                </div>
              </div>
              <span className="dropdown-pill-badge">OPEN</span>
            </button>

            <button 
              className="dropdown-item-btn"
              onClick={() => { onOpenBluetoothHealth(); setIsMenuOpen(false); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Radio size={14} color="#3b82f6" />
                </div>
                <div>
                  <div className="dropdown-item-title">Bluetooth Health & RF Monitor</div>
                  <div className="dropdown-item-desc">Inspect RSSI, bitrates & LDAC/aptX codecs</div>
                </div>
              </div>
              <span className="dropdown-pill-badge">OPEN</span>
            </button>

            <button 
              className="dropdown-item-btn"
              onClick={() => { onOpenRules(); setIsMenuOpen(false); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <SlidersHorizontal size={14} color="#a855f7" />
                </div>
                <div>
                  <div className="dropdown-item-title">Automation & Ducking Rules</div>
                  <div className="dropdown-item-desc">Auto-duck background music during voice chat</div>
                </div>
              </div>
              <span className="dropdown-pill-badge">OPEN</span>
            </button>

            <div className="dropdown-divider" />

            {/* Section: System & Window Views */}
            <div className="dropdown-section-title">System & Window Controls</div>

            <button 
              className={`dropdown-item-btn ${minimizeToTray ? 'active' : ''}`}
              onClick={onToggleMinimizeToTray}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <PanelBottom size={14} color="#10b981" />
                </div>
                <div>
                  <div className="dropdown-item-title">Close Window Action</div>
                  <div className="dropdown-item-desc">
                    {minimizeToTray ? 'Minimizes to System Tray on close' : 'Exits application on close'}
                  </div>
                </div>
              </div>
              <span className={`dropdown-pill-badge ${minimizeToTray ? 'active' : ''}`}>
                {minimizeToTray ? 'TRAY' : 'EXIT'}
              </span>
            </button>

            <button 
              className={`dropdown-item-btn ${isMiniMixerOpen ? 'active' : ''}`}
              onClick={() => { onToggleMiniMixer(); setIsMenuOpen(false); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Minimize2 size={14} color="#6366f1" />
                </div>
                <div>
                  <div className="dropdown-item-title">Compact Mini Mixer</div>
                  <div className="dropdown-item-desc">Always-on-top floating desktop faders</div>
                </div>
              </div>
              <span className="dropdown-pill-badge">OPEN</span>
            </button>

            <button 
              className={`dropdown-item-btn ${isTrayOpen ? 'active' : ''}`}
              onClick={() => { onToggleTray(); setIsMenuOpen(false); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Layers size={14} color="#06b6d4" />
                </div>
                <div>
                  <div className="dropdown-item-title">System Tray Mixer Flyout</div>
                  <div className="dropdown-item-desc">Preview quick taskbar control popup</div>
                </div>
              </div>
              <span className="dropdown-pill-badge">PREVIEW</span>
            </button>

            <button 
              className="dropdown-item-btn"
              onClick={() => { onOpenTechSpec(); setIsMenuOpen(false); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Cpu size={14} color="#94a3b8" />
                </div>
                <div>
                  <div className="dropdown-item-title">Tech Architecture & Specs</div>
                  <div className="dropdown-item-desc">WASAPI endpoint details, latency & buffers</div>
                </div>
              </div>
              <span className="dropdown-pill-badge">SPECS</span>
            </button>

            <button 
              className="dropdown-item-btn"
              onClick={() => { if (onReplayStartup) onReplayStartup(); setIsMenuOpen(false); }}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Sparkles size={14} color="#f59e0b" />
                </div>
                <div>
                  <div className="dropdown-item-title">Replay Startup Reveal</div>
                  <div className="dropdown-item-desc">Minimal audiophile boot animation</div>
                </div>
              </div>
              <span className="dropdown-pill-badge">PLAY</span>
            </button>

            <div className="dropdown-divider" />

            {/* Section: Mode & Setup */}
            <div className="dropdown-section-title">Hardware Profile</div>

            <button 
              className="dropdown-item-btn"
              onClick={onToggleHardwareMode}
            >
              <div className="dropdown-item-left">
                <div className="dropdown-item-icon">
                  <Laptop size={14} color={hardwareMode === 'system' ? '#10b981' : '#a5b4fc'} />
                </div>
                <div>
                  <div className="dropdown-item-title">
                    {hardwareMode === 'system' ? 'Active PC Hardware Mode' : 'Studio Demo Setup'}
                  </div>
                  <div className="dropdown-item-desc">
                    {hardwareMode === 'system' ? 'Routing real Windows endpoints' : 'Multi-Bluetooth demo simulation'}
                  </div>
                </div>
              </div>
              <span className="dropdown-pill-badge active">SWITCH</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
