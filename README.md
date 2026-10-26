# MultiAudio for Desktop

> Minimalist Per-App Audio Router & Latency Sync Mixer for Windows, macOS, and Linux.

MultiAudio lets you connect multiple Bluetooth, USB, and wired audio devices to your computer simultaneously and control exactly which application plays through which device with zero latency drift and zero nested menus.

![MultiAudio Architecture](public/favicon.svg)

---

## Key Features

1. **Intuitive Drag-and-Drop Patch Bay**
   - Active audio-producing apps appear on the left; connected output devices on the right.
   - Simply drag glowing patch cables between nodes to route audio one-to-one or one-to-many.
   - Animated audio energy particles flow along active cables in real time.

2. **Bluetooth Sync & Acoustic Auto-Calibration**
   - Per-device millisecond delay slider (+0 to +500ms) to align Bluetooth latency differences.
   - **One-Click Auto-Calibration:** Emits a calibrated ultrasonic/acoustic chirp tone and measures microphone loopback to automatically calculate the exact buffer offset.

3. **Bluetooth Bandwidth & RF Health Monitor**
   - Real-time HCI adapter throughput pool monitor.
   - Prevents audio crackle and dropouts when streaming dual Hi-Res codecs (e.g., dual-LDAC 990 kbps).
   - 1-click automatic codec optimization.

4. **Profiles & Automation Rules**
   - Instant 1-click profile switching: *Work Focus*, *Gaming & Voice*, *Movie Night*, *Stream Setup*, and *Silent Disco*.
   - Priority voice ducking: Automatically lowers music volume when Discord speech is detected.

5. **Multi-Window Desktop Adaptations**
   - **Hero Routing Window:** Full visual cable matrix.
   - **Compact Mini-Mixer:** Floating, always-on-top sleek widget for quick volume control while gaming or working.
   - **System Tray / Menu Bar Flyout:** Fast hotkeys and profile switcher.

6. **Web Audio Reactive Simulator & Native Rust Engine**
   - Built-in generative sound synthesizer for real-time testing with audio meters.
   - Native Rust backend scaffolding (`src-tauri/`) leveraging WASAPI (`IPolicyConfigVista`), CoreAudio (`ScreenCaptureKit`), and Linux PipeWire.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Rust (optional, for native Tauri desktop packaging)

### Run as a Standalone Desktop App (No Browser)

#### Option A: 1-Click Desktop Launcher
Double-click `run-desktop.bat` in the root folder, or run:
```bash
npm run desktop:window
```
*Launches MultiAudio in its own dedicated, frameless standalone native window (no browser tabs, no address bar, custom 1280x840 window).*

#### Option B: Native Electron Runtime
```bash
npm run desktop
```
*Launches MultiAudio inside a standalone Electron desktop runtime with custom window controls.*

#### Option C: Web Dev Server
```bash
npm run dev
```
*Serves at `http://localhost:5173/` for development.*

---

## Project Structure

```
MultiAudio/
├── index.html                   # HTML5 shell with Google Fonts & metadata
├── src/
│   ├── App.jsx                  # Main state orchestration & drag-and-drop cable router
│   ├── index.css                # Audiophile dark/light glassmorphism styling
│   ├── types.js                 # Data models (Apps, Devices, Profiles, EQ presets)
│   ├── services/
│   │   └── soundEngine.js       # Web Audio API real-time synthesizer & meter service
│   └── components/
│       ├── Header.jsx           # Top controls, profile pills, audio engine toggle
│       ├── RoutingCanvas.jsx    # SVG dynamic cubic Bezier patch cords & particle flows
│       ├── AppNode.jsx          # App cards with VU meters, spectrum bars, volume faders
│       ├── DeviceNode.jsx       # Device cards with codec badges, battery, latency slider
│       ├── MiniMixer.jsx        # Compact always-on-top floating mixer window
│       ├── SystemTrayPopup.jsx  # OS notification area flyout simulator
│       ├── LatencyCalibrator.jsx# Acoustic chirp pulse auto-calibration wizard
│       ├── BluetoothHealthMonitor.jsx # HCI adapter bandwidth monitor
│       ├── RulesModal.jsx       # Event-driven routing and voice ducking rules
│       └── TechArchitectureModal.jsx # Live low-level OS subsystem inspector
├── src-tauri/                   # Production Native Desktop Core (Rust)
│   ├── Cargo.toml               # Rust dependencies (WASAPI, CoreAudio, PipeWire, Rubato)
│   ├── tauri.conf.json          # Desktop window & tray configuration
│   └── src/
│       ├── main.rs              # Tauri IPC bridge & command handlers
│       └── audio/
│           ├── wasapi.rs        # Windows 10/11 IPolicyConfig & WASAPI session manager
│           ├── coreaudio.rs     # macOS ScreenCaptureKit tap & HAL virtual driver
│           ├── pipewire.rs      # Linux PipeWire multimedia graph routing
│           ├── sync_engine.rs   # Circular ring buffers & latency compensation
│           └── virtual_driver.rs# Virtual sound card loopback for OBS Studio
└── docs/
    ├── ARCHITECTURE.md          # Comprehensive architecture & Mermaid diagrams
    ├── PER_PLATFORM_PLAN.md     # In-depth OS APIs, driver signing, Bluetooth bandwidth
    └── TECH_SPEC.md             # API schemas, data models, CLI & REST endpoints
```

---

## Technical Documentation
- 📘 [System Architecture Diagram](docs/ARCHITECTURE.md)
- 🛠️ [Per-Platform Implementation & Risks](docs/PER_PLATFORM_PLAN.md)
- 🔌 [Technical Specification & REST/CLI API](docs/TECH_SPEC.md)
