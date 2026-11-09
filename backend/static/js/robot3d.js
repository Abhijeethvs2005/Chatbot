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
    this.activeHand = "left"; // 'left' (viewer perspective) or 'right'
    this.currentAction = null;
    this.actionTimer = 0;
    this.isHifiReady = false;
    this.hifiSlapped = false;
    this.hifiSlapTimer = 0;

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
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    this.keyLight.position.set(4, 6, 5);
    this.scene.add(this.keyLight);

    // Balanced left fill light to eliminate any dark shadow or discoloration on the left eye
    this.fillLight = new THREE.DirectionalLight(0xffffff, 1.1);
    this.fillLight.position.set(-4, 5, 4);
    this.scene.add(this.fillLight);

    // Front portrait light for clear facial features (eyes, nose, mouth)
    this.faceLight = new THREE.DirectionalLight(0xfff7ed, 0.85);
    this.faceLight.position.set(0, 1.2, 3.8);
    this.scene.add(this.faceLight);

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

    // --- HIGH-CLARITY ULTRA-DEFINITION EYE MATERIALS ---
    this.matEyeSocket = new THREE.MeshStandardMaterial({
      color: 0x050811,
      roughness: 0.85,
      metalness: 0.5
    });

    this.matLimbalRing = new THREE.MeshStandardMaterial({
      color: 0x0b1324,
      roughness: 0.1,
      metalness: 0.95
    });

    this.matIris = new THREE.MeshStandardMaterial({
      color: p.eyeColor || p.accent,
      emissive: p.glow,
      emissiveIntensity: 1.6,
      roughness: 0.12,
      metalness: 0.6
    });

    this.matPupilObsidian = new THREE.MeshBasicMaterial({
      color: 0x03050a
    });

    this.matPupilCore = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    this.matCatchlight = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    // Optical Cornea: Ultra-Clear Glass Dome (High clarity, zero milky fog)
    this.matEyeLens = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.02,
      metalness: 0.15,
      transparent: true,
      opacity: 0.14
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

    // --- HUMAN ANATOMY & FACIAL MATERIALS ---
    this.matSkin = new THREE.MeshStandardMaterial({
      color: 0xdfaa8b, // Healthy, warm masculine human skin tone
      roughness: 0.58,
      metalness: 0.02
    });

    this.matSkinShadow = new THREE.MeshStandardMaterial({
      color: 0xc89274,
      roughness: 0.65,
      metalness: 0.02
    });

    this.matHair = new THREE.MeshStandardMaterial({
      color: 0x1c1917, // Refined dark espresso brunette hair
      roughness: 0.72,
      metalness: 0.05
    });

    this.matEyebrow = new THREE.MeshStandardMaterial({
      color: 0x181512,
      roughness: 0.85
    });

    this.matLips = new THREE.MeshStandardMaterial({
      color: 0xc97a70, // Natural masculine lips
      roughness: 0.50,
      metalness: 0.02
    });

    this.matSclera = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Pure pearlescent clean white sclera
      roughness: 0.12,
      metalness: 0.05
    });

    this.matCaruncle = new THREE.MeshStandardMaterial({
      color: 0xe08f88,
      roughness: 0.40
    });

    this.matNails = new THREE.MeshStandardMaterial({
      color: 0xf2d5c4, // Natural male fingernails with subtle healthy sheen
      roughness: 0.30,
      metalness: 0.04
    });

    // --- REFINED HUMAN MENSWEAR CLOTHING MATERIALS ---
    this.matSuitNavy = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Tailored navy/slate fine wool blazer
      roughness: 0.74,
      metalness: 0.04
    });

    this.matSuitLapel = new THREE.MeshStandardMaterial({
      color: 0x172033, // Fine grosgrain/satin lapel finish
      roughness: 0.56,
      metalness: 0.08
    });

    this.matSuitButtons = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Polished dark horn button
      roughness: 0.32,
      metalness: 0.15
    });

    this.matShirtWhite = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Crisp poplin dress shirt
      roughness: 0.44,
      metalness: 0.02
    });

    this.matShirtCollar = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.38,
      metalness: 0.02
    });

    this.matTieRed = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Luxurious rich crimson woven silk tie
      roughness: 0.32,
      metalness: 0.14,
      emissive: 0x450a0a,
      emissiveIntensity: 0.15
    });

    this.matTieClip = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Polished 18k gold tie bar & cufflinks
      roughness: 0.18,
      metalness: 0.95
    });

    this.matPocketSquare = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Crisp linen pocket square
      roughness: 0.35
    });

    this.matBelt = new THREE.MeshStandardMaterial({
      color: 0x18181b, // Italian dark leather
      roughness: 0.38,
      metalness: 0.05
    });

    this.matBeltBuckle = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Polished brushed steel/palladium buckle
      roughness: 0.18,
      metalness: 0.96
    });

    this.matTrousers = new THREE.MeshStandardMaterial({
      color: 0x1e293b, // Tailored wool trousers matching jacket
      roughness: 0.75,
      metalness: 0.04
    });

    this.matTrouserCrease = new THREE.MeshStandardMaterial({
      color: 0x172130, // Sharp pressed trouser crease accent
      roughness: 0.68,
      metalness: 0.04
    });

    this.matShoes = new THREE.MeshStandardMaterial({
      color: 0x1c120c, // Hand-burnished mahogany espresso Oxford leather
      roughness: 0.32,
      metalness: 0.08
    });

    this.matSole = new THREE.MeshStandardMaterial({
      color: 0x0c0a09, // Leather welt & stacked heel sole
      roughness: 0.65,
      metalness: 0.05
    });

    this.matLaces = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.75
    });

    // Wardrobe Specific Materials
    this.matLabCoat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    this.matHoodie = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 });
    this.matJeans = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.7 });
    this.matSpaceGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });
    this.matHeart = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xf43f5e, emissiveIntensity: 0.8 });
    this.matAreola = new THREE.MeshStandardMaterial({ color: 0xb5786c, roughness: 0.65 });
    this.matMissionBlue = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 });
    this.matSlateTrousers = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.75 });
    this.matSpaceSuit = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35, metalness: 0.3 });
    this.matStethoscope = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.25, metalness: 0.8 });
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

    if (this.matIris) {
      this.matIris.color.setHex(p.eyeColor || p.accent);
      this.matIris.emissive.setHex(p.glow);
    }
    if (this.leftEye && this.leftEye.userData.aperture) {
      this.leftEye.userData.aperture.material.color.setHex(p.accent);
      this.leftEye.userData.aperture.material.emissive.setHex(p.glow);
    }
    if (this.rightEye && this.rightEye.userData.aperture) {
      this.rightEye.userData.aperture.material.color.setHex(p.accent);
      this.rightEye.userData.aperture.material.emissive.setHex(p.glow);
    }

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

    // 7. Ensure active wardrobe outfit is properly initialized
    this.setOutfit(this.currentOutfit);
  }

  buildHumanoidHead() {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.78, 0);

    // 1. Male Cranium Base (Proportional masculine head shape)
    const craniumGeo = new THREE.SphereGeometry(0.50, 32, 32);
    craniumGeo.scale(0.88, 1.05, 0.95);
    const cranium = new THREE.Mesh(craniumGeo, this.matSkin);
    cranium.position.set(0, 0.02, -0.02);
    this.headGroup.add(cranium);

    // 2. Broad Masculine Forehead (Frontal bone with subtle slope)
    const forehead = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.20, 0.16), this.matSkin);
    forehead.position.set(0, 0.25, 0.30);
    forehead.rotation.x = -0.12;
    this.headGroup.add(forehead);

    // 3. Strong Masculine Brow Ridge (Supraorbital ridge defining male eye sockets)
    const browRidge = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.065, 0.14), this.matSkin);
    browRidge.position.set(0, 0.155, 0.38);
    this.headGroup.add(browRidge);

    // 4. Chiseled Zygomatic Cheekbones (Lateral cheek definition)
    [-0.23, 0.23].forEach((cx) => {
      const cheek = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.16), this.matSkin);
      cheek.position.set(cx, -0.05, 0.32);
      cheek.rotation.y = cx < 0 ? 0.20 : -0.20;
      cheek.rotation.z = cx < 0 ? -0.10 : 0.10;
      this.headGroup.add(cheek);
    });

    // 5. Defined Masculine Jawline (Mandibular angles tapering to chin)
    [-0.17, 0.17].forEach((jx) => {
      const jawAngle = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.22, 0.24), this.matSkin);
      jawAngle.position.set(jx, -0.24, 0.18);
      jawAngle.rotation.y = jx < 0 ? 0.32 : -0.32;
      jawAngle.rotation.z = jx < 0 ? -0.16 : 0.16;
      this.headGroup.add(jawAngle);
    });

    // 6. Strong Square Male Chin
    const chin = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.18), this.matSkin);
    chin.position.set(0, -0.34, 0.32);
    this.headGroup.add(chin);

    // Handsome Masculine Chin Cleft (Subtle central groove)
    const chinCleft = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.08, 0.025), this.matArmor);
    chinCleft.position.set(0, -0.34, 0.415);
    this.headGroup.add(chinCleft);

    // 7. Handsome Modern Male Haircut (Stylish Quiff/Pompadour with Tapered Sides)
    // 7a. Hair Base Cap (Top, crown, and back of cranium)
    const hairCapGeo = new THREE.SphereGeometry(0.51, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.52);
    hairCapGeo.scale(0.91, 1.06, 0.97);
    const hairCap = new THREE.Mesh(hairCapGeo, this.matHair);
    hairCap.position.set(0, 0.06, -0.02);
    this.headGroup.add(hairCap);

    // 7b. Nape and Back Taper
    const napeTaper = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.26, 0.16), this.matHair);
    napeTaper.position.set(0, -0.12, -0.36);
    this.headGroup.add(napeTaper);

    // 7c. Styled Top Pompadour Volume
    const topHair = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.13, 0.42), this.matHair);
    topHair.position.set(0, 0.51, 0.02);
    topHair.rotation.x = -0.06;
    this.headGroup.add(topHair);

    // 7d. Swept Front Quiff / Fringe (Styled upward & swept back, clear of eyes)
    const frontQuiff = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.20, 0.38, 16), this.matHair);
    frontQuiff.rotation.z = Math.PI / 2;
    frontQuiff.rotation.x = 0.28;
    frontQuiff.position.set(0, 0.46, 0.24);
    this.headGroup.add(frontQuiff);

    // 7e. Clean Male Sideburns (Descend in front of ears)
    [-0.41, 0.41].forEach((sx) => {
      const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.12), this.matHair);
      sideburn.position.set(sx, 0.06, 0.08);
      this.headGroup.add(sideburn);
    });

    // 8. Natural Masculine Ears with Cybernetic Comms Node
    [-0.46, 0.46].forEach((ex) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(ex, 0.02, 0.0);

      const earBody = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.19, 0.10), this.matSkin);
      earBody.rotation.y = ex < 0 ? -0.16 : 0.16;
      earGroup.add(earBody);

      const helix = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.016, 12, 24), this.matSkin);
      helix.rotation.y = Math.PI / 2;
      earGroup.add(helix);

      const commRing = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.007, 12, 24), this.matAccent);
      commRing.rotation.y = Math.PI / 2;
      commRing.position.set(ex < 0 ? -0.02 : 0.02, -0.02, 0);
      earGroup.add(commRing);

      this.headGroup.add(earGroup);
    });

    // 9. Muscular Male Neck with Adam's Apple & Collar Ring
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.28, 24), this.matSkin);
    neck.position.set(0, -0.50, 0);
    this.headGroup.add(neck);

    const adamsApple = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 16), this.matSkin);
    adamsApple.rotation.x = Math.PI / 2;
    adamsApple.position.set(0, -0.48, 0.195);
    this.headGroup.add(adamsApple);

    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.03, 16, 32), this.matChassis);
    collarRing.rotation.x = Math.PI / 2;
    collarRing.position.set(0, -0.62, 0);
    this.headGroup.add(collarRing);

    // 10. --- PROMINENT, CLEARLY VISIBLE 3D MALE NOSE ---
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 0.035, 0.42);

    // 10a. Nasal Root & Straight Dorsal Bridge (Extends down from between eyes)
    const bridgeGeo = new THREE.CylinderGeometry(0.026, 0.036, 0.15, 12);
    bridgeGeo.scale(1.0, 1.0, 1.35);
    const bridge = new THREE.Mesh(bridgeGeo, this.matSkin);
    bridge.rotation.x = 0.32;
    bridge.position.set(0, 0.02, 0.04);
    noseGroup.add(bridge);

    // 10b. Defined Masculine Nose Tip (Apex / Lobule - proud & distinct)
    const tipGeo = new THREE.SphereGeometry(0.038, 16, 16);
    tipGeo.scale(1.15, 0.95, 1.25);
    const noseTip = new THREE.Mesh(tipGeo, this.matSkin);
    noseTip.position.set(0, -0.058, 0.098);
    noseGroup.add(noseTip);

    // 10c. Symmetrical Left and Right Nostril Wings (Alar Cartilages)
    [-0.042, 0.042].forEach((nx) => {
      const ala = new THREE.Mesh(new THREE.SphereGeometry(0.023, 12, 12), this.matSkin);
      ala.scale.set(0.9, 0.85, 1.1);
      ala.position.set(nx, -0.068, 0.078);
      noseGroup.add(ala);

      // Recessed dark nostril openings underneath
      const nostril = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.016, 8), this.matEyeSocket);
      nostril.position.set(nx * 0.72, -0.084, 0.076);
      nostril.rotation.x = 0.48;
      noseGroup.add(nostril);
    });

    // 10d. Nasal Columella & Septum Base
    const columella = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.030, 0.032), this.matSkin);
    columella.position.set(0, -0.078, 0.078);
    noseGroup.add(columella);

    // 10e. Philtrum Groove (Connecting nose to upper lip)
    const philtrum = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.065, 0.016), this.matSkin);
    philtrum.position.set(0, -0.125, 0.055);
    noseGroup.add(philtrum);

    this.faceNose = noseGroup;
    this.headGroup.add(noseGroup);

    // 11. --- ULTRA-CLARITY SYMMETRICAL MALE EYES (Zero black defect!) ---
    this.leftEye = this.createHumanoidEye(-0.19);
    this.rightEye = this.createHumanoidEye(0.19);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // 12. --- GROOMED MASCULINE EYEBROWS ---
    this.leftBrow = this.createEyebrow(-0.19, true);
    this.rightBrow = this.createEyebrow(0.19, false);
    this.headGroup.add(this.leftBrow);
    this.headGroup.add(this.rightBrow);

    // 13. --- MASCULINE LIPS & SPEECH BAR ---
    const lipsGroup = new THREE.Group();
    lipsGroup.position.set(0, -0.22, 0.42);

    // Upper Lip with Cupid's bow contour
    const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.024, 0.038), this.matLips);
    upperLip.position.set(0, 0.014, 0.005);
    lipsGroup.add(upperLip);

    // Full Masculine Lower Lip
    const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.026, 0.040), this.matLips);
    lowerLip.position.set(0, -0.016, 0.005);
    lipsGroup.add(lowerLip);

    // Acoustic Speech Light Bar (Pulses during voice activity)
    this.speechLED = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.010, 0.022), this.matAccent);
    this.speechLED.position.set(0, 0, 0.022);
    lipsGroup.add(this.speechLED);

    this.faceLips = lipsGroup;
    this.headGroup.add(lipsGroup);

    this.robotGroup.add(this.headGroup);
  }

  createHumanoidEye(xPos) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(xPos, 0.065, 0.44);

    // 1. Natural Skin-Toned Orbital Socket Rim
    const socketRim = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.015, 16, 32), this.matSkin);
    eyeGroup.add(socketRim);

    // 2. Pure Pearlescent White Eyeball Sclera (100% clean white on BOTH eyes - zero black defect!)
    const eyeballGeo = new THREE.SphereGeometry(0.10, 32, 32);
    const eyeball = new THREE.Mesh(eyeballGeo, this.matSclera);
    eyeball.position.set(0, 0, -0.01);
    eyeGroup.add(eyeball);

    // 3. Moving Gaze Assembly (Iris, Aperture, Pupil, Laser Diode, Catchlights)
    const gazeGroup = new THREE.Group();
    gazeGroup.position.set(0, 0, 0.038);
    eyeGroup.add(gazeGroup);

    // 3a. Deep Metallic Limbal Ring (Defines iris boundary for sharp optical contrast)
    const limbalRing = new THREE.Mesh(new THREE.TorusGeometry(0.076, 0.007, 16, 36), this.matLimbalRing);
    gazeGroup.add(limbalRing);

    // 3b. Radiant Glowing Cybernetic Iris
    const irisRing = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.012, 20, 36), this.matIris);
    gazeGroup.add(irisRing);

    // 3c. Geometric Micro-Aperture (High-tech cyber eye texture)
    const apertureMat = new THREE.MeshStandardMaterial({
      color: this.themes[this.currentTheme].accent,
      emissive: this.themes[this.currentTheme].glow,
      emissiveIntensity: 0.9,
      wireframe: true
    });
    const aperture = new THREE.Mesh(new THREE.RingGeometry(0.040, 0.068, 24), apertureMat);
    aperture.position.set(0, 0, 0.003);
    gazeGroup.add(aperture);

    // 3d. Deep Obsidian Black Pupil Core (Optical center)
    const pupilBacking = new THREE.Mesh(new THREE.CircleGeometry(0.042, 32), this.matPupilObsidian);
    pupilBacking.position.set(0, 0, 0.006);
    gazeGroup.add(pupilBacking);

    // 3e. Luminous Central Diode (Retina focus core)
    const pupilCore = new THREE.Mesh(new THREE.SphereGeometry(0.020, 16, 16), this.matPupilCore);
    pupilCore.position.set(0, 0, 0.014);
    gazeGroup.add(pupilCore);

    // 3f. Primary Crisp Specular Catchlight (Upper right glint for lifelike shine)
    const catchlight1 = new THREE.Mesh(new THREE.SphereGeometry(0.010, 10, 10), this.matCatchlight);
    catchlight1.position.set(0.020, 0.020, 0.022);
    gazeGroup.add(catchlight1);

    // 3g. Secondary Sub-Specular Catchlight (Lower left glint)
    const catchlight2 = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), this.matCatchlight);
    catchlight2.position.set(-0.015, -0.015, 0.020);
    gazeGroup.add(catchlight2);

    // 4. Crystal-Clear Optical Cornea Lens Dome (Pure clarity, zero milky fog)
    const lensGeo = new THREE.SphereGeometry(0.104, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const lens = new THREE.Mesh(lensGeo, this.matEyeLens);
    lens.position.set(0, 0, 0.012);
    eyeGroup.add(lens);

    // 5. Natural Upper Eyelid Fold (Supratarsal male eyelid crease in skin tone)
    const lidArch = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.014, 12, 24, Math.PI), this.matSkin);
    lidArch.rotation.z = Math.PI;
    lidArch.position.set(0, 0.018, 0.032);
    eyeGroup.add(lidArch);

    // 6. Natural Skin-Toned Eyelid Shutter for Blinking (NEVER black - uses matSkin!)
    const lidGeo = new THREE.SphereGeometry(0.106, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const eyelid = new THREE.Mesh(lidGeo, this.matSkin);
    eyelid.position.set(0, 0, 0.016);
    eyelid.rotation.x = -Math.PI / 2; // Default open
    eyeGroup.add(eyelid);

    // 7. Dedicated High-Definition Eye Point Light (Symmetrically illuminates both eyes!)
    const eyeLight = new THREE.PointLight(this.themes[this.currentTheme].light, 1.3, 1.8);
    eyeLight.position.set(0, 0, 0.14);
    eyeGroup.add(eyeLight);

    if (xPos < 0) this.leftEyeLight = eyeLight;
    else this.rightEyeLight = eyeLight;

    eyeGroup.userData = {
      eyelid: eyelid,
      gazeGroup: gazeGroup,
      pupil: gazeGroup,
      pupilCore: pupilCore,
      irisRing: irisRing,
      aperture: aperture,
      catchlight1: catchlight1,
      catchlight2: catchlight2
    };

    return eyeGroup;
  }

  createEyebrow(xPos, isLeft) {
    const brow = new THREE.Group();
    brow.position.set(xPos, 0.19, 0.47);

    // Groomed masculine eyebrow: thicker at the glabella, tapering toward the temple
    const browMesh = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.034, 0.04), this.matEyebrow);
    browMesh.rotation.z = isLeft ? -0.08 : 0.08;
    brow.add(browMesh);

    return brow;
  }

  buildHumanoidTorso() {
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.15, 0);

    // ==========================================
    // 1. ATHLETIC HUMAN TORSO FOUNDATION (RIBCAGE & SPINE)
    // ==========================================
    // Inner thoracic ribcage foundation with athletic human V-taper
    const ribcageGeo = new THREE.SphereGeometry(0.33, 24, 24);
    ribcageGeo.scale(1.08, 1.05, 0.72);
    const ribcage = new THREE.Mesh(ribcageGeo, this.matSkin);
    ribcage.position.set(0, 0.08, 0.02);
    this.torsoGroup.add(ribcage);

    // Latissimus dorsi (Broad athletic back wings tapering into waist)
    [-0.24, 0.24].forEach((lx) => {
      const isLeft = lx < 0;
      const latGeo = new THREE.SphereGeometry(0.18, 16, 16);
      latGeo.scale(0.85, 1.45, 0.65);
      const lat = new THREE.Mesh(latGeo, this.matSkin);
      lat.position.set(lx, 0.07, -0.06);
      lat.rotation.z = isLeft ? -0.22 : 0.22;
      lat.rotation.y = isLeft ? 0.15 : -0.15;
      this.torsoGroup.add(lat);
    });

    // Serratus anterior muscle digitations ("boxer's ribs" on lateral chest)
    [-0.24, 0.24].forEach((sx) => {
      const isLeft = sx < 0;
      [0.05, -0.02, -0.09].forEach((sy, idx) => {
        const serratus = new THREE.Mesh(new THREE.BoxGeometry(0.045 - idx * 0.005, 0.032, 0.12), this.matSkin);
        serratus.position.set(sx, sy, 0.07);
        serratus.rotation.z = isLeft ? -0.20 : 0.20;
        this.torsoGroup.add(serratus);
      });
    });

    // Muscular spinal column along the back
    const spineColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.040, 0.58, 16), this.matJoint);
    spineColumn.position.set(0, 0.02, -0.12);
    this.torsoGroup.add(spineColumn);

    // Erector spinae muscular ridges flanking spine
    [-0.065, 0.065].forEach((ex) => {
      const erector = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.032, 0.54, 14), this.matSkin);
      erector.position.set(ex, 0.02, -0.115);
      this.torsoGroup.add(erector);
    });

    // ==========================================
    // 2. SCULPTED HUMAN CLAVICLES (COLLARBONES) & SUPRASTERNAL NOTCH
    // ==========================================
    // Suprasternal jugular notch depression at throat base
    const jugularNotch = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), this.matSkinShadow);
    jugularNotch.scale.set(1.4, 0.8, 0.6);
    jugularNotch.position.set(0, 0.275, 0.135);
    this.torsoGroup.add(jugularNotch);

    // Left and Right Clavicles (S-curved collarbones)
    [-0.15, 0.15].forEach((cx) => {
      const isLeft = cx < 0;
      const clavicle = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.015, 0.24, 16), this.matSkin);
      clavicle.rotation.z = isLeft ? 1.48 : -1.48;
      clavicle.rotation.y = isLeft ? -0.18 : 0.18;
      clavicle.rotation.x = -0.10;
      clavicle.position.set(cx, 0.27, 0.11);
      this.torsoGroup.add(clavicle);
    });

    // Trapezius muscle slope connecting neck base to shoulder acromion
    [-0.19, 0.19].forEach((tx) => {
      const isLeft = tx < 0;
      const trap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), this.matSkin);
      trap.position.set(tx, 0.25, -0.02);
      trap.rotation.z = isLeft ? -0.32 : 0.32;
      this.torsoGroup.add(trap);
    });

    // ==========================================
    // 3. SCULPTED PECTORALIS MAJOR (ATHLETIC HUMAN CHEST)
    // ==========================================
    [-0.155, 0.155].forEach((px) => {
      const isLeft = px < 0;
      const pecGroup = new THREE.Group();
      pecGroup.position.set(px, 0.115, 0.135);

      // Main Pectoral Muscle Slab (curved muscular ellipsoid)
      const pecGeo = new THREE.SphereGeometry(0.175, 20, 20);
      pecGeo.scale(1.22, 0.86, 0.52);
      const pec = new THREE.Mesh(pecGeo, this.matSkin);
      pec.rotation.z = isLeft ? -0.08 : 0.08;
      pec.rotation.y = isLeft ? 0.08 : -0.08;
      pecGroup.add(pec);

      // Defined Upper Clavicular Pectoral Head
      const pecUpper = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.085, 0.065), this.matSkin);
      pecUpper.position.set(isLeft ? 0.02 : -0.02, 0.07, 0.02);
      pecUpper.rotation.z = isLeft ? 0.10 : -0.10;
      pecGroup.add(pecUpper);

      // Defined Lower Pectoral Inframammary Fold
      const pecLower = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.045, 0.05), this.matSkinShadow);
      pecLower.position.set(0, -0.075, 0.015);
      pecGroup.add(pecLower);

      // Subtle male areola
      const areola = new THREE.Mesh(new THREE.CircleGeometry(0.016, 16), this.matAreola);
      areola.position.set(isLeft ? -0.035 : 0.035, -0.015, 0.092);
      pecGroup.add(areola);

      this.torsoGroup.add(pecGroup);
    });

    // ==========================================
    // 4. QUANTUM ARC REACTOR CORE (FLUSH EMBEDDED IN STERNUM)
    // ==========================================
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0.105, 0.152);

    // Polished Chrome Bezel Framing Core
    const coreBezel = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.014, 16, 32), this.matChrome);
    coreGroup.add(coreBezel);

    // Stepped Inner Titanium Ring
    const coreInnerRing = new THREE.Mesh(new THREE.TorusGeometry(0.064, 0.008, 12, 24), this.matChassis);
    coreGroup.add(coreInnerRing);

    // Glowing Neon Emitter Core
    this.coreMesh = new THREE.Mesh(new THREE.CircleGeometry(0.062, 32), this.matAccent);
    this.coreMesh.position.set(0, 0, 0.005);
    coreGroup.add(this.coreMesh);

    // Sternal cleft furrow extending above and below reactor
    const sternalFurrow = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.28, 0.02), this.matSkinShadow);
    sternalFurrow.position.set(0, 0.105, 0.145);
    this.torsoGroup.add(sternalFurrow);

    this.torsoGroup.add(coreGroup);

    // ==========================================
    // 5. RECTUS ABDOMINIS (CHISELED 6-PACK ABS) & LINEA ALBA
    // ==========================================
    // Linea alba (Vertical central tendon depression)
    const lineaAlba = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.28, 0.025), this.matSkinShadow);
    lineaAlba.position.set(0, -0.08, 0.128);
    this.torsoGroup.add(lineaAlba);

    // 3 Tiers of Paired Abdominal Muscle Packs
    const abTiers = [
      { y: 0.005, w: 0.105, h: 0.068, d: 0.042, z: 0.138 },  // Tier 1: Upper Abs
      { y: -0.075, w: 0.110, h: 0.070, d: 0.044, z: 0.132 }, // Tier 2: Mid Abs
      { y: -0.155, w: 0.100, h: 0.072, d: 0.040, z: 0.120 }  // Tier 3: Lower Abs
    ];

    abTiers.forEach((t) => {
      [-0.068, 0.068].forEach((ax) => {
        const isLeft = ax < 0;
        const abMesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), this.matSkin);
        abMesh.position.set(ax, t.y, t.z);
        abMesh.rotation.z = isLeft ? -0.04 : 0.04;
        abMesh.rotation.y = isLeft ? 0.08 : -0.08;
        this.torsoGroup.add(abMesh);
      });

      // Horizontal tendinous intersection groove
      const groove = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.010, 0.018), this.matSkinShadow);
      groove.position.set(0, t.y - t.h / 2, t.z + 0.01);
      this.torsoGroup.add(groove);
    });

    // Anatomical Umbilicus (Navel / Belly Button)
    const navel = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), this.matSkinShadow);
    navel.scale.set(1.0, 1.4, 0.6);
    navel.position.set(0, -0.105, 0.138);
    this.torsoGroup.add(navel);

    // ==========================================
    // 6. EXTERNAL OBLIQUES & INGUINAL CREASE (APOLLO'S BELT / V-CUT)
    // ==========================================
    [-0.20, 0.20].forEach((ox) => {
      const isLeft = ox < 0;
      const obliqueGeo = new THREE.SphereGeometry(0.12, 16, 16);
      obliqueGeo.scale(0.85, 1.75, 0.75);
      const oblique = new THREE.Mesh(obliqueGeo, this.matSkin);
      oblique.position.set(ox, -0.11, 0.05);
      oblique.rotation.z = isLeft ? 0.20 : -0.20;
      this.torsoGroup.add(oblique);
    });

    // Athletic Inguinal Crease (V-Cut lines tapering down to groin)
    [-0.11, 0.11].forEach((ix) => {
      const isLeft = ix < 0;
      const vCut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.014, 0.018), this.matSkinShadow);
      vCut.position.set(ix, -0.22, 0.10);
      vCut.rotation.z = isLeft ? 0.55 : -0.55;
      vCut.rotation.y = isLeft ? 0.12 : -0.12;
      this.torsoGroup.add(vCut);
    });

    // ==========================================
    // 7. ANATOMICAL HUMAN PELVIS & GLUTEAL CONTOURS
    // ==========================================
    // Pelvic basin in matSkin
    const pelvisGeo = new THREE.SphereGeometry(0.28, 20, 20);
    pelvisGeo.scale(1.02, 0.72, 0.82);
    const pelvis = new THREE.Mesh(pelvisGeo, this.matSkin);
    pelvis.position.set(0, -0.28, 0.02);
    this.torsoGroup.add(pelvis);

    // Left and Right Gluteal Musculature at the back
    [-0.14, 0.14].forEach((gx) => {
      const gluteGeo = new THREE.SphereGeometry(0.155, 16, 16);
      gluteGeo.scale(1.0, 1.15, 0.95);
      const glute = new THREE.Mesh(gluteGeo, this.matSkin);
      glute.position.set(gx, -0.28, -0.09);
      this.torsoGroup.add(glute);
    });

    // Dual Pelvic Hip Ball Sockets interfacing with legs
    [-0.20, 0.20].forEach((px) => {
      const hipSocket = new THREE.Mesh(new THREE.SphereGeometry(0.092, 16, 16), this.matJoint);
      hipSocket.position.set(px, -0.34, 0.02);
      this.torsoGroup.add(hipSocket);
    });

    this.robotGroup.add(this.torsoGroup);
  }

  buildHumanoidArmsAndHands() {
    this.leftArm = this.createHumanoidArm(-0.48, "left");
    this.rightArm = this.createHumanoidArm(0.48, "right");
    this.robotGroup.add(this.leftArm.group);
    this.robotGroup.add(this.rightArm.group);
  }

  createHumanoidArm(shoulderX, side) {
    const isLeft = side === "left";
    const armGroup = new THREE.Group();
    armGroup.position.set(shoulderX, 0.32, 0.02);

    // 1. SCULPTED 3-HEADED HUMAN DELTOID (SHOULDER CAP)
    // Anterior, lateral, and posterior deltoid wrapping over shoulder joint
    const deltoidGroup = new THREE.Group();
    deltoidGroup.position.set(isLeft ? -0.02 : 0.02, 0.02, 0);

    const deltoidGeo = new THREE.SphereGeometry(0.142, 20, 20);
    deltoidGeo.scale(1.12, 1.35, 1.12);
    const deltoid = new THREE.Mesh(deltoidGeo, this.matSkin);
    deltoidGroup.add(deltoid);

    // Subtle cybernetic biometric seam line tracing deltoid contour
    const deltoidSeam = new THREE.Mesh(new THREE.TorusGeometry(0.118, 0.006, 12, 24, Math.PI), this.matAccent);
    deltoidSeam.rotation.y = isLeft ? -0.4 : 0.4;
    deltoidSeam.position.set(0, -0.06, 0.02);
    deltoidGroup.add(deltoidSeam);

    armGroup.add(deltoidGroup);

    // 2. UPPER ARM (SCULPTED BICEPS BRACHII & TRICEPS BRACHII)
    const upperArm = new THREE.Group();
    upperArm.position.set(isLeft ? -0.03 : 0.03, -0.04, 0);
    upperArm.rotation.x = 0.25;
    upperArm.rotation.z = isLeft ? 0.12 : -0.12;
    armGroup.add(upperArm);

    // Upper arm structural humeral core
    const humerus = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.068, 0.32, 18), this.matSkin);
    humerus.position.set(0, -0.16, 0);
    upperArm.add(humerus);

    // Biceps Brachii: Muscular bicep belly on anterior arm
    const bicepGeo = new THREE.SphereGeometry(0.082, 16, 16);
    bicepGeo.scale(0.92, 1.45, 0.82);
    const bicep = new THREE.Mesh(bicepGeo, this.matSkin);
    bicep.position.set(isLeft ? 0.01 : -0.01, -0.15, 0.032);
    upperArm.add(bicep);

    // Triceps Brachii: Muscular tricep horseshoe contour on posterior arm
    const tricepGeo = new THREE.SphereGeometry(0.086, 16, 16);
    tricepGeo.scale(1.0, 1.5, 0.88);
    const tricep = new THREE.Mesh(tricepGeo, this.matSkin);
    tricep.position.set(isLeft ? -0.01 : 0.01, -0.15, -0.030);
    upperArm.add(tricep);

    // 3. ELBOW JOINT (OLECRANON BONY POINT & HINGE)
    const elbow = new THREE.Group();
    elbow.position.set(0, -0.32, 0);
    upperArm.add(elbow);

    // Anatomical olecranon (elbow bone)
    const olecranon = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 16), this.matSkin);
    olecranon.position.set(0, 0, -0.015);
    elbow.add(olecranon);

    // Chrome pivot hinge within inner joint
    const elbowHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.12, 16), this.matChrome);
    elbowHinge.rotation.z = Math.PI / 2;
    elbow.add(elbowHinge);

    // 4. FOREARM (BRACHIORADIALIS & TAPERING MUSCULATURE)
    const forearm = new THREE.Group();
    forearm.rotation.x = -1.1; // bent forward in active conversational pose
    forearm.rotation.y = isLeft ? 0.35 : -0.35;
    elbow.add(forearm);

    // Anatomical Forearm tapering gracefully from muscular elbow down to wrist
    const forearmGeo = new THREE.CylinderGeometry(0.076, 0.054, 0.28, 20);
    forearmGeo.scale(1.12, 1.0, 0.90);
    const forearmMesh = new THREE.Mesh(forearmGeo, this.matSkin);
    forearmMesh.position.set(0, -0.14, 0);
    forearm.add(forearmMesh);

    // Brachioradialis muscle sweep on outer upper forearm
    const brachioGeo = new THREE.SphereGeometry(0.065, 14, 14);
    brachioGeo.scale(0.85, 1.6, 0.90);
    const brachioradialis = new THREE.Mesh(brachioGeo, this.matSkin);
    brachioradialis.position.set(isLeft ? -0.038 : 0.038, -0.09, 0.018);
    forearm.add(brachioradialis);

    // Subtle cybernetic conduit tracing forearm
    const armConduit = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.22, 0.010), this.matAccent);
    armConduit.position.set(isLeft ? 0.048 : -0.048, -0.14, 0.032);
    forearm.add(armConduit);

    // 5. WRIST JOINT (RADIAL & ULNAR STYLOID PROCESSES)
    const wrist = new THREE.Group();
    wrist.position.set(0, -0.30, 0);
    forearm.add(wrist);

    // Sculpted human wrist
    const wristMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.050, 0.045, 16), this.matSkin);
    wrist.add(wristMesh);

    // Lateral styloid bone nodes
    [-0.048, 0.048].forEach((wx) => {
      const styloid = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), this.matSkin);
      styloid.position.set(wx, 0, 0);
      wrist.add(styloid);
    });

    // 6. CLEAR 5-DIGIT ARTICULATED HUMAN HAND
    const hand = this.createHumanoidHand(side);
    hand.position.set(0, -0.05, 0);
    hand.rotation.x = -0.25;
    hand.rotation.y = isLeft ? 0.35 : -0.35;
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

    // 1. Natural Human Palm Base in matSkin
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.13, 0.042), this.matSkin);
    palm.position.set(0, -0.06, 0);
    handGroup.add(palm);

    // Thenar Eminence (Thumb base muscle cushion)
    const thenar = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), this.matSkin);
    thenar.scale.set(1.2, 1.4, 0.9);
    thenar.position.set(isLeft ? 0.05 : -0.05, -0.045, 0.014);
    handGroup.add(thenar);

    // Hypothenar Eminence (Outer palm pad)
    const hypothenar = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), this.matSkin);
    hypothenar.scale.set(1.0, 1.5, 0.8);
    hypothenar.position.set(isLeft ? -0.05 : 0.05, -0.055, 0.012);
    handGroup.add(hypothenar);

    // Glowing Palm Repulsor Core nestled neatly in the center of the palm
    const repulsorRim = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 12, 24), this.matChrome);
    repulsorRim.position.set(0, -0.06, 0.024);
    handGroup.add(repulsorRim);

    const repulsorCore = new THREE.Mesh(new THREE.CircleGeometry(0.021, 16), this.matAccent);
    repulsorCore.position.set(0, -0.06, 0.026);
    handGroup.add(repulsorCore);

    const fingers = [];

    // 4 Articulated Human Fingers along natural curved knuckle arch
    const specs = [
      { name: "index",  x: isLeft ? 0.042 : -0.042, len: 0.125, yArch: 0.003 },
      { name: "middle", x: isLeft ? 0.014 : -0.014, len: 0.138, yArch: 0.009 }, // Longest finger
      { name: "ring",   x: isLeft ? -0.014 : 0.014, len: 0.128, yArch: 0.004 },
      { name: "pinky",  x: isLeft ? -0.042 : 0.042, len: 0.104, yArch: -0.006 } // Shortest finger
    ];

    specs.forEach((s) => {
      const fGroup = new THREE.Group();
      fGroup.position.set(s.x, -0.12 + s.yArch, 0);

      // Metacarpophalangeal (MCP) Knuckle in matSkin
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.015, 12, 12), this.matSkin);
      fGroup.add(knuckle);

      // Proximal Phalanx
      const p1Len = s.len * 0.44;
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.011, p1Len, 10), this.matSkin);
      p1.position.set(0, -p1Len / 2, 0.003);
      fGroup.add(p1);

      // Interphalangeal Joint (PIP)
      const pip = new THREE.Mesh(new THREE.SphereGeometry(0.0115, 10, 10), this.matSkin);
      pip.position.set(0, -p1Len, 0.005);
      fGroup.add(pip);

      // Intermediate & Distal Phalanx with realistic pad
      const p2Len = s.len * 0.40;
      const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.0095, p2Len, 10), this.matSkin);
      p2.position.set(0, -p1Len - p2Len / 2, 0.010);
      p2.rotation.x = 0.12;
      fGroup.add(p2);

      // Natural Human Fingertip Pad
      const tipPad = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 10, 10), this.matSkin);
      tipPad.position.set(0, -p1Len - p2Len - 0.004, 0.016);
      fGroup.add(tipPad);

      // Natural Groomed Fingernail (Dorsal side of fingertip)
      const nail = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.014, 0.004), this.matNails);
      nail.position.set(0, -p1Len - p2Len - 0.002, 0.024);
      nail.rotation.x = 0.12;
      fGroup.add(nail);

      handGroup.add(fGroup);
      fingers.push(fGroup);
    });

    // Naturally Opposable Articulated Male Thumb
    const thumbGroup = new THREE.Group();
    const tx = isLeft ? 0.076 : -0.076;
    thumbGroup.position.set(tx, -0.045, 0.016);
    thumbGroup.rotation.z = isLeft ? -0.52 : 0.52;
    thumbGroup.rotation.y = isLeft ? -0.42 : 0.42;
    thumbGroup.rotation.x = 0.22;

    const tKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), this.matSkin);
    thumbGroup.add(tKnuckle);

    const tp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.0135, 0.012, 0.052, 10), this.matSkin);
    tp1.position.set(0, -0.026, 0);
    thumbGroup.add(tp1);

    const tp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.010, 0.042, 10), this.matSkin);
    tp2.position.set(0, -0.068, 0.008);
    thumbGroup.add(tp2);

    const thumbPad = new THREE.Mesh(new THREE.SphereGeometry(0.010, 10, 10), this.matSkin);
    thumbPad.position.set(0, -0.092, 0.014);
    thumbGroup.add(thumbPad);

    const thumbNail = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.015, 0.004), this.matNails);
    thumbNail.position.set(0, -0.090, 0.022);
    thumbGroup.add(thumbNail);

    handGroup.add(thumbGroup);
    fingers.push(thumbGroup);

    if (isLeft) this.leftFingers = fingers;
    else this.rightFingers = fingers;

    return handGroup;
  }

  // --- TWO REAL ARTICULATED HUMANOID LEGS (SCULPTED QUADRICEPS, PATELLA, CALVES & FEET) ---
  buildHumanoidLegs() {
    this.legsGroup = new THREE.Group();
    this.leftLeg = this.createHumanoidLeg(-0.20, "left");
    this.rightLeg = this.createHumanoidLeg(0.20, "right");
    this.legsGroup.add(this.leftLeg.group);
    this.legsGroup.add(this.rightLeg.group);
    this.robotGroup.add(this.legsGroup);
  }

  createHumanoidLeg(hipX, side) {
    const isLeft = side === "left";
    const legGroup = new THREE.Group();
    legGroup.position.set(hipX, -0.22, 0.02);

    // 1. HIP JOINT ASSEMBLY & GREATER TROCHANTER
    const hipSocket = new THREE.Mesh(new THREE.SphereGeometry(0.105, 18, 18), this.matJoint);
    legGroup.add(hipSocket);

    // Greater trochanter lateral hip prominence
    const trochanter = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 14), this.matSkin);
    trochanter.position.set(isLeft ? -0.075 : 0.075, 0.01, 0);
    legGroup.add(trochanter);

    // 2. THIGH GROUP (QUADRICEPS & HAMSTRINGS MUSCULATURE)
    const thighGroup = new THREE.Group();
    legGroup.add(thighGroup);

    // Femur core column in matSkin
    const femur = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.084, 0.44, 20), this.matSkin);
    femur.position.set(0, -0.24, 0);
    thighGroup.add(femur);

    // Rectus femoris (Central anterior thigh muscle column)
    const rectusGeo = new THREE.CylinderGeometry(0.062, 0.052, 0.38, 16);
    rectusGeo.scale(1.15, 1.0, 0.75);
    const rectusFemoris = new THREE.Mesh(rectusGeo, this.matSkin);
    rectusFemoris.position.set(0, -0.23, 0.052);
    thighGroup.add(rectusFemoris);

    // Vastus lateralis (Muscular outer thigh sweep)
    const vastusLatGeo = new THREE.SphereGeometry(0.096, 16, 16);
    vastusLatGeo.scale(0.82, 1.85, 0.88);
    const vastusLateralis = new THREE.Mesh(vastusLatGeo, this.matSkin);
    vastusLateralis.position.set(isLeft ? -0.050 : 0.050, -0.22, 0.018);
    thighGroup.add(vastusLateralis);

    // Vastus medialis (Iconic teardrop muscle bulge just above inner knee)
    const teardropGeo = new THREE.SphereGeometry(0.078, 16, 16);
    teardropGeo.scale(0.88, 1.35, 0.95);
    const vastusMedialis = new THREE.Mesh(teardropGeo, this.matSkin);
    vastusMedialis.position.set(isLeft ? 0.042 : -0.042, -0.34, 0.046);
    thighGroup.add(vastusMedialis);

    // Posterior Hamstrings / Biceps femoris
    const hamstringGeo = new THREE.SphereGeometry(0.090, 16, 16);
    hamstringGeo.scale(0.88, 1.82, 0.95);
    const hamstrings = new THREE.Mesh(hamstringGeo, this.matSkin);
    hamstrings.position.set(0, -0.23, -0.048);
    thighGroup.add(hamstrings);

    // Subtle cybernetic conduit strip down outer thigh
    const thighConduit = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.34, 0.012), this.matAccent);
    thighConduit.position.set(isLeft ? -0.102 : 0.102, -0.23, 0.01);
    thighGroup.add(thighConduit);

    // 3. KNEE JOINT ASSEMBLY (HUMAN PATELLA & CONDYLES)
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.48, 0);
    thighGroup.add(kneeGroup);

    // Knee Hinge Core
    const kneeHinge = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 16), this.matJoint);
    kneeGroup.add(kneeHinge);

    // Sculpted Human Patella (Kneecap) in matSkin
    const patellaGeo = new THREE.SphereGeometry(0.068, 16, 16);
    patellaGeo.scale(1.0, 1.18, 0.68);
    const patella = new THREE.Mesh(patellaGeo, this.matSkin);
    patella.position.set(0, 0.01, 0.048);
    kneeGroup.add(patella);

    // Patellar Ligament connecting kneecap to tibial tuberosity
    const patellarTendon = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.085, 0.018), this.matSkinShadow);
    patellarTendon.position.set(0, -0.05, 0.050);
    kneeGroup.add(patellarTendon);

    // Medial & Lateral Femoral Condyles
    [-0.062, 0.062].forEach((cx) => {
      const condyle = new THREE.Mesh(new THREE.SphereGeometry(0.040, 12, 12), this.matSkin);
      condyle.position.set(cx, 0.01, 0.02);
      kneeGroup.add(condyle);
    });

    // 4. SHIN & CALF GROUP (TIBIA, GASTROCNEMIUS & ACHILLES TENDON)
    const calfGroup = new THREE.Group();
    kneeGroup.add(calfGroup);

    // Structural Tibia core cylinder
    const tibia = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.066, 0.46, 20), this.matSkin);
    tibia.position.set(0, -0.25, 0);
    calfGroup.add(tibia);

    // Anterior Tibial Crest (Distinct human shin bone ridge down front)
    const shinRidge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.40, 0.025), this.matSkin);
    shinRidge.position.set(0, -0.24, 0.074);
    calfGroup.add(shinRidge);

    // Gastrocnemius (Twin calf muscle bellies on posterior leg)
    // Medial head (fuller inner belly)
    const medialCalfGeo = new THREE.SphereGeometry(0.076, 16, 16);
    medialCalfGeo.scale(0.82, 1.45, 0.95);
    const medialCalf = new THREE.Mesh(medialCalfGeo, this.matSkin);
    medialCalf.position.set(isLeft ? 0.028 : -0.028, -0.16, -0.048);
    calfGroup.add(medialCalf);

    // Lateral head (outer calf belly)
    const lateralCalfGeo = new THREE.SphereGeometry(0.072, 16, 16);
    lateralCalfGeo.scale(0.80, 1.40, 0.92);
    const lateralCalf = new THREE.Mesh(lateralCalfGeo, this.matSkin);
    lateralCalf.position.set(isLeft ? -0.028 : 0.028, -0.15, -0.046);
    calfGroup.add(lateralCalf);

    // Soleus & Achilles Tendon (Tapering gracefully into heel)
    const achilles = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.020, 0.22, 14), this.matSkin);
    achilles.position.set(0, -0.34, -0.042);
    calfGroup.add(achilles);

    // Subtle cybernetic conduit tracing shin
    const shinConduit = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.32, 0.010), this.matAccent);
    shinConduit.position.set(isLeft ? -0.065 : 0.065, -0.25, 0.035);
    calfGroup.add(shinConduit);

    // 5. ANKLE JOINT (MEDIAL & LATERAL MALLEOLI)
    const ankleGroup = new THREE.Group();
    ankleGroup.position.set(0, -0.50, 0);
    calfGroup.add(ankleGroup);

    const ankleJoint = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 16), this.matJoint);
    ankleGroup.add(ankleJoint);

    // Medial malleolus (inner ankle bone, slightly higher)
    const innerAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), this.matSkin);
    innerAnkle.position.set(isLeft ? 0.052 : -0.052, 0.005, 0);
    ankleGroup.add(innerAnkle);

    // Lateral malleolus (outer ankle bone, slightly lower)
    const outerAnkle = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), this.matSkin);
    outerAnkle.position.set(isLeft ? -0.054 : 0.054, -0.015, 0);
    ankleGroup.add(outerAnkle);

    // 6. SCULPTED HUMAN FOOT (ARCH, HEEL, BALL & 5 TOES)
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -0.06, 0.04);
    footGroup.rotation.y = isLeft ? 0.08 : -0.08; // Confident athletic stance
    ankleGroup.add(footGroup);

    // Calcaneus (Heel bone)
    const heel = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), this.matSkin);
    heel.scale.set(0.95, 0.90, 1.25);
    heel.position.set(0, 0.01, -0.085);
    footGroup.add(heel);

    // Midfoot & Plantar Arch
    const midfoot = new THREE.Mesh(new THREE.BoxGeometry(0.138, 0.068, 0.20), this.matSkin);
    midfoot.position.set(0, 0.015, 0.02);
    footGroup.add(midfoot);

    // Ball of the Foot (Metatarsal pad)
    const footBall = new THREE.Mesh(new THREE.SphereGeometry(0.070, 14, 14), this.matSkin);
    footBall.scale.set(1.08, 0.72, 1.15);
    footBall.position.set(0, 0.005, 0.125);
    footGroup.add(footBall);

    // 5 Sculpted Human Toes along natural foot arch
    const toeSpecs = [
      { name: "bigToe",  x: isLeft ? 0.044 : -0.044, z: 0.190, r: 0.022, len: 0.058 },
      { name: "indexToe",x: isLeft ? 0.022 : -0.022, z: 0.198, r: 0.018, len: 0.052 },
      { name: "midToe",  x: 0,                       z: 0.192, r: 0.017, len: 0.048 },
      { name: "fourthToe",x: isLeft ? -0.022 : 0.022,z: 0.182, r: 0.016, len: 0.044 },
      { name: "pinkyToe", x: isLeft ? -0.044 : 0.044,z: 0.170, r: 0.015, len: 0.040 }
    ];

    toeSpecs.forEach((ts) => {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(ts.r, 10, 10), this.matSkin);
      toe.scale.set(1.0, 0.85, 1.35);
      toe.position.set(ts.x, -0.008, ts.z);
      footGroup.add(toe);

      // Natural Toenail in matNails
      const toenail = new THREE.Mesh(new THREE.BoxGeometry(ts.r * 1.3, 0.006, ts.r * 1.1), this.matNails);
      toenail.position.set(ts.x, 0.006, ts.z + ts.r * 0.4);
      footGroup.add(toenail);
    });

    // Sleek ground contact sole pad
    const solePad = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.016, 0.28), this.matChassis);
    solePad.position.set(0, -0.024, 0.035);
    footGroup.add(solePad);

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
    this.wardrobeParts = {
      cyber: [],
      student: [],
      scientist: [],
      hoodie: [],
      astronaut: []
    };

    const register = (outfitKey, mesh, parent) => {
      mesh.visible = false;
      parent.add(mesh);
      this.wardrobeParts[outfitKey].push(mesh);
      return mesh;
    };

    // ==========================================
    // 0. CYBER MECHA EXOSKELETON ARMOR (TITANIUM PLATES & NEON CONDUITS)
    // ==========================================
    const cyberTorso = new THREE.Group();
    cyberTorso.position.set(0, 0, 0);

    // Left and Right Cyber Chest Pectoral Armor Plates
    [-0.155, 0.155].forEach((cx) => {
      const isLeft = cx < 0;
      const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.04), this.matArmor);
      chestPlate.position.set(cx, 0.12, 0.17);
      chestPlate.rotation.z = isLeft ? -0.10 : 0.10;
      chestPlate.rotation.y = isLeft ? 0.08 : -0.08;
      cyberTorso.add(chestPlate);

      // Glowing Neon Conduit on Pectoral Plate
      const pecGlow = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.12, 0.012), this.matAccent);
      pecGlow.position.set(cx + (isLeft ? -0.04 : 0.04), 0.12, 0.192);
      cyberTorso.add(pecGlow);
    });

    // Hexagonal Cyber Abdominal Armor Protector
    const cyberAbPlate = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.035), this.matChassis);
    cyberAbPlate.position.set(0, -0.08, 0.145);
    cyberTorso.add(cyberAbPlate);

    // Cyber Belt & Hip Armor Guards
    const cyberBelt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.22), this.matJoint);
    cyberBelt.position.set(0, -0.22, 0.05);
    cyberTorso.add(cyberBelt);

    [-0.22, 0.22].forEach((hx) => {
      const hipGuard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.16), this.matArmor);
      hipGuard.position.set(hx, -0.26, 0.06);
      cyberTorso.add(hipGuard);
    });

    register("cyber", cyberTorso, this.torsoGroup);

    // Cyber Deltoid Epaulet Caps
    [-1, 1].forEach((dir) => {
      const armGroup = (dir === -1) ? this.leftArm.group : this.rightArm.group;
      const isLeft = dir === -1;
      const cyberShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.165, 16, 16), this.matArmor);
      cyberShoulder.scale.set(1.15, 0.90, 1.10);
      cyberShoulder.position.set(isLeft ? -0.02 : 0.02, 0.03, 0);
      register("cyber", cyberShoulder, armGroup);

      const shoulderHalo = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 12, 24), this.matAccent);
      shoulderHalo.position.set(isLeft ? -0.02 : 0.02, 0.03, 0);
      register("cyber", shoulderHalo, armGroup);
    });

    // Cyber Thigh, Knee & Shin Armor Plating
    if (this.leftLeg && this.rightLeg) {
      [-1, 1].forEach((dir) => {
        const leg = (dir === -1) ? this.leftLeg : this.rightLeg;
        const isLeft = dir === -1;

        // Front Thigh Armor Shield
        const thighShield = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.34, 0.05), this.matArmor);
        thighShield.position.set(0, -0.23, 0.075);
        register("cyber", thighShield, leg.thigh);

        const thighGlow = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.26, 0.015), this.matAccent);
        thighGlow.position.set(0, -0.23, 0.102);
        register("cyber", thighGlow, leg.thigh);

        // Knee Cap Armor & Halo Ring
        const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.082, 16, 16), this.matChrome);
        kneeCap.scale.set(1.0, 1.15, 1.25);
        kneeCap.position.set(0, 0.01, 0.04);
        register("cyber", kneeCap, leg.knee);

        const kneeHalo = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.012, 12, 24), this.matAccent);
        kneeHalo.position.set(0, 0.01, 0.095);
        register("cyber", kneeHalo, leg.knee);

        // Shin Armor Guard
        const shinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.38, 0.055), this.matArmor);
        shinGuard.position.set(0, -0.24, 0.075);
        register("cyber", shinGuard, leg.calf);

        const shinGlow = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.30, 0.015), this.matAccent);
        shinGlow.position.set(0, -0.24, 0.105);
        register("cyber", shinGlow, leg.calf);

        // Cyber Combat Boot Upper Armor & Sole
        const bootPlate = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.082, 0.30), this.matArmor);
        bootPlate.position.set(0, 0.01, 0.03);
        register("cyber", bootPlate, leg.foot);

        const toeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.145, 16), this.matChrome);
        toeCap.rotation.z = Math.PI / 2;
        toeCap.position.set(0, 0.01, 0.155);
        register("cyber", toeCap, leg.foot);

        const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.170, 0.020, 0.32), this.matAccent);
        bootSole.position.set(0, -0.038, 0.035);
        register("cyber", bootSole, leg.foot);
      });
    }

    // ==========================================
    // 1. STUDENT SCHOOL UNIFORM (ACADEMIC SHIELD CREST & GRADUATION MORTARBOARD)
    // ==========================================
    const studentTorso = new THREE.Group();
    studentTorso.position.set(0, 0, 0);

    const blazer = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.50, 0.28), this.matSuitNavy);
    blazer.position.set(0, 0.08, 0.10);
    studentTorso.add(blazer);

    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.29), this.matShirtWhite);
    shirt.position.set(0, 0.12, 0.11);
    studentTorso.add(shirt);

    const tie = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.28, 4), this.matTieRed);
    tie.position.set(0, 0.08, 0.26);
    tie.rotation.x = Math.PI;
    studentTorso.add(tie);

    const tieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.045, 0.03), this.matTieRed);
    tieKnot.position.set(0, 0.22, 0.26);
    studentTorso.add(tieKnot);

    // Academic Crest Shield Symbol on Left Breast Pocket
    const crestGroup = new THREE.Group();
    crestGroup.position.set(-0.20, 0.14, 0.25);

    const shield = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.10, 0.015), this.matSpaceGold);
    crestGroup.add(shield);

    const bookSymbol = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.04, 0.012), this.matSuitNavy);
    bookSymbol.position.set(0, 0.01, 0.01);
    crestGroup.add(bookSymbol);

    const starSymbol = new THREE.Mesh(new THREE.CircleGeometry(0.015, 8), this.matSpaceGold);
    starSymbol.position.set(0, -0.025, 0.016);
    crestGroup.add(starSymbol);

    studentTorso.add(crestGroup);

    [-0.04, -0.12].forEach((by) => {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.015, 12), this.matSpaceGold);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0.02, by, 0.25);
      studentTorso.add(btn);
    });

    register("student", studentTorso, this.torsoGroup);

    // Academic Graduation Mortarboard Cap
    const studentCap = new THREE.Group();
    studentCap.position.set(0, 0.38, 0);

    const capBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.35, 0.14, 24), this.matSuitNavy);
    capBase.position.set(0, 0.02, 0);
    studentCap.add(capBase);

    const capPlate = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.022, 0.70), this.matSuitNavy);
    capPlate.position.set(0, 0.10, 0);
    capPlate.rotation.x = 0.08;
    studentCap.add(capPlate);

    const tasselButton = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), this.matSpaceGold);
    tasselButton.position.set(0, 0.12, 0);
    studentCap.add(tasselButton);

    const tasselCord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.014, 0.24, 8), this.matSpaceGold);
    tasselCord.position.set(0.24, 0.02, 0.12);
    tasselCord.rotation.z = -0.3;
    studentCap.add(tasselCord);

    register("student", studentCap, this.headGroup);

    // Blazer Sleeves on Arms
    [-1, 1].forEach((dir) => {
      const upperArm = (dir === -1) ? this.leftArm.upperArm : this.rightArm.upperArm;
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.094, 0.084, 0.34, 16), this.matSuitNavy);
      sleeve.position.set(0, -0.16, 0);
      register("student", sleeve, upperArm);
    });

    if (this.leftLeg && this.rightLeg) {
      const leftPantsThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.114, 0.098, 0.46, 18), this.matSuitNavy);
      leftPantsThigh.position.set(0, -0.24, 0);
      register("student", leftPantsThigh, this.leftLeg.thigh);

      const rightPantsThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.114, 0.098, 0.46, 18), this.matSuitNavy);
      rightPantsThigh.position.set(0, -0.24, 0);
      register("student", rightPantsThigh, this.rightLeg.thigh);

      const leftPantsCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.084, 0.46, 18), this.matSuitNavy);
      leftPantsCalf.position.set(0, -0.25, 0);
      register("student", leftPantsCalf, this.leftLeg.calf);

      const rightPantsCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.084, 0.46, 18), this.matSuitNavy);
      rightPantsCalf.position.set(0, -0.25, 0);
      register("student", rightPantsCalf, this.rightLeg.calf);

      const leftOxford = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.082, 0.30), this.matChassis);
      leftOxford.position.set(0, 0, 0.03);
      register("student", leftOxford, this.leftLeg.foot);

      const rightOxford = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.082, 0.30), this.matChassis);
      rightOxford.position.set(0, 0, 0.03);
      register("student", rightOxford, this.rightLeg.foot);
    }

    // ==========================================
    // 2. SCIENTIST LAB COAT (ID BADGE, PENS, STETHOSCOPE & SMART SPECTACLES)
    // ==========================================
    const scientistTorso = new THREE.Group();
    scientistTorso.position.set(0, 0, 0);

    const labCoat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.68, 0.30), this.matLabCoat);
    labCoat.position.set(0, -0.02, 0.10);
    scientistTorso.add(labCoat);

    [-0.15, 0.15].forEach((lx) => {
      const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.02), this.matLabCoat);
      lapel.position.set(lx, 0.12, 0.26);
      scientistTorso.add(lapel);
    });

    // Pinned Research ID Badge Symbol
    const badgeGroup = new THREE.Group();
    badgeGroup.position.set(0.18, 0.14, 0.26);

    const badgeBacking = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.015), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    badgeGroup.add(badgeBacking);

    const badgePhoto = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.055, 0.01), this.matMissionBlue);
    badgePhoto.position.set(0, 0.025, 0.01);
    badgeGroup.add(badgePhoto);

    const badgeBarcode = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.018, 0.01), this.matJoint);
    badgeBarcode.position.set(0, -0.035, 0.01);
    badgeGroup.add(badgeBarcode);

    const badgeClip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.02), this.matChrome);
    badgeClip.position.set(0, 0.075, 0.01);
    badgeGroup.add(badgeClip);

    scientistTorso.add(badgeGroup);

    // Left Pocket with Dual Technical Pens
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.10, 0.02), this.matLabCoat);
    pocket.position.set(-0.18, 0.10, 0.26);
    scientistTorso.add(pocket);

    const silverPen = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.12, 8), this.matChrome);
    silverPen.position.set(-0.16, 0.16, 0.27);
    scientistTorso.add(silverPen);

    const bluePen = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.12, 8), this.matMissionBlue);
    bluePen.position.set(-0.20, 0.16, 0.27);
    scientistTorso.add(bluePen);

    // Scientific Stethoscope draped around neck
    const stethTubing = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.016, 12, 28), this.matStethoscope);
    stethTubing.position.set(0, 0.26, 0.06);
    stethTubing.rotation.x = Math.PI / 2.3;
    scientistTorso.add(stethTubing);

    const chestPiece = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.016, 16), this.matChrome);
    chestPiece.rotation.x = Math.PI / 2;
    chestPiece.position.set(0.08, -0.06, 0.26);
    scientistTorso.add(chestPiece);

    register("scientist", scientistTorso, this.torsoGroup);

    // Smart Research Spectacles on Face
    const glassesGroup = new THREE.Group();
    glassesGroup.position.set(0, 0.06, 0.50);

    [-0.18, 0.18].forEach((gx) => {
      const frame = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 12, 24), this.matSpaceGold);
      frame.position.set(gx, 0, 0);
      glassesGroup.add(frame);
    });

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.014, 0.02), this.matSpaceGold);
    bridge.position.set(0, 0, 0);
    glassesGroup.add(bridge);

    register("scientist", glassesGroup, this.headGroup);

    // Lab Coat Sleeves on Arms
    [-1, 1].forEach((dir) => {
      const upperArm = (dir === -1) ? this.leftArm.upperArm : this.rightArm.upperArm;
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.086, 0.34, 16), this.matLabCoat);
      sleeve.position.set(0, -0.16, 0);
      register("scientist", sleeve, upperArm);
    });

    if (this.leftLeg && this.rightLeg) {
      const leftSlacksThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.114, 0.098, 0.46, 18), this.matSlateTrousers);
      leftSlacksThigh.position.set(0, -0.24, 0);
      register("scientist", leftSlacksThigh, this.leftLeg.thigh);

      const rightSlacksThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.114, 0.098, 0.46, 18), this.matSlateTrousers);
      rightSlacksThigh.position.set(0, -0.24, 0);
      register("scientist", rightSlacksThigh, this.rightLeg.thigh);

      const leftSlacksCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.084, 0.46, 18), this.matSlateTrousers);
      leftSlacksCalf.position.set(0, -0.25, 0);
      register("scientist", leftSlacksCalf, this.leftLeg.calf);

      const rightSlacksCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.084, 0.46, 18), this.matSlateTrousers);
      rightSlacksCalf.position.set(0, -0.25, 0);
      register("scientist", rightSlacksCalf, this.rightLeg.calf);

      const leftLabShoe = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.082, 0.30), this.matLabCoat);
      leftLabShoe.position.set(0, 0, 0.03);
      register("scientist", leftLabShoe, this.leftLeg.foot);

      const rightLabShoe = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.082, 0.30), this.matLabCoat);
      rightLabShoe.position.set(0, 0, 0.03);
      register("scientist", rightLabShoe, this.rightLeg.foot);
    }

    // ==========================================
    // 3. STREETWEAR HOODIE (GLOWING NEON CYBER SYMBOL & TECH DENIM)
    // ==========================================
    const hoodieTorso = new THREE.Group();
    hoodieTorso.position.set(0, 0, 0);

    const hoodieBody = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.54, 0.32), this.matHoodie);
    hoodieBody.position.set(0, 0.08, 0.10);
    hoodieTorso.add(hoodieBody);

    const kPouch = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.18, 0.06), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }));
    kPouch.position.set(0, -0.04, 0.27);
    hoodieTorso.add(kPouch);

    const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.09, 12, 24), this.matHoodie);
    hoodCollar.position.set(0, 0.35, -0.04);
    hoodCollar.rotation.x = Math.PI / 2.6;
    hoodieTorso.add(hoodCollar);

    // Glowing Neon Cyber Tech Symbol on Center Chest
    const neonSymbolGeo = new THREE.ConeGeometry(0.065, 0.11, 3);
    const neonSymbol = new THREE.Mesh(neonSymbolGeo, this.matAccent);
    neonSymbol.rotation.z = Math.PI;
    neonSymbol.position.set(0, 0.14, 0.27);
    hoodieTorso.add(neonSymbol);

    [-0.08, 0.08].forEach((dx) => {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.20, 8), this.matShirtWhite);
      cord.position.set(dx, 0.14, 0.27);
      hoodieTorso.add(cord);
    });

    register("hoodie", hoodieTorso, this.torsoGroup);

    // Hoodie Sleeves on Arms
    [-1, 1].forEach((dir) => {
      const upperArm = (dir === -1) ? this.leftArm.upperArm : this.rightArm.upperArm;
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.088, 0.34, 16), this.matHoodie);
      sleeve.position.set(0, -0.16, 0);
      register("hoodie", sleeve, upperArm);
    });

    if (this.leftLeg && this.rightLeg) {
      const leftDenimThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.100, 0.46, 18), this.matJeans);
      leftDenimThigh.position.set(0, -0.24, 0);
      register("hoodie", leftDenimThigh, this.leftLeg.thigh);

      const rightDenimThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.100, 0.46, 18), this.matJeans);
      rightDenimThigh.position.set(0, -0.24, 0);
      register("hoodie", rightDenimThigh, this.rightLeg.thigh);

      const leftDenimCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.100, 0.086, 0.46, 18), this.matJeans);
      leftDenimCalf.position.set(0, -0.25, 0);
      register("hoodie", leftDenimCalf, this.leftLeg.calf);

      const rightDenimCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.100, 0.086, 0.46, 18), this.matJeans);
      rightDenimCalf.position.set(0, -0.25, 0);
      register("hoodie", rightDenimCalf, this.rightLeg.calf);

      [-1, 1].forEach((dir) => {
        const foot = (dir === -1) ? this.leftLeg.foot : this.rightLeg.foot;
        const sneaker = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.085, 0.31), this.matShirtWhite);
        sneaker.position.set(0, 0, 0.03);
        register("hoodie", sneaker, foot);

        const sneakerSole = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.02, 0.32), this.matAccent);
        sneakerSole.position.set(0, -0.045, 0.03);
        register("hoodie", sneakerSole, foot);
      });
    }

    // ==========================================
    // 4. ASTRONAUT SPACE SUIT (MISSION PATCH, O2 VALVES, TELEMETRY CONSOLE & BACKPACK)
    // ==========================================
    const astroTorso = new THREE.Group();
    astroTorso.position.set(0, 0, 0);

    const astroHarness = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.52, 0.34), this.matSpaceSuit);
    astroHarness.position.set(0, 0.08, 0.10);
    astroTorso.add(astroHarness);

    [-0.16, 0.16].forEach((vx) => {
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.05, 16), this.matSpaceGold);
      valve.rotation.x = Math.PI / 2;
      valve.position.set(vx, 0.14, 0.28);
      astroTorso.add(valve);
    });

    // Spaceflight Mission Patch Symbol on Chest
    const patchGroup = new THREE.Group();
    patchGroup.position.set(-0.18, 0.18, 0.28);

    const patchBacking = new THREE.Mesh(new THREE.CircleGeometry(0.048, 20), this.matMissionBlue);
    patchGroup.add(patchBacking);

    const patchOrbit = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.007, 8, 16), this.matSpaceGold);
    patchOrbit.position.set(0, 0, 0.005);
    patchGroup.add(patchOrbit);

    const patchStar = new THREE.Mesh(new THREE.CircleGeometry(0.012, 8), this.matShirtWhite);
    patchStar.position.set(0, 0, 0.01);
    patchGroup.add(patchStar);

    astroTorso.add(patchGroup);

    // Chest Telemetry Status Box with Multi-Colored LEDs
    const telemetryBox = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.035), this.matJoint);
    telemetryBox.position.set(0, 0.01, 0.28);
    astroTorso.add(telemetryBox);

    [
      { x: -0.07, color: 0x22c55e },
      { x: 0.0, color: 0xf59e0b },
      { x: 0.07, color: 0x38bdf8 }
    ].forEach((led) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), new THREE.MeshStandardMaterial({
        color: led.color,
        emissive: led.color,
        emissiveIntensity: 0.9
      }));
      dot.position.set(led.x, 0.01, 0.30);
      astroTorso.add(dot);
    });

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.50, 0.24), this.matChassis);
    backpack.position.set(0, 0.08, -0.22);
    astroTorso.add(backpack);

    [-0.20, 0.20].forEach((tx) => {
      const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.048, 0.08, 16), this.matSpaceGold);
      thruster.position.set(tx, 0.35, -0.22);
      astroTorso.add(thruster);
    });

    register("astronaut", astroTorso, this.torsoGroup);

    const commsGroup = new THREE.Group();
    commsGroup.position.set(0, 0, 0);

    const commsBase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16), this.matChassis);
    commsBase.rotation.z = Math.PI / 2;
    commsBase.position.set(0.58, 0.02, 0.05);
    commsGroup.add(commsBase);

    const micBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 8), this.matSpaceGold);
    micBoom.rotation.x = Math.PI / 2.8;
    micBoom.rotation.z = -Math.PI / 3.5;
    micBoom.position.set(0.42, -0.06, 0.25);
    commsGroup.add(micBoom);

    register("astronaut", commsGroup, this.headGroup);

    // Space Suit Sleeves on Arms
    [-1, 1].forEach((dir) => {
      const upperArm = (dir === -1) ? this.leftArm.upperArm : this.rightArm.upperArm;
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.092, 0.34, 16), this.matSpaceSuit);
      sleeve.position.set(0, -0.16, 0);
      register("astronaut", sleeve, upperArm);
    });

    if (this.leftLeg && this.rightLeg) {
      const leftAstroThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.104, 0.46, 18), this.matSpaceSuit);
      leftAstroThigh.position.set(0, -0.24, 0);
      register("astronaut", leftAstroThigh, this.leftLeg.thigh);

      const rightAstroThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.122, 0.104, 0.46, 18), this.matSpaceSuit);
      rightAstroThigh.position.set(0, -0.24, 0);
      register("astronaut", rightAstroThigh, this.rightLeg.thigh);

      const leftAstroCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.106, 0.092, 0.46, 18), this.matSpaceSuit);
      leftAstroCalf.position.set(0, -0.25, 0);
      register("astronaut", leftAstroCalf, this.leftLeg.calf);

      const rightAstroCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.106, 0.092, 0.46, 18), this.matSpaceSuit);
      rightAstroCalf.position.set(0, -0.25, 0);
      register("astronaut", rightAstroCalf, this.rightLeg.calf);

      const leftMoonBoot = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.092, 0.32), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25 }));
      leftMoonBoot.position.set(0, 0, 0.03);
      register("astronaut", leftMoonBoot, this.leftLeg.foot);

      const rightMoonBoot = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.092, 0.32), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25 }));
      rightMoonBoot.position.set(0, 0, 0.03);
      register("astronaut", rightMoonBoot, this.rightLeg.foot);
    }
  }

  setOutfit(outfitKey) {
    if (!["cyber", "student", "scientist", "hoodie", "astronaut"].includes(outfitKey)) return;
    this.currentOutfit = outfitKey;

    if (this.wardrobeParts) {
      Object.keys(this.wardrobeParts).forEach((key) => {
        const isSelected = (key === outfitKey);
        this.wardrobeParts[key].forEach((part) => {
          part.visible = isSelected;
        });
      });
    }

    // Play transformation SFX
    if (window.AudioEngine) {
      if (window.AudioEngine.playChime) window.AudioEngine.playChime();
      else if (window.AudioEngine.playRobotChirp) window.AudioEngine.playRobotChirp();
    }
  }

  toggleHand() {
    this.activeHand = (this.activeHand === "left") ? "right" : "left";
    return this.activeHand;
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

  // --- INTERACTIVE ACTIONS & GESTURES ARCHITECTURE ---

  /**
   * Execute a robot action gesture with promise-based lifecycle.
   * @param {string} actionName - 'hello', 'bye', 'hifi', 'kiss', 'salute', 'think', 'nod', 'shakeHead', 'celebrate'
   * @param {Function} [onComplete] - Optional callback invoked when action concludes
   * @param {number} [duration] - Optional override duration in seconds
   * @returns {Promise<void>}
   */
  doAction(actionName, onComplete, duration = null) {
    this.currentAction = actionName;
    this.actionTimer = 0;
    this.actionDuration = duration;

    return new Promise((resolve) => {
      this._actionResolver = () => {
        if (typeof onComplete === "function") {
          try { onComplete(); } catch (err) { console.error("Action onComplete error:", err); }
        }
        resolve();
      };

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
        this.hifiSlapped = false;
        if (window.AudioEngine) {
          window.AudioEngine.playRobotChirp();
          window.AudioEngine.speak("Give me a high-five! Tap my hand or screen!");
        }
      } else if (actionName === "kiss") {
        this.setExpression("happy");
        if (window.AudioEngine) {
          if (window.AudioEngine.playKissSound) window.AudioEngine.playKissSound();
          else window.AudioEngine.playRobotChirp();
          window.AudioEngine.speak("Sending you lots of love and positive energy!");
        }
        setTimeout(() => this.spawnHeartParticles(), 1200);
      } else if (actionName === "salute") {
        this.setExpression("idle");
        if (window.AudioEngine) {
          if (window.AudioEngine.playSalute) window.AudioEngine.playSalute();
          else window.AudioEngine.playServoHum();
          window.AudioEngine.speak("Standing at attention! System fully operational!");
        }
      } else if (actionName === "think") {
        this.setExpression("thinking");
        if (window.AudioEngine && window.AudioEngine.playServoHum) {
          window.AudioEngine.playServoHum();
        }
      } else if (actionName === "nod") {
        this.setExpression("happy");
        if (window.AudioEngine && window.AudioEngine.playChime) {
          window.AudioEngine.playChime();
        }
      } else if (actionName === "shakeHead") {
        this.setExpression("idle");
        if (window.AudioEngine && window.AudioEngine.playHydraulicClick) {
          window.AudioEngine.playHydraulicClick();
        }
      } else if (actionName === "celebrate") {
        this.setExpression("happy");
        if (window.AudioEngine) {
          if (window.AudioEngine.playVictoryFanfare) window.AudioEngine.playVictoryFanfare();
          else if (window.AudioEngine.playChime) window.AudioEngine.playChime();
          window.AudioEngine.speak("Outstanding job! Goal achieved!");
        }
      }
    });
  }

  endAction() {
    this.currentAction = null;
    this.actionTimer = 0;
    this.isHifiReady = false;
    this.hifiSlapped = false;
    this.setExpression("idle");
    if (this._actionResolver) {
      const resolve = this._actionResolver;
      this._actionResolver = null;
      resolve();
    }
  }

  // First-Class Convenient Action Methods
  hello(onComplete) {
    return this.doAction("hello", onComplete);
  }

  bye(onComplete) {
    return this.doAction("bye", onComplete);
  }

  hifi(onComplete) {
    return this.doAction("hifi", onComplete);
  }

  kiss(onComplete) {
    return this.doAction("kiss", onComplete);
  }

  salute(onComplete) {
    return this.doAction("salute", onComplete);
  }

  think(duration = 2.5, onComplete) {
    return this.doAction("think", onComplete, duration);
  }

  nod(onComplete) {
    return this.doAction("nod", onComplete);
  }

  shakeHead(onComplete) {
    return this.doAction("shakeHead", onComplete);
  }

  celebrate(onComplete) {
    return this.doAction("celebrate", onComplete);
  }

  stopAction() {
    this.endAction();
  }

  spawnHeartParticles() {
    const x = 0, y = 0;
    const heartShape = new THREE.Shape();
    heartShape.moveTo(x + 0.05, y + 0.05);
    heartShape.bezierCurveTo(x + 0.05, y + 0.05, x + 0.04, y, x, y);
    heartShape.bezierCurveTo(x - 0.06, y, x - 0.06, y + 0.07, x - 0.06, y + 0.07);
    heartShape.bezierCurveTo(x - 0.06, y + 0.11, x - 0.03, y + 0.154, x + 0.05, y + 0.19);
    heartShape.bezierCurveTo(x + 0.12, y + 0.154, x + 0.16, y + 0.11, x + 0.16, y + 0.07);
    heartShape.bezierCurveTo(x + 0.16, y + 0.07, x + 0.16, y, x + 0.10, y);
    heartShape.bezierCurveTo(x + 0.07, y, x + 0.05, y + 0.05, x + 0.05, y + 0.05);

    for (let i = 0; i < 10; i++) {
      const heartGeo = new THREE.ShapeGeometry(heartShape);
      const heart = new THREE.Mesh(heartGeo, this.matHeart);
      heart.rotation.z = Math.PI;
      heart.scale.set(0.38, 0.38, 0.38);
      heart.position.set(
        0.12 + (Math.random() - 0.5) * 0.14,
        0.48 + (Math.random() - 0.5) * 0.10,
        0.58 + Math.random() * 0.12
      );
      heart.userData = {
        vx: (Math.random() - 0.5) * 0.40,
        vy: 0.25 + Math.random() * 0.35,
        vz: 1.1 + Math.random() * 0.7,
        rotV: (Math.random() - 0.5) * 4.0,
        life: 1.2
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
      // Clamp zoom limits: close macro inspection (1.2) to wide full view (6.5)
      this.targetCameraDistance = Math.max(1.2, Math.min(6.5, this.targetCameraDistance));
    }, { passive: false });

    // Double-click to reset view
    this.container.addEventListener("dblclick", () => {
      this.resetCameraView();
    });

    window.addEventListener("resize", () => this.onResize());
  }

  triggerHighFiveClap() {
    if (!this.isHifiReady) return;
    this.isHifiReady = false;
    this.hifiSlapped = true;
    this.hifiSlapTimer = 0;
    if (window.AudioEngine) {
      if (window.AudioEngine.playClap) window.AudioEngine.playClap();
      else if (window.AudioEngine.playHydraulicClick) window.AudioEngine.playHydraulicClick();
      window.AudioEngine.speak("Awesome high-five! Let's conquer our study goals!");
    }
    this.setExpression("happy");
  }

  onHifiHit() {
    this.triggerHighFiveClap();
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
      this.targetCameraDistance = 1.35;
      this.targetRotationX = 0.02;
      this.targetRotationY = 0;
      this.cameraLookTarget.set(0, 0.84, 0.12);
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

    // 3. Head & Eyes Cursor Tracking with Expressive Kinematics
    if (this.headGroup && !this.isDragging) {
      if (this.expression === "thinking") {
        // Inquisitive head tilt up and to the side with subtle cognitive oscillation
        this.headGroup.rotation.y = this.mouse.x * 0.25 + 0.16;
        this.headGroup.rotation.x = -0.15 + Math.sin(time * 3.0) * 0.03;
        this.headGroup.rotation.z = 0.14;
      } else if (this.expression === "speaking") {
        // Subtle rhythmic conversational head nods synchronized with speech cadence
        this.headGroup.rotation.y = this.mouse.x * 0.45;
        this.headGroup.rotation.x = -this.mouse.y * 0.30 + Math.sin(time * 6.0) * 0.035;
        this.headGroup.rotation.z = Math.sin(time * 3.0) * 0.02;
      } else if (this.expression === "happy") {
        // Cheerful affirmative encouraging head nod
        this.headGroup.rotation.y = this.mouse.x * 0.40;
        this.headGroup.rotation.x = -this.mouse.y * 0.25 + Math.sin(time * 5.0) * 0.04;
        this.headGroup.rotation.z = 0.04;
      } else {
        this.headGroup.rotation.y = this.mouse.x * 0.45;
        this.headGroup.rotation.x = -this.mouse.y * 0.30;
        this.headGroup.rotation.z = 0;
      }
    }

    if (this.leftEye && this.rightEye) {
      const gx = this.mouse.x * 0.026;
      const gy = this.mouse.y * 0.018;

      if (this.leftEye.userData.gazeGroup) {
        this.leftEye.userData.gazeGroup.position.x = gx;
        this.leftEye.userData.gazeGroup.position.y = gy;
      }
      if (this.rightEye.userData.gazeGroup) {
        this.rightEye.userData.gazeGroup.position.x = gx;
        this.rightEye.userData.gazeGroup.position.y = gy;
      }

      // Smooth Natural Eyelid Blinking & Expressive Squinting
      const blinkCycle = (time % 3.8);
      let lidOpen = 1.0;
      if (blinkCycle < 0.14) {
        const t = blinkCycle / 0.14;
        lidOpen = 1.0 - Math.sin(t * Math.PI);
      }
      if (this.expression === "happy") {
        lidOpen *= 0.65; // Warm smiling squint
      } else if (this.expression === "surprised") {
        lidOpen = 1.15; // Wide focused gaze
      }

      const lidAngle = -Math.PI * 0.5 * Math.max(0, Math.min(1.2, lidOpen));
      if (this.leftEye.userData.eyelid) this.leftEye.userData.eyelid.rotation.x = lidAngle;
      if (this.rightEye.userData.eyelid) this.rightEye.userData.eyelid.rotation.x = lidAngle;

      // Cybernetic Pupil Laser Diode Pulse
      if (this.expression === "speaking" || this.isOverdrive) {
        const pulse = 1.0 + Math.sin(time * 12) * 0.25;
        if (this.leftEye.userData.pupilCore) this.leftEye.userData.pupilCore.scale.set(pulse, pulse, pulse);
        if (this.rightEye.userData.pupilCore) this.rightEye.userData.pupilCore.scale.set(pulse, pulse, pulse);
        if (this.leftEyeLight) this.leftEyeLight.intensity = 1.4 + Math.sin(time * 12) * 0.4;
        if (this.rightEyeLight) this.rightEyeLight.intensity = 1.4 + Math.sin(time * 12) * 0.4;
      } else {
        if (this.leftEye.userData.pupilCore) this.leftEye.userData.pupilCore.scale.set(1, 1, 1);
        if (this.rightEye.userData.pupilCore) this.rightEye.userData.pupilCore.scale.set(1, 1, 1);
        if (this.leftEyeLight) this.leftEyeLight.intensity = 1.2;
        if (this.rightEyeLight) this.rightEyeLight.intensity = 1.2;
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

        // Kinematic weight shift targets between left and right leg
        let targetLeftLeg = { thighX: 0, thighZ: 0, kneeX: 0 };
        let targetRightLeg = { thighX: 0, thighZ: 0, kneeX: 0 };

        if (this.currentAction === "salute") {
          // Standing rigid at attention: heels aligned, zero sway
          targetLeftLeg = { thighX: 0, thighZ: 0, kneeX: 0 };
          targetRightLeg = { thighX: 0, thighZ: 0, kneeX: 0 };
        } else if (this.currentAction === "hifi") {
          // Athletic grounded stance
          targetLeftLeg = { thighX: 0.10, thighZ: -0.04, kneeX: -0.12 };
          targetRightLeg = { thighX: -0.06, thighZ: 0.04, kneeX: 0.06 };
        } else if (this.currentAction === "hello" || this.currentAction === "bye") {
          // Weight shifted toward left hip to balance right arm gesture
          targetLeftLeg = { thighX: 0.04, thighZ: 0.035, kneeX: 0.02 };
          targetRightLeg = { thighX: -0.04, thighZ: -0.035, kneeX: 0.04 };
        } else {
          // Natural idle breathing weight shift
          const shift = Math.sin(time * 1.5);
          targetLeftLeg = { thighX: shift * 0.022, thighZ: shift * 0.022, kneeX: Math.max(0, -shift * 0.025) };
          targetRightLeg = { thighX: -shift * 0.022, thighZ: -shift * 0.022, kneeX: Math.max(0, shift * 0.025) };
        }

        if (this.leftLeg && this.rightLeg) {
          const legAlpha = Math.min(1.0, delta * 8.0);
          this.leftLeg.thigh.rotation.x += (targetLeftLeg.thighX - this.leftLeg.thigh.rotation.x) * legAlpha;
          this.leftLeg.thigh.rotation.z += (targetLeftLeg.thighZ - this.leftLeg.thigh.rotation.z) * legAlpha;
          this.leftLeg.knee.rotation.x += (targetLeftLeg.kneeX - this.leftLeg.knee.rotation.x) * legAlpha;

          this.rightLeg.thigh.rotation.x += (targetRightLeg.thighX - this.rightLeg.thigh.rotation.x) * legAlpha;
          this.rightLeg.thigh.rotation.z += (targetRightLeg.thighZ - this.rightLeg.thigh.rotation.z) * legAlpha;
          this.rightLeg.knee.rotation.x += (targetRightLeg.kneeX - this.rightLeg.knee.rotation.x) * legAlpha;
        }
      }
    }

    // 5. Speech Bar Pulsing
    if (this.speechLED && this.expression === "speaking") {
      const pulse = Math.abs(Math.sin(time * 14)) * 0.15 + 0.1;
      this.speechLED.scale.set(1 + pulse, 1 + pulse, 1);
    }

    // 6. Kinematic Action Gestures & Pose Interpolation
    if (this.leftArm && this.rightArm) {
      const breathe = Math.sin(time * 1.8) * 0.03;

      // Default Neutral Idle Poses with Dynamic Expression Articulation (naturally outside body)
      const targetLeft = {
        upper: { x: 0.25 + breathe, y: 0.0, z: -0.14 },
        fore: { x: -1.05 + breathe, y: 0.0, z: 0.0 },
        hand: { x: -0.25, y: 0.40, z: 0.0 }
      };
      const targetRight = {
        upper: { x: 0.25 + breathe, y: 0.0, z: 0.14 },
        fore: { x: -1.05 + breathe, y: 0.0, z: 0.0 },
        hand: { x: -0.25, y: -0.40, z: 0.0 }
      };
      const targetHead = { x: 0.0, y: 0.0, z: 0.0 };
      let leftFingersTarget = Math.sin(time * 2.2) * 0.12 + 0.18;
      let rightFingersTarget = Math.sin(time * 2.2) * 0.12 + 0.18;

      // Inquisitive Contemplative Arm Gestures during Thinking
      if (this.expression === "thinking" && !this.currentAction) {
        targetLeft.upper = { x: 0.48 + breathe, y: 0.24, z: 0.36 };
        targetLeft.fore = { x: -1.82, y: 0.18, z: 0.08 };
        targetLeft.hand = { x: -0.10, y: 0.38, z: 0.14 };
        leftFingersTarget = 0.32; // gently curled fingers near chin
      } else if (this.expression === "speaking" && !this.currentAction) {
        // Conversational Explaining Gesture during Speech Streaming
        const talkWave = Math.sin(time * 5.0) * 0.14;
        targetRight.upper = { x: 0.32 + talkWave * 0.4, y: -0.12, z: -0.28 };
        targetRight.fore = { x: -1.45 + talkWave, y: 0.15, z: -0.10 };
        targetRight.hand = { x: 0.12, y: -0.20 + talkWave * 0.8, z: 0.0 };
        rightFingersTarget = 0.08 + Math.abs(talkWave) * 0.25;
      }

      if (this.currentAction === "hello") {
        this.actionTimer += delta;
        // Step-by-Step Action (OUTSIDE the body):
        // Step 1 (0.0s - 0.6s): Right hand comes up over the right arm outside the body
        // Step 2 (0.6s - 2.6s): Raised hand waves side-to-side over the right arm outside the body
        // Step 3 (2.6s - 3.2s): Smoothly lowers arm back to idle ready stance
        if (this.actionTimer < 0.6) {
          // Phase 1: Bringing right hand up over right arm OUTSIDE the body
          targetRight.upper = { x: 0.41, y: -0.22, z: 1.89 };
          targetRight.fore = { x: -0.37, y: 0.09, z: 1.79 };
          targetRight.hand = { x: 0.15, y: -0.72, z: -0.34 };
          rightFingersTarget = -0.02;
          targetHead.z = 0.08;
          targetHead.x = -0.04;
        } else if (this.actionTimer < 2.6) {
          // Phase 2: Hand is over right arm OUTSIDE the body — WAVE IT side-to-side!
          const wave = Math.sin((this.actionTimer - 0.6) * 7.0) * 0.35;
          targetRight.upper = { x: 0.41, y: -0.22, z: 1.89 };
          targetRight.fore = { x: -0.37, y: 0.09, z: 1.79 + wave * 0.15 };
          targetRight.hand = { x: 0.15, y: -0.72, z: -0.34 + wave };
          rightFingersTarget = -0.02; // Open flat waving hand
          targetHead.z = 0.10 + wave * 0.04;
          targetHead.x = -0.04;
        } else {
          // Phase 3: Lowering arm smoothly back to idle
          if (this.actionTimer > 3.2) {
            this.endAction();
          }
        }

        // Left arm relaxed supportive posture outside body
        targetLeft.upper = { x: 0.15, y: 0.0, z: -0.16 };
        targetLeft.fore = { x: -0.90, y: -0.35, z: 0.0 };
        targetLeft.hand = { x: -0.15, y: -0.25, z: 0.0 };
      } else if (this.currentAction === "bye") {
        this.actionTimer += delta;
        // Step-by-Step Action (OUTSIDE the body):
        // Step 1 (0.0s - 0.6s): Right hand comes up over the right arm outside the body
        // Step 2 (0.6s - 2.6s): Raised hand waves farewell over the right arm outside the body
        // Step 3 (2.6s - 3.2s): Smoothly lowers arm back to idle ready stance
        if (this.actionTimer < 0.6) {
          // Phase 1: Hand comes up over right arm outside the body
          targetRight.upper = { x: 0.41, y: -0.22, z: 1.89 };
          targetRight.fore = { x: -0.37, y: 0.09, z: 1.79 };
          targetRight.hand = { x: 0.15, y: -0.72, z: -0.34 };
          rightFingersTarget = -0.02;
          targetHead.z = -0.08;
        } else if (this.actionTimer < 2.6) {
          // Phase 2: Wave it farewell over right arm outside the body!
          const byeWave = Math.sin((this.actionTimer - 0.6) * 5.0) * 0.32;
          targetRight.upper = { x: 0.41, y: -0.22, z: 1.89 };
          targetRight.fore = { x: -0.37, y: 0.09, z: 1.79 + byeWave * 0.15 };
          targetRight.hand = { x: 0.15, y: -0.72, z: -0.34 + byeWave };
          rightFingersTarget = -0.02;
          targetHead.z = -0.10 + byeWave * 0.04;
        } else {
          // Phase 3: Lower smoothly back down
          if (this.actionTimer > 3.2) {
            this.endAction();
          }
        }

        // Left arm in supportive posture outside body
        targetLeft.upper = { x: 0.12, y: 0.0, z: -0.15 };
        targetLeft.fore = { x: -0.85, y: -0.35, z: 0.0 };
        targetLeft.hand = { x: -0.10, y: -0.20, z: 0.0 };
      } else if (this.currentAction === "hifi") {
        this.actionTimer += delta;
        // Step-by-Step High-Five:
        // Right hand positioned high on the UPPER OF RIGHT ARM OUTSIDE THE BODY (elevated straight up)
        if (this.hifiSlapped) {
          this.hifiSlapTimer += delta;
          // Kinetic physical recoil from slap with damped harmonic recovery
          const recoil = Math.sin(Math.min(Math.PI, this.hifiSlapTimer * 7.0)) * Math.exp(-this.hifiSlapTimer * 2.2) * 0.40;
          targetRight.upper = { x: 0.41 - recoil * 0.30, y: -0.22, z: 1.89 };
          targetRight.fore = { x: -0.37 - recoil * 0.40, y: 0.09, z: 1.79 };
          targetRight.hand = { x: 0.15, y: -0.72, z: -0.34 - recoil * 0.30 };
          rightFingersTarget = 0.02;

          targetLeft.upper = { x: -0.18, y: 0.0, z: -0.22 };
          targetHead.x = -recoil * 0.18;

          if (this.hifiSlapTimer > 1.4) {
            this.endAction();
          }
        } else {
          // Right hand held high on the UPPER OF RIGHT ARM OUTSIDE THE BODY, palm facing forward
          targetRight.upper = { x: 0.41, y: -0.22, z: 1.89 }; // Elevated upper arm laterally outside
          targetRight.fore = { x: -0.37, y: 0.09, z: 1.79 };  // Forearm reaches straight up outside
          targetRight.hand = { x: 0.15, y: -0.72, z: -0.34 }; // Hand upright on top of arm
          rightFingersTarget = -0.05; // Flat open high-five palm

          targetLeft.upper = { x: -0.15, y: 0.0, z: -0.20 };   // Braced athletic stance outside body
          targetLeft.fore = { x: -0.65, y: -0.35, z: 0.0 };
          targetLeft.hand = { x: 0.0, y: -0.30, z: 0.0 };
          leftFingersTarget = 0.20;

          targetHead.x = 0.05;

          if (this.actionTimer > 6.0) {
            this.endAction();
          }
        }
      } else if (this.currentAction === "kiss") {
        this.actionTimer += delta;
        // Step-by-Step Flying Kiss:
        // Step 1: Right hand goes to lips with elbow outside body
        // Step 2: "Flew it" (extends arm forward & sweeps OUTWARD from body, releasing flying hearts)
        // Step 3: Smooth return to idle
        if (this.actionTimer < 1.2) {
          // Step 1: Right hand goes directly to lips with gentle head bow, elbow flared outside
          targetRight.upper = { x: 0.89, y: -0.16, z: 2.87 };
          targetRight.fore = { x: -1.52, y: 0.0, z: 1.41 };
          targetRight.hand = { x: 0.0, y: 1.41, z: 0.0 };
          rightFingersTarget = 0.25; // Gently cupped at lips
          targetHead.x = -0.12; // Bow head gently toward fingertips
        } else if (this.actionTimer < 2.8) {
          // Step 2: "Flew it" — arm sweeps OUTWARD from body into the air, blowing kiss!
          const sway = Math.sin((this.actionTimer - 1.2) * 3.5) * 0.08;
          targetRight.upper = { x: -1.16, y: -1.24, z: 0.64 };
          targetRight.fore = { x: -1.06, y: 0.80, z: 0.35 };
          targetRight.hand = { x: 1.69, y: 0.69 + sway, z: 0.09 }; // palm up pushing kiss outward into air
          rightFingersTarget = -0.05; // Open fingers releasing the kiss
          targetHead.x = 0.08;
          targetHead.z = 0.05;
        } else {
          // Step 3: Smooth return to idle
          if (this.actionTimer > 3.5) {
            this.endAction();
          }
        }
        targetLeft.upper = { x: 0.10, y: 0.0, z: -0.16 };
        targetLeft.fore = { x: -0.75, y: -0.35, z: 0.0 };
        targetLeft.hand = { x: -0.10, y: -0.30, z: 0.0 };
      } else if (this.currentAction === "salute") {
        this.actionTimer += delta;
        // Step-by-Step Salute:
        // Step 1 (0.0s - 0.5s): Right hand goes directly to right ear with elbow flared OUTSIDE body
        // Step 2 (0.5s - 2.4s): Holds crisp rigid salute at the right ear outside the body
        // Step 3 (2.4s - 3.0s): Smartly snaps hand down to side and returns to ready stance
        if (this.actionTimer < 2.4) {
          // Steps 1 & 2: Right hand goes directly to right ear with elbow flared OUTSIDE body (X=0.75)
          targetRight.upper = { x: -0.18, y: 0.60, z: 1.88 };
          targetRight.fore = { x: -0.45, y: -0.25, z: 1.74 };
          targetRight.hand = { x: -0.15, y: 0.27, z: 0.48 }; // fingertips touch right ear from outside
          rightFingersTarget = 0.0; // Pinned flat fingers at ear

          targetLeft.upper = { x: 0.0, y: 0.0, z: -0.05 }; // Left arm pinned flush to side
          targetLeft.fore = { x: 0.0, y: 0.0, z: 0.0 };
          targetLeft.hand = { x: 0.0, y: 0.0, z: 0.0 };
          leftFingersTarget = 0.0;

          targetHead.x = 0.04;
          targetHead.y = 0.0;
          targetHead.z = 0.0;
        } else {
          // Step 3: Snap cleanly down to attention
          targetRight.upper = { x: 0.0, y: 0.0, z: 0.05 };
          targetRight.fore = { x: 0.0, y: 0.0, z: 0.0 };
          targetRight.hand = { x: 0.0, y: 0.0, z: 0.0 };
          rightFingersTarget = 0.0;

          if (this.actionTimer > 3.0) {
            this.endAction();
          }
        }
      } else if (this.currentAction === "think") {
        this.actionTimer += delta;
        const dur = this.actionDuration || 2.5;
        // Pondering pose: right hand under chin, left arm crossed supporting elbow
        targetRight.upper = { x: 0.65, y: -0.10, z: 0.25 };
        targetRight.fore = { x: -2.15, y: -0.15, z: 0.0 };
        targetRight.hand = { x: 0.45, y: 0.10, z: -0.10 };
        rightFingersTarget = 0.25;

        targetLeft.upper = { x: 0.35, y: 0.0, z: -0.25 };
        targetLeft.fore = { x: -1.35, y: -0.55, z: 0.0 };
        targetLeft.hand = { x: -0.10, y: -0.50, z: 0.0 };

        targetHead.z = -0.14;
        targetHead.x = -0.06;

        if (this.actionTimer > dur) {
          this.endAction();
        }
      } else if (this.currentAction === "nod") {
        this.actionTimer += delta;
        const nod = Math.sin(this.actionTimer * 8.5) * 0.16;
        targetHead.x = nod;
        if (this.actionTimer > 1.5) {
          this.endAction();
        }
      } else if (this.currentAction === "shakeHead") {
        this.actionTimer += delta;
        const shake = Math.sin(this.actionTimer * 8.5) * 0.20;
        targetHead.y = shake;
        if (this.actionTimer > 1.5) {
          this.endAction();
        }
      } else if (this.currentAction === "celebrate") {
        this.actionTimer += delta;
        // Double victory arm raise with fists OUTWARD from body
        targetLeft.upper = { x: 0.20, y: 0.0, z: -1.35 };
        targetRight.upper = { x: 0.20, y: 0.0, z: 1.35 };
        targetLeft.fore = { x: -1.15, y: 0.0, z: 0.0 };
        targetRight.fore = { x: -1.15, y: 0.0, z: 0.0 };
        targetLeft.hand = { x: 0.30, y: 0.0, z: 0.0 };
        targetRight.hand = { x: 0.30, y: 0.0, z: 0.0 };
        leftFingersTarget = 0.55; // clenched victory fist
        rightFingersTarget = 0.55;
        targetHead.x = -0.14; // head lifted high in victory
        targetLeft.fore = { x: -1.15, y: 0.0, z: 0.0 };
        targetRight.fore = { x: -1.15, y: 0.0, z: 0.0 };
        targetLeft.hand = { x: 0.30, y: 0.0, z: 0.0 };
        targetRight.hand = { x: 0.30, y: 0.0, z: 0.0 };
        leftFingersTarget = 0.55; // clenched victory fist
        rightFingersTarget = 0.55;
        targetHead.x = -0.14; // head lifted high in victory

        if (this.actionTimer > 2.4) {
          this.endAction();
        }
      } else if (this.expression === "speaking") {
        // Conversational Gesturing: Both hands articulate with natural speech rhythm
        const wave1 = Math.sin(time * 3.8) * 0.16;
        const wave2 = Math.cos(time * 3.2) * 0.14;
        targetRight.upper = { x: 0.32 + wave1 * 0.4, y: -0.12, z: -0.25 };
        targetRight.fore = { x: -1.25 + wave1, y: -0.25, z: 0.0 };
        targetRight.hand = { x: 0.10, y: -0.30 + wave1 * 0.6, z: 0.0 };

        targetLeft.upper = { x: 0.30 + wave2 * 0.4, y: 0.12, z: 0.25 };
        targetLeft.fore = { x: -1.20 + wave2, y: 0.25, z: 0.0 };
        targetLeft.hand = { x: 0.10, y: 0.30 + wave2 * 0.6, z: 0.0 };

        targetHead.x = Math.sin(time * 3.8) * 0.04;
        targetHead.y = Math.cos(time * 2.2) * 0.06;
      }

      // Smooth Kinematic Rotation Interpolation (Lerp)
      const lerpSpeed = 12.0;
      const alpha = Math.min(1.0, delta * lerpSpeed);

      const lerpBone = (bone, target) => {
        if (!bone || !target) return;
        if (target.x !== undefined) bone.rotation.x += (target.x - bone.rotation.x) * alpha;
        if (target.y !== undefined) bone.rotation.y += (target.y - bone.rotation.y) * alpha;
        if (target.z !== undefined) bone.rotation.z += (target.z - bone.rotation.z) * alpha;
      };

      if (this.activeHand === "left" && this.currentAction) {
        const mirror = (rot) => ({
          x: rot.x,
          y: rot.y !== undefined ? -rot.y : undefined,
          z: rot.z !== undefined ? -rot.z : undefined
        });
        const mirroredLeft = {
          upper: mirror(targetRight.upper),
          fore: mirror(targetRight.fore),
          hand: mirror(targetRight.hand)
        };
        const mirroredRight = {
          upper: mirror(targetLeft.upper),
          fore: mirror(targetLeft.fore),
          hand: mirror(targetLeft.hand)
        };
        targetLeft = mirroredLeft;
        targetRight = mirroredRight;
        const tempCurl = leftFingersTarget;
        leftFingersTarget = rightFingersTarget;
        rightFingersTarget = tempCurl;
      }

      lerpBone(this.leftArm.upperArm, targetLeft.upper);
      lerpBone(this.leftArm.forearm, targetLeft.fore);
      lerpBone(this.leftArm.hand, targetLeft.hand);

      lerpBone(this.rightArm.upperArm, targetRight.upper);
      lerpBone(this.rightArm.forearm, targetRight.fore);
      lerpBone(this.rightArm.hand, targetRight.hand);

      if (this.headGroup) {
        const headAlpha = Math.min(1.0, delta * 8.0);
        this.headGroup.rotation.x += (targetHead.x - this.headGroup.rotation.x) * headAlpha;
        this.headGroup.rotation.y += (targetHead.y - this.headGroup.rotation.y) * headAlpha;
        this.headGroup.rotation.z += (targetHead.z - this.headGroup.rotation.z) * headAlpha;
      }

      // 7. Clear 5-Digit Finger Articulation
      this.leftFingers.forEach((f, i) => {
        const targetCurl = leftFingersTarget + i * 0.03;
        f.rotation.x += (targetCurl - f.rotation.x) * alpha;
      });
      this.rightFingers.forEach((f, i) => {
        const targetCurl = rightFingersTarget + (rightFingersTarget > 0.05 ? i * 0.03 : 0);
        f.rotation.x += (targetCurl - f.rotation.x) * alpha;
      });
    }

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

    // 9. Quantum Core Pulse with Adaptive Cognitive Feedback
    if (this.coreMesh) {
      const pulseRate = this.isOverdrive ? 8.5 : (this.expression === "thinking" ? 7.0 : (this.expression === "speaking" ? 5.5 : 2.5));
      const amp = this.isOverdrive ? 0.22 : (this.expression === "thinking" ? 0.18 : (this.expression === "speaking" ? 0.15 : 0.08));
      const s = 1.0 + Math.sin(time * pulseRate) * amp;
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
