/**
 * Chatbot Abhi - High-Precision 3D Robot System
 * Features:
 * - Real 3D Articulated Robot with Sculpted Chassis
 * - Clear 3D Glowing Expressive Eyes (Physical Eye Sockets, Iris Rings, Pupils, Lids)
 * - Clear 5-Digit Articulated Mechanical Hands (Palm, Knuckles, Segmented Fingers, Glowing Tips)
 * - Realistic Inverse Kinematics (Head, Eyes, and Arms track cursor)
 * - Multi-theme Material Engine (Obsidian Cyan, Industrial Amber, Cleanroom White, Neon Violet)
 */

class Robot3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error("Canvas container not found:", containerId);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Groups
    this.robotGroup = null;
    this.headGroup = null;
    this.leftEye = null;
    this.rightEye = null;
    this.leftEyelid = null;
    this.rightEyelid = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftHand = null;
    this.rightHand = null;
    this.leftFingers = [];
    this.rightFingers = [];
    this.coreMesh = null;
    this.coreLight = null;
    this.thrusterParticles = null;

    // Colors & Theme
    this.currentTheme = "cyber_cyan";
    this.themes = {
      cyber_cyan: {
        armor: 0xf1f5f9,
        chassis: 0x0f172a,
        accent: 0x0ea5e9,
        glow: 0x38bdf8,
        eyeColor: 0x38bdf8,
        pupilColor: 0xffffff,
        light: 0x38bdf8
      },
      amber_hazard: {
        armor: 0x1e293b,
        chassis: 0x090d16,
        accent: 0xf59e0b,
        glow: 0xfbbf24,
        eyeColor: 0xf59e0b,
        pupilColor: 0xffedd5,
        light: 0xf59e0b
      },
      cleanroom_white: {
        armor: 0xffffff,
        chassis: 0x334155,
        accent: 0x2563eb,
        glow: 0x60a5fa,
        eyeColor: 0x3b82f6,
        pupilColor: 0xdbeafe,
        light: 0x60a5fa
      },
      quantum_violet: {
        armor: 0x18181b,
        chassis: 0x09090b,
        accent: 0xa855f7,
        glow: 0xc084fc,
        eyeColor: 0xa855f7,
        pupilColor: 0xf3e8ff,
        light: 0xc084fc
      }
    };

    // State & Tracking
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.expression = "idle"; // 'idle', 'happy', 'thinking', 'speaking', 'surprised'
    this.isBlinking = false;
    this.blinkProgress = 0;
    this.isPoked = false;
    this.isOverdrive = false;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 500;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    this.camera.position.set(0, 0.4, 4.6);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLights();

    // 5. Materials
    this.initMaterials();

    // 6. Build the Accurate Robot Model
    this.buildRobot();

    // 7. Event Listeners
    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.renderer.domElement.addEventListener("click", () => this.pokeRobot());

    // 8. Start Loop
    this.animate();
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.keyLight.position.set(4, 6, 5);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    this.rimLight.position.set(-5, 4, -4);
    this.scene.add(this.rimLight);

    this.coreLight = new THREE.PointLight(0x38bdf8, 2.0, 4);
    this.coreLight.position.set(0, 0.1, 0.6);
    this.scene.add(this.coreLight);
  }

  initMaterials() {
    const p = this.themes[this.currentTheme];

    this.matArmor = new THREE.MeshStandardMaterial({
      color: p.armor,
      roughness: 0.18,
      metalness: 0.2
    });

    this.matChassis = new THREE.MeshStandardMaterial({
      color: p.chassis,
      roughness: 0.4,
      metalness: 0.8
    });

    this.matAccent = new THREE.MeshStandardMaterial({
      color: p.accent,
      emissive: p.glow,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.5
    });

    this.matEyeLens = new THREE.MeshBasicMaterial({
      color: p.eyeColor
    });

    this.matPupil = new THREE.MeshBasicMaterial({
      color: p.pupilColor
    });

    this.matJoint = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.3,
      metalness: 0.9
    });
  }

  setTheme(themeKey) {
    if (!this.themes[themeKey]) return;
    this.currentTheme = themeKey;
    const p = this.themes[themeKey];

    this.matArmor.color.setHex(p.armor);
    this.matChassis.color.setHex(p.chassis);
    this.matAccent.color.setHex(p.accent);
    this.matAccent.emissive.setHex(p.glow);
    this.matEyeLens.color.setHex(p.eyeColor);
    this.matPupil.color.setHex(p.pupilColor);

    if (this.coreLight) this.coreLight.color.setHex(p.light);
    if (this.rimLight) this.rimLight.color.setHex(p.light);
  }

  buildRobot() {
    this.robotGroup = new THREE.Group();
    this.scene.add(this.robotGroup);

    // 1. HEAD UNIT WITH CLEAR 3D EYES
    this.buildHead();

    // 2. TORSO & CHASSIS
    this.buildTorso();

    // 3. ARTICULATED ARMS AND CLEAR 5-DIGIT MECHANICAL HANDS
    this.buildArmsAndHands();

    // 4. FLOATING THRUSTER
    this.buildThruster();
  }

  buildHead() {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.72, 0);

    // Main Helmet (Aerodynamic, sculpted)
    const helmetGeo = new THREE.SphereGeometry(0.65, 36, 36);
    helmetGeo.scale(1, 0.95, 0.92);
    const helmet = new THREE.Mesh(helmetGeo, this.matArmor);
    this.headGroup.add(helmet);

    // Front Face Visor Plate (Recessed dark faceplate where eyes sit clearly)
    const visorBezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 0.38, 32, 1, false, -Math.PI / 2.4, (Math.PI * 2) / 2.4),
      this.matChassis
    );
    visorBezel.rotation.y = Math.PI / 2;
    visorBezel.position.set(0, 0.04, 0.22);
    this.headGroup.add(visorBezel);

    // 3D CLEAR EYES (Left & Right)
    this.leftEye = this.createEye(-0.22);
    this.rightEye = this.createEye(0.22);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // Head Audio Scanner Antennas on sides
    [-0.64, 0.64].forEach((x) => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.1, 24), this.matChassis);
      ear.rotation.z = Math.PI / 2;
      ear.position.set(x, 0.04, 0);
      this.headGroup.add(ear);

      const earRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 16, 24), this.matAccent);
      earRing.rotation.y = Math.PI / 2;
      earRing.position.set(x, 0.04, 0);
      this.headGroup.add(earRing);
    });

    // Neck Ball Joint
    const neck = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), this.matJoint);
    neck.position.set(0, -0.62, 0);
    this.headGroup.add(neck);

    this.robotGroup.add(this.headGroup);
  }

  createEye(xPos) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(xPos, 0.05, 0.54);

    // 1. Recessed Eye Socket Ring
    const socketRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 16, 32), this.matChassis);
    eyeGroup.add(socketRing);

    // 2. Glowing Iris Ring (Bright glowing circle)
    const irisRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 16, 32), this.matAccent);
    eyeGroup.add(irisRing);

    // 3. Clear Glowing Eye Lens / Pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 24), this.matPupil);
    pupil.position.set(0, 0, 0.01);
    eyeGroup.add(pupil);

    // 4. Specular Catchlight dot (creates vivid, alive look)
    const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    catchlight.position.set(0.03, 0.03, 0.07);
    eyeGroup.add(catchlight);

    // 5. Articulated Eyelid for Expressive Blinking and Emotions
    const lidGeo = new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const eyelid = new THREE.Mesh(lidGeo, this.matChassis);
    eyelid.position.set(0, 0, 0.02);
    eyelid.rotation.x = -Math.PI / 2; // Open state
    eyeGroup.add(eyelid);

    eyeGroup.userData = { eyelid: eyelid, pupil: pupil };
    return eyeGroup;
  }

  buildTorso() {
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0, 0);

    // Inner mechanical spine
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.28, 0.8, 24), this.matChassis);
    torsoGroup.add(spine);

    // Sculpted Chest Armor Plate
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.44, 0.2), this.matArmor);
    chestPlate.position.set(0, 0.16, 0.24);
    torsoGroup.add(chestPlate);

    // Quantum Core Arc Reactor (Center glowing heart)
    const coreRim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 16, 32), this.matChassis);
    coreRim.position.set(0, 0.15, 0.35);
    torsoGroup.add(coreRim);

    this.coreMesh = new THREE.Mesh(new THREE.CircleGeometry(0.11, 32), this.matAccent);
    this.coreMesh.position.set(0, 0.15, 0.36);
    torsoGroup.add(this.coreMesh);

    // Abdominal Mechanical Ribbing
    [-0.1, -0.22].forEach((y) => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.18), this.matChassis);
      rib.position.set(0, y, 0.2);
      torsoGroup.add(rib);
    });

    this.robotGroup.add(torsoGroup);
  }

  buildArmsAndHands() {
    this.leftArm = this.createArm(-0.62, "left");
    this.rightArm = this.createArm(0.62, "right");
    this.robotGroup.add(this.leftArm.group);
    this.robotGroup.add(this.rightArm.group);
  }

  createArm(shoulderX, side) {
    const armGroup = new THREE.Group();
    armGroup.position.set(shoulderX, 0.28, 0);

    // Shoulder Ball Joint & Armor Guard
    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), this.matJoint);
    armGroup.add(shoulderBall);

    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), this.matArmor);
    shoulderCap.scale.set(1.1, 0.8, 1);
    shoulderCap.position.set(side === "left" ? -0.06 : 0.06, 0.04, 0);
    armGroup.add(shoulderCap);

    // Upper Arm (Bicep cylinder)
    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.35, 16), this.matChassis);
    bicep.position.set(side === "left" ? -0.08 : 0.08, -0.22, 0);
    armGroup.add(bicep);

    // Elbow Joint
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), this.matJoint);
    elbow.position.set(side === "left" ? -0.08 : 0.08, -0.42, 0);
    armGroup.add(elbow);

    // Forearm
    const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.32, 16), this.matArmor);
    forearm.position.set(side === "left" ? -0.08 : 0.08, -0.6, 0.08);
    forearm.rotation.x = 0.35; // natural forward angle
    armGroup.add(forearm);

    // Wrist Joint
    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), this.matJoint);
    wrist.position.set(side === "left" ? -0.08 : 0.08, -0.78, 0.16);
    armGroup.add(wrist);

    // CLEAR 5-DIGIT ARTICULATED ROBOT HAND
    const hand = this.createRobotHand(side);
    hand.position.set(side === "left" ? -0.08 : 0.08, -0.84, 0.18);
    armGroup.add(hand);

    return {
      group: armGroup,
      hand: hand
    };
  }

  createRobotHand(side) {
    const handGroup = new THREE.Group();

    // 1. Palm Base (Beveled metal chassis)
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.05), this.matArmor);
    handGroup.add(palm);

    // Palm Core Glow Ring
    const palmCore = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), this.matAccent);
    palmCore.position.set(0, 0, 0.028);
    handGroup.add(palmCore);

    const fingersList = [];

    // 2. 4 Articulated Fingers (Index, Middle, Ring, Pinky)
    const fingerSpacing = 0.036;
    const startX = -fingerSpacing * 1.5;

    for (let i = 0; i < 4; i++) {
      const fingerGroup = new THREE.Group();
      const fx = startX + i * fingerSpacing;
      fingerGroup.position.set(fx, -0.07, 0);

      // Knuckle Joint
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), this.matJoint);
      fingerGroup.add(knuckle);

      // Proximal Phalanx
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.06, 8), this.matArmor);
      p1.position.set(0, -0.035, 0.01);
      fingerGroup.add(p1);

      // Interphalangeal Joint
      const j2 = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 8), this.matJoint);
      j2.position.set(0, -0.068, 0.015);
      fingerGroup.add(j2);

      // Distal Phalanx (Fingertip)
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.05, 8), this.matChassis);
      p2.position.set(0, -0.096, 0.022);
      fingerGroup.add(p2);

      // Glowing Cyber Sensor on Fingertip
      const tipSensor = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), this.matAccent);
      tipSensor.position.set(0, -0.122, 0.025);
      fingerGroup.add(tipSensor);

      handGroup.add(fingerGroup);
      fingersList.push(fingerGroup);
    }

    // 3. Opposable Thumb
    const thumbGroup = new THREE.Group();
    const thumbX = side === "left" ? 0.08 : -0.08;
    thumbGroup.position.set(thumbX, -0.02, 0.02);
    thumbGroup.rotation.z = side === "left" ? -0.6 : 0.6;
    thumbGroup.rotation.y = side === "left" ? -0.4 : 0.4;

    const tKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), this.matJoint);
    thumbGroup.add(tKnuckle);

    const tp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.05, 8), this.matArmor);
    tp1.position.set(0, -0.03, 0);
    thumbGroup.add(tp1);

    const tp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 0.045, 8), this.matChassis);
    tp2.position.set(0, -0.065, 0.01);
    thumbGroup.add(tp2);

    const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), this.matAccent);
    thumbTip.position.set(0, -0.09, 0.015);
    thumbGroup.add(thumbTip);

    handGroup.add(thumbGroup);
    fingersList.push(thumbGroup);

    if (side === "left") this.leftFingers = fingersList;
    else this.rightFingers = fingersList;

    return handGroup;
  }

  buildThruster() {
    const thrusterGroup = new THREE.Group();
    thrusterGroup.position.set(0, -0.52, 0);

    // Glowing Anti-Gravity Ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 16, 32), this.matAccent);
    ring.rotation.x = Math.PI / 2;
    thrusterGroup.add(ring);

    // Thruster Particle Exhaust
    const count = 30;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 0.35;
      pos[i * 3 + 1] = -0.1 - Math.random() * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.thrusterParticles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.08, transparent: true, opacity: 0.85 })
    );
    thrusterGroup.add(this.thrusterParticles);

    this.robotGroup.add(thrusterGroup);
  }

  onMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.mouse.targetX = (x / rect.width) * 2 - 1;
    this.mouse.targetY = -(y / rect.height) * 2 + 1;
  }

  pokeRobot() {
    this.isPoked = true;
    this.setExpression("happy");
    if (window.AudioEngine) window.AudioEngine.playRobotChirp();

    setTimeout(() => {
      this.isPoked = false;
      this.setExpression("idle");
    }, 1200);
  }

  setExpression(expr) {
    this.expression = expr;
    const p = this.themes[this.currentTheme];

    if (expr === "happy") {
      this.matEyeLens.color.setHex(0x22c55e); // Green happy eyes
    } else if (expr === "thinking") {
      this.matEyeLens.color.setHex(0xf59e0b); // Amber thinking
    } else if (expr === "speaking") {
      this.matEyeLens.color.setHex(p.eyeColor);
    } else {
      this.matEyeLens.color.setHex(p.eyeColor);
    }
  }

  triggerOverdrive(duration = 2500) {
    this.isOverdrive = true;
    this.setExpression("thinking");
    setTimeout(() => {
      this.isOverdrive = false;
      this.setExpression("idle");
    }, duration);
  }

  setCameraView(mode) {
    if (mode === "command") {
      this.camera.position.set(0, 0.4, 4.6);
    } else if (mode === "core") {
      this.camera.position.set(0, 0.3, 2.8);
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Mouse Damping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    // 2. Head Tracking (Inverse Kinematics)
    if (this.headGroup) {
      this.headGroup.rotation.y = this.mouse.x * 0.65;
      this.headGroup.rotation.x = -this.mouse.y * 0.45;
    }

    // 3. Clear Eyes Physical Gaze Tracking
    if (this.leftEye && this.rightEye) {
      const gazeX = this.mouse.x * 0.04;
      const gazeY = this.mouse.y * 0.03;

      if (this.leftEye.userData.pupil) {
        this.leftEye.userData.pupil.position.x = gazeX;
        this.leftEye.userData.pupil.position.y = gazeY;
      }
      if (this.rightEye.userData.pupil) {
        this.rightEye.userData.pupil.position.x = gazeX;
        this.rightEye.userData.pupil.position.y = gazeY;
      }

      // Natural Eye Blinking Animation
      const blinkCycle = Math.sin(time * 1.8);
      if (blinkCycle > 0.96) {
        this.leftEye.userData.eyelid.rotation.x = 0; // closed
        this.rightEye.userData.eyelid.rotation.x = 0;
      } else {
        this.leftEye.userData.eyelid.rotation.x = -Math.PI / 2; // open
        this.rightEye.userData.eyelid.rotation.x = -Math.PI / 2;
      }
    }

    // 4. Floating Sinusoidal Idle Body Motion
    if (this.robotGroup) {
      const hoverSpeed = this.isOverdrive ? 4.0 : 2.0;
      const hoverY = Math.sin(time * hoverSpeed) * (this.isOverdrive ? 0.12 : 0.06);
      this.robotGroup.position.y = hoverY;

      if (this.isPoked) {
        this.robotGroup.rotation.y += delta * 10;
      } else {
        this.robotGroup.rotation.y += (this.mouse.x * 0.22 - this.robotGroup.rotation.y) * 0.06;
      }
    }

    // 5. Articulated Mechanical Hands Animation
    if (this.leftArm && this.rightArm) {
      if (this.expression === "speaking") {
        // Natural Gesturing hands
        this.leftArm.group.rotation.x = Math.sin(time * 4) * 0.2;
        this.rightArm.group.rotation.x = Math.cos(time * 4) * 0.2;
      } else if (this.isPoked) {
        // Wave Hello Hand
        this.rightArm.group.rotation.z = -1.2 + Math.sin(time * 10) * 0.3;
        this.rightArm.group.rotation.x = 0.5;
      } else {
        // Gentle breathing motion
        this.leftArm.group.rotation.x = Math.sin(time * 1.5) * 0.06;
        this.rightArm.group.rotation.x = Math.sin(time * 1.5) * 0.06;
        this.leftArm.group.rotation.z = -0.05;
        this.rightArm.group.rotation.z = 0.05;
      }
    }

    // 6. Natural Finger Curls (Idle Breathing)
    const fingerCurl = Math.sin(time * 2.5) * 0.15 + 0.2;
    this.leftFingers.forEach((f, i) => {
      f.rotation.x = fingerCurl + i * 0.04;
    });
    this.rightFingers.forEach((f, i) => {
      f.rotation.x = fingerCurl + i * 0.04;
    });

    // 7. Core Pulse & Thruster Particles
    if (this.coreMesh) {
      const scale = 1.0 + Math.sin(time * 4) * 0.12;
      this.coreMesh.scale.set(scale, scale, 1);
    }

    if (this.thrusterParticles) {
      const pos = this.thrusterParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let py = pos.getY(i) - delta * 1.5;
        if (py < -0.6) py = -0.1;
        pos.setY(i, py);
      }
      this.thrusterParticles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Robot3D = Robot3D;
