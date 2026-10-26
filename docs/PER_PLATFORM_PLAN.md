# MultiAudio — Per-Platform Implementation Plan & Risk Mitigation

This document details the engineering roadmap, OS-specific APIs, driver requirements, and physical constraints (Bluetooth bandwidth, audio sync drift) for MultiAudio across Windows, macOS, and Linux.

---

## 1. Windows 10/11 Implementation (Phase 1 Target)

### 1.1 Audio Routing Engine
Windows 10 (Build 1803+) and Windows 11 natively expose per-app audio output routing in the "Sound Settings" system menu. MultiAudio taps directly into this OS subsystem via the undocumented COM interface `IPolicyConfigVista` (and its Windows 10 variant `IPolicyConfig`):

```cpp
// Windows PolicyConfig GUID: {870C3566-037F-4E92-B857-81C1014B27C4}
MIDL_INTERFACE("f8679f50-850a-41cf-9c72-430f290290c8")
IPolicyConfig : public IUnknown {
public:
    virtual HRESULT STDMETHODCALLTYPE GetMixFormat(PCWSTR, WAVEFORMATEX**);
    virtual HRESULT STDMETHODCALLTYPE GetDeviceFormat(PCWSTR, INT, WAVEFORMATEX**);
    virtual HRESULT STDMETHODCALLTYPE SetDeviceFormat(PCWSTR, WAVEFORMATEX*, WAVEFORMATEX*);
    virtual HRESULT STDMETHODCALLTYPE GetProcessingPeriod(PCWSTR, INT, PINT64, PINT64);
    virtual HRESULT STDMETHODCALLTYPE SetProcessingPeriod(PCWSTR, PINT64);
    virtual HRESULT STDMETHODCALLTYPE GetShareMode(PCWSTR, struct DeviceShareMode*);
    virtual HRESULT STDMETHODCALLTYPE SetShareMode(PCWSTR, struct DeviceShareMode*);
    virtual HRESULT STDMETHODCALLTYPE GetPropertyValue(PCWSTR, const PROPERTYKEY&, PROPVARIANT*);
    virtual HRESULT STDMETHODCALLTYPE SetPropertyValue(PCWSTR, const PROPERTYKEY&, PROPVARIANT*);
    virtual HRESULT STDMETHODCALLTYPE SetDefaultEndpoint(PCWSTR wszDeviceId, ERole eRole);
    virtual HRESULT STDMETHODCALLTYPE SetPersistedDefaultAudioEndpoint(
        UINT processId,
        PCWSTR processPath,
        ERole eRole,
        EDataFlow eDataFlow,
        PCWSTR wszDeviceId
    );
};
```

#### Key Advantage:
* **Zero Driver Requirement for 1-to-1 Routing:** Users can route Spotify to headphones and Chrome to speakers immediately upon launching MultiAudio without needing administrator privileges or kernel drivers.

### 1.2 Multi-Streaming (1-to-Many / "Silent Disco")
To split a single application stream (e.g. Spotify) to multiple output receivers simultaneously:
1. MultiAudio captures the app's output stream using WASAPI Loopback Capture (`AUDCLNT_STREAMFLAGS_LOOPBACK`) in shared render mode.
2. The raw audio buffer is fanned out across multiple endpoints with individual sample-delay lines for latency alignment.

---

## 2. macOS Implementation (Phase 2 Target)

### 2.1 Technical Constraints & Sandboxing
Unlike Windows, macOS has no native per-application output routing in System Settings. Applications render directly to the default `HAL AudioDevice` unless they provide internal device pickers (e.g., Logic Pro, Zoom).

### 2.2 Solution: ScreenCaptureKit + AudioServerPlugIn
1. **Per-Process Stream Capture:** MultiAudio uses `ScreenCaptureKit` (`SCStreamConfiguration.capturesAudio = YES`, filtered by `SCRunningApplication`), introduced in macOS 13 (Ventura). This captures pristine digital audio per application without kernel extensions.
2. **Virtual Loopback Driver:** A bundled userland `AudioServerPlugIn` (HAL plugin placed in `/Library/Audio/Plug-Ins/HAL/`) provides virtual audio interfaces that can feed into OBS Studio, Zoom, or other software.
3. **Driver Signing:** Requires an Apple Developer ID with the Audio Server Plugin entitlement, properly notarized via `xcrun notarytool`.

---

## 3. Linux Implementation (Phase 2 Target)

### 3.1 The PipeWire Advantage
Modern Linux distributions (Fedora 34+, Ubuntu 22.10+, Arch) utilize **PipeWire** by default. PipeWire provides a native graph-based multimedia routing engine:
* Every running sound stream is represented as a node (`PW_KEY_MEDIA_CLASS = "Stream/Output/Audio"`).
* Every sound card, Bluetooth A2DP/LE Audio sink is a sink node (`PW_KEY_MEDIA_CLASS = "Audio/Sink"`).
* MultiAudio interacts with the PipeWire daemon via `libpipewire` to dynamically create or destroy links (`pw-link` or C/Rust API) with zero audio copying overhead and microsecond latency.

---

## 4. Real-World Physical Constraints & Risk Mitigation

### Risk 1: Bluetooth Adapter Bandwidth Saturation
* **Physical Limit:** Standard Bluetooth 5.0–5.3 adapters operate on 2.4 GHz ISM band sharing bandwidth with Wi-Fi. The practical maximum payload throughput for audio ACL (Asynchronous Connection-Oriented) packets is **1.2 to 1.5 Mbps**.
* **Failure Scenario:**
  - Streaming to Sony WH-1000XM5 using Sony LDAC @ 990 kbps (96kHz/24bit).
  - Attempting to simultaneously stream to Bose SoundLink using aptX Adaptive @ 420 kbps.
  - Total bandwidth = $990 + 420 = 1,410\text{ kbps}$ (approaching theoretical saturation). Adding a third stream causes severe buffer dropouts, crackling, and Bluetooth controller restarts.
* **MultiAudio Mitigation:**
  - Real-time **Bluetooth Bandwidth Pool Monitor** in the UI.
  - **Dynamic Codec Downgrade:** When 2+ Bluetooth receivers are active, MultiAudio automatically negotiates LDAC to 660 kbps or AAC 256 kbps to guarantee dropout-free multi-streaming.

### Risk 2: Acoustic Latency Drift
* **Physical Limit:** Bluetooth codecs operate with variable internal buffer sizes (SBC ~150-220ms, AAC ~180-240ms, aptX-LL ~35-40ms). Over time, hardware clock oscillators on different headphones drift apart.
* **MultiAudio Mitigation:**
  - **Acoustic One-Click Auto-Calibration:** Generates a 400Hz–2.4kHz logarithmic chirp pulse through the headphones and measures acoustic loopback via the laptop microphone to calculate true acoustic transit latency.
  - **Dynamic Kalman Time Sync:** Fine-grained fractional sinc resampling periodically nudges sample playback (+/- 1-2 ms) when packet jitter drifts.

---

## 5. Development Roadmap & Milestones

| Phase | Duration | Core Deliverables |
| :--- | :--- | :--- |
| **Phase 1 (MVP)** | Weeks 1–4 | Windows 10/11 per-app routing, drag-and-drop UI, multi-device output, per-device delay slider, saved profiles, system tray quick controls. |
| **Phase 2** | Weeks 5–8 | Linux PipeWire integration, macOS ScreenCaptureKit tap + HAL driver, acoustic auto-calibration wizard, priority voice ducking rules. |
| **Phase 3** | Weeks 9–12 | MultiAudio Virtual Sound Card for OBS/Zoom, Silent Disco multi-sync mode, CLI/REST automation API, signed installer packaging (MSI/DMG/Flatpak). |
