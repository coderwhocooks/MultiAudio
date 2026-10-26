// SoundEngine - Web Audio API simulation & real-time audio synthesis
// Provides authentic audio reactivity, VU meter calculations, and test tones.

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.tracks = {};
    this.masterGain = null;
    this.analysers = {};
    this.animationFrame = null;
    this.meterCallbacks = [];
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  startDemoAudio() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;

    // Create 3 synthesized generative streams:
    // 1. Spotify lo-fi beat & bass
    this.createLofiBeat('app-spotify');
    // 2. Chrome ambient voice/stream
    this.createAmbientChords('app-chrome');
    // 3. Game synth arpeggios
    this.createGameArp('app-game');

    this.startMeterLoop();
  }

  stopDemoAudio() {
    this.isPlaying = false;
    Object.values(this.tracks).forEach(track => {
      try {
        if (track.stop) track.stop();
        if (track.interval) clearInterval(track.interval);
      } catch (e) {
        // ignore
      }
    });
    this.tracks = {};
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  createLofiBeat(appId) {
    if (!this.ctx) return;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gainNode.connect(this.masterGain);

    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 64;
    gainNode.connect(analyser);
    this.analysers[appId] = analyser;

    // Synthesize low sub-bass kick & hat rhythm
    const interval = setInterval(() => {
      if (!this.isPlaying) return;
      const now = this.ctx.currentTime;

      // Kick drum
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.2);
      oscGain.gain.setValueAtTime(0.6, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(oscGain);
      oscGain.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.35);

      // Hi-hat tick
      setTimeout(() => {
        if (!this.isPlaying || !this.ctx) return;
        const hatNow = this.ctx.currentTime;
        const hatOsc = this.ctx.createOscillator();
        const hatGain = this.ctx.createGain();
        hatOsc.type = 'highpass';
        hatOsc.frequency.setValueAtTime(7000, hatNow);
        hatGain.gain.setValueAtTime(0.08, hatNow);
        hatGain.gain.exponentialRampToValueAtTime(0.001, hatNow + 0.05);
        hatOsc.connect(hatGain);
        hatGain.connect(gainNode);
        hatOsc.start(hatNow);
        hatOsc.stop(hatNow + 0.05);
      }, 300);
    }, 600);

    this.tracks[appId] = { interval, gainNode };
  }

  createAmbientChords(appId) {
    if (!this.ctx) return;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gainNode.connect(this.masterGain);

    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 64;
    gainNode.connect(analyser);
    this.analysers[appId] = analyser;

    const chords = [
      [261.63, 329.63, 392.00], // C Maj
      [220.00, 261.63, 329.63], // A Min
      [174.61, 220.00, 261.63], // F Maj
      [196.00, 246.94, 293.66], // G Maj
    ];

    let chordIdx = 0;
    const interval = setInterval(() => {
      if (!this.isPlaying) return;
      const now = this.ctx.currentTime;
      const chord = chords[chordIdx % chords.length];
      chordIdx++;

      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        chordGain.gain.setValueAtTime(0.001, now);
        chordGain.gain.linearRampToValueAtTime(0.12, now + 0.4);
        chordGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(chordGain);
        chordGain.connect(gainNode);
        osc.start(now);
        osc.stop(now + 1.8);
      });
    }, 2000);

    this.tracks[appId] = { interval, gainNode };
  }

  createGameArp(appId) {
    if (!this.ctx) return;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gainNode.connect(this.masterGain);

    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 64;
    gainNode.connect(analyser);
    this.analysers[appId] = analyser;

    const notes = [440, 523.25, 659.25, 783.99, 880];
    let noteIdx = 0;
    const interval = setInterval(() => {
      if (!this.isPlaying) return;
      const now = this.ctx.currentTime;
      const freq = notes[noteIdx % notes.length];
      noteIdx++;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.08, now);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(noteGain);
      noteGain.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.18);
    }, 250);

    this.tracks[appId] = { interval, gainNode };
  }

  // Play a calibration chirp tone (used for auto-calibrating latency)
  playCalibrationTone(onComplete) {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Frequency sweep 400Hz -> 2400Hz (standard acoustic impulse chirp)
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(2400, now + 0.25);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.35);

    setTimeout(() => {
      if (onComplete) onComplete();
    }, 450);
  }

  subscribeMeters(cb) {
    this.meterCallbacks.push(cb);
    return () => {
      this.meterCallbacks = this.meterCallbacks.filter(c => c !== cb);
    };
  }

  startMeterLoop() {
    const dataArray = new Uint8Array(32);
    const loop = () => {
      const levels = {};
      Object.keys(this.analysers).forEach(id => {
        const analyser = this.analysers[id];
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (dataArray.length * 255);
        levels[id] = {
          rms: Math.min(1, avg * 1.8),
          bands: Array.from(dataArray.slice(0, 8)).map(v => Math.round((v / 255) * 100))
        };
      });

      this.meterCallbacks.forEach(cb => cb(levels));
      if (this.isPlaying) {
        this.animationFrame = requestAnimationFrame(loop);
      }
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  // Configure dual output bus for a specific source
  setDualOutput(sourceId, devAId, devBId, delayMs = 0, volA = 80, volB = 80) {
    if (!this.dualOutputs) this.dualOutputs = {};
    this.dualOutputs[sourceId] = { devAId, devBId, delayMs, volA, volB, active: true };
  }

  removeDualOutput(sourceId) {
    if (this.dualOutputs && this.dualOutputs[sourceId]) {
      delete this.dualOutputs[sourceId];
    }
  }

  // Live microphone audition / loopback
  async startMicAudition(onLevel) {
    try {
      this.init();
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.micStream = stream;
        const micSource = this.ctx.createMediaStreamSource(stream);
        const micGain = this.ctx.createGain();
        micGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        const micAnalyser = this.ctx.createAnalyser();
        micAnalyser.fftSize = 64;

        micSource.connect(micGain);
        micGain.connect(micAnalyser);
        micGain.connect(this.masterGain);

        this.analysers['mic-live'] = micAnalyser;
        if (!this.isPlaying) {
          this.startMeterLoop();
        }
        return true;
      }
    } catch (e) {
      console.warn('Microphone audition not permitted or not supported:', e);
      return false;
    }
  }

  stopMicAudition() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    delete this.analysers['mic-live'];
  }
}

export const soundEngine = new SoundEngine();
