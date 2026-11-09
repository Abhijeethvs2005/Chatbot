/**
 * Chatbot Abhi - High-Precision 3D Robot System
 * Features:
 * - Real 3D Articulated Humanoid Robot Chassis
 * - Clear 3D Glowing Expressive Eyes (Ocular Sockets, Illuminated Aperture Rings, Clear Lenses, Pupils with Point Lights, Emotive Brow Plates, Smooth Blinking)
 * - Clear 5-Digit Articulated Mechanical Hands prominently positioned in front of chest (Palm Chassis, Glowing Palm Repulsor Core, 5 Chrome Knuckles in Anatomical Arch, 3-Segment Phalanges, Opposable Thumb, Glowing Cyber Fingertips)
 * - Humanoid Conversational Gestures (Idle finger curl, speaking articulation, thinking posture, wave greeting)
 * - Multi-theme Material Engine (Cyber Cyan, Amber Hazard, Quantum Violet, Cleanroom White)
 * - Interactive Camera Presets: Full Chassis, Detailed Eyes, 5-Digit Hands
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

    // Component Groups & Nodes
    this.robotGroup = null;
    this.headGroup = null;
    this.leftEye = null;
    this.rightEye = null;
    this.leftBrow = null;
    this.rightBrow = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftHand = null;
    this.rightHand = null;
    this.leftFingers = [];
    this.rightFingers = [];
    this.coreMesh = null;
    this.coreLight = null;
    this.thrusterParticles = null;

    // Camera animation targets
    this.cameraTargetPos = new THREE.Vector3(0, 0.25, 4.2);
    this.cameraLookTarget = new THREE.Vector3(0, 0.1, 0);

    // Color Palettes
    this.currentTheme = "cyber_cyan";
    this.themes = {
      cyber_cyan: {
        armor: 0xe2e8f0,
        chassis: 0x0f172a,
        visor: 0x030712,
        accent: 0x0ea5e9,
        glow: 0x38bdf8,
        eyeColor: 0x38bdf8,
        pupilColor: 0xffffff,
        light: 0x38bdf8,
        joint: 0x334155
      },
      amber_hazard: {
        armor: 0x1e293b,
        chassis: 0x090d16,
        visor: 0x050402,
        accent: 0xf59e0b,
        glow: 0xfbbf24,
        eyeColor: 0xf59e0b,
        pupilColor: 0xffedd5,
        light: 0xf59e0b,
        joint: 0x451a03
      },
      quantum_violet: {
        armor: 0x18181b,
        chassis: 0x09090b,
        visor: 0x070311,
        accent: 0xa855f7,
        glow: 0xc084fc,
        eyeColor: 0xa855f7,
        pupilColor: 0xf3e8ff,
        light: 0xc084fc,
        joint: 0x3b0764
      },
      cleanroom_white: {
        armor: 0xffffff,
        chassis: 0x334155,
        visor: 0x0f172a,
        accent: 0x2563eb,
        glow: 0x60a5fa,
        eyeColor: 0x3b82f6,
        pupilColor: 0xdbeafe,
        light: 0x60a5fa,
        joint: 0x475569
      },
      matrix_emerald: {
        armor: 0x052e16,
        chassis: 0x021609,
        visor: 0x011206,
        accent: 0x22c55e,
        glow: 0x4ade80,
        eyeColor: 0x22c55e,
        pupilColor: 0xdcfce7,
        light: 0x22c55e,
        joint: 0x14532d
      }
    };

    // State & Tracking
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.expression = "idle"; // 'idle', 'happy', 'thinking', 'speaking', 'surprised'
    this.isBlinking = false;
    this.blinkTimer = 0;
    this.isWaving = false;
    this.waveTimer = 0;
    this.isPoked = false;
    this.isOverdrive = false;

    // 3D Animation Frame & Holographic Stage
    this.isOrbiting = false;
    this.orbitAngle = 0;
    this.holoStageVisible = true;
    this.holoStageGroup = null;
    this.holoGyroRing = null;
    this.holoParticles = null;
    this.holoStageMat = null;
    this.holoParticlesMat = null;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 500;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera: Positioned to capture head, glowing eyes, torso, and elevated 5-digit hands
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    this.camera.position.copy(this.cameraTargetPos);
    this.camera.lookAt(this.cameraLookTarget);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLights();

    // 5. Materials
    this.initMaterials();

    // 6. Build the Accurate Robot Model with Clear Eyes and Clear Hands
    this.buildRobot();

    // 7. Event Listeners
    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.renderer.domElement.addEventListener("click", () => this.pokeRobot());

    // 8. Start Animation Loop
    this.animate();
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    this.keyLight.position.set(4, 5, 5);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    this.rimLight.position.set(-4, 3, -3);
    this.scene.add(this.rimLight);

    this.coreLight = new THREE.PointLight(0x38bdf8, 2.2, 4);
    this.coreLight.position.set(0, 0.1, 0.6);
    this.scene.add(this.coreLight);
  }

  initMaterials() {
    const p = this.themes[this.currentTheme];

    this.matArmor = new THREE.MeshStandardMaterial({
      color: p.armor,
      roughness: 0.18,
      metalness: 0.35
    });

    this.matChassis = new THREE.MeshStandardMaterial({
      color: p.chassis,
      roughness: 0.45,
      metalness: 0.75
    });

    this.matVisor = new THREE.MeshStandardMaterial({
      color: p.visor,
      roughness: 0.1,
      metalness: 0.9
    });

    this.matAccent = new THREE.MeshStandardMaterial({
      color: p.accent,
      emissive: p.glow,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.5
    });

    this.matEyeLens = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.45
    });

    this.matPupil = new THREE.MeshBasicMaterial({
      color: p.pupilColor
    });

    this.matJoint = new THREE.MeshStandardMaterial({
      color: p.joint,
      roughness: 0.25,
      metalness: 0.95
    });

    this.matChrome = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.98
    });
  }

  setTheme(themeKey) {
    if (!this.themes[themeKey]) return;
    this.currentTheme = themeKey;
    const p = this.themes[themeKey];

    this.matArmor.color.setHex(p.armor);
    this.matChassis.color.setHex(p.chassis);
    this.matVisor.color.setHex(p.visor);
    this.matAccent.color.setHex(p.accent);
    this.matAccent.emissive.setHex(p.glow);
    this.matPupil.color.setHex(p.pupilColor);
    this.matJoint.color.setHex(p.joint);

    if (this.coreLight) this.coreLight.color.setHex(p.light);
    if (this.rimLight) this.rimLight.color.setHex(p.light);
    if (this.keyLight) this.keyLight.color.setHex(p.light);
    if (this.leftEyeLight) this.leftEyeLight.color.setHex(p.light);
    if (this.rightEyeLight) this.rightEyeLight.color.setHex(p.light);

    if (this.holoStageMat) {
      this.holoStageMat.color.setHex(p.accent);
      this.holoStageMat.emissive.setHex(p.glow);
    }
    if (this.holoParticlesMat) {
      this.holoParticlesMat.color.setHex(p.glow);
    }
    if (this.thrusterParticles && this.thrusterParticles.material) {
      this.thrusterParticles.material.color.setHex(p.glow);
    }
  }

  buildRobot() {
    this.robotGroup = new THREE.Group();
    this.scene.add(this.robotGroup);

    // 1. HEAD UNIT WITH CLEAR 3D EXPRESSIVE EYES
    this.buildHead();

    // 2. TORSO & QUANTUM CORE ARC REACTOR
    this.buildTorso();

    // 3. ARTICULATED ARMS AND CLEAR 5-DIGIT MECHANICAL HANDS
    this.buildArmsAndHands();

    // 4. FLOATING THRUSTER & ION PARTICLES
    this.buildThruster();

    // 5. 3D HOLOGRAPHIC ANIMATION FRAME STAGE & GYRO PLATFORM
    this.buildHoloStageFrame();
  }

  buildHead() {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.78, 0);

    // Main Helmet (Sculpted, aerodynamic pearlescent chassis)
    const helmetGeo = new THREE.SphereGeometry(0.62, 36, 36);
    helmetGeo.scale(1, 0.96, 0.92);
    const helmet = new THREE.Mesh(helmetGeo, this.matArmor);
    this.headGroup.add(helmet);

    // Dark Visor Faceplate: Provides sleek high-contrast backdrop so the glowing eyes stand out with absolute clarity
    const visorGeo = new THREE.CylinderGeometry(0.50, 0.50, 0.36, 32, 1, false, -Math.PI / 2.3, (Math.PI * 2) / 2.3);
    const visorBezel = new THREE.Mesh(visorGeo, this.matVisor);
    visorBezel.rotation.y = Math.PI / 2;
    visorBezel.position.set(0, 0.03, 0.23);
    this.headGroup.add(visorBezel);

    // 3D CLEAR EYES (Left & Right)
    this.leftEye = this.createEye(-0.21);
    this.rightEye = this.createEye(0.21);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // Expressive Eyebrow Brow Plates (Tilt during thinking, surprise, or happy states)
    this.leftBrow = this.createBrow(-0.21, true);
    this.rightBrow = this.createBrow(0.21, false);
    this.headGroup.add(this.leftBrow);
    this.headGroup.add(this.rightBrow);

    // Head Audio Scanner Antennas on sides
    [-0.62, 0.62].forEach((x) => {
      const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 24), this.matChassis);
      ear.rotation.z = Math.PI / 2;
      ear.position.set(x, 0.04, 0);
      this.headGroup.add(ear);

      const earRing = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 16, 24), this.matAccent);
      earRing.rotation.y = Math.PI / 2;
      earRing.position.set(x, 0.04, 0);
      this.headGroup.add(earRing);

      const antennaFin = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.22, 12), this.matAccent);
      antennaFin.position.set(x, 0.16, 0);
      antennaFin.rotation.z = x < 0 ? 0.3 : -0.3;
      this.headGroup.add(antennaFin);
    });

    // Neck Ball Joint
    const neck = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), this.matJoint);
    neck.position.set(0, -0.60, 0);
    this.headGroup.add(neck);

    this.robotGroup.add(this.headGroup);
  }

  createBrow(xPos, isLeft) {
    const browGroup = new THREE.Group();
    browGroup.position.set(xPos, 0.21, 0.52);

    const browPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.035, 0.05), this.matArmor);
    browPlate.rotation.z = isLeft ? -0.08 : 0.08;
    browGroup.add(browPlate);

    return browGroup;
  }

  createEye(xPos) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(xPos, 0.05, 0.54);

    // 1. Recessed Cylindrical Ocular Socket
    const socketBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.04, 32), this.matChassis);
    socketBase.rotation.x = Math.PI / 2;
    socketBase.position.set(0, 0, -0.02);
    eyeGroup.add(socketBase);

    // 2. Beveled Socket Outer Bezel Ring (Chrome finish)
    const socketRing = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.02, 16, 32), this.matChrome);
    eyeGroup.add(socketRing);

    // 3. Glowing Aperture Iris Ring (Neon cyber accent)
    const irisRing = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.018, 16, 32), this.matAccent);
    irisRing.position.set(0, 0, 0.005);
    eyeGroup.add(irisRing);

    // 4. Clear Transparent Convex Eye Lens
    const lensGeo = new THREE.SphereGeometry(0.10, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const lens = new THREE.Mesh(lensGeo, this.matEyeLens);
    lens.position.set(0, 0, 0.015);
    eyeGroup.add(lens);

    // 5. Bright Luminous Digital Pupil (Tracks Cursor)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.068, 24, 24), this.matPupil);
    pupil.position.set(0, 0, 0.025);
    eyeGroup.add(pupil);

    // Dedicated Point Light for Vivid Eye Glow
    const eyeLight = new THREE.PointLight(this.themes[this.currentTheme].light, 0.8, 1.2);
    eyeLight.position.set(0, 0, 0.08);
    eyeGroup.add(eyeLight);

    if (xPos < 0) this.leftEyeLight = eyeLight;
    else this.rightEyeLight = eyeLight;

    // 6. Specular Catchlight Gleam (Creates alive, intelligent sparkle)
    const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    catchlight.position.set(0.03, 0.03, 0.085);
    eyeGroup.add(catchlight);

    // 7. Articulated Visor Eyelid for Smooth Blinking
    const lidGeo = new THREE.SphereGeometry(0.135, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const eyelid = new THREE.Mesh(lidGeo, this.matChassis);
    eyelid.position.set(0, 0, 0.03);
    eyelid.rotation.x = -Math.PI / 2; // Default open state
    eyeGroup.add(eyelid);

    eyeGroup.userData = { eyelid: eyelid, pupil: pupil, catchlight: catchlight, baseZ: 0.54 };
    return eyeGroup;
  }

  buildTorso() {
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0, 0);

    // Inner mechanical spine
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.26, 0.82, 24), this.matChassis);
    torsoGroup.add(spine);

    // Sculpted Chest Armor Plate
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.44, 0.22), this.matArmor);
    chestPlate.position.set(0, 0.16, 0.24);
    torsoGroup.add(chestPlate);

    // Quantum Core Arc Reactor (Center glowing heart)
    const coreRim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.028, 16, 32), this.matChrome);
    coreRim.position.set(0, 0.15, 0.36);
    torsoGroup.add(coreRim);

    this.coreMesh = new THREE.Mesh(new THREE.CircleGeometry(0.115, 32), this.matAccent);
    this.coreMesh.position.set(0, 0.15, 0.37);
    torsoGroup.add(this.coreMesh);

    // Abdominal Mechanical Ribbing
    [-0.10, -0.22].forEach((y) => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.18), this.matChassis);
      rib.position.set(0, y, 0.2);
      torsoGroup.add(rib);
    });

    this.robotGroup.add(torsoGroup);
  }

  buildArmsAndHands() {
    // Both arms are held in an attentive humanoid posture:
    // Upper arms angle forward, elbows bend ~70 degrees, forearms extend forward/inward,
    // bringing the hands to mid-chest height where they are prominently displayed!
    this.leftArm = this.createArm(-0.56, "left");
    this.rightArm = this.createArm(0.56, "right");
    this.robotGroup.add(this.leftArm.group);
    this.robotGroup.add(this.rightArm.group);
  }

  createArm(shoulderX, side) {
    const isLeft = side === "left";
    const armGroup = new THREE.Group();
    armGroup.position.set(shoulderX, 0.30, 0);

    // 1. Shoulder Ball Joint & Armor Cap
    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), this.matJoint);
    armGroup.add(shoulderBall);

    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), this.matArmor);
    shoulderCap.scale.set(1.1, 0.85, 1);
    shoulderCap.position.set(isLeft ? -0.06 : 0.06, 0.04, 0);
    armGroup.add(shoulderCap);

    // 2. Upper Arm (Bicep chassis) angled forward and downward
    const upperArmGroup = new THREE.Group();
    upperArmGroup.position.set(isLeft ? -0.06 : 0.06, -0.04, 0);
    upperArmGroup.rotation.x = 0.25; // angled forward
    upperArmGroup.rotation.z = isLeft ? 0.15 : -0.15; // angled slightly outward
    armGroup.add(upperArmGroup);

    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.34, 16), this.matChassis);
    bicep.position.set(0, -0.17, 0);
    upperArmGroup.add(bicep);

    // 3. Elbow Joint (Chrome hinge)
    const elbowGroup = new THREE.Group();
    elbowGroup.position.set(0, -0.34, 0);
    upperArmGroup.add(elbowGroup);

    const elbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), this.matChrome);
    elbowGroup.add(elbowMesh);

    // 4. Forearm bent forward ~75 degrees to bring hands into clear, prominent view
    const forearmGroup = new THREE.Group();
    forearmGroup.rotation.x = -1.15; // bent forward towards camera
    forearmGroup.rotation.y = isLeft ? 0.35 : -0.35; // angled inward towards chest center
    elbowGroup.add(forearmGroup);

    const forearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.32, 16), this.matArmor);
    forearmMesh.position.set(0, -0.16, 0);
    forearmGroup.add(forearmMesh);

    // 5. Wrist Joint
    const wristGroup = new THREE.Group();
    wristGroup.position.set(0, -0.32, 0);
    forearmGroup.add(wristGroup);

    const wristMesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 14), this.matJoint);
    wristGroup.add(wristMesh);

    // 6. CLEAR 5-DIGIT ARTICULATED ROBOT HAND
    const hand = this.createRobotHand(side);
    hand.position.set(0, -0.08, 0);
    // Face palms slightly toward each other and forward toward user
    hand.rotation.x = -0.3;
    hand.rotation.y = isLeft ? 0.4 : -0.4;
    wristGroup.add(hand);

    return {
      group: armGroup,
      upperArm: upperArmGroup,
      elbow: elbowGroup,
      forearm: forearmGroup,
      wrist: wristGroup,
      hand: hand,
      side: side
    };
  }

  createRobotHand(side) {
    const isLeft = side === "left";
    const handGroup = new THREE.Group();

    // 1. Palm Chassis Base (Sculpted metallic hand base)
    const palmGeo = new THREE.BoxGeometry(0.18, 0.16, 0.055);
    const palm = new THREE.Mesh(palmGeo, this.matArmor);
    handGroup.add(palm);

    // Dorsal Armor Shell
    const dorsalPlate = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.02), this.matChassis);
    dorsalPlate.position.set(0, 0, -0.03);
    handGroup.add(dorsalPlate);

    // Central Palm Repulsor / Bio-Sensor Glow Node
    const palmRim = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 16, 24), this.matChrome);
    palmRim.position.set(0, 0, 0.03);
    handGroup.add(palmRim);

    const palmCore = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), this.matAccent);
    palmCore.position.set(0, 0, 0.031);
    handGroup.add(palmCore);

    const fingerNodes = [];

    // 2. Four Articulated Fingers (Index, Middle, Ring, Pinky) arranged along natural curved knuckle arch
    const fingerSpecs = [
      { name: "index",  xOffset: isLeft ? 0.052 : -0.052, len: 0.13, yArch: 0.005 },
      { name: "middle", xOffset: isLeft ? 0.018 : -0.018, len: 0.145, yArch: 0.012 }, // longest
      { name: "ring",   xOffset: isLeft ? -0.018 : 0.018, len: 0.135, yArch: 0.006 },
      { name: "pinky",  xOffset: isLeft ? -0.052 : 0.052, len: 0.11,  yArch: -0.006 } // shortest
    ];

    fingerSpecs.forEach((spec, idx) => {
      const fingerGroup = new THREE.Group();
      fingerGroup.position.set(spec.xOffset, -0.08 + spec.yArch, 0);

      // Spherical Chrome Knuckle Joint
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), this.matChrome);
      fingerGroup.add(knuckle);

      // Proximal Phalanx
      const p1Len = spec.len * 0.44;
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, p1Len, 10), this.matArmor);
      p1.position.set(0, -p1Len / 2, 0.005);
      fingerGroup.add(p1);

      // Intermediate Joint (PIP)
      const pip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), this.matJoint);
      pip.position.set(0, -p1Len, 0.008);
      fingerGroup.add(pip);

      // Intermediate & Distal Phalanx (curls slightly)
      const p2Len = spec.len * 0.40;
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.009, p2Len, 10), this.matChassis);
      p2.position.set(0, -p1Len - p2Len / 2, 0.016);
      p2.rotation.x = 0.15;
      fingerGroup.add(p2);

      // Glowing Cyber Fingertip Sensor Cap
      const tipSensor = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), this.matAccent);
      tipSensor.position.set(0, -p1Len - p2Len - 0.005, 0.024);
      fingerGroup.add(tipSensor);

      handGroup.add(fingerGroup);
      fingerNodes.push(fingerGroup);
    });

    // 3. Opposable Articulated Thumb
    const thumbGroup = new THREE.Group();
    const thumbX = isLeft ? 0.095 : -0.095;
    thumbGroup.position.set(thumbX, -0.01, 0.02);
    thumbGroup.rotation.z = isLeft ? -0.55 : 0.55;
    thumbGroup.rotation.y = isLeft ? -0.45 : 0.45;
    thumbGroup.rotation.x = 0.2;

    // Thumb Basal Knuckle
    const tKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.019, 12, 12), this.matChrome);
    thumbGroup.add(tKnuckle);

    // Thumb Proximal Phalanx
    const tp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.055, 10), this.matArmor);
    tp1.position.set(0, -0.028, 0);
    thumbGroup.add(tp1);

    // Thumb IP Joint
    const tipHinge = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 10), this.matJoint);
    tipHinge.position.set(0, -0.056, 0.005);
    thumbGroup.add(tipHinge);

    // Thumb Distal Phalanx
    const tp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 0.045, 10), this.matChassis);
    tp2.position.set(0, -0.078, 0.012);
    thumbGroup.add(tp2);

    // Thumb Glowing Sensor Tip
    const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), this.matAccent);
    thumbTip.position.set(0, -0.103, 0.018);
    thumbGroup.add(thumbTip);

    handGroup.add(thumbGroup);
    fingerNodes.push(thumbGroup);

    if (isLeft) this.leftFingers = fingerNodes;
    else this.rightFingers = fingerNodes;

    return handGroup;
  }

  buildThruster() {
    const thrusterGroup = new THREE.Group();
    thrusterGroup.position.set(0, -0.52, 0);

    // Glowing Anti-Gravity Ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.045, 16, 32), this.matAccent);
    ring.rotation.x = Math.PI / 2;
    thrusterGroup.add(ring);

    // Thruster Particle Exhaust
    const count = 35;
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
      new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.075, transparent: true, opacity: 0.85 })
    );
    thrusterGroup.add(this.thrusterParticles);

    this.robotGroup.add(thrusterGroup);
  }

  buildHoloStageFrame() {
    this.holoStageGroup = new THREE.Group();
    this.scene.add(this.holoStageGroup);

    const p = this.themes[this.currentTheme];

    this.holoStageMat = new THREE.MeshStandardMaterial({
      color: p.accent,
      emissive: p.glow,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.75
    });

    // 1. Concentric Floor Rings (Elevated Hologram Stage Platform)
    const floorOuterRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.022, 16, 64), this.holoStageMat);
    floorOuterRing.rotation.x = Math.PI / 2;
    floorOuterRing.position.y = -1.25;
    this.holoStageGroup.add(floorOuterRing);

    const floorInnerRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.016, 16, 48), this.holoStageMat);
    floorInnerRing.rotation.x = Math.PI / 2;
    floorInnerRing.position.y = -1.25;
    this.holoStageGroup.add(floorInnerRing);

    // 2. Holographic Radial Crosshairs on Floor
    for (let i = 0; i < 4; i++) {
      const spokeGeo = new THREE.BoxGeometry(0.018, 0.01, 0.55);
      const spoke = new THREE.Mesh(spokeGeo, this.holoStageMat);
      spoke.position.y = -1.25;
      spoke.rotation.y = (i * Math.PI) / 2;
      spoke.translateZ(1.1);
      this.holoStageGroup.add(spoke);
    }

    // 3. 3D Floating Gyro Ring behind the robot
    this.holoGyroRing = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.018, 16, 64), this.holoStageMat);
    this.holoGyroRing.position.set(0, 0.35, -0.6);
    this.holoGyroRing.rotation.x = 0.35;
    this.scene.add(this.holoGyroRing);

    // 4. 3D Holographic Ambient Particle Field
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4.2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.8 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    this.holoParticlesMat = new THREE.PointsMaterial({
      color: p.glow,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.holoParticles = new THREE.Points(particleGeo, this.holoParticlesMat);
    this.scene.add(this.holoParticles);
  }

  toggleOrbit() {
    this.isOrbiting = !this.isOrbiting;
    if (!this.isOrbiting) {
      this.cameraTargetPos.set(0, 0.25, 4.2);
      this.cameraLookTarget.set(0, 0.1, 0);
    }
    return this.isOrbiting;
  }

  toggleHoloStage() {
    this.holoStageVisible = !this.holoStageVisible;
    if (this.holoStageGroup) this.holoStageGroup.visible = this.holoStageVisible;
    if (this.holoGyroRing) this.holoGyroRing.visible = this.holoStageVisible;
    if (this.holoParticles) this.holoParticles.visible = this.holoStageVisible;
    return this.holoStageVisible;
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

  triggerWave() {
    this.isWaving = true;
    this.waveTimer = 0;
    this.setExpression("happy");
    if (window.AudioEngine) window.AudioEngine.playRobotChirp();
  }

  setExpression(expr) {
    this.expression = expr;
    const p = this.themes[this.currentTheme];

    if (expr === "happy") {
      this.matPupil.color.setHex(0x22c55e); // Bright emerald happy eyes
      if (this.leftBrow) this.leftBrow.rotation.z = -0.25;
      if (this.rightBrow) this.rightBrow.rotation.z = 0.25;
    } else if (expr === "thinking") {
      this.matPupil.color.setHex(0xf59e0b); // Amber thinking eyes
      if (this.leftBrow) this.leftBrow.rotation.z = 0.2;
      if (this.rightBrow) this.rightBrow.rotation.z = -0.2;
    } else if (expr === "surprised") {
      this.matPupil.color.setHex(0xec4899); // Neon pink surprise
      if (this.leftBrow) this.leftBrow.position.y = 0.24;
      if (this.rightBrow) this.rightBrow.position.y = 0.24;
    } else {
      this.matPupil.color.setHex(p.pupilColor);
      if (this.leftBrow) { this.leftBrow.rotation.z = -0.08; this.leftBrow.position.y = 0.21; }
      if (this.rightBrow) { this.rightBrow.rotation.z = 0.08; this.rightBrow.position.y = 0.21; }
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
    if (mode === "command" || mode === "full") {
      // Cinematic Full View: Showcases head, glowing eyes, chest reactor, and both 5-digit hands
      this.cameraTargetPos.set(0, 0.25, 4.2);
      this.cameraLookTarget.set(0, 0.1, 0);
    } else if (mode === "eyes" || mode === "core") {
      // Detailed Close-up on the Head & Glowing Eyes
      this.cameraTargetPos.set(0, 0.78, 2.1);
      this.cameraLookTarget.set(0, 0.78, 0);
    } else if (mode === "hands") {
      // Detailed Close-up on the 5-Digit Articulated Hands
      this.cameraTargetPos.set(0, 0.05, 2.2);
      this.cameraLookTarget.set(0, 0.0, 0);
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

    // 1. Camera Handling (Cinematic Auto-Orbit vs Smooth Lerp Focus)
    if (this.isOrbiting) {
      this.orbitAngle += delta * 0.72;
      const radius = 4.2;
      this.camera.position.x = Math.sin(this.orbitAngle) * radius;
      this.camera.position.z = Math.cos(this.orbitAngle) * radius;
      this.camera.position.y = 0.25 + Math.sin(this.orbitAngle * 1.6) * 0.18;
      this.camera.lookAt(this.cameraLookTarget);
    } else {
      this.camera.position.lerp(this.cameraTargetPos, 0.06);
      this.camera.lookAt(this.cameraLookTarget);
    }

    // 2. Mouse Cursor Damping
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    // 3. Head Inverse Kinematics Gaze Tracking
    if (this.headGroup) {
      this.headGroup.rotation.y = this.mouse.x * 0.55;
      this.headGroup.rotation.x = -this.mouse.y * 0.35;
    }

    // 4. Clear 3D Eyes Physical Gaze & Pupil Tracking
    if (this.leftEye && this.rightEye) {
      const gazeX = this.mouse.x * 0.035;
      const gazeY = this.mouse.y * 0.025;

      if (this.leftEye.userData.pupil) {
        this.leftEye.userData.pupil.position.x = gazeX;
        this.leftEye.userData.pupil.position.y = gazeY;
      }
      if (this.rightEye.userData.pupil) {
        this.rightEye.userData.pupil.position.x = gazeX;
        this.rightEye.userData.pupil.position.y = gazeY;
      }

      // Smooth Natural Blinking Animation
      const blinkCycle = Math.sin(time * 1.6);
      if (blinkCycle > 0.96) {
        // Smooth lid closure
        this.leftEye.userData.eyelid.rotation.x = 0;
        this.rightEye.userData.eyelid.rotation.x = 0;
      } else {
        this.leftEye.userData.eyelid.rotation.x = -Math.PI / 2; // open
        this.rightEye.userData.eyelid.rotation.x = -Math.PI / 2;
      }
    }

    // 5. Floating Hover Motion
    if (this.robotGroup) {
      const hoverSpeed = this.isOverdrive ? 4.0 : 1.8;
      const hoverY = Math.sin(time * hoverSpeed) * (this.isOverdrive ? 0.09 : 0.045);
      this.robotGroup.position.y = hoverY;

      if (this.isPoked) {
        this.robotGroup.rotation.y += delta * 8;
      } else {
        this.robotGroup.rotation.y += (this.mouse.x * 0.18 - this.robotGroup.rotation.y) * 0.05;
      }
    }

    // 6. Natural Articulated Arms & Hand Postures
    if (this.leftArm && this.rightArm) {
      if (this.isWaving) {
        // Active Right Hand Wave Greeting Animation
        this.waveTimer += delta;
        this.rightArm.upperArm.rotation.z = -1.1; // raise arm up
        this.rightArm.upperArm.rotation.x = 0.3;
        this.rightArm.forearm.rotation.x = -1.8; // raise forearm up near head
        this.rightArm.hand.rotation.x = 0.5;
        this.rightArm.hand.rotation.y = Math.sin(this.waveTimer * 10) * 0.45; // wave side to side

        if (this.waveTimer > 2.0) {
          this.isWaving = false;
          this.setExpression("idle");
        }
      } else if (this.expression === "speaking") {
        // Conversational Gesturing: Both hands articulate in rhythm
        const speakWave = Math.sin(time * 5) * 0.12;
        this.leftArm.forearm.rotation.x = -1.15 + speakWave;
        this.rightArm.forearm.rotation.x = -1.15 - speakWave;
        this.leftArm.hand.rotation.y = 0.4 + Math.sin(time * 4) * 0.15;
        this.rightArm.hand.rotation.y = -0.4 - Math.sin(time * 4) * 0.15;
      } else if (this.expression === "thinking") {
        // Thinking posture: Right hand taps chin/chest thoughtfully
        this.rightArm.forearm.rotation.x = -1.5;
        this.rightArm.forearm.rotation.y = -0.6;
        this.leftArm.forearm.rotation.x = -1.1;
      } else {
        // Relaxed Idle Breathing: Gentle arm sway
        const breathe = Math.sin(time * 1.8) * 0.04;
        this.leftArm.upperArm.rotation.x = 0.25 + breathe;
        this.rightArm.upperArm.rotation.x = 0.25 + breathe;
        this.leftArm.forearm.rotation.x = -1.15 + breathe;
        this.rightArm.forearm.rotation.x = -1.15 + breathe;
        this.rightArm.hand.rotation.y = -0.4;
      }
    }

    // 7. Clear 5-Digit Finger Articulations
    const fingerBaseCurl = Math.sin(time * 2.2) * 0.12 + 0.18;
    this.leftFingers.forEach((f, i) => {
      f.rotation.x = fingerBaseCurl + i * 0.03;
    });
    this.rightFingers.forEach((f, i) => {
      if (this.isWaving) {
        // Dynamic finger flexing during wave
        f.rotation.x = Math.sin(time * 8 + i) * 0.2 + 0.1;
      } else {
        f.rotation.x = fingerBaseCurl + i * 0.03;
      }
    });

    // 8. Core Pulse & Thruster Particles
    if (this.coreMesh) {
      const pulseRate = this.isOverdrive ? 8.0 : 3.5;
      const scale = 1.0 + Math.sin(time * pulseRate) * 0.12;
      this.coreMesh.scale.set(scale, scale, 1);
    }

    if (this.thrusterParticles) {
      const pos = this.thrusterParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let py = pos.getY(i) - delta * 1.4;
        if (py < -0.55) py = -0.08;
        pos.setY(i, py);
      }
      this.thrusterParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 9. 3D Holographic Stage Frame & Gyroscope Animation
    if (this.holoStageGroup) {
      this.holoStageGroup.rotation.y += delta * 0.45;
    }
    if (this.holoGyroRing) {
      this.holoGyroRing.rotation.z += delta * 0.28;
      this.holoGyroRing.rotation.x = 0.35 + Math.sin(time * 0.9) * 0.12;
    }
    if (this.holoParticles) {
      const pos = this.holoParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let py = pos.getY(i) + delta * 0.24;
        if (py > 2.2) py = -1.5;
        pos.setY(i, py);
      }
      this.holoParticles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Robot3D = Robot3D;
