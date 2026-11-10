/**
 * NOVA-3D Main Application Controller
 * Connects 3D Robot, Audio Engine, Academic Knowledge Base, Math Renderer, and Student Study Tools.
 * Crafted with love by an engineering student for students.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize 3D Robot safely
  let robot = null;
  try {
    if (typeof Robot3D !== "undefined") {
      robot = new Robot3D("robot-viewport");
      window.robotInstance = robot;
    }
  } catch (err) {
    console.warn("3D Robot System loaded in fallback mode:", err);
  }

  // 2. Application State
  const state = {
    subject: "General",
    mode: "standard", // standard, eli5, exam_prep
    currentQuiz: null,
    studyXP: parseInt(localStorage.getItem("nova_xp") || "120"),
    studyStreak: parseInt(localStorage.getItem("nova_streak") || "4"),
    savedNotes: JSON.parse(localStorage.getItem("nova_notes") || "[]"),
    pomodoro: {
      timeLeft: 25 * 60,
      totalTime: 25 * 60,
      timerId: null,
      isRunning: false,
      isBreak: false
    }
  };

  // 3. UI DOM Elements
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const micBtn = document.getElementById("mic-btn");
  const soundToggleBtn = document.getElementById("sound-toggle-btn");
  const voiceToggleBtn = document.getElementById("voice-toggle-btn");
  const eli5Toggle = document.getElementById("eli5-toggle");
  const subjectPills = document.querySelectorAll(".subject-pill");
  const quickPromptBtns = document.querySelectorAll(".quick-prompt");
  const latencyBadge = document.getElementById("latency-badge");

  // Pomodoro elements
  const pomoDisplay = document.getElementById("pomo-display");
  const pomoToggle = document.getElementById("pomo-toggle");
  const pomoReset = document.getElementById("pomo-reset");

  // XP & Streak
  const xpCounter = document.getElementById("xp-counter");
  const streakCounter = document.getElementById("streak-counter");

  // Modals & Drawers
  const notesDrawer = document.getElementById("notes-drawer");
  const notesToggleBtn = document.getElementById("notes-toggle-btn");
  const closeNotesBtn = document.getElementById("close-notes-btn");
  const notesList = document.getElementById("notes-list");

  const quizModal = document.getElementById("quiz-modal");
  const closeQuizBtn = document.getElementById("close-quiz-btn");
  const quizContainer = document.getElementById("quiz-container");

  const makerModal = document.getElementById("maker-modal");
  const makerBtn = document.getElementById("maker-notes-btn");
  const closeMakerBtn = document.getElementById("close-maker-btn");

  // Settings Modal & API Key
  const settingsModal = document.getElementById("settings-modal");
  const settingsBtn = document.getElementById("settings-btn");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  const customApiKeyInput = document.getElementById("custom-api-key-input");
  const saveApiKeyBtn = document.getElementById("save-api-key-btn");
  const clearApiKeyBtn = document.getElementById("clear-api-key-btn");
  const testApiKeyBtn = document.getElementById("test-api-key-btn");
  const keyTestFeedback = document.getElementById("key-test-feedback");
  const apiStatusDot = document.getElementById("api-status-dot");
  const engineStatusBox = document.getElementById("engine-status-box");
  const engineStatusIcon = document.getElementById("engine-status-icon");
  const engineStatusTitle = document.getElementById("engine-status-title");
  const engineStatusDesc = document.getElementById("engine-status-desc");
  const preferLiveAiCheckbox = document.getElementById("prefer-live-ai-checkbox");

  let customApiKey = localStorage.getItem("abhi_api_key") || "";
  let preferLiveAI = localStorage.getItem("abhi_prefer_live") !== "false";
  let serverHasOpenAI = false;

  if (customApiKeyInput && customApiKey) {
    customApiKeyInput.value = customApiKey;
  }
  if (preferLiveAiCheckbox) {
    preferLiveAiCheckbox.checked = preferLiveAI;
    preferLiveAiCheckbox.addEventListener("change", () => {
      preferLiveAI = preferLiveAiCheckbox.checked;
      localStorage.setItem("abhi_prefer_live", preferLiveAI ? "true" : "false");
    });
  }

  function updateEngineUI() {
    const activeKey = customApiKey || (serverHasOpenAI ? "server-key" : "");
    if (activeKey) {
      if (apiStatusDot) {
        apiStatusDot.style.background = "#22c55e";
        apiStatusDot.style.boxShadow = "0 0 6px #22c55e";
      }
      if (engineStatusBox) {
        engineStatusIcon.textContent = "🟢";
        engineStatusTitle.textContent = "Live OpenAI AI Engine Active (GPT-4o Mini)";
        engineStatusDesc.textContent = customApiKey 
          ? "Connected via custom browser key. Live unrestricted reasoning active."
          : "Connected via backend environment key. Live unrestricted reasoning active.";
        engineStatusBox.style.background = "rgba(34, 197, 94, 0.08)";
        engineStatusBox.style.borderColor = "rgba(34, 197, 94, 0.25)";
        engineStatusBox.style.color = "#4ade80";
      }
    } else {
      if (apiStatusDot) {
        apiStatusDot.style.background = "#64748b";
        apiStatusDot.style.boxShadow = "none";
      }
      if (engineStatusBox) {
        engineStatusIcon.textContent = "⚡";
        engineStatusTitle.textContent = "Sub-10ms Offline Academic & Math Engine Active";
        engineStatusDesc.textContent = "Instant curriculum solver with zero latency. Add an OpenAI key below to enable live unrestricted AI generation.";
        engineStatusBox.style.background = "rgba(56, 189, 248, 0.08)";
        engineStatusBox.style.borderColor = "rgba(56, 189, 248, 0.25)";
        engineStatusBox.style.color = "#38bdf8";
      }
    }
  }

  // Check backend server status
  fetch("/api/health")
    .then((r) => r.json())
    .then((data) => {
      if (data.openai_configured) {
        serverHasOpenAI = true;
      }
      updateEngineUI();
    })
    .catch(() => {
      updateEngineUI();
    });

  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      settingsModal.classList.add("open");
      if (keyTestFeedback) keyTestFeedback.style.display = "none";
      updateEngineUI();
      window.AudioEngine.playClick();
    });
  }

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener("click", () => {
      settingsModal.classList.remove("open");
    });
  }

  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener("click", () => {
      const val = customApiKeyInput.value.trim();
      customApiKey = val;
      localStorage.setItem("abhi_api_key", val);
      updateEngineUI();
      alert(val ? "✓ OpenAI API Key saved! Live AI Mode is now active." : "API Key cleared. Reverted to Sub-10ms Offline Engine.");
      settingsModal.classList.remove("open");
      window.AudioEngine.playClick();
    });
  }

  if (clearApiKeyBtn) {
    clearApiKeyBtn.addEventListener("click", () => {
      customApiKey = "";
      customApiKeyInput.value = "";
      localStorage.removeItem("abhi_api_key");
      updateEngineUI();
      if (keyTestFeedback) {
        keyTestFeedback.style.display = "block";
        keyTestFeedback.style.background = "rgba(100, 116, 139, 0.15)";
        keyTestFeedback.style.border = "1px solid rgba(100, 116, 139, 0.3)";
        keyTestFeedback.style.color = "#94a3b8";
        keyTestFeedback.textContent = "Key removed. System returned to Sub-10ms Offline Academic Engine.";
      }
      alert("API Key removed. Reverted to Sub-10ms Offline Engine.");
      window.AudioEngine.playClick();
    });
  }

  if (testApiKeyBtn) {
    testApiKeyBtn.addEventListener("click", async () => {
      const val = customApiKeyInput.value.trim();
      if (!val) {
        if (keyTestFeedback) {
          keyTestFeedback.style.display = "block";
          keyTestFeedback.style.background = "rgba(239, 68, 68, 0.15)";
          keyTestFeedback.style.border = "1px solid rgba(239, 68, 68, 0.3)";
          keyTestFeedback.style.color = "#f87171";
          keyTestFeedback.textContent = "Please enter an OpenAI API key (starts with 'sk-') to test.";
        }
        return;
      }

      if (keyTestFeedback) {
        keyTestFeedback.style.display = "block";
        keyTestFeedback.style.background = "rgba(56, 189, 248, 0.1)";
        keyTestFeedback.style.border = "1px solid rgba(56, 189, 248, 0.3)";
        keyTestFeedback.style.color = "#38bdf8";
        keyTestFeedback.textContent = "⏳ Testing API key with OpenAI servers...";
      }

      try {
        const res = await fetch("/api/test-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: val })
        });

        const data = await res.json();
        if (data.valid) {
          keyTestFeedback.style.background = "rgba(34, 197, 94, 0.15)";
          keyTestFeedback.style.border = "1px solid rgba(34, 197, 94, 0.3)";
          keyTestFeedback.style.color = "#4ade80";
          keyTestFeedback.textContent = data.message || "✓ Key is valid and active!";
        } else {
          keyTestFeedback.style.background = "rgba(239, 68, 68, 0.15)";
          keyTestFeedback.style.border = "1px solid rgba(239, 68, 68, 0.3)";
          keyTestFeedback.style.color = "#f87171";
          keyTestFeedback.textContent = "❌ " + (data.error || "Failed to validate key.");
        }
      } catch (err) {
        // Fallback: test directly via browser CORS
        try {
          const directRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${val}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: "ping" }],
              max_tokens: 2
            })
          });

          if (directRes.ok) {
            keyTestFeedback.style.background = "rgba(34, 197, 94, 0.15)";
            keyTestFeedback.style.border = "1px solid rgba(34, 197, 94, 0.3)";
            keyTestFeedback.style.color = "#4ade80";
            keyTestFeedback.textContent = "✓ Key is valid and active! Live OpenAI direct answers ready.";
          } else {
            const errJson = await directRes.json().catch(() => ({}));
            const msg = errJson?.error?.message || `HTTP ${directRes.status}`;
            keyTestFeedback.style.background = "rgba(239, 68, 68, 0.15)";
            keyTestFeedback.style.border = "1px solid rgba(239, 68, 68, 0.3)";
            keyTestFeedback.style.color = "#f87171";
            keyTestFeedback.textContent = "❌ OpenAI Error: " + msg;
          }
        } catch (directErr) {
          keyTestFeedback.style.background = "rgba(239, 68, 68, 0.15)";
          keyTestFeedback.style.border = "1px solid rgba(239, 68, 68, 0.3)";
          keyTestFeedback.style.color = "#f87171";
          keyTestFeedback.textContent = "❌ Network error testing key: " + directErr.message;
        }
      }
    });
  }

  // 3D Animation Frame & Multi-Theme System
  const THEME_DATA = {
    cyber_cyan: {
      bodyClass: "theme-cyber",
      status: "3D FRAME: CYBER CYAN ONLINE",
      name: "Cyber Cyan"
    },
    amber_hazard: {
      bodyClass: "theme-amber",
      status: "3D FRAME: AMBER HAZARD WARNING",
      name: "Amber Hazard"
    },
    quantum_violet: {
      bodyClass: "theme-quantum",
      status: "3D FRAME: QUANTUM VOID ACTIVE",
      name: "Quantum Void"
    },
    cleanroom_white: {
      bodyClass: "theme-cleanroom",
      status: "3D FRAME: CLEANROOM AERO CALIBRATED",
      name: "Cleanroom White"
    },
    matrix_emerald: {
      bodyClass: "theme-matrix",
      status: "3D FRAME: EMERALD MATRIX INITIALIZED",
      name: "Emerald Matrix"
    }
  };

  const THEME_KEYS = ["cyber_cyan", "amber_hazard", "quantum_violet", "cleanroom_white", "matrix_emerald"];
  let currentThemeIdx = 0;

  function applyTheme(themeKey) {
    const info = THEME_DATA[themeKey] || THEME_DATA["cyber_cyan"];
    currentThemeIdx = THEME_KEYS.indexOf(themeKey);
    if (currentThemeIdx === -1) currentThemeIdx = 0;

    // Trigger 3D Frame Theme Switching Glitch Animation
    const hudStage = document.getElementById("robot-hud-stage");
    if (hudStage) {
      hudStage.classList.remove("theme-transitioning");
      void hudStage.offsetWidth; // trigger reflow
      hudStage.classList.add("theme-transitioning");
      setTimeout(() => hudStage.classList.remove("theme-transitioning"), 700);
    }

    // Update Body CSS theme
    document.body.className = "";
    if (info.bodyClass) document.body.classList.add(info.bodyClass);

    // Update Active Pill indicator
    document.querySelectorAll(".theme-pill").forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.theme === themeKey);
    });

    // Update 3D Robot & Holographic Stage Materials
    if (robot) robot.setTheme(themeKey);

    // Update HUD Frame Telemetry Title
    const frameStatus = document.getElementById("frame-system-status");
    if (frameStatus) frameStatus.textContent = info.status;

    if (window.AudioEngine) window.AudioEngine.playHydraulicClick();
  }

  // Theme Switching Event Listeners
  const themePills = document.querySelectorAll(".theme-pill");
  themePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const themeKey = pill.dataset.theme;
      applyTheme(themeKey);
    });
  });

  // Telemetry sensor readout on HUD (Clean, no cursor tracer/reticle)
  const hudStage = document.getElementById("robot-hud-stage");
  const telemetryCoords = document.getElementById("frame-telemetry-coords");

  if (hudStage && telemetryCoords) {
    hudStage.addEventListener("mousemove", (e) => {
      const rect = hudStage.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const normX = ((x / rect.width) * 2 - 1).toFixed(2);
      const normY = (-((y / rect.height) * 2 - 1)).toFixed(2);
      telemetryCoords.textContent = `SENSOR: X: ${normX} | Y: ${normY} | Z: 4.20`;
    });
  }

  // Live 3D Frame FPS Telemetry Counter
  let lastFrameTime = performance.now();
  let frameCount = 0;
  const fpsDisplay = document.getElementById("frame-fps-counter");
  function updateFps() {
    frameCount++;
    const now = performance.now();
    if (now - lastFrameTime >= 1000) {
      if (fpsDisplay) fpsDisplay.textContent = Math.round((frameCount * 1000) / (now - lastFrameTime));
      frameCount = 0;
      lastFrameTime = now;
    }
    requestAnimationFrame(updateFps);
  }
  requestAnimationFrame(updateFps);

  // Robot Overdrive & Camera Controls
  const overdriveBtn = document.getElementById("overdrive-btn");
  if (overdriveBtn) {
    overdriveBtn.addEventListener("click", () => {
      if (robot) robot.triggerOverdrive(3500);
      window.AudioEngine.playServoHum();
    });
  }

  const camCommandBtn = document.getElementById("cam-command-btn");
  const camLegsBtn = document.getElementById("cam-legs-btn");
  const camOrbitBtn = document.getElementById("cam-orbit-btn");
  const toggleGridBtn = document.getElementById("toggle-grid-btn");
  const frameThemeBtn = document.getElementById("frame-theme-btn");

  if (camCommandBtn) {
    camCommandBtn.addEventListener("click", () => {
      if (robot) {
        if (robot.isOrbiting) robot.toggleOrbit();
        robot.setCameraView("command");
      }
      if (camOrbitBtn) {
        camOrbitBtn.classList.remove("active");
        camOrbitBtn.innerHTML = "🔄 ORBIT";
      }
      window.AudioEngine.playHydraulicClick();
    });
  }

  if (camLegsBtn) {
    camLegsBtn.addEventListener("click", () => {
      if (robot) {
        if (robot.isOrbiting) robot.toggleOrbit();
        robot.setCameraView("legs");
      }
      if (camOrbitBtn) {
        camOrbitBtn.classList.remove("active");
        camOrbitBtn.innerHTML = "🔄 ORBIT";
      }
      window.AudioEngine.playHydraulicClick();
    });
  }


  if (camOrbitBtn) {
    camOrbitBtn.addEventListener("click", () => {
      if (robot) {
        const isOrbiting = robot.toggleOrbit();
        camOrbitBtn.classList.toggle("active", isOrbiting);
        camOrbitBtn.innerHTML = isOrbiting ? "⏹️ STOP" : "🔄 ORBIT";
      }
      window.AudioEngine.playHydraulicClick();
    });
  }

  if (toggleGridBtn) {
    toggleGridBtn.addEventListener("click", () => {
      if (robot) {
        const isVisible = robot.toggleHoloStage();
        toggleGridBtn.classList.toggle("active", isVisible);
      }
      window.AudioEngine.playClick();
    });
  }

  if (frameThemeBtn) {
    frameThemeBtn.addEventListener("click", () => {
      const nextIdx = (currentThemeIdx + 1) % THEME_KEYS.length;
      applyTheme(THEME_KEYS[nextIdx]);
    });
  }

  const camResetBtn = document.getElementById("cam-reset-btn");
  if (camResetBtn) {
    camResetBtn.addEventListener("click", () => {
      if (robot) robot.resetCameraView();
      window.AudioEngine.playHydraulicClick();
    });
  }

  // Wardrobe / Clothes Outfit Selector
  const outfitPills = document.querySelectorAll(".outfit-pill");
  const syncOutfitUI = (outfitKey) => {
    outfitPills.forEach((p) => {
      if (p.dataset.outfit === outfitKey) p.classList.add("active");
      else p.classList.remove("active");
    });
    // Sync Quick Action Chips
    document.querySelectorAll(".quick-chip").forEach((chip) => {
      const act = chip.dataset.action;
      if (act === `outfit-${outfitKey}`) {
        chip.classList.add("active");
      } else if (act && act.startsWith("outfit-")) {
        chip.classList.remove("active");
      }
    });
  };

  outfitPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const outfit = pill.dataset.outfit;
      syncOutfitUI(outfit);
      if (robot) robot.setOutfit(outfit);
    });
  });

  // Robot Interactive Actions & Gestures
  const actionConfigs = [
    { id: "act-hifi-btn", action: "hifi" },
    { id: "act-hello-btn", action: "hello" },
    { id: "act-bye-btn", action: "bye" },
    { id: "act-kiss-btn", action: "kiss" },
    { id: "act-salute-btn", action: "salute" }
  ];

  actionConfigs.forEach((cfg) => {
    const btn = document.getElementById(cfg.id);
    if (btn) {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".action-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        if (robot) {
          robot.doAction(cfg.action, () => {
            btn.classList.remove("active");
          });
        }
      });
    }
  });

  // Quick Action Chips in Terminal Input Bar
  const quickChips = document.querySelectorAll(".quick-chip");
  quickChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const action = chip.dataset.action;
      if (!action) return;

      if (window.AudioEngine && window.AudioEngine.playClick) {
        window.AudioEngine.playClick();
      }

      if (action === "outfit-cyber") {
        syncOutfitUI("cyber");
        if (robot) robot.setOutfit("cyber");
      } else if (action === "outfit-suit") {
        syncOutfitUI("suit");
        if (robot) robot.setOutfit("suit");
      } else if (action === "gesture-wave") {
        if (robot) robot.doAction("hello");
      } else if (action === "gesture-salute") {
        if (robot) robot.doAction("salute");
      } else if (action === "voice-toggle") {
        if (voiceCmdBtn) voiceCmdBtn.click();
      } else if (action === "camera-orbit") {
        if (camOrbitBtn) camOrbitBtn.click();
        else if (robot) robot.toggleOrbit();
      }
    });
  });

  // Neural Waveform Equalizer UI integration
  const neuralWaveform = document.getElementById("neural-waveform");
  const waveformLabel = document.getElementById("waveform-label");
  const updateNeuralWaveform = (state, label) => {
    if (!neuralWaveform || !waveformLabel) return;
    if (state === "idle") {
      neuralWaveform.classList.remove("active");
      waveformLabel.textContent = label || "NEURAL AUDIO ENGINE: READY";
    } else {
      neuralWaveform.classList.add("active");
      waveformLabel.textContent = label || "NEURAL AUDIO ENGINE: ACTIVE";
    }
  };

  if (window.AudioEngine && window.AudioEngine.setWaveformListener) {
    window.AudioEngine.setWaveformListener((st, lbl) => {
      updateNeuralWaveform(st, lbl);
    });
  }

  const waveBtn = document.getElementById("wave-btn");
  if (waveBtn) {
    waveBtn.addEventListener("click", () => {
      if (robot) robot.doAction("hello");
    });
  }

  // Update UI stats
  updateStats();
  renderNotesList();

  // 4. Subject Selection
  subjectPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      subjectPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      state.subject = pill.dataset.subject || "General";
      window.AudioEngine.playClick();
      if (state.subject === "Communication Skills" && robot) {
        robot.doAction("hello");
        if (window.AudioEngine && window.AudioEngine.voiceEnabled) {
          window.AudioEngine.speak("Communication skills module engaged. Ready to master active listening, public speaking, and interviews!");
        }
      } else if (state.subject === "Vocabulary" && robot) {
        robot.doAction("hello");
        if (window.AudioEngine && window.AudioEngine.voiceEnabled) {
          window.AudioEngine.speak("Welcome to the Vocabulary and Lexicon Explorer! What word would you like to define or explore?");
        }
      } else if (robot) {
        robot.setExpression("happy");
        setTimeout(() => { if (robot) robot.setExpression("idle"); }, 800);
      }
    });
  });

  // 5. Quick Prompts
  quickPromptBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.dataset.prompt;
      if (prompt) {
        chatInput.value = prompt;
        sendMessage();
      }
    });
  });

  // 6. ELI5 Toggle
  if (eli5Toggle) {
    eli5Toggle.addEventListener("change", (e) => {
      state.mode = e.target.checked ? "eli5" : "standard";
      window.AudioEngine.playClick();
    });
  }

  // 7. Audio Controls
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener("click", () => {
      const enabled = window.AudioEngine.toggleSound();
      soundToggleBtn.classList.toggle("active", enabled);
      soundToggleBtn.title = enabled ? "Sound FX: ON" : "Sound FX: OFF";
      window.AudioEngine.playClick();
    });
  }

  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener("click", () => {
      const enabled = window.AudioEngine.toggleVoice();
      voiceToggleBtn.classList.toggle("active", enabled);
      voiceToggleBtn.title = enabled ? "Robot Voice: ON" : "Robot Voice: OFF";
      window.AudioEngine.playClick();
      if (enabled) {
        window.AudioEngine.speak("Voice output enabled! Ask me anything.", () => {
          if (robot) robot.setExpression("speaking");
        }, () => {
          if (robot) robot.setExpression("idle");
        });
      }
    });
  }

  // ── VOICE COMMAND OPERATION SYSTEM ──────────────────────────────────────────
  const voiceToast = document.getElementById("voice-toast");
  const voiceToastText = document.getElementById("voice-toast-text");
  const voiceCmdBtn = document.getElementById("voice-cmd-btn");
  let voiceToastTimer = null;
  let isVoiceCommandModeActive = false;

  const showVoiceToast = (message, mode = "listening", autoHideMs = 3500) => {
    if (!voiceToast || !voiceToastText) return;
    if (voiceToastTimer) clearTimeout(voiceToastTimer);

    voiceToastText.textContent = message;
    voiceToast.classList.remove("hidden", "listening", "executing");
    voiceToast.classList.add(mode);

    if (autoHideMs > 0) {
      voiceToastTimer = setTimeout(() => {
        if (isVoiceCommandModeActive && mode === "executing") {
          showVoiceToast("🎙️ Listening... Say 'Wear suit', 'Salute', 'Zoom face', 'Flex'...", "listening", 0);
        } else if (!isVoiceCommandModeActive) {
          voiceToast.classList.add("hidden");
        }
      }, autoHideMs);
    }
  };

  const matchAndExecuteVoiceCommand = (rawText) => {
    if (!rawText || typeof rawText !== "string") return null;
    const text = rawText.trim().toLowerCase();

    // 1. WARDROBE / DRESSES COMMANDS
    if (/\b(?:wear|put on|equip|change to|switch to|dress in|show)?\s*(?:the\s*)?(?:disciplined\s*)?(?:bespoke\s*)?(?:tailored\s*)?suit\b/i.test(text) ||
        /\b(?:formal|executive|officer)\s*(?:suit|dress)\b/i.test(text)) {
      if (robot) robot.setOutfit("suit");
      syncOutfitUI("suit");
      return {
        label: "Disciplined Suit",
        spoken: "Wearing disciplined bespoke tailored suit, shoulder epaulettes, and gold cufflinks.",
        feedback: "👔 Equipped: Disciplined Bespoke Suit"
      };
    }

    if (/\b(?:wear|put on|equip|change to|switch to|dress in|show)?\s*(?:the\s*)?(?:cyber|mecha|exoskeleton|armor)\b/i.test(text)) {
      if (robot) robot.setOutfit("cyber");
      syncOutfitUI("cyber");
      return {
        label: "Cyber Mecha",
        spoken: "Equipping titanium cyber exoskeleton armor and glowing neon conduits.",
        feedback: "⚡ Equipped: Cyber Mecha Exoskeleton"
      };
    }

    if (/\b(?:wear|put on|equip|change to|switch to|dress in|show)?\s*(?:the\s*)?(?:student|school|uniform|blazer)\b/i.test(text)) {
      if (robot) robot.setOutfit("student");
      syncOutfitUI("student");
      return {
        label: "Student Uniform",
        spoken: "Wearing student academic uniform blazer and crest.",
        feedback: "🎓 Equipped: Student Uniform"
      };
    }

    if (/\b(?:wear|put on|equip|change to|switch to|dress in|show)?\s*(?:the\s*)?(?:scientist|lab coat|researcher|doctor coat)\b/i.test(text)) {
      if (robot) robot.setOutfit("scientist");
      syncOutfitUI("scientist");
      return {
        label: "Scientist Lab Coat",
        spoken: "Donning research scientist lab coat and smart spectacles.",
        feedback: "🥼 Equipped: Scientist Lab Coat"
      };
    }

    if (/\b(?:wear|put on|equip|change to|switch to|dress in|show)?\s*(?:the\s*)?(?:hoodie|streetwear|jacket|casual)\b/i.test(text)) {
      if (robot) robot.setOutfit("hoodie");
      syncOutfitUI("hoodie");
      return {
        label: "Streetwear Hoodie",
        spoken: "Wearing urban streetwear hoodie and denim.",
        feedback: "🧥 Equipped: Streetwear Hoodie"
      };
    }

    if (/\b(?:wear|put on|equip|change to|switch to|dress in|show)?\s*(?:the\s*)?(?:astronaut|space\s*suit|lunar|cosmonaut)\b/i.test(text)) {
      if (robot) robot.setOutfit("astronaut");
      syncOutfitUI("astronaut");
      return {
        label: "Astronaut Suit",
        spoken: "Pressurizing cosmic lunar extravehicular space suit.",
        feedback: "🚀 Equipped: Pressurized Astronaut Suit"
      };
    }

    if (/\b(?:show|reveal|display|switch to)?\s*(?:pure\s*)?(?:muscular\s*)?physique\b/i.test(text) ||
        /\b(?:remove|take off)\s*(?:clothes|dresses|outfit|suit)\b/i.test(text) ||
        /\b(?:no|without)\s*(?:clothes|dresses)\b/i.test(text)) {
      if (robot) robot.setOutfit("physique");
      syncOutfitUI("physique");
      return {
        label: "Muscular Physique",
        spoken: "Displaying pure muscular physique and sculpted anatomy.",
        feedback: "💪 Equipped: Pure Muscular Physique"
      };
    }

    // 2. GESTURES & ACTIONS
    if (/\b(?:high[\s-]*five|hifi|give me five|clap hands?|slap hand)\b/i.test(text)) {
      if (robot) robot.hifi();
      return {
        label: "High-Five",
        spoken: "High five ready! Tap my hand or screen!",
        feedback: "✋ Action: High-Five"
      };
    }

    if (/\b(?:military\s+)?(?:salute|attention|at attention)\b/i.test(text)) {
      if (robot) robot.salute();
      return {
        label: "Military Salute",
        spoken: "Standing at attention! System fully operational!",
        feedback: "🫡 Action: Military Salute"
      };
    }

    if (/\b(?:blow\s+)?(?:kiss|flying kiss|send love)\b/i.test(text)) {
      if (robot) robot.kiss();
      return {
        label: "Flying Kiss",
        spoken: "Sending you love and positive energy!",
        feedback: "💋 Action: Flying Kiss & Hearts"
      };
    }

    if (/\b(?:say\s+)?(?:hello|wave|hi|hey|greet|greeting)\b/i.test(text)) {
      if (robot) robot.hello();
      return {
        label: "Wave Hello",
        spoken: "Hello there! Wonderful to see you!",
        feedback: "👋 Action: Friendly Wave"
      };
    }

    if (/\b(?:say\s+)?(?:bye|goodbye|farewell|see you)\b/i.test(text)) {
      if (robot) robot.bye();
      return {
        label: "Farewell Bye",
        spoken: "Goodbye! Have an extraordinary session!",
        feedback: "👋 Action: Farewell Wave"
      };
    }

    if (/\b(?:nod|nod head|agree)\b/i.test(text)) {
      if (robot) robot.nod();
      return {
        label: "Nod Head",
        spoken: "Affirmative!",
        feedback: "✅ Action: Affirmative Nod"
      };
    }

    if (/\b(?:shake head|disagree)\b/i.test(text)) {
      if (robot) robot.shakeHead();
      return {
        label: "Shake Head",
        spoken: "Understood, negative.",
        feedback: "❌ Action: Shake Head"
      };
    }

    if (/\b(?:celebrate|victory|cheer|congratulate)\b/i.test(text)) {
      if (robot) robot.celebrate();
      return {
        label: "Celebrate Victory",
        spoken: "Outstanding victory! Goal achieved!",
        feedback: "🎉 Action: Celebrate Victory"
      };
    }

    // 3. CAMERA & PERSPECTIVES
    if (/\b(?:look at|focus on|show|view)\s*(?:the\s*)?(?:legs|boots|feet)\b/i.test(text) ||
        /\blegs\s*view\b/i.test(text)) {
      if (robot) {
        if (robot.isOrbiting) robot.toggleOrbit();
        robot.setCameraView("legs");
      }
      return {
        label: "Inspect Legs",
        spoken: "Inspecting articulated mechanical legs, kneecaps, and boots.",
        feedback: "🦵 Camera: Legs & Boots View"
      };
    }

    if (/\b(?:full\s*(?:body|view|chassis)|zoom out|reset camera|default view|command view)\b/i.test(text)) {
      if (robot) {
        if (robot.isOrbiting) robot.toggleOrbit();
        robot.setCameraView("command");
      }
      return {
        label: "Full Body View",
        spoken: "Framing full athletic humanoid body and two legs.",
        feedback: "🎥 Camera: Full Body Chassis"
      };
    }

    if (/\b(?:rotate|orbit|spin|360|turn around)\b/i.test(text)) {
      let isOrbiting = false;
      if (robot) isOrbiting = robot.toggleOrbit();
      const orbitBtn = document.getElementById("cam-orbit-btn");
      if (orbitBtn) {
        if (isOrbiting) {
          orbitBtn.classList.add("active");
          orbitBtn.innerHTML = "⏹️ STOP ORBIT";
        } else {
          orbitBtn.classList.remove("active");
          orbitBtn.innerHTML = "🔄 ORBIT";
        }
      }
      return {
        label: "360 Orbit",
        spoken: isOrbiting ? "Engaging 360-degree cinematic orbit." : "Stopping orbit rotation.",
        feedback: isOrbiting ? "🔄 360° Orbit: ACTIVE" : "🔄 360° Orbit: STOPPED"
      };
    }

    // 5. EXPRESSIONS
    if (/\b(?:smile|be happy|look happy)\b/i.test(text)) {
      if (robot) robot.setExpression("happy");
      return { label: "Happy Expression", spoken: "Warm charismatic smile activated.", feedback: "😊 Expression: Happy" };
    }
    if (/\b(?:think|ponder|contemplate)\b/i.test(text)) {
      if (robot) robot.setExpression("thinking");
      return { label: "Thinking Expression", spoken: "Deep analytical thinking mode.", feedback: "🤔 Expression: Thinking" };
    }
    if (/\b(?:surprise|look surprised|gasp)\b/i.test(text)) {
      if (robot) robot.setExpression("surprised");
      return { label: "Surprised Expression", spoken: "Inquisitive surprised expression.", feedback: "😮 Expression: Surprised" };
    }
    if (/\b(?:neutral|calm|relax face|idle)\b/i.test(text)) {
      if (robot) robot.setExpression("idle");
      return { label: "Neutral Expression", spoken: "Resting natural expression.", feedback: "😐 Expression: Neutral" };
    }

    // 6. THEMES & STAGE
    if (/\b(?:next theme|change theme|switch theme)\b/i.test(text)) {
      const btn = document.getElementById("frame-theme-btn");
      if (btn) btn.click();
      return { label: "Next Theme", spoken: "Color theme switched.", feedback: "🎨 Theme: Cycled" };
    }

    if (/\b(?:overdrive|turbo|supercharge)\b/i.test(text)) {
      if (robot) robot.triggerOverdrive(3500);
      return { label: "Overdrive", spoken: "Overdrive mode supercharged!", feedback: "⚡ System: OVERDRIVE ACTIVATED" };
    }

    if (/\b(?:toggle stage|platform|holo)\b/i.test(text)) {
      if (robot) robot.toggleHoloStage();
      return { label: "Toggle Platform", spoken: "Hologram stage toggled.", feedback: "🛸 Stage: Toggled" };
    }

    // 7. AXIOM IDENTITY & WAKE CALLS
    if (/\b(?:who are you|what is your name|tell me about yourself|who created you|who made you)\b/i.test(text)) {
      if (robot) {
        robot.setExpression("happy");
        robot.doAction("hello");
      }
      return {
        label: "Axiom Identity",
        spoken: "I am Axiom, your voice-controlled 3D AI companion and study assistant created by Abhijeeth! Say Hey Axiom to command me anytime.",
        feedback: "🤖 Identity: AXIOM-AI"
      };
    }

    return null;
  };

  const WAKE_WORD_MATCH = /^(?:(?:hey|hi|hello|ok|okay)\s+)?(?:axiom|axion|a[\s-]?xiom)\b[,:]?\s*/i;
  const IS_STANDALONE_WAKE = /^(?:(?:hey|hi|hello|ok|okay)\s+)?(?:axiom|axion|a[\s-]?xiom)[!?,.]*$/i;

  const handleVoiceInput = (rawTranscript, isFromVoiceCmdMode = false) => {
    if (!rawTranscript) return;
    const transcript = rawTranscript.trim();

    // 1. Check if user called the Wake Word ("Hey Axiom")
    const hasWakeWord = WAKE_WORD_MATCH.test(transcript);
    const isStandaloneWake = IS_STANDALONE_WAKE.test(transcript);

    if (isStandaloneWake) {
      if (window.AudioEngine.playAxiomWakeChime) {
        window.AudioEngine.playAxiomWakeChime();
      } else if (window.AudioEngine.playVoiceCommandChime) {
        window.AudioEngine.playVoiceCommandChime();
      }

      if (robot) {
        robot.setExpression("happy");
        robot.doAction("hello");
      }

      showVoiceToast("✨ AXIOM AWAKE: Listening for your command or query...", "listening", 3500);

      const greetings = [
        "Yes, I am Axiom! I am listening. How can I help you?",
        "Hello! Axiom online. What would you like to explore or solve?",
        "Axiom at your service! Ready for your question or command."
      ];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];

      if (window.AudioEngine.voiceEnabled) {
        window.AudioEngine.speak(greeting, () => {
          if (robot) robot.setExpression("speaking");
        }, () => {
          if (robot) robot.setExpression("idle");
        });
      }

      appendMessage("user", `🎙️ "${transcript}"`);
      appendMessage("bot", `<div class="voice-cmd-confirmation"><span class="voice-cmd-pill">⚡ WAKE WORD: "HEY AXIOM" DETECTED</span><p>${greeting}</p></div>`);
      return true;
    }

    // 2. Strip wake word prefix if spoken as a compound phrase:
    // e.g. "Hey Axiom, wear suit" -> "wear suit"
    // e.g. "Hey Axiom, explain quantum physics" -> "explain quantum physics"
    let cleanPrompt = transcript;
    if (hasWakeWord) {
      cleanPrompt = transcript.replace(WAKE_WORD_MATCH, "").trim();
    }

    if (!cleanPrompt) {
      return true;
    }

    // Check if the prompt is a direct robot command
    const cmd = matchAndExecuteVoiceCommand(cleanPrompt);

    if (cmd) {
      if (hasWakeWord && window.AudioEngine.playAxiomWakeChime) {
        window.AudioEngine.playAxiomWakeChime();
      } else if (window.AudioEngine.playVoiceCommandChime) {
        window.AudioEngine.playVoiceCommandChime();
      }

      showVoiceToast(`✨ ${cmd.feedback}`, "executing", 3200);

      const spokenResponse = hasWakeWord ? `Axiom executing: ${cmd.spoken}` : cmd.spoken;

      if (window.AudioEngine.voiceEnabled) {
        window.AudioEngine.speak(spokenResponse, () => {
          if (robot) robot.setExpression("speaking");
        }, () => {
          if (robot) robot.setExpression("idle");
        });
      }

      appendMessage("user", `🎙️ "${transcript}"`);
      appendMessage("bot", `<div class="voice-cmd-confirmation"><span class="voice-cmd-pill">${cmd.feedback}</span><p>${spokenResponse}</p></div>`);
      return true;
    }

    // Not a direct robot command: forward as conversational/academic inquiry
    if (hasWakeWord && window.AudioEngine.playAxiomWakeChime) {
      window.AudioEngine.playAxiomWakeChime();
    }
    showVoiceToast(`🔍 Axiom Query: "${cleanPrompt}"`, "executing", 2500);
    chatInput.value = cleanPrompt;
    sendMessage();
    return false;
  };

  // Voice Assistant Access & Two-Way Hands-Free Engine
  const voiceAssistantMasterBtn = document.getElementById("voice-assistant-master-btn");
  const voiceModal = document.getElementById("voice-modal");
  const closeVoiceModalBtn = document.getElementById("close-voice-modal-btn");
  const cancelVoiceModalBtn = document.getElementById("cancel-voice-modal-btn");
  const grantMicPermissionBtn = document.getElementById("grant-mic-permission-btn");
  const voicePermissionFeedback = document.getElementById("voice-permission-feedback");

  const syncVoiceAssistantUI = (isActive) => {
    isVoiceCommandModeActive = isActive;
    if (isActive) {
      if (voiceAssistantMasterBtn) {
        voiceAssistantMasterBtn.classList.add("active");
        voiceAssistantMasterBtn.innerHTML = "🟢 ASSISTANT ACTIVE";
      }
      if (voiceCmdBtn) {
        voiceCmdBtn.classList.add("listening");
        voiceCmdBtn.innerHTML = "🔴 LISTENING...";
      }
      if (micBtn) {
        micBtn.classList.add("listening");
      }
      document.querySelectorAll('.quick-chip[data-action="voice-toggle"]').forEach(c => c.classList.add("active"));
      if (voiceToggleBtn) {
        voiceToggleBtn.classList.add("active");
        voiceToggleBtn.textContent = "🗣️ VOICE: ON";
      }
      showVoiceToast("🟢 Voice Assistant Online: Listening... Speak naturally!", "listening", 0);
    } else {
      if (voiceAssistantMasterBtn) {
        voiceAssistantMasterBtn.classList.remove("active");
        voiceAssistantMasterBtn.innerHTML = "🎙️ VOICE ASSISTANT";
      }
      if (voiceCmdBtn) {
        voiceCmdBtn.classList.remove("listening");
        voiceCmdBtn.innerHTML = "🎙️ VOICE CMD";
      }
      if (micBtn) {
        micBtn.classList.remove("listening");
      }
      document.querySelectorAll('.quick-chip[data-action="voice-toggle"]').forEach(c => c.classList.remove("active"));
      if (voiceToast) voiceToast.classList.add("hidden");
    }
  };

  async function activateVoiceAssistant(forceState = null) {
    const shouldActivate = (forceState !== null) ? forceState : !isVoiceCommandModeActive;

    if (!shouldActivate) {
      // Deactivate Voice Assistant
      syncVoiceAssistantUI(false);
      window.AudioEngine.stopListening();
      showVoiceToast("Voice Assistant deactivated.", "listening", 1800);
      return;
    }

    // 1. Explicitly request microphone access from browser
    showVoiceToast("🎙️ Requesting microphone permission...", "listening", 0);
    const permResult = await window.AudioEngine.requestMicrophonePermission();

    if (!permResult.ok) {
      syncVoiceAssistantUI(false);
      showVoiceToast("⚠️ Microphone access needed. Opening permission setup...", "executing", 2800);
      if (voiceModal) {
        voiceModal.classList.add("active");
        if (voicePermissionFeedback) {
          voicePermissionFeedback.style.display = "block";
          voicePermissionFeedback.style.background = "rgba(239, 68, 68, 0.15)";
          voicePermissionFeedback.style.border = "1px solid #ef4444";
          voicePermissionFeedback.style.color = "#fca5a5";
          voicePermissionFeedback.innerHTML = `⚠️ <strong>Microphone Access Needed (${permResult.error})</strong><br>Please click <strong>"Allow"</strong> in your browser popup, or enable microphone permissions in the URL bar settings.`;
        }
      }
      return;
    }

    // 2. Microphone access granted!
    if (voiceModal) voiceModal.classList.remove("active");
    window.AudioEngine.setVoiceEnabled(true);
    syncVoiceAssistantUI(true);

    if (window.AudioEngine.playVoiceCommandChime) {
      window.AudioEngine.playVoiceCommandChime();
    }

    // Speak welcome confirmation
    window.AudioEngine.speak(
      "Voice assistant access granted! I can hear you clearly. Ask me any question or tell me what to do!",
      () => { if (robot) robot.setExpression("speaking"); },
      () => { if (robot) robot.setExpression("idle"); }
    );

    // 3. Start Speech Recognition Engine (Continuous Hands-Free)
    window.AudioEngine.startListening(
      (transcript) => {
        handleVoiceInput(transcript, true);
      },
      () => {
        if (!isVoiceCommandModeActive) {
          syncVoiceAssistantUI(false);
        }
      },
      (err) => {
        console.warn("Voice assistant recognition error:", err);
        if (err === "not-allowed" || err === "permission-denied") {
          syncVoiceAssistantUI(false);
          if (voiceModal) {
            voiceModal.classList.add("active");
            if (voicePermissionFeedback) {
              voicePermissionFeedback.style.display = "block";
              voicePermissionFeedback.innerHTML = `⚠️ <strong>Microphone Access Blocked</strong><br>Please click the 🔒 icon next to localhost in the address bar and set Microphone to "Allow".`;
            }
          }
        }
      },
      true // continuous hands-free listening
    );
  }

  // Master Voice Assistant Button Listener
  if (voiceAssistantMasterBtn) {
    voiceAssistantMasterBtn.addEventListener("click", () => activateVoiceAssistant());
  }

  // Voice Assistant Modal Listeners
  if (closeVoiceModalBtn) {
    closeVoiceModalBtn.addEventListener("click", () => {
      if (voiceModal) voiceModal.classList.remove("active");
    });
  }

  if (cancelVoiceModalBtn) {
    cancelVoiceModalBtn.addEventListener("click", () => {
      if (voiceModal) voiceModal.classList.remove("active");
    });
  }

  if (grantMicPermissionBtn) {
    grantMicPermissionBtn.addEventListener("click", async () => {
      if (voiceModal) voiceModal.classList.remove("active");
      await activateVoiceAssistant(true);
    });
  }

  if (voiceModal) {
    voiceModal.addEventListener("click", (e) => {
      if (e.target === voiceModal) voiceModal.classList.remove("active");
    });
  }

  // Bottom Bar Voice CMD Button
  if (voiceCmdBtn) {
    voiceCmdBtn.addEventListener("click", () => activateVoiceAssistant());
  }

  // 8. Microphone Input (Quick single-shot speech input in chat box)
  if (micBtn) {
    micBtn.addEventListener("click", () => activateVoiceAssistant());
  }

  // 9. Send Message on Enter or Click
  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 10. Message Processing Pipeline (Dual Engine: Instant Academic Core + FastAPI SSE)
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";
    window.AudioEngine.playClick();

    // Render User Message
    appendMessage("user", text);

    // Check if message is a direct voice / text robot operation command
    const directCmd = matchAndExecuteVoiceCommand(text);
    if (directCmd) {
      if (window.AudioEngine.playVoiceCommandChime) {
        window.AudioEngine.playVoiceCommandChime();
      }
      showVoiceToast(`✨ ${directCmd.feedback}`, "executing", 3200);
      if (window.AudioEngine.voiceEnabled) {
        window.AudioEngine.speak(directCmd.spoken, () => {
          if (robot) robot.setExpression("speaking");
        }, () => {
          if (robot) robot.setExpression("idle");
        });
      }
      appendMessage("bot", `<div class="voice-cmd-confirmation"><span class="voice-cmd-pill">${directCmd.feedback}</span><p>${directCmd.spoken}</p></div>`);
      return;
    }

    // Robot Reacts: Thinking & Overdrive State
    if (robot) {
      robot.setExpression("thinking");
      robot.triggerOverdrive(2200);
    }
    updateNeuralWaveform("thinking", "NEURAL CORE: INFERENCE ACTIVE...");
    window.AudioEngine.playThinking();

    const startTime = performance.now();

    // Check if live AI is configured & preferred
    const hasLiveKey = !!customApiKey || serverHasOpenAI;
    const shouldBypassLocal = hasLiveKey && preferLiveAI;

    // STEP A: Check Sub-millisecond Client Academic Knowledge Base first (unless Live AI is preferred)
    const localMatch = !shouldBypassLocal && window.findAcademicTopic ? window.findAcademicTopic(text) : null;

    if (localMatch) {
      const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
      updateLatencyBadge(elapsed, "NOVA-AI v2.0 Academic Engine (Sub-10ms Verified)");

      // Format response based on mode
      const formattedHtml = formatAcademicTopic(localMatch, state.mode);
      
      // Simulate ultra-smooth typing effect (under 40ms total)
      const botMsgElement = appendMessage("bot", "", localMatch);
      streamTextToElement(botMsgElement, formattedHtml, () => {
        if (robot) robot.setExpression("speaking");
        window.AudioEngine.playClick();
        
        // Voice reading if enabled
        if (window.AudioEngine.voiceEnabled) {
          window.AudioEngine.speak(localMatch.core, () => {
            if (robot) robot.setExpression("speaking");
          }, () => {
            if (robot) {
              robot.setExpression("happy");
              setTimeout(() => { if (robot) robot.setExpression("idle"); }, 1200);
            }
          });
        } else {
          updateNeuralWaveform("idle", "NEURAL AUDIO ENGINE: READY");
          if (robot) {
            robot.setExpression("happy");
            setTimeout(() => { if (robot) robot.setExpression("idle"); }, 1200);
          }
        }

        // Render any math equations with KaTeX
        MathGrapher.renderMath(botMsgElement);

        // Render Graph if topic has function curve
        if (localMatch.graph) {
          const graphCanvas = botMsgElement.querySelector(".topic-graph-canvas");
          if (graphCanvas) {
            MathGrapher.plotFunction(graphCanvas, localMatch.graph.fn, {
              label: localMatch.graph.label,
              color: localMatch.graph.color
            });
          }
        }
      });

      addXP(15);
      return;
    }

    // STEP B: Fall back to Backend FastAPI streaming API
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          subject: state.subject,
          mode: state.mode,
          api_key: customApiKey,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const botMsgElement = appendMessage("bot", "");
      const contentDiv = botMsgElement.querySelector(".message-content");
      let fullText = "";

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let firstChunkReceived = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (!firstChunkReceived && data.latency_ms) {
                firstChunkReceived = true;
                updateLatencyBadge(data.latency_ms, data.source || "NOVA-AI v2.0 Turbo API");
              }

              if (data.chunk) {
                fullText += data.chunk;
                contentDiv.innerHTML = markedParse(fullText);
                MathGrapher.renderMath(contentDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                if (robot && robot.expression !== "speaking") {
                  robot.setExpression("speaking");
                }
              }

              if (data.done) {
                updateNeuralWaveform("idle", "NEURAL AUDIO ENGINE: READY");
                if (robot) {
                  robot.setExpression("happy");
                  setTimeout(() => { if (robot) robot.setExpression("idle"); }, 1500);
                }
              }
            } catch (err) {
              // ignore parse errors on partial chunks
            }
          }
        }
      }

      updateNeuralWaveform("idle", "NEURAL AUDIO ENGINE: READY");
      addXP(10);
    } catch (err) {
      console.warn("Backend API not reachable, evaluating standalone fallback options:", err);

      // If user configured their custom OpenAI API key, stream directly from OpenAI via CORS!
      if (customApiKey && customApiKey.startsWith("sk-")) {
        try {
          const directSuccess = await streamDirectFromOpenAI(text, customApiKey, state.subject, state.mode, startTime);
          if (directSuccess) {
            updateNeuralWaveform("idle", "NEURAL AUDIO ENGINE: READY");
            addXP(10);
            return;
          }
        } catch (openaiErr) {
          console.warn("Direct OpenAI call failed:", openaiErr);
        }
      }

      // Autonomous Fallback when running standalone without python backend or when offline
      const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
      updateLatencyBadge(elapsed, "NOVA-AI v2.0 Autonomous Core");

      // Check if window.findAcademicTopic has an exact analytical, factual, or curriculum answer
      const offlineTopic = window.findAcademicTopic ? window.findAcademicTopic(text) : null;
      if (offlineTopic) {
        const formattedHtml = formatAcademicTopic(offlineTopic, state.mode);
        const botMsgElement = appendMessage("bot", "", offlineTopic);
        streamTextToElement(botMsgElement, formattedHtml, () => {
          if (robot) robot.setExpression("idle");
          updateNeuralWaveform("idle", "NEURAL AUDIO ENGINE: READY");
          window.AudioEngine.playClick();
          MathGrapher.renderMath(botMsgElement);
          if (offlineTopic.graph) {
            const graphCanvas = botMsgElement.querySelector(".topic-graph-canvas");
            if (graphCanvas) {
              MathGrapher.plotFunction(graphCanvas, offlineTopic.graph.fn, {
                label: offlineTopic.graph.label,
                color: offlineTopic.graph.color
              });
            }
          }
        });
        addXP(10);
        return;
      }

      let noticeHeader = "";
      if (customApiKey) {
        noticeHeader = `> ⚠️ **Notice**: Local Python server is offline and direct OpenAI request encountered a quota/network issue. Falling back to the Autonomous Offline Reasoning Engine.\n\n`;
      }

      // Infer subject domain dynamically
      const tLower = text.toLowerCase();
      let inferredSubject = state.subject || "General Academic";
      if (inferredSubject === "General") {
        if (/math|number|equation|solve|triangle|angle|fraction|root|algebra|calculus|derivative|integral/.test(tLower)) inferredSubject = "Mathematics";
        else if (/force|motion|gravity|energy|velocity|atom|light|wave|electric|ohm|volt|amp|work/.test(tLower)) inferredSubject = "Physics";
        else if (/code|program|python|algorithm|loop|function|array|data|binary|tcp|udp/.test(tLower)) inferredSubject = "Computer Science";
        else if (/cell|dna|organ|plant|animal|gene|protein|body|photosynthesis|mitochondria/.test(tLower)) inferredSubject = "Biology";
        else if (/reaction|acid|base|molecule|bond|periodic|element|water|ph\b/.test(tLower)) inferredSubject = "Chemistry";
        else if (/capital|country|river|mountain|continent|ocean|city|world/.test(tLower)) inferredSubject = "Geography";
        else if (/history|war|century|discovered|invented|president|empire/.test(tLower)) inferredSubject = "History";
      }

      const fallbackMsg = `${noticeHeader}### 📚 Academic Analysis: ${escapeHtml(text)}

#### 📌 Core Analysis in ${inferredSubject}
In **${inferredSubject}**, answering **"${escapeHtml(text)}"** requires evaluating governing physical laws, defining formulas, and exact boundary conditions.

#### 🔬 Step-by-Step Analytical Breakdown
1. **Identify First Principles**: Determine the governing physical or mathematical model applicable to this query.
2. **Apply Domain Rules**: Formulate the relevant mathematical equations or conceptual relationships.
3. **Validate Units & Boundary Conditions**: Ensure that all variables have consistent units and adhere to conservation laws.

#### 💡 Student Mental Model
> Treat academic problem-solving like an engineering blueprint: master the foundational premise first, and the calculations follow naturally.

#### ⚠️ High-Frequency Exam Trap
Always double check starting assumptions, sign conventions, and ensure units are converted to standard SI before executing calculations!`;

      const botMsgElement = appendMessage("bot", "");
      streamTextToElement(botMsgElement, markedParse(fallbackMsg), () => {
        if (robot) robot.setExpression("idle");
        updateNeuralWaveform("idle", "NEURAL AUDIO ENGINE: READY");
        MathGrapher.renderMath(botMsgElement);
      });
      addXP(10);
    }
  }

  // Direct client-side streaming from OpenAI API (CORS supported)
  async function streamDirectFromOpenAI(userMsg, key, subject, mode, startTime) {
    const sysPrompt = `You are NOVA-AI v2.0, an ultra-fast, next-gen cybernetic AI study companion created by Abhijeeth. Subject: ${subject}. Mode: ${mode}. Format answers with: 1. Core summary, 2. Step-by-step breakdown with KaTeX math ($...$), 3. Intuitive analogy, 4. Exam pitfall.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: userMsg }
        ],
        stream: true,
        max_tokens: 900,
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `HTTP ${res.status}`;
      throw new Error(errMsg);
    }

    const botMsgElement = appendMessage("bot", "");
    const contentDiv = botMsgElement.querySelector(".message-content");
    let fullText = "";
    let firstChunkReceived = false;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunkStr = decoder.decode(value);
      const lines = chunkStr.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ") && line.trim() !== "data: [DONE]") {
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices[0]?.delta?.content || "";
            if (delta) {
              if (!firstChunkReceived) {
                firstChunkReceived = true;
                const elapsed = Math.round((performance.now() - startTime) * 10) / 10;
                updateLatencyBadge(elapsed, "OpenAI Direct (GPT-4o Mini)");
              }
              fullText += delta;
              contentDiv.innerHTML = markedParse(fullText);
              MathGrapher.renderMath(contentDiv);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          } catch (e) {}
        }
      }
    }

    if (robot) robot.setExpression("idle");
    return true;
  }

  // 11. Format Academic Topic to Simplest Form (Accurate & Clean)
  function formatAcademicTopic(topic, mode) {
    const title = topic.title || "Academic Concept";
    const core = topic.core || "";

    // 1. Clean, punchy bullet points (top 3)
    let bulletsHtml = "";
    if (topic.steps && topic.steps.length > 0) {
      const cleanSteps = topic.steps.slice(0, 3).map((s) => {
        const cleaned = s.replace(/^\d+\.\s*/, "").trim();
        return `<li>${markedInline(cleaned)}</li>`;
      });
      bulletsHtml = `<ul class="simple-topic-bullets">${cleanSteps.join("")}</ul>`;
    }

    // 2. Single Key Formula
    let formulaHtml = "";
    if (topic.formulas && topic.formulas.length > 0) {
      formulaHtml = `
        <div class="simple-formula-row">
          <span class="formula-label">Key Formula:</span>
          <div class="katex-display">$$ ${topic.formulas[0]} $$</div>
        </div>
      `;
    }

    // 3. Real-time Graph if available
    let graphHtml = "";
    if (topic.graph) {
      graphHtml = `
        <div class="graph-block">
          <canvas class="topic-graph-canvas" width="480" height="180"></canvas>
        </div>
      `;
    }

    // 4. Single-line Simple Analogy
    const analogyHtml = topic.analogy ? `
      <div class="simple-analogy-row">
        💡 <strong>Simple Analogy:</strong> ${markedInline(topic.analogy)}
      </div>` : "";

    const quizBtnHtml = topic.quiz ? `<button class="btn-sm quiz-trigger-btn" data-topic-id="${topic.id}">🎯 Test Knowledge</button>` : "";

    return `
      <div class="simple-topic-card">
        <h3 class="simple-title">${title}</h3>
        <p class="simple-core">${markedInline(core)}</p>
        ${bulletsHtml}
        ${formulaHtml}
        ${graphHtml}
        ${analogyHtml}
        <div class="action-buttons">
          ${quizBtnHtml}
          <button class="btn-sm save-note-btn" data-title="${escapeHtml(title)}">📌 Save Note</button>
        </div>
      </div>
    `;
  }

  // 12. Append Chat Message to UI
  function appendMessage(sender, text, rawTopic = null) {
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender}-message`;

    if (sender === "user") {
      msgDiv.innerHTML = `
        <div class="avatar user-avatar">👨‍🎓</div>
        <div class="message-bubble">
          <div class="sender-name">You (Student)</div>
          <div class="message-content">${escapeHtml(text)}</div>
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="avatar bot-avatar">🤖</div>
        <div class="message-bubble">
          <div class="sender-header">
            <span class="sender-name">NOVA-AI v2.0</span>
            <span class="model-tag">Gen-2 Quantum AI Core</span>
          </div>
          <div class="message-content">${text}</div>
        </div>
      `;

      // Delegate Quiz Trigger Button
      msgDiv.addEventListener("click", (e) => {
        if (e.target.classList.contains("quiz-trigger-btn")) {
          const topicId = e.target.dataset.topicId;
          const topic = window.ACADEMIC_TOPICS.find((t) => t.id === topicId) || rawTopic;
          if (topic && topic.quiz) {
            openQuizModal(topic);
          }
        }

        if (e.target.classList.contains("save-note-btn")) {
          const title = e.target.dataset.title;
          saveNote(title, msgDiv.querySelector(".message-content").innerHTML);
          e.target.textContent = "✓ Saved to Notes!";
          e.target.disabled = true;
        }
      });
    }

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv;
  }

  // 13. Fast Smooth Stream Simulation
  function streamTextToElement(container, htmlContent, onDone) {
    const contentDiv = container.querySelector(".message-content");
    contentDiv.innerHTML = htmlContent;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (onDone) onDone();
  }

  // 14. Quiz Modal Controller
  function openQuizModal(topic) {
    state.currentQuiz = topic.quiz;
    quizContainer.innerHTML = `
      <div class="quiz-topic-title">📚 Active Recall Challenge: ${topic.title}</div>
      <div class="quiz-question">${topic.quiz.question}</div>
      <div class="quiz-options">
        ${topic.quiz.options
          .map(
            (opt, idx) => `
          <button class="quiz-opt-btn" data-index="${idx}">
            <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
            <span class="opt-text">${escapeHtml(opt)}</span>
          </button>
        `
          )
          .join("")}
      </div>
      <div class="quiz-feedback" style="display: none;"></div>
    `;

    const optButtons = quizContainer.querySelectorAll(".quiz-opt-btn");
    const feedbackDiv = quizContainer.querySelector(".quiz-feedback");

    optButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const selectedIdx = parseInt(btn.dataset.index);
        optButtons.forEach((b) => (b.disabled = true));

        if (selectedIdx === topic.quiz.correct) {
          btn.classList.add("correct");
          feedbackDiv.className = "quiz-feedback correct-feedback";
          feedbackDiv.innerHTML = `🎉 <strong>Spot on! (+25 XP)</strong><br>${topic.quiz.explanation}`;
          feedbackDiv.style.display = "block";
          window.AudioEngine.playQuizSuccess();
          if (robot) robot.setExpression("happy");
          addXP(25);
        } else {
          btn.classList.add("incorrect");
          optButtons[topic.quiz.correct].classList.add("correct");
          feedbackDiv.className = "quiz-feedback incorrect-feedback";
          feedbackDiv.innerHTML = `❌ <strong>Not quite:</strong><br>${topic.quiz.explanation}`;
          feedbackDiv.style.display = "block";
          window.AudioEngine.playQuizError();
          if (robot) robot.setExpression("surprised");
        }
      });
    });

    quizModal.classList.add("open");
  }

  if (closeQuizBtn) {
    closeQuizBtn.addEventListener("click", () => {
      quizModal.classList.remove("open");
      if (robot) robot.setExpression("idle");
    });
  }

  // 15. Notes Drawer Controller
  function saveNote(title, content) {
    state.savedNotes.push({
      id: Date.now(),
      title: title || "Study Note",
      subject: state.subject,
      date: new Date().toLocaleDateString(),
      content: content
    });
    localStorage.setItem("nova_notes", JSON.stringify(state.savedNotes));
    renderNotesList();
    window.AudioEngine.playClick();
  }

  function renderNotesList() {
    if (!notesList) return;
    if (state.savedNotes.length === 0) {
      notesList.innerHTML = `<div class="empty-notes">No study notes saved yet. Click "Save to Notes" on any explanation!</div>`;
      return;
    }

    notesList.innerHTML = state.savedNotes
      .map(
        (note) => `
      <div class="note-card">
        <div class="note-card-header">
          <strong>${escapeHtml(note.title)}</strong>
          <span class="note-date">${note.date}</span>
        </div>
        <div class="note-card-body">${note.content}</div>
        <button class="delete-note-btn btn-xs" data-id="${note.id}">Remove</button>
      </div>
    `
      )
      .join("");

    notesList.querySelectorAll(".delete-note-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        state.savedNotes = state.savedNotes.filter((n) => n.id !== id);
        localStorage.setItem("nova_notes", JSON.stringify(state.savedNotes));
        renderNotesList();
      });
    });

    MathGrapher.renderMath(notesList);
  }

  if (notesToggleBtn) {
    notesToggleBtn.addEventListener("click", () => {
      notesDrawer.classList.add("open");
      window.AudioEngine.playClick();
    });
  }

  if (closeNotesBtn) {
    closeNotesBtn.addEventListener("click", () => {
      notesDrawer.classList.remove("open");
    });
  }

  // 16. Maker Notes Modal
  if (makerBtn) {
    makerBtn.addEventListener("click", () => {
      makerModal.classList.add("open");
      window.AudioEngine.playClick();
    });
  }

  if (closeMakerBtn) {
    closeMakerBtn.addEventListener("click", () => {
      makerModal.classList.remove("open");
    });
  }

  // 16B. Educational Resources Hub Modal
  const resourcesModal = document.getElementById("resources-modal");
  const eduResourcesBtn = document.getElementById("edu-resources-btn");
  const closeResourcesBtn = document.getElementById("close-resources-btn");

  if (eduResourcesBtn && resourcesModal) {
    eduResourcesBtn.addEventListener("click", () => {
      resourcesModal.classList.add("open");
      window.AudioEngine.playClick();
      if (window.AudioEngine && window.AudioEngine.voiceEnabled) {
        window.AudioEngine.speak("Opening Educational Resources Library! Select any topic cheat sheet to study.");
      }
    });
  }

  if (closeResourcesBtn && resourcesModal) {
    closeResourcesBtn.addEventListener("click", () => {
      resourcesModal.classList.remove("open");
    });
  }

  // Handle click on any .resource-card inside resourcesModal
  document.querySelectorAll(".resource-card").forEach((card) => {
    card.addEventListener("click", () => {
      const prompt = card.dataset.prompt;
      if (prompt) {
        if (resourcesModal) resourcesModal.classList.remove("open");
        chatInput.value = prompt;
        sendMessage();
      }
    });
  });

  // 17. Pomodoro Timer
  if (pomoToggle) {
    pomoToggle.addEventListener("click", () => {
      window.AudioEngine.playClick();
      if (state.pomodoro.isRunning) {
        clearInterval(state.pomodoro.timerId);
        state.pomodoro.isRunning = false;
        pomoToggle.textContent = "▶ Start Focus";
        pomoToggle.classList.remove("running");
      } else {
        state.pomodoro.isRunning = true;
        pomoToggle.textContent = "⏸ Pause";
        pomoToggle.classList.add("running");
        state.pomodoro.timerId = setInterval(tickPomodoro, 1000);
      }
    });
  }

  if (pomoReset) {
    pomoReset.addEventListener("click", () => {
      clearInterval(state.pomodoro.timerId);
      state.pomodoro.isRunning = false;
      state.pomodoro.timeLeft = 25 * 60;
      updatePomoDisplay();
      pomoToggle.textContent = "▶ Start Focus";
      pomoToggle.classList.remove("running");
      window.AudioEngine.playClick();
    });
  }

  function tickPomodoro() {
    if (state.pomodoro.timeLeft > 0) {
      state.pomodoro.timeLeft--;
      updatePomoDisplay();
    } else {
      clearInterval(state.pomodoro.timerId);
      state.pomodoro.isRunning = false;
      window.AudioEngine.playQuizSuccess();
      robot.setExpression("happy");
      alert(state.pomodoro.isBreak ? "Break finished! Ready to learn?" : "Study session completed! Great focus! Take a 5-min break.");
      state.pomodoro.isBreak = !state.pomodoro.isBreak;
      state.pomodoro.timeLeft = state.pomodoro.isBreak ? 5 * 60 : 25 * 60;
      updatePomoDisplay();
      pomoToggle.textContent = "▶ Start Next";
    }
  }

  function updatePomoDisplay() {
    const mins = Math.floor(state.pomodoro.timeLeft / 60);
    const secs = state.pomodoro.timeLeft % 60;
    if (pomoDisplay) {
      pomoDisplay.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
  }

  // 18. Telemetry & XP Helpers
  function updateLatencyBadge(ms, source) {
    if (!latencyBadge) return;
    latencyBadge.innerHTML = `⚡ <strong>${ms} ms</strong> • ${source}`;
  }

  function addXP(amount) {
    state.studyXP += amount;
    localStorage.setItem("nova_xp", state.studyXP.toString());
    updateStats();
  }

  function updateStats() {
    if (xpCounter) xpCounter.textContent = `${state.studyXP} XP`;
    if (streakCounter) streakCounter.textContent = `${state.studyStreak} Days`;
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function markedInline(str) {
    return str.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }

  function markedParse(text) {
    // Basic Markdown parser for streaming headers, lists, code, bold, quotes
    let html = escapeHtml(text)
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n\n/g, "<br><br>");
    return html;
  }
});
