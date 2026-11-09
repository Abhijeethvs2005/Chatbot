/**
 * Chatbot Abhi - Complete Humanoid 3D Robot System
 * Features:
 * - Full Humanoid Anatomy:
 *   - Humanoid Head with Sculpted 3D Nose, Expressive Clear Glowing Eyes, Lips/Mouth, Eyebrows & Ears
 *   - Humanoid Torso with Quantum Core Arc Reactor & Abdominal Ribbing
 *   - Two Articulated Arms with Clear 5-Digit Hands (Palm, Knuckles, 3-Segment Phalanges, Opposable Thumb, Glowing Tips)
 *   - TWO REAL HUMANOID ARTICULATED LEGS (Pelvis, Dual Thighs/Femurs, Patellar Chrome Knee Caps with Glowing Halos, Dual Calves/Shins with Cooling Vents & Hydraulic Shocks, Dual-Axis Ankle Gimbals, Grounded Cyber Combat Boots)
 *   - Ground Holographic Projector Stage with Grid Projections & Concentric Light Rings
 * - Wardrobe & Outfits Engine:
 *   - "cyber": High-Tech Titanium Exoskeleton Armor with Chrome Hydraulics & Neon Conduits
 *   - "student": School Uniform Blazer, Shirt Collar, Red Necktie, Trousers & Dress Shoes
 *   - "scientist": White Research Lab Coat, Stethoscope, Smart Glasses, ID Badge & Tailored Slacks
 *   - "hoodie": Urban Streetwear Hoodie, Kangaroo Pocket, Tech Denim Jeans & High-Top Sneakers
 *   - "astronaut": Pressurized Cosmic EVA Space Suit with Gold Oxygen Valves, Knee Ribs & Moon Boots
 * - Interactive Gestures & Actions:
 *   - "hello": Cheerful hand wave greeting
 *   - "bye": Gentle farewell wave
 *   - "hifi": High-Five interactive stance & clap
 *   - "kiss": Blows a sweet flying kiss with floating glowing 3D heart particles!
 *   - "salute": Crisp military/mecha salute standing at attention
 * - Camera Controls:
 *   - 🎥 FULL View: Perfectly frames entire humanoid robot from head down to two legs & boots
 *   - 🦵 LEGS View: Zooms in directly on the dual articulated mechanical legs & cyber boots
 *   - 👁️ EYES View: Close-up on clear glowing expressive eyes and facial structure
 *   - ✋ HANDS View: Close-up on 5-digit articulated mechanical hands
 *   - 🔄 ORBIT Mode: Continuous 360-degree rotation around the humanoid model
 *   - Mouse Wheel: Smooth cursor-centered zoom in / out
 *   - Mouse Drag: 360-degree manual orbit around the robot
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
    this.torsoGroup = null;
    this.legsGroup = null;
    this.faceNose = null;
    this.faceLips = null;
    this.speechLED = null;
    this.leftEye = null;
    this.rightEye = null;
    this.leftBrow = null;
    this.rightBrow = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftFingers = [];
    this.rightFingers = [];
    this.leftLeg = null;
    this.rightLeg = null;
    this.coreMesh = null;
    this.coreLight = null;
    this.holoStage = null;

    // Wardrobe Outfits Container & Active Outfit
    this.wardrobeGroup = null;
    this.currentOutfit = "cyber"; // 'cyber', 'student', 'scientist', 'hoodie', 'astronaut'
    this.outfitMeshes = {};

    // Camera Orbit & Cursor Zoom Parameters (Framed to show head, torso, arms AND two full legs)
    this.cameraDistance = 4.85;
    this.targetCameraDistance = 4.85;
    this.cameraRotationX = 0.08;
    this.cameraRotationY = 0;
    this.targetRotationX = 0.08;
    this.targetRotationY = 0;
    this.cameraLookTarget = new THREE.Vector3(0, -0.05, 0);

    // Mouse Drag State
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };

    // Floating 3D Hearts for Kiss Action
    this.heartParticles = [];

    // Current Action & Animation Timers
    this.currentAction = null;
    this.actionTimer = 0;
    this.isHifiReady = false;

    // Orbit & Stage Toggles
    this.isOrbiting = false;
    this.holoStageVisible = true;

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
        joint: 0x334155,
        skin: 0xf1f5f9
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
        joint: 0x451a03,
        skin: 0x334155
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
        joint: 0x3b0764,
        skin: 0x27272a
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
        joint: 0x475569,
        skin: 0xffffff
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
        joint: 0x14532d,
        skin: 0x064e3b
      }
    };

    // State & Tracking
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.expression = "idle";
    this.isBlinking = false;
    this.isPoked = false;
    this.isOverdrive = false;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 500;
    const height = this.container.clientHeight || 500;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera (Framed with vertical FOV to display full humanoid body & two legs)
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    this.updateCameraPosition();

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

    // 6. Build the Complete Humanoid Robot System with Head, Torso, Arms, and TWO LEGS
    this.buildHumanoidRobot();

    // 7. Setup Cursor Orbit & Zoom Event Listeners
    this.setupInteractions();

    // 8. Start Animation Loop
    this.animate();
  }

  setupLights() {
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    this.keyLight.position.set(4, 6, 5);
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    this.rimLight.position.set(-4, 3, -3);
    this.scene.add(this.rimLight);

    this.coreLight = new THREE.PointLight(0x38bdf8, 2.2, 4);
    this.coreLight.position.set(0, 0.1, 0.6);
    this.scene.add(this.coreLight);

    // Dedicated lower ground light to illuminate the two legs and feet
    this.groundLight = new THREE.PointLight(0x38bdf8, 1.2, 3);
    this.groundLight.position.set(0, -1.1, 0.8);
    this.scene.add(this.groundLight);
  }

  initMaterials() {
    const p = this.themes[this.currentTheme];

    this.matArmor = new THREE.MeshStandardMaterial({
      color: p.armor,
      roughness: 0.25,
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
      roughness: 0.08,
      metalness: 0.98
    });

    // Wardrobe Specific Materials
    this.matSuitNavy = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65 });
    this.matShirtWhite = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    this.matTieRed = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, emissive: 0x991b1b, emissiveIntensity: 0.2 });
    this.matLabCoat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    this.matHoodie = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 });
    this.matJeans = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 });
    this.matSpaceGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });
    this.matHeart = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.8 });
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
    if (this.groundLight) this.groundLight.color.setHex(p.light);
    if (this.leftEyeLight) this.leftEyeLight.color.setHex(p.light);
    if (this.rightEyeLight) this.rightEyeLight.color.setHex(p.light);
  }

  buildHumanoidRobot() {
    this.robotGroup = new THREE.Group();
    this.scene.add(this.robotGroup);

    // 1. Humanoid Head with Clear 3D Nose, Eyes, Mouth & Brows
    this.buildHumanoidHead();

    // 2. Humanoid Torso & Quantum Core Arc Reactor
    this.buildHumanoidTorso();

    // 3. Two Articulated Arms with 5-Digit Hands
    this.buildHumanoidArmsAndHands();

    // 4. TWO REAL ARTICULATED HUMANOID LEGS (Thighs, Knee Caps, Calves, Ankles, Boots)
    this.buildHumanoidLegs();

    // 5. Modular Wardrobe Outfits (Student, Scientist, Hoodie, Astronaut, Cyber)
    this.buildWardrobeOutfits();

    // 6. Holographic Ground Platform
    this.buildHoloPlatform();
  }

  buildHumanoidHead() {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.78, 0);

    // Humanoid Head Sculpt (Cranium with jaw, chin, cheeks)
    const craniumGeo = new THREE.SphereGeometry(0.58, 32, 32);
    craniumGeo.scale(0.92, 1.05, 0.95);
    const cranium = new THREE.Mesh(craniumGeo, this.matArmor);
    this.headGroup.add(cranium);

    // Sculpted Humanoid Jaw & Chin
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.32), this.matArmor);
    jaw.position.set(0, -0.26, 0.12);
    this.headGroup.add(jaw);

    const chin = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.14, 16), this.matChassis);
    chin.position.set(0, -0.35, 0.24);
    chin.rotation.x = 0.3;
    this.headGroup.add(chin);

    // Recessed High-Contrast Visor Faceplate
    const visorGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.38, 32, 1, false, -Math.PI / 2.3, (Math.PI * 2) / 2.3);
    const visor = new THREE.Mesh(visorGeo, this.matVisor);
    visor.rotation.y = Math.PI / 2;
    visor.position.set(0, 0.02, 0.22);
    this.headGroup.add(visor);

    // --- CLEAR 3D HUMAN-LIKE NOSE ---
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, -0.04, 0.44);

    // Nose Bridge (Dorsal ridge extending down from between the eyes)
    const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.042, 0.14, 8), this.matArmor);
    noseBridge.rotation.x = 0.35;
    noseBridge.position.set(0, 0.04, 0.02);
    noseGroup.add(noseBridge);

    // Defined Humanoid Nose Tip & Nostrils
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), this.matChrome);
    noseTip.scale.set(1.1, 0.8, 1.2);
    noseTip.position.set(0, -0.03, 0.06);
    noseGroup.add(noseTip);

    // Left and Right Nostril Flares
    [-0.035, 0.035].forEach((nx) => {
      const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), this.matChassis);
      nostril.position.set(nx, -0.045, 0.04);
      noseGroup.add(nostril);
    });

    this.faceNose = noseGroup;
    this.headGroup.add(noseGroup);

    // --- CLEAR 3D GLOWING EYES ---
    this.leftEye = this.createHumanoidEye(-0.20);
    this.rightEye = this.createHumanoidEye(0.20);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // Humanoid Eyebrow Plates (Emote dynamically)
    this.leftBrow = this.createEyebrow(-0.20, true);
    this.rightBrow = this.createEyebrow(0.20, false);
    this.headGroup.add(this.leftBrow);
    this.headGroup.add(this.rightBrow);

    // --- HUMANOID LIPS & SPEECH BAR ---
    const lipsGroup = new THREE.Group();
    lipsGroup.position.set(0, -0.22, 0.42);

    // Upper Lip Contour
    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.024, 0.04), this.matArmor);
    upperLip.position.set(0, 0.015, 0);
    lipsGroup.add(upperLip);

    // Lower Lip
    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.024, 0.04), this.matArmor);
    lowerLip.position.set(0, -0.015, 0);
    lipsGroup.add(lowerLip);

    // Acoustic Speech Light Bar (Glows and pulses when speaking)
    this.speechLED = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.012, 0.02), this.matAccent);
    this.speechLED.position.set(0, 0, 0.018);
    lipsGroup.add(this.speechLED);

    this.faceLips = lipsGroup;
    this.headGroup.add(lipsGroup);

    // Lateral Audio Sensors / Human-like Ears
    [-0.56, 0.56].forEach((ex) => {
      const earBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 16), this.matChassis);
      earBase.rotation.z = Math.PI / 2;
      earBase.position.set(ex, 0.02, 0);
      this.headGroup.add(earBase);

      const earTorus = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.018, 12, 24), this.matAccent);
      earTorus.rotation.y = Math.PI / 2;
      earTorus.position.set(ex, 0.02, 0);
      this.headGroup.add(earTorus);
    });

    // Neck Column
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.18, 20), this.matJoint);
    neck.position.set(0, -0.56, 0);
    this.headGroup.add(neck);

    this.robotGroup.add(this.headGroup);
  }

  createHumanoidEye(xPos) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(xPos, 0.06, 0.44);

    // Recessed Chrome Orbital Socket
    const socketRing = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 16, 32), this.matChrome);
    eyeGroup.add(socketRing);

    // Glowing Neon Aperture Iris
    const irisRing = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.016, 16, 32), this.matAccent);
    irisRing.position.set(0, 0, 0.01);
    eyeGroup.add(irisRing);

    // Clear Convex Glass Lens
    const lensGeo = new THREE.SphereGeometry(0.095, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const lens = new THREE.Mesh(lensGeo, this.matEyeLens);
    lens.position.set(0, 0, 0.018);
    eyeGroup.add(lens);

    // Bright Expressive Pupil (Gaze tracks cursor)
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 20), this.matPupil);
    pupil.position.set(0, 0, 0.025);
    eyeGroup.add(pupil);

    // Dedicated Point Light for dynamic facial glow
    const eyeLight = new THREE.PointLight(this.themes[this.currentTheme].light, 0.9, 1.3);
    eyeLight.position.set(0, 0, 0.09);
    eyeGroup.add(eyeLight);

    if (xPos < 0) this.leftEyeLight = eyeLight;
    else this.rightEyeLight = eyeLight;

    // Specular Catchlight
    const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    catchlight.position.set(0.028, 0.028, 0.082);
    eyeGroup.add(catchlight);

    // Smooth Articulated Eyelids
    const lidGeo = new THREE.SphereGeometry(0.125, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const eyelid = new THREE.Mesh(lidGeo, this.matChassis);
    eyelid.position.set(0, 0, 0.03);
    eyelid.rotation.x = -Math.PI / 2; // Default open
    eyeGroup.add(eyelid);

    eyeGroup.userData = { eyelid: eyelid, pupil: pupil, catchlight: catchlight };
    return eyeGroup;
  }

  createEyebrow(xPos, isLeft) {
    const brow = new THREE.Group();
    brow.position.set(xPos, 0.20, 0.44);

    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.03, 0.05), this.matArmor);
    plate.rotation.z = isLeft ? -0.1 : 0.1;
    brow.add(plate);

    return brow;
  }

  buildHumanoidTorso() {
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.15, 0);

    // Chest & Pectoral Armor
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.42, 0.24), this.matArmor);
    chest.position.set(0, 0.08, 0.12);
    this.torsoGroup.add(chest);

    // Central Arc Reactor Core
    const coreRim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 16, 32), this.matChrome);
    coreRim.position.set(0, 0.08, 0.25);
    this.torsoGroup.add(coreRim);

    this.coreMesh = new THREE.Mesh(new THREE.CircleGeometry(0.105, 32), this.matAccent);
    this.coreMesh.position.set(0, 0.08, 0.26);
    this.torsoGroup.add(this.coreMesh);

    // Spine Column & Back Plating
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.65, 16), this.matJoint);
    spine.position.set(0, -0.05, -0.05);
    this.torsoGroup.add(spine);

    // Humanoid Waist & Abdominal Actuators
    [-0.14, -0.24].forEach((y) => {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.065, 0.20), this.matChassis);
      rib.position.set(0, y, 0.1);
      this.torsoGroup.add(rib);
    });

    // Pelvis / Hip Chassis Connecting to Legs
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.18, 0.24), this.matArmor);
    pelvis.position.set(0, -0.38, 0.06);
    this.torsoGroup.add(pelvis);

    // Dual Pelvic Hip Sockets
    [-0.22, 0.22].forEach((px) => {
      const hipSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16), this.matJoint);
      hipSocket.rotation.z = Math.PI / 2;
      hipSocket.position.set(px, -0.38, 0.06);
      this.torsoGroup.add(hipSocket);
    });

    this.robotGroup.add(this.torsoGroup);
  }

  buildHumanoidArmsAndHands() {
    this.leftArm = this.createHumanoidArm(-0.52, "left");
    this.rightArm = this.createHumanoidArm(0.52, "right");
    this.robotGroup.add(this.leftArm.group);
    this.robotGroup.add(this.rightArm.group);
  }

  createHumanoidArm(shoulderX, side) {
    const isLeft = side === "left";
    const armGroup = new THREE.Group();
    armGroup.position.set(shoulderX, 0.32, 0);

    // Shoulder Ball Joint & Armored Epaulet
    const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), this.matJoint);
    armGroup.add(shoulderBall);

    const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), this.matArmor);
    shoulderCap.scale.set(1.1, 0.85, 1);
    shoulderCap.position.set(isLeft ? -0.05 : 0.05, 0.04, 0);
    armGroup.add(shoulderCap);

    // Upper Arm (Bicep/Tricep)
    const upperArm = new THREE.Group();
    upperArm.position.set(isLeft ? -0.04 : 0.04, -0.04, 0);
    upperArm.rotation.x = 0.25;
    upperArm.rotation.z = isLeft ? 0.12 : -0.12;
    armGroup.add(upperArm);

    const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.32, 16), this.matChassis);
    bicep.position.set(0, -0.16, 0);
    upperArm.add(bicep);

    // Elbow Hinge Joint
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.32, 0);
    upperArm.add(elbow);

    const elbowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), this.matChrome);
    elbow.add(elbowMesh);

    // Forearm angled forward
    const forearm = new THREE.Group();
    forearm.rotation.x = -1.1; // bent forward in active conversational pose
    forearm.rotation.y = isLeft ? 0.35 : -0.35;
    elbow.add(forearm);

    const forearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.30, 16), this.matArmor);
    forearmMesh.position.set(0, -0.15, 0);
    forearm.add(forearmMesh);

    // Wrist Joint
    const wrist = new THREE.Group();
    wrist.position.set(0, -0.30, 0);
    forearm.add(wrist);

    const wristMesh = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 14), this.matJoint);
    wrist.add(wristMesh);

    // CLEAR 5-DIGIT ARTICULATED ROBOT HAND
    const hand = this.createHumanoidHand(side);
    hand.position.set(0, -0.08, 0);
    hand.rotation.x = -0.25;
    hand.rotation.y = isLeft ? 0.4 : -0.4;
    wrist.add(hand);

    return {
      group: armGroup,
      upperArm: upperArm,
      elbow: elbow,
      forearm: forearm,
      wrist: wrist,
      hand: hand,
      side: side
    };
  }

  createHumanoidHand(side) {
    const isLeft = side === "left";
    const handGroup = new THREE.Group();

    // Palm Chassis Base
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.055), this.matArmor);
    handGroup.add(palm);

    // Glowing Central Palm Repulsor Core
    const palmRim = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.01, 16, 24), this.matChrome);
    palmRim.position.set(0, 0, 0.03);
    handGroup.add(palmRim);

    const palmCore = new THREE.Mesh(new THREE.CircleGeometry(0.033, 16), this.matAccent);
    palmCore.position.set(0, 0, 0.031);
    handGroup.add(palmCore);

    const fingers = [];

    // 4 Articulated Fingers along natural curved knuckle arch
    const specs = [
      { name: "index",  x: isLeft ? 0.052 : -0.052, len: 0.13,  yArch: 0.005 },
      { name: "middle", x: isLeft ? 0.018 : -0.018, len: 0.145, yArch: 0.012 }, // longest
      { name: "ring",   x: isLeft ? -0.018 : 0.018, len: 0.135, yArch: 0.006 },
      { name: "pinky",  x: isLeft ? -0.052 : 0.052, len: 0.11,  yArch: -0.006 } // shortest
    ];

    specs.forEach((s) => {
      const fGroup = new THREE.Group();
      fGroup.position.set(s.x, -0.08 + s.yArch, 0);

      // Knuckle Joint
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.017, 10, 10), this.matChrome);
      fGroup.add(knuckle);

      // Proximal Phalanx
      const p1Len = s.len * 0.44;
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.011, p1Len, 8), this.matArmor);
      p1.position.set(0, -p1Len / 2, 0.005);
      fGroup.add(p1);

      // Interphalangeal Joint
      const pip = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), this.matJoint);
      pip.position.set(0, -p1Len, 0.008);
      fGroup.add(pip);

      // Intermediate & Distal Phalanx
      const p2Len = s.len * 0.40;
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.009, p2Len, 8), this.matChassis);
      p2.position.set(0, -p1Len - p2Len / 2, 0.016);
      p2.rotation.x = 0.15;
      fGroup.add(p2);

      // Glowing Cyber Fingertip
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), this.matAccent);
      tip.position.set(0, -p1Len - p2Len - 0.005, 0.024);
      fGroup.add(tip);

      handGroup.add(fGroup);
      fingers.push(fGroup);
    });

    // Opposable Articulated Thumb
    const thumbGroup = new THREE.Group();
    const tx = isLeft ? 0.095 : -0.095;
    thumbGroup.position.set(tx, -0.01, 0.02);
    thumbGroup.rotation.z = isLeft ? -0.55 : 0.55;
    thumbGroup.rotation.y = isLeft ? -0.45 : 0.45;
    thumbGroup.rotation.x = 0.2;

    const tKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 10), this.matChrome);
    thumbGroup.add(tKnuckle);

    const tp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.055, 8), this.matArmor);
    tp1.position.set(0, -0.028, 0);
    thumbGroup.add(tp1);

    const tp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 0.045, 8), this.matChassis);
    tp2.position.set(0, -0.076, 0.012);
    thumbGroup.add(tp2);

    const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), this.matAccent);
    thumbTip.position.set(0, -0.10, 0.018);
    thumbGroup.add(thumbTip);

    handGroup.add(thumbGroup);
    fingers.push(thumbGroup);

    if (isLeft) this.leftFingers = fingers;
    else this.rightFingers = fingers;

    return handGroup;
  }

  // --- TWO REAL ARTICULATED HUMANOID LEGS ---
  buildHumanoidLegs() {
    this.legsGroup = new THREE.Group();
    this.leftLeg = this.createHumanoidLeg(-0.22, "left");
    this.rightLeg = this.createHumanoidLeg(0.22, "right");
    this.legsGroup.add(this.leftLeg.group);
    this.legsGroup.add(this.rightLeg.group);
    this.robotGroup.add(this.legsGroup);
  }

  createHumanoidLeg(hipX, side) {
    const isLeft = side === "left";
    const legGroup = new THREE.Group();
    legGroup.position.set(hipX, -0.22, 0);

    // 1. Hip Joint Assembly & Pelvic Socket
    const hipSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 16), this.matJoint);
    hipSocket.rotation.z = Math.PI / 2;
    legGroup.add(hipSocket);

    const hipBall = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 16), this.matChrome);
    legGroup.add(hipBall);

    const hipRing = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.016, 12, 24), this.matAccent);
    hipRing.rotation.y = Math.PI / 2;
    legGroup.add(hipRing);

    // Outer Hip Armor Shield
    const hipArmor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.18), this.matArmor);
    hipArmor.position.set(isLeft ? -0.06 : 0.06, -0.02, 0);
    legGroup.add(hipArmor);

    // 2. Thigh Group (Femur with Armor & Actuators)
    const thighGroup = new THREE.Group();
    legGroup.add(thighGroup);

    // Structural Femur Cylinder
    const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.44, 16), this.matChassis);
    femur.position.set(0, -0.24, 0);
    thighGroup.add(femur);

    // Front Quadricep Armor Shield
    const quadShield = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.38, 0.06), this.matArmor);
    quadShield.position.set(0, -0.24, 0.075);
    thighGroup.add(quadShield);

    // Glowing Neon Energy Conduit Strip on Quadricep
    const quadConduit = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.30, 0.015), this.matAccent);
    quadConduit.position.set(0, -0.24, 0.108);
    thighGroup.add(quadConduit);

    // Lateral Outer Thigh Armor
    const latThighArmor = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.12), this.matArmor);
    latThighArmor.position.set(isLeft ? -0.09 : 0.09, -0.24, 0);
    thighGroup.add(latThighArmor);

    // Rear Hamstring Hydraulic Cylinder
    const hamstringCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.30, 12), this.matJoint);
    hamstringCylinder.position.set(0, -0.24, -0.075);
    thighGroup.add(hamstringCylinder);

    const hamstringPiston = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 12), this.matChrome);
    hamstringPiston.position.set(0, -0.24, -0.075);
    thighGroup.add(hamstringPiston);

    // 3. Knee Joint Assembly (Knee Cap & Hinge)
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.48, 0);
    thighGroup.add(kneeGroup);

    // Knee Hinge Core
    const kneeHinge = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 16), this.matJoint);
    kneeGroup.add(kneeHinge);

    // Lateral Chrome Pivot Studs
    const kneePins = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.19, 16), this.matChrome);
    kneePins.rotation.z = Math.PI / 2;
    kneeGroup.add(kneePins);

    // Heavy Chrome Patellar Knee Cap
    const kneeCapGeo = new THREE.SphereGeometry(0.088, 16, 16);
    kneeCapGeo.scale(1.0, 1.15, 1.3);
    const kneeCap = new THREE.Mesh(kneeCapGeo, this.matChrome);
    kneeCap.position.set(0, 0, 0.025);
    kneeGroup.add(kneeCap);

    // Glowing Neon Energy Halo Ring on Knee Cap
    const kneeHalo = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 12, 24), this.matAccent);
    kneeHalo.position.set(0, 0, 0.095);
    kneeGroup.add(kneeHalo);

    // 4. Shin & Calf Group (Tibia with Armor, Cooling Vents & Shocks)
    const calfGroup = new THREE.Group();
    kneeGroup.add(calfGroup);

    // Structural Tibia Cylinder
    const shinCore = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.062, 0.46, 16), this.matChassis);
    shinCore.position.set(0, -0.25, 0);
    calfGroup.add(shinCore);

    // Sculpted Front Shin Armor Plate
    const shinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.40, 0.06), this.matArmor);
    shinGuard.position.set(0, -0.25, 0.07);
    calfGroup.add(shinGuard);

    // Glowing Shin Energy Conduit
    const shinConduit = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.34, 0.015), this.matAccent);
    shinConduit.position.set(0, -0.25, 0.102);
    calfGroup.add(shinConduit);

    // Rear Calf Mechanical Thruster Vents / Cooling Fins
    const calfVents = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.24, 0.08), this.matArmor);
    calfVents.position.set(0, -0.22, -0.065);
    calfGroup.add(calfVents);

    // Twin Posterior Chrome Suspension Struts
    [-0.035, 0.035].forEach((sx) => {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.38, 12), this.matChrome);
      strut.position.set(sx, -0.25, -0.04);
      calfGroup.add(strut);
    });

    // 5. Dual-Axis Ankle Gimbal Joint
    const ankleGroup = new THREE.Group();
    ankleGroup.position.set(0, -0.50, 0);
    calfGroup.add(ankleGroup);

    const ankleBall = new THREE.Mesh(new THREE.SphereGeometry(0.062, 14, 14), this.matJoint);
    ankleGroup.add(ankleBall);

    const ankleRings = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.15, 16), this.matChrome);
    ankleRings.rotation.z = Math.PI / 2;
    ankleGroup.add(ankleRings);

    // 6. Articulated Cyber Combat Boot Planted Firmly on Ground
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -0.06, 0.05);
    // Slight heroic outward stance rotation
    footGroup.rotation.y = isLeft ? 0.07 : -0.07;
    ankleGroup.add(footGroup);

    // Boot Upper Armor
    const bootUpper = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.085, 0.28), this.matArmor);
    bootUpper.position.set(0, 0, 0.03);
    footGroup.add(bootUpper);

    // Reinforced Chrome Toe Guard
    const toeGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.145, 16), this.matChrome);
    toeGuard.rotation.z = Math.PI / 2;
    toeGuard.position.set(0, -0.01, 0.15);
    footGroup.add(toeGuard);

    // Rear Heel Chassis & Chrome Stabilizer Spur
    const heelChassis = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.08, 0.10), this.matChassis);
    heelChassis.position.set(0, 0, -0.08);
    footGroup.add(heelChassis);

    const heelSpur = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), this.matChrome);
    heelSpur.position.set(0, -0.02, -0.13);
    footGroup.add(heelSpur);

    // Heavy Traction Ground Contact Sole Plate
    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.03, 0.31), this.matChassis);
    sole.position.set(0, -0.046, 0.04);
    footGroup.add(sole);

    // Dual Glowing Neon Cyber Energy Treads on Sole
    const soleTread = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.014, 0.32), this.matAccent);
    soleTread.position.set(0, -0.054, 0.04);
    footGroup.add(soleTread);

    return {
      group: legGroup,
      thigh: thighGroup,
      knee: kneeGroup,
      calf: calfGroup,
      ankle: ankleGroup,
      foot: footGroup,
      side: side
    };
  }

  buildWardrobeOutfits() {
    this.wardrobeGroup = new THREE.Group();
    this.robotGroup.add(this.wardrobeGroup);

    // --- 1. STUDENT SCHOOL UNIFORM ---
    const studentGroup = new THREE.Group();

    // Dark Navy School Blazer Jacket
    const blazer = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.46, 0.30), this.matSuitNavy);
    blazer.position.set(0, 0.24, 0.12);
    studentGroup.add(blazer);

    // White Shirt Inner V
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.31), this.matShirtWhite);
    shirt.position.set(0, 0.27, 0.12);
    studentGroup.add(shirt);

    // Red Student Necktie
    const tie = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.28, 4), this.matTieRed);
    tie.position.set(0, 0.22, 0.30);
    tie.rotation.x = Math.PI;
    studentGroup.add(tie);

    // Golden Student Crest on Left Pocket
    const crest = new THREE.Mesh(new THREE.CircleGeometry(0.038, 16), this.matSpaceGold);
    crest.position.set(-0.20, 0.28, 0.28);
    studentGroup.add(crest);

    // Dark Uniform Pants Overlays for Both Legs
    [-0.22, 0.22].forEach((px) => {
      const pantsThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.46, 16), this.matSuitNavy);
      pantsThigh.position.set(px, -0.46, 0);
      studentGroup.add(pantsThigh);

      const pantsCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.48, 16), this.matSuitNavy);
      pantsCalf.position.set(px, -0.96, 0);
      studentGroup.add(pantsCalf);

      // Polished Black Formal Oxford Shoes
      const dressShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.30), this.matChassis);
      dressShoe.position.set(px, -1.26, 0.05);
      studentGroup.add(dressShoe);
    });

    studentGroup.visible = false;
    this.wardrobeGroup.add(studentGroup);
    this.outfitMeshes["student"] = studentGroup;

    // --- 2. SCIENTIST LAB COAT ---
    const scientistGroup = new THREE.Group();

    // Long White Open Lab Coat (extending down past hips)
    const labCoat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.70, 0.30), this.matLabCoat);
    labCoat.position.set(0, 0.10, 0.12);
    scientistGroup.add(labCoat);

    // ID Badge Pinned to Chest
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.13, 0.02), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    badge.position.set(0.18, 0.28, 0.28);
    scientistGroup.add(badge);

    // Smart Research Spectacles / Glasses on Face
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.84, 0.54);
    [-0.18, 0.18].forEach((gx) => {
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 12, 24), this.matSpaceGold);
      frame.position.set(gx, 0, 0);
      glassesGroup.add(frame);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.014, 0.02), this.matSpaceGold);
    bridge.position.set(0, 0, 0);
    glassesGroup.add(bridge);
    scientistGroup.add(glassesGroup);

    // Formal Slate Tailored Trousers for Both Legs
    [-0.22, 0.22].forEach((sx) => {
      const labPantsThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.092, 0.46, 16), this.matJoint);
      labPantsThigh.position.set(sx, -0.46, 0);
      scientistGroup.add(labPantsThigh);

      const labPantsCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.078, 0.48, 16), this.matJoint);
      labPantsCalf.position.set(sx, -0.96, 0);
      scientistGroup.add(labPantsCalf);

      // Cleanroom White Anti-Static Lab Shoes
      const cleanShoe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.30), this.matLabCoat);
      cleanShoe.position.set(sx, -1.26, 0.05);
      scientistGroup.add(cleanShoe);
    });

    scientistGroup.visible = false;
    this.wardrobeGroup.add(scientistGroup);
    this.outfitMeshes["scientist"] = scientistGroup;

    // --- 3. STREETWEAR HOODIE ---
    const hoodieGroup = new THREE.Group();

    // Oversized Casual Streetwear Hoodie
    const hoodieBody = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.50, 0.34), this.matHoodie);
    hoodieBody.position.set(0, 0.22, 0.12);
    hoodieGroup.add(hoodieBody);

    // Kangaroo Front Pocket
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    pocket.position.set(0, 0.10, 0.30);
    hoodieGroup.add(pocket);

    // Puffed Hood Collar draped behind neck
    const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.09, 12, 24), this.matHoodie);
    hoodCollar.position.set(0, 0.50, -0.04);
    hoodCollar.rotation.x = Math.PI / 2.6;
    hoodieGroup.add(hoodCollar);

    // Denim Tech Jeans Overlays for Both Legs
    [-0.22, 0.22].forEach((jx) => {
      const denimThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.098, 0.46, 16), this.matJeans);
      denimThigh.position.set(jx, -0.46, 0);
      hoodieGroup.add(denimThigh);

      const denimCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.084, 0.48, 16), this.matJeans);
      denimCalf.position.set(jx, -0.96, 0);
      hoodieGroup.add(denimCalf);

      // Streetwear High-Top Sneaker
      const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.085, 0.31), this.matShirtWhite);
      sneaker.position.set(jx, -1.26, 0.05);
      hoodieGroup.add(sneaker);

      const sneakerSole = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.32), this.matAccent);
      sneakerSole.position.set(jx, -1.30, 0.05);
      hoodieGroup.add(sneakerSole);
    });

    hoodieGroup.visible = false;
    this.wardrobeGroup.add(hoodieGroup);
    this.outfitMeshes["hoodie"] = hoodieGroup;

    // --- 4. ASTRONAUT SPACE SUIT ---
    const astroGroup = new THREE.Group();

    // Heavy Pressurized EVA Torso Harness
    const astroHarness = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.48, 0.36), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 }));
    astroHarness.position.set(0, 0.22, 0.12);
    astroGroup.add(astroHarness);

    // Dual Gold Life Support Oxygen Valves
    [-0.16, 0.16].forEach((vx) => {
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.05, 16), this.matSpaceGold);
      valve.rotation.x = Math.PI / 2;
      valve.position.set(vx, 0.28, 0.31);
      astroGroup.add(valve);
    });

    // Space Insignia on Sternum
    const insignia = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.02), this.matTieRed);
    insignia.position.set(0, 0.14, 0.31);
    astroGroup.add(insignia);

    // Heavy Life Support Backpack behind shoulders
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.50, 0.24), this.matChassis);
    backpack.position.set(0, 0.22, -0.23);
    astroGroup.add(backpack);

    // Pressurized Space Suit Legs for Both Legs
    [-0.22, 0.22].forEach((ax) => {
      const astroThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.105, 0.46, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      astroThigh.position.set(ax, -0.46, 0);
      astroGroup.add(astroThigh);

      // Gold Knee Compression Joint Ring
      const kneeRing = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.016, 12, 24), this.matSpaceGold);
      kneeRing.rotation.x = Math.PI / 2;
      kneeRing.position.set(ax, -0.70, 0);
      astroGroup.add(kneeRing);

      const astroCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.09, 0.48, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
      astroCalf.position.set(ax, -0.96, 0);
      astroGroup.add(astroCalf);

      // Heavy Cosmic Moon Boots
      const moonBoot = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.09, 0.32), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2 }));
      moonBoot.position.set(ax, -1.26, 0.05);
      astroGroup.add(moonBoot);
    });

    astroGroup.visible = false;
    this.wardrobeGroup.add(astroGroup);
    this.outfitMeshes["astronaut"] = astroGroup;

    // --- 5. CYBER MECHA (Default, built-in) ---
    this.outfitMeshes["cyber"] = null;
  }

  setOutfit(outfitKey) {
    if (!["cyber", "student", "scientist", "hoodie", "astronaut"].includes(outfitKey)) return;
    this.currentOutfit = outfitKey;

    // Hide all outfit meshes
    Object.keys(this.outfitMeshes).forEach((key) => {
      if (this.outfitMeshes[key]) {
        this.outfitMeshes[key].visible = false;
      }
    });

    // Show chosen outfit
    if (this.outfitMeshes[outfitKey]) {
      this.outfitMeshes[outfitKey].visible = true;
    }

    // Play transformation SFX
    if (window.AudioEngine) {
      if (window.AudioEngine.playChime) window.AudioEngine.playChime();
      else if (window.AudioEngine.playRobotChirp) window.AudioEngine.playRobotChirp();
    }
  }

  buildHoloPlatform() {
    this.holoStage = new THREE.Group();
    this.holoStage.position.set(0, -1.33, 0);

    // Main Hologram Projector Ring
    const baseDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.06, 36), this.matChassis);
    this.holoStage.add(baseDisk);

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.025, 16, 40), this.matChrome);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.set(0, 0.035, 0);
    this.holoStage.add(outerRing);

    const innerGlowRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.02, 16, 40), this.matAccent);
    innerGlowRing.rotation.x = Math.PI / 2;
    innerGlowRing.position.set(0, 0.036, 0);
    this.holoStage.add(innerGlowRing);

    // Dual Foot Contact Target Rings directly beneath each foot
    [-0.22, 0.22].forEach((fx) => {
      const footTarget = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 12, 24), this.matAccent);
      footTarget.rotation.x = Math.PI / 2;
      footTarget.position.set(fx, 0.037, 0.05);
      this.holoStage.add(footTarget);
    });

    this.scene.add(this.holoStage);
  }

  // --- INTERACTIVE ACTIONS & GESTURES ---

  doAction(actionName) {
    this.currentAction = actionName;
    this.actionTimer = 0;

    if (actionName === "hello") {
      this.setExpression("happy");
      if (window.AudioEngine) {
        window.AudioEngine.playRobotChirp();
        window.AudioEngine.speak("Hello there! Wonderful to meet you!");
      }
    } else if (actionName === "bye") {
      this.setExpression("happy");
      if (window.AudioEngine) {
        window.AudioEngine.playRobotChirp();
        window.AudioEngine.speak("Goodbye! Have an extraordinary study session!");
      }
    } else if (actionName === "hifi") {
      this.setExpression("happy");
      this.isHifiReady = true;
      if (window.AudioEngine) {
        window.AudioEngine.playRobotChirp();
        window.AudioEngine.speak("Give me a high-five! Tap my hand or screen!");
      }
    } else if (actionName === "kiss") {
      this.setExpression("happy");
      this.spawnHeartParticles();
      if (window.AudioEngine) {
        window.AudioEngine.playRobotChirp();
        window.AudioEngine.speak("Sending you lots of love and good energy!");
      }
    } else if (actionName === "salute") {
      this.setExpression("idle");
      if (window.AudioEngine) {
        window.AudioEngine.playServoHum();
        window.AudioEngine.speak("Standing at attention! System fully operational!");
      }
    }
  }

  spawnHeartParticles() {
    for (let i = 0; i < 7; i++) {
      const heartGeo = new THREE.SphereGeometry(0.045, 12, 12);
      heartGeo.scale(1.1, 1.2, 0.6);
      const heart = new THREE.Mesh(heartGeo, this.matHeart);
      heart.position.set(0.1 + (Math.random() - 0.5) * 0.15, 0.6 + Math.random() * 0.2, 0.5);
      heart.userData = {
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.35 + Math.random() * 0.45,
        vz: 0.6 + Math.random() * 0.5,
        life: 1.0
      };
      this.heartParticles.push(heart);
      this.scene.add(heart);
    }
  }

  // --- CURSOR ORBIT, DRAG & ZOOM CONTROLS ---

  setupInteractions() {
    // 1. Mouse Drag to Orbit 360-Degrees Around Humanoid Model
    this.container.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };

      // High-five clap interaction if in hifi action mode
      if (this.isHifiReady) {
        this.triggerHighFiveClap();
      }
    });

    window.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    window.addEventListener("mousemove", (e) => {
      const rect = this.container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Normalized coordinates (-1 to +1) for Head Inverse Kinematics
      this.mouse.targetX = (x / rect.width) * 2 - 1;
      this.mouse.targetY = -(y / rect.height) * 2 + 1;

      // Orbit Dragging
      if (this.isDragging) {
        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;

        this.targetRotationY += deltaX * 0.008;
        this.targetRotationX += deltaY * 0.008;

        // Clamp vertical pitch to prevent flipping
        this.targetRotationX = Math.max(-0.6, Math.min(0.6, this.targetRotationX));

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      }
    });

    // 2. Cursor Scroll Wheel Zoom (Smoothly Zoom In / Out)
    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.0025;
      this.targetCameraDistance += zoomDelta;
      // Clamp zoom limits: close macro inspection (1.6) to wide full view (6.5)
      this.targetCameraDistance = Math.max(1.6, Math.min(6.5, this.targetCameraDistance));
    }, { passive: false });

    // Double-click to reset view
    this.container.addEventListener("dblclick", () => {
      this.resetCameraView();
    });

    window.addEventListener("resize", () => this.onResize());
  }

  triggerHighFiveClap() {
    this.isHifiReady = false;
    if (window.AudioEngine) {
      if (window.AudioEngine.playClap) window.AudioEngine.playClap();
      else if (window.AudioEngine.playHydraulicClick) window.AudioEngine.playHydraulicClick();
    }
    this.rightArm.hand.rotation.x = 0.8;
    setTimeout(() => {
      this.rightArm.hand.rotation.x = -0.25;
      this.currentAction = null;
    }, 600);
  }

  resetCameraView() {
    this.targetCameraDistance = 4.85;
    this.targetRotationX = 0.08;
    this.targetRotationY = 0;
    this.cameraLookTarget.set(0, -0.05, 0);
  }

  setCameraView(mode) {
    if (mode === "command" || mode === "full") {
      this.targetCameraDistance = 4.85;
      this.targetRotationX = 0.08;
      this.targetRotationY = 0;
      this.cameraLookTarget.set(0, -0.05, 0);
    } else if (mode === "legs") {
      this.targetCameraDistance = 2.4;
      this.targetRotationX = -0.05;
      this.targetRotationY = 0;
      this.cameraLookTarget.set(0, -0.72, 0);
    } else if (mode === "eyes") {
      this.targetCameraDistance = 1.9;
      this.targetRotationX = 0.0;
      this.targetRotationY = 0;
      this.cameraLookTarget.set(0, 0.78, 0);
    } else if (mode === "hands") {
      this.targetCameraDistance = 2.1;
      this.targetRotationX = 0.15;
      this.targetRotationY = 0;
      this.cameraLookTarget.set(0, 0.05, 0);
    }
  }

  toggleOrbit() {
    this.isOrbiting = !this.isOrbiting;
    if (!this.isOrbiting) {
      this.resetCameraView();
    }
    return this.isOrbiting;
  }

  toggleHoloStage() {
    this.holoStageVisible = !this.holoStageVisible;
    if (this.holoStage) this.holoStage.visible = this.holoStageVisible;
    return this.holoStageVisible;
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
    if (!this.leftBrow || !this.rightBrow) return;

    if (expr === "happy") {
      this.leftBrow.rotation.z = -0.22;
      this.rightBrow.rotation.z = 0.22;
      this.leftBrow.position.y = 0.24;
      this.rightBrow.position.y = 0.24;
    } else if (expr === "surprised") {
      this.leftBrow.rotation.z = 0.0;
      this.rightBrow.rotation.z = 0.0;
      this.leftBrow.position.y = 0.28;
      this.rightBrow.position.y = 0.28;
    } else if (expr === "thinking") {
      this.leftBrow.rotation.z = -0.32;
      this.rightBrow.rotation.z = 0.08;
      this.leftBrow.position.y = 0.22;
      this.rightBrow.position.y = 0.26;
    } else {
      // Idle
      this.leftBrow.rotation.z = -0.1;
      this.rightBrow.rotation.z = 0.1;
      this.leftBrow.position.y = 0.20;
      this.rightBrow.position.y = 0.20;
    }
  }

  triggerOverdrive(duration = 3500) {
    this.isOverdrive = true;
    this.setExpression("surprised");
    setTimeout(() => {
      this.isOverdrive = false;
      this.setExpression("idle");
    }, duration);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  updateCameraPosition() {
    // Spherical orbit calculation based on user drag & zoom
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.08;
    this.cameraRotationX += (this.targetRotationX - this.cameraRotationX) * 0.08;
    this.cameraRotationY += (this.targetRotationY - this.cameraRotationY) * 0.08;

    const cx = this.cameraDistance * Math.sin(this.cameraRotationY) * Math.cos(this.cameraRotationX);
    const cy = this.cameraDistance * Math.sin(this.cameraRotationX) + this.cameraLookTarget.y;
    const cz = this.cameraDistance * Math.cos(this.cameraRotationY) * Math.cos(this.cameraRotationX);

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(this.cameraLookTarget);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // 1. Camera Orbit & Zoom Update
    if (this.isOrbiting) {
      this.targetRotationY += delta * 0.45;
    }
    this.updateCameraPosition();

    // 2. Mouse Damping for head IK
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    // 3. Head & Eyes Cursor Tracking
    if (this.headGroup && !this.isDragging) {
      this.headGroup.rotation.y = this.mouse.x * 0.45;
      this.headGroup.rotation.x = -this.mouse.y * 0.30;
    }

    if (this.leftEye && this.rightEye) {
      const gx = this.mouse.x * 0.035;
      const gy = this.mouse.y * 0.025;

      if (this.leftEye.userData.pupil) {
        this.leftEye.userData.pupil.position.x = gx;
        this.leftEye.userData.pupil.position.y = gy;
      }
      if (this.rightEye.userData.pupil) {
        this.rightEye.userData.pupil.position.x = gx;
        this.rightEye.userData.pupil.position.y = gy;
      }

      // Natural Eye Blinking
      const blink = Math.sin(time * 1.6);
      if (blink > 0.96) {
        this.leftEye.userData.eyelid.rotation.x = 0;
        this.rightEye.userData.eyelid.rotation.x = 0;
      } else {
        this.leftEye.userData.eyelid.rotation.x = -Math.PI / 2;
        this.rightEye.userData.eyelid.rotation.x = -Math.PI / 2;
      }
    }

    // 4. Subtle Humanoid Breathing & Idle Weight Shifting on Two Legs
    if (this.robotGroup) {
      const breath = Math.sin(time * 2.0) * 0.015;
      if (this.torsoGroup) this.torsoGroup.position.y = 0.15 + breath;
      if (this.headGroup) this.headGroup.position.y = 0.78 + breath;

      if (this.isPoked) {
        // Joyful bounce on legs
        const pokeBounce = Math.abs(Math.sin(time * 10)) * 0.08;
        this.robotGroup.position.y = pokeBounce;
        if (this.leftLeg && this.rightLeg) {
          this.leftLeg.knee.rotation.x = pokeBounce * 1.8;
          this.rightLeg.knee.rotation.x = pokeBounce * 1.8;
        }
      } else {
        this.robotGroup.position.y = 0;

        // Subtle realistic weight shift between left and right leg
        if (this.leftLeg && this.rightLeg) {
          if (this.currentAction === "salute") {
            // Standing rigid at attention
            this.leftLeg.thigh.rotation.z = 0;
            this.rightLeg.thigh.rotation.z = 0;
            this.leftLeg.thigh.rotation.x = 0;
            this.rightLeg.thigh.rotation.x = 0;
            this.leftLeg.knee.rotation.x = 0;
            this.rightLeg.knee.rotation.x = 0;
          } else if (this.currentAction === "hifi") {
            // Braced athletic stance
            this.leftLeg.thigh.rotation.x = 0.10;
            this.leftLeg.knee.rotation.x = -0.12;
            this.rightLeg.thigh.rotation.x = -0.06;
            this.rightLeg.knee.rotation.x = 0.06;
          } else {
            // Natural idle breathing weight shift
            const shift = Math.sin(time * 1.5);
            this.leftLeg.thigh.rotation.z = shift * 0.022;
            this.rightLeg.thigh.rotation.z = -shift * 0.022;
            this.leftLeg.thigh.rotation.x = shift * 0.018;
            this.rightLeg.thigh.rotation.x = -shift * 0.018;
            this.leftLeg.knee.rotation.x = Math.max(0, -shift * 0.025);
            this.rightLeg.knee.rotation.x = Math.max(0, shift * 0.025);
          }
        }
      }
    }

    // 5. Speech Bar Pulsing
    if (this.speechLED && this.expression === "speaking") {
      const pulse = Math.abs(Math.sin(time * 14)) * 0.15 + 0.1;
      this.speechLED.scale.set(1 + pulse, 1 + pulse, 1);
    }

    // 6. Action Gestures State Machine
    if (this.leftArm && this.rightArm) {
      if (this.currentAction === "hello") {
        this.actionTimer += delta;
        // Warm waving gesture
        this.rightArm.upperArm.rotation.z = -1.1;
        this.rightArm.upperArm.rotation.x = 0.3;
        this.rightArm.forearm.rotation.x = -1.8;
        this.rightArm.hand.rotation.x = 0.5;
        this.rightArm.hand.rotation.y = Math.sin(this.actionTimer * 9) * 0.45;

        if (this.actionTimer > 2.5) {
          this.currentAction = null;
          this.setExpression("idle");
        }
      } else if (this.currentAction === "bye") {
        this.actionTimer += delta;
        // Gentle farewell wave
        this.rightArm.upperArm.rotation.z = -0.9;
        this.rightArm.upperArm.rotation.x = 0.2;
        this.rightArm.forearm.rotation.x = -1.6;
        this.rightArm.hand.rotation.x = 0.4;
        this.rightArm.hand.rotation.y = Math.sin(this.actionTimer * 5) * 0.35;

        if (this.actionTimer > 2.5) {
          this.currentAction = null;
          this.setExpression("idle");
        }
      } else if (this.currentAction === "hifi") {
        // High-five ready stance: palm facing straight toward viewer at eye height
        this.rightArm.upperArm.rotation.z = -0.5;
        this.rightArm.upperArm.rotation.x = 0.7;
        this.rightArm.forearm.rotation.x = -0.6;
        this.rightArm.hand.rotation.x = 0.9;
        this.rightArm.hand.rotation.y = 0.0;
      } else if (this.currentAction === "kiss") {
        this.actionTimer += delta;
        if (this.actionTimer < 1.0) {
          // Bring hand to mouth
          this.rightArm.upperArm.rotation.z = -0.4;
          this.rightArm.upperArm.rotation.x = 0.8;
          this.rightArm.forearm.rotation.x = -2.1;
          this.rightArm.hand.rotation.x = 0.6;
        } else if (this.actionTimer < 3.2) {
          // Open hand outward blowing kiss toward user
          this.rightArm.forearm.rotation.x = -0.8;
          this.rightArm.hand.rotation.x = 0.4;
          this.rightArm.hand.rotation.y = Math.sin(time * 3) * 0.15;
        } else {
          this.currentAction = null;
          this.setExpression("idle");
        }
      } else if (this.currentAction === "salute") {
        this.actionTimer += delta;
        // Sharp military salute: fingertips touch right temple/brow
        this.rightArm.upperArm.rotation.z = -1.2;
        this.rightArm.upperArm.rotation.x = 0.4;
        this.rightArm.forearm.rotation.x = -2.35;
        this.rightArm.hand.rotation.x = 0.2;
        this.rightArm.hand.rotation.z = 0.3;

        if (this.actionTimer > 2.5) {
          this.currentAction = null;
          this.setExpression("idle");
        }
      } else if (this.expression === "speaking") {
        // Conversational Gesturing: Both hands articulate in rhythm
        const wave = Math.sin(time * 5) * 0.12;
        this.leftArm.forearm.rotation.x = -1.1 + wave;
        this.rightArm.forearm.rotation.x = -1.1 - wave;
        this.leftArm.hand.rotation.y = 0.4 + Math.sin(time * 4) * 0.15;
        this.rightArm.hand.rotation.y = -0.4 - Math.sin(time * 4) * 0.15;
      } else {
        // Default Stance: Both hands elevated at chest level
        const breathe = Math.sin(time * 1.8) * 0.03;
        this.leftArm.upperArm.rotation.x = 0.25 + breathe;
        this.rightArm.upperArm.rotation.x = 0.25 + breathe;
        this.leftArm.forearm.rotation.x = -1.15 + breathe;
        this.rightArm.forearm.rotation.x = -1.15 + breathe;
        this.rightArm.upperArm.rotation.z = -0.12;
        this.rightArm.hand.rotation.x = -0.25;
        this.rightArm.hand.rotation.y = -0.4;
      }
    }

    // 7. Clear 5-Digit Finger Articulation
    const fingerCurl = Math.sin(time * 2.2) * 0.12 + 0.18;
    this.leftFingers.forEach((f, i) => {
      f.rotation.x = fingerCurl + i * 0.03;
    });
    this.rightFingers.forEach((f, i) => {
      if (this.currentAction === "hifi" || this.currentAction === "salute") {
        f.rotation.x = 0.02; // Flat straight fingers for high-five or salute
      } else {
        f.rotation.x = fingerCurl + i * 0.03;
      }
    });

    // 8. Animate Floating 3D Hearts (Flying Kiss Action)
    for (let i = this.heartParticles.length - 1; i >= 0; i--) {
      const h = this.heartParticles[i];
      h.position.x += h.userData.vx * delta;
      h.position.y += h.userData.vy * delta;
      h.position.z += h.userData.vz * delta;
      h.userData.life -= delta * 0.45;
      h.scale.multiplyScalar(0.99);

      if (h.userData.life <= 0) {
        this.scene.remove(h);
        this.heartParticles.splice(i, 1);
      }
    }

    // 9. Quantum Core Pulse
    if (this.coreMesh) {
      const pulseRate = this.isOverdrive ? 8.0 : 3.5;
      const s = 1.0 + Math.sin(time * pulseRate) * 0.12;
      this.coreMesh.scale.set(s, s, 1);
    }

    // 10. Hologram Ring Spin
    if (this.holoStage) {
      this.holoStage.rotation.y += delta * 0.2;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Robot3D = Robot3D;
