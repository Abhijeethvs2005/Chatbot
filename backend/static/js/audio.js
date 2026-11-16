/**
 * NOVA Audio & Robotics Sound Synthesizer
 * Procedural Web Audio API for Mecha Servos, Hydraulics, Reactor Hums, and Speech.
 */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.voiceEnabled = true; // Voice speech synthesis enabled by default
    this.isListening = false;
    this.recognition = null;
    this.currentUtterance = null;
    this.waveformListener = null;
    this.danceBeatInterval = null;

    // Soothing Female Voice Engine (Anti-Harsh Filtering)
    this.selectedVoice = null;
    this.voicePitch = 1.0;
    this.voiceRate = 0.98;
    this.preferredVoiceName = "";
    if (typeof localStorage !== "undefined") {
      const storedVoice = localStorage.getItem("axiom_voice_enabled");
      if (storedVoice !== null) {
        this.voiceEnabled = storedVoice === "true";
      } else {
        this.voiceEnabled = true;
      }
      this.voicePitch = parseFloat(localStorage.getItem("axiom_voice_pitch") || "1.0");
      this.voiceRate = parseFloat(localStorage.getItem("axiom_voice_rate") || "0.98");
      this.preferredVoiceName = localStorage.getItem("axiom_voice_name") || "";
    }

    this.initVoices();
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
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("axiom_voice_enabled", this.voiceEnabled ? "true" : "false");
    }
    if (!this.voiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    return this.voiceEnabled;
  }

  setVoiceEnabled(enabled) {
    this.voiceEnabled = !!enabled;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("axiom_voice_enabled", this.voiceEnabled ? "true" : "false");
    }
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

  isMaleOrHarshVoice(voice) {
    if (!voice || !voice.name) return true;
    const name = voice.name.toLowerCase();
    const badTokens = [
      "male", "man", "boy", "guy", "david", "daniel", "alex", "fred", "albert",
      "junior", "ralph", "eddy", "reed", "rocko", "rishi", "aman", "george",
      "oliver", "james", "tom", "bruce", "zarvox", "trinoids", "whisper",
      "bad news", "bahh", "bells", "boing", "bubbles", "cellos", "wobble",
      "organ", "jester", "superstar", "grandpa", "mark", "paul", "ryan",
      "steve", "charles", "richard", "arthur", "kurt", "boris", "deranged",
      "hysterical"
    ];
    return badTokens.some((t) => name.includes(t));
  }

  getAvailableFemaleVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
    const all = window.speechSynthesis.getVoices() || [];
    return all.filter((v) => {
      const isEn = v.lang && v.lang.toLowerCase().startsWith("en");
      return isEn && !this.isMaleOrHarshVoice(v);
    });
  }

  pickBestFemaleVoice(voices) {
    if (!voices || voices.length === 0) return null;

    // Respect saved preference if valid non-male voice
    if (this.preferredVoiceName) {
      const saved = voices.find((v) => v.name === this.preferredVoiceName && !this.isMaleOrHarshVoice(v));
      if (saved) return saved;
    }

    // Filter strictly against male and harsh novelty voices
    const enVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
    const nonMaleVoices = (enVoices.length > 0 ? enVoices : voices).filter((v) => !this.isMaleOrHarshVoice(v));
    const pool = nonMaleVoices.length > 0 ? nonMaleVoices : voices;

    // Highest-rated soothing, warm, articulate female voices
    const topFemaleNames = [
      "samantha",          // Apple macOS / iOS standard natural warm female
      "karen",              // Apple macOS soft Australian female
      "moira",              // Apple macOS gentle Irish female
      "tessa",              // Apple macOS crisp South African female
      "google us english",  // Google Chrome natural female assistant
      "google uk english female",
      "ava",                // Apple modern neural female
      "victoria",           // Apple classic clear female
      "jenny",              // Microsoft Edge / Windows Natural female
      "aria",               // Microsoft Edge / Windows Natural female
      "sonia",              // Microsoft Natural female
      "zira",               // Microsoft Windows female
      "tara",               // Apple Indian English female
      "sandy",              // Apple natural female
      "shelley",            // Apple natural female
      "flo",                // Apple natural female
      "allison",            // Natural female
      "susan",              // Natural female
      "kathy"               // Apple natural female
    ];

    for (const name of topFemaleNames) {
      const found = pool.find((v) => v.name.toLowerCase().includes(name));
      if (found) return found;
    }

    // Fall back to any voice that explicitly includes "female"
    const femaleMatch = pool.find((v) => v.name.toLowerCase().includes("female"));
    if (femaleMatch) return femaleMatch;

    return pool[0] || null;
  }

  initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const updateVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        this.selectedVoice = this.pickBestFemaleVoice(voices);
      }
    };
    updateVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoice;
    }
  }

  setVoice(voiceName) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.name === voiceName && !this.isMaleOrHarshVoice(v));
    if (match) {
      this.selectedVoice = match;
      this.preferredVoiceName = match.name;
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("axiom_voice_name", match.name);
      }
    }
  }

  setPitch(pitch) {
    this.voicePitch = Math.max(0.7, Math.min(1.3, parseFloat(pitch) || 1.0));
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("axiom_voice_pitch", this.voicePitch.toString());
    }
  }

  setRate(rate) {
    this.voiceRate = Math.max(0.7, Math.min(1.3, parseFloat(rate) || 0.98));
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("axiom_voice_rate", this.voiceRate.toString());
    }
  }

  speak(text, onStart, onEnd) {
    if (!this.voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    let cleanText = text
      .replace(/#+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\$\$[\s\S]*?\$\$/g, "formula")
      .replace(/\$[^$]+\$/g, "formula")
      .replace(/`[^`]+`/g, "")
      .replace(/>/g, "")
      .replace(/---/g, "")
      .replace(/[\u{1F300}-\u{1FAFF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, "")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    // Relaxed, calm cadence and warm natural pitch - zero harsh or shrill robotic artifacts
    utterance.rate = this.voiceRate || 0.98;
    utterance.pitch = this.voicePitch || 1.0;
    utterance.volume = 1.0;

    if (!this.selectedVoice) {
      const voices = window.speechSynthesis.getVoices();
      this.selectedVoice = this.pickBestFemaleVoice(voices);
    }

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    const voiceDisplayName = (this.selectedVoice && this.selectedVoice.name) ? this.selectedVoice.name : "Warm Female AI";

    const setRobotSpeaking = (isSpeaking) => {
      const bot = window.robot3d || window.robotInstance;
      if (bot && typeof bot.setExpression === "function") {
        bot.setExpression(isSpeaking ? "speaking" : "idle");
      }
    };

    utterance.onstart = () => {
      this.notifyWaveform("speaking", `NEURAL AUDIO: SPEAKING (${voiceDisplayName})...`);
      setRobotSpeaking(true);
      if (onStart) onStart();
    };
    utterance.onend = () => {
      this.notifyWaveform("idle", "NEURAL AUDIO ENGINE: READY");
      setRobotSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      this.notifyWaveform("idle", "NEURAL AUDIO ENGINE: READY");
      setRobotSpeaking(false);
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    this.notifyWaveform("speaking", `NEURAL AUDIO: SPEAKING (${voiceDisplayName})...`);
  }

  stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    const bot = window.robot3d || window.robotInstance;
    if (bot && typeof bot.setExpression === "function") {
      bot.setExpression("idle");
    }
    this.notifyWaveform("idle", "NEURAL AUDIO ENGINE: READY");
  }

  playDanceBeat(durationSec = 10.5) {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.audioCtx) return;

    this.stopDanceBeat();
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }

    const bpm = 120;
    const intervalMs = (60 / bpm) * 1000; // 500ms per beat
    let currentBeat = 0;
    const totalBeats = Math.ceil(durationSec / (intervalMs / 1000));
    const melodyNotes = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 293.66]; // C-E-G-C-A-G-E-D

    const step = () => {
      if (currentBeat >= totalBeats) {
        this.stopDanceBeat();
        return;
      }
      if (!this.soundEnabled || !this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // 1. Kick Bass (Punchy 140Hz -> 42Hz drop)
      try {
        const kick = this.audioCtx.createOscillator();
        const kickGain = this.audioCtx.createGain();
        kick.type = "sine";
        kick.frequency.setValueAtTime(140, now);
        kick.frequency.exponentialRampToValueAtTime(42, now + 0.18);
        kickGain.gain.setValueAtTime(0.28, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        kick.connect(kickGain);
        kickGain.connect(this.audioCtx.destination);
        kick.start(now);
        kick.stop(now + 0.23);
      } catch (e) {}

      // 2. Off-beat Synth Snare / Hi-Hat
      try {
        const offTime = now + 0.25;
        const hat = this.audioCtx.createOscillator();
        const hatGain = this.audioCtx.createGain();
        hat.type = "triangle";
        hat.frequency.setValueAtTime(1800 + (currentBeat % 4) * 250, offTime);
        hatGain.gain.setValueAtTime(0.08, offTime);
        hatGain.gain.exponentialRampToValueAtTime(0.001, offTime + 0.08);
        hat.connect(hatGain);
        hatGain.connect(this.audioCtx.destination);
        hat.start(offTime);
        hat.stop(offTime + 0.09);
      } catch (e) {}

      // 3. Catchy Electro Synth Lead
      try {
        const mel = this.audioCtx.createOscillator();
        const melGain = this.audioCtx.createGain();
        mel.type = "sine";
        mel.frequency.setValueAtTime(melodyNotes[currentBeat % melodyNotes.length], now);
        melGain.gain.setValueAtTime(0.12, now);
        melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        mel.connect(melGain);
        melGain.connect(this.audioCtx.destination);
        mel.start(now);
        mel.stop(now + 0.33);
      } catch (e) {}

      currentBeat++;
    };

    // First beat immediate
    step();
    this.danceBeatInterval = setInterval(step, intervalMs);
  }

  stopDanceBeat() {
    if (this.danceBeatInterval) {
      clearInterval(this.danceBeatInterval);
      this.danceBeatInterval = null;
    }
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
