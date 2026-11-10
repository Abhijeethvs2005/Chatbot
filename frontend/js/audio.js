/**
 * NOVA Audio & Robotics Sound Synthesizer
 * Procedural Web Audio API for Mecha Servos, Hydraulics, Reactor Hums, and Speech.
 */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.voiceEnabled = false;
    this.isListening = false;
    this.recognition = null;
    this.currentUtterance = null;
    this.waveformListener = null;

    this.initSpeechRecognition();
  }

  setWaveformListener(fn) {
    this.waveformListener = fn;
  }

  notifyWaveform(state, label) {
    if (typeof this.waveformListener === "function") {
      this.waveformListener(state, label);
    }
  }

  ensureContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    if (!this.voiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return this.voiceEnabled;
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = !!enabled;
    if (!this.voiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return this.voiceEnabled;
  }

  async requestMicrophonePermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return { ok: false, error: "MediaDevices API not supported in this browser." };
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.name || err.message || "Microphone access blocked." };
    }
  }

  // --- Procedural Robotics SFX ---

  playClick() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, this.audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.04);
  }

  playServoHum() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(380, now + 0.18);
    osc.frequency.linearRampToValueAtTime(220, now + 0.35);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playHydraulicClick() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playRobotChirp() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.08);
    osc.frequency.linearRampToValueAtTime(850, now + 0.14);
    osc.frequency.linearRampToValueAtTime(1500, now + 0.22);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playThinking() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.16);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playClap() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    // White noise clap burst
    const bufferSize = this.audioCtx.sampleRate * 0.12;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.audioCtx.sampleRate * 0.025));
    }
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    noise.connect(gain);
    gain.connect(this.audioCtx.destination);
    noise.start(now);
  }

  playChime() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    [659.25, 880, 1046.5].forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const startTime = now + i * 0.08;
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
    });
  }

  playKissSound() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.13);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playSalute() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    [0, 0.06].forEach((delay) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const t = now + delay;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(580, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.04);
      gain.gain.setValueAtTime(0.13, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    });
  }

  playQuizSuccess() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const startTime = now + i * 0.07;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }

  playQuizError() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.24);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  // --- Web Speech API (TTS & Speech-to-Text) ---

  speak(text, onStart, onEnd) {
    if (!this.voiceEnabled || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/#+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\$\$[\s\S]*?\$\$/g, "formula")
      .replace(/\$[^$]+\$/g, "formula")
      .replace(/`[^`]+`/g, "")
      .replace(/>/g, "")
      .replace(/---/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.15;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha")));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.notifyWaveform("speaking", "NEURAL AUDIO: SYNTHESIZING SPEECH...");
      if (onStart) onStart();
    };
    utterance.onend = () => {
      this.notifyWaveform("idle", "NEURAL AUDIO ENGINE: READY");
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      this.notifyWaveform("idle", "NEURAL AUDIO ENGINE: READY");
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
    this.currentUtterance = utterance;
    this.notifyWaveform("speaking", "NEURAL AUDIO: SYNTHESIZING SPEECH...");
  }

  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.notifyWaveform("idle", "NEURAL AUDIO ENGINE: READY");
  }

  playVoiceCommandChime() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (err) {
      // AudioContext unavailable
    }
  }

  playAxiomWakeChime() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      // Ascending futuristic chord: F#5 (739.99Hz), A5 (880.0Hz), C#6 (1108.73Hz)
      const freqs = [739.99, 880.0, 1108.73];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        const t0 = now + idx * 0.08;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(0.22, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.32);
      });
    } catch (err) {
      // AudioContext unavailable
    }
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";
  }

  startListening(onResult, onEnd, onError, continuous = false) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError("Speech recognition not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      return;
    }

    if (!this.recognition) {
      this.initSpeechRecognition();
    }

    this.isListening = true;
    this.isContinuous = !!continuous;
    this.recognition.continuous = !!continuous;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";
    this.playClick();
    this.notifyWaveform("listening", continuous ? "VOICE CMD ENGINE: CONTINUOUS LISTENING..." : "VOICE RECOGNITION: LISTENING...");

    this.recognition.onresult = (event) => {
      const results = event.results;
      const last = results[results.length - 1];
      const transcript = last[0].transcript;
      if (onResult) onResult(transcript, last.isFinal);
    };

    this.recognition.onerror = (e) => {
      if (this.isContinuous && (e.error === "no-speech" || e.error === "network")) {
        // Suppress non-fatal quiet errors in continuous voice mode
        return;
      }
      this.isListening = false;
      this.isContinuous = false;
      if (onError) onError(e.error);
    };

    this.recognition.onend = () => {
      if (this.isContinuous && this.isListening) {
        // Auto-reconnect in continuous voice mode
        try {
          this.recognition.start();
          return;
        } catch (err) {
          // Fall through
        }
      }
      this.isListening = false;
      this.isContinuous = false;
      this.notifyWaveform("idle", "NEURAL AUDIO ENGINE: READY");
      if (onEnd) onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn("Recognition already active:", err);
    }
  }

  stopListening() {
    this.isContinuous = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
      this.isListening = false;
    }
    this.notifyWaveform("idle", "NEURAL AUDIO ENGINE: READY");
  }
}

window.AudioEngine = new AudioEngine();
