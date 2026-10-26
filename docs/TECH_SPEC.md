# MultiAudio — Technical Specification & API Reference

## 1. Product Overview
MultiAudio provides desktop operating systems with fine-grained, per-application audio stream routing and multi-device latency alignment.

---

## 2. Data Models & Schemas

### 2.1 Audio Process Node (`AppNode`)
```typescript
interface AppNode {
  id: string;              // Unique identifier e.g., 'app-spotify'
  name: string;            // User-friendly name e.g., 'Spotify'
  processName: string;     // Process image name e.g., 'Spotify.exe'
  pid: number;             // OS Process ID e.g., 14280
  category: 'music' | 'browser' | 'voice' | 'game' | 'creator';
  icon: string;
  color: string;           // Brand hex color
  format: string;          // e.g., '44.1 kHz • 320 kbps MP3'
  volume: number;          // 0 to 100
  muted: boolean;
  solo: boolean;
  currentTrack: string;    // Media metadata string
  activeLevel: number;     // 0.0 to 1.0 (RMS)
  frequencyData: number[]; // 8-band frequency energy
  priorityDucking?: boolean;
}
```

### 2.2 Output Device Sink (`DeviceNode`)
```typescript
interface DeviceNode {
  id: string;              // Endpoint ID e.g., 'dev-sony'
  name: string;            // e.g., 'Sony WH-1000XM5'
  type: 'bluetooth' | 'usb' | 'builtin' | 'virtual';
  codec: string;           // 'LDAC' | 'AAC' | 'aptX' | 'Direct PCM' | 'Virtual'
  codecRate: string;       // e.g., '990 kbps • 96kHz/24bit'
  battery: number | null;  // Percentage (0-100) or null if wired
  rssi: number | null;     // Signal strength in dBm (-30 to -95)
  signalQuality: string;   // 'Excellent' | 'Good' | 'Fair' | 'Poor'
  bandwidthUsageKbps: number;
  volume: number;          // 0 to 100
  muted: boolean;
  delayMs: number;         // Millisecond compensation delay (0-500)
  eqPreset: string;        // Selected EQ preset
  isDefault: boolean;
  isVirtual?: boolean;
}
```

### 2.3 Audio Route (`Connection`)
```typescript
interface Connection {
  id: string;              // e.g., 'conn-1'
  sourceId: string;        // ID of AppNode
  targetId: string;        // ID of DeviceNode
  active: boolean;
  color: string;
  volumeOffset?: number;   // dB adjustment for this specific connection
}
```

---

## 3. Power-User CLI & Automation Interface

MultiAudio includes a built-in local IPC socket and HTTP daemon (`127.0.0.1:48120`) allowing Stream Deck plugins, terminal scripts, and hotkey managers to orchestrate routing:

### 3.1 CLI Command Syntax
```bash
# List all active sound sessions
multiaudio list-apps

# List connected output devices
multiaudio list-devices

# Route Spotify to Sony Headphones
multiaudio route --app Spotify.exe --device "Sony WH-1000XM5"

# Set delay compensation on Bluetooth receiver
multiaudio set-delay --device "AirPods Pro" --ms 180

# Switch active profile
multiaudio profile load "Work Focus"

# Mute Discord
multiaudio mute --app Discord.exe
```

### 3.2 REST API Endpoints
* `GET /v1/sessions`: Returns JSON array of all active audio sessions with volume levels.
* `POST /v1/routes`: Body `{ "sourceId": "app-spotify", "targetId": "dev-sony" }`
* `DELETE /v1/routes/{id}`: Disconnects the patch cable.
* `POST /v1/profiles/apply`: Body `{ "profileId": "profile-gaming" }`
* `GET /v1/health/bluetooth`: Returns current bandwidth consumption and drop warning state.
