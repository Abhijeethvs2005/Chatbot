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
    this.upperLip = null;
    this.lowerMouth = null;
    this.lowerLip = null;
    this.upperTeeth = null;
    this.lowerTeeth = null;
    this.tongue = null;
    this.speechLED = null;
    this.hairGroup = null;
    this.hairQuiff = null;
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
    this.currentOutfit = "suit"; // 'suit', 'cyber', 'student', 'scientist', 'hoodie', 'astronaut', 'physique'
    this.outfitMeshes = {};

    // Dynamic Muscle Hypertrophy System
    this.muscleLevel = 1.0; // 0.75: Lean, 1.0: Athletic, 1.38: Muscular, 1.75: Bodybuilder
    this.targetMuscleLevel = 1.0;
    this.currentMuscleLevel = 1.0;
    this.muscleContraction = 0.0; // Dynamic extra peak contraction during flex
    this.targetMuscleContraction = 0.0;

    this.muscleGroups = {
      pecs: [],
      deltoids: [],
      biceps: [],
      triceps: [],
      upperArmCores: [],
      forearmCores: [],
      brachioradialis: [],
      veins: [],
      ribcages: [],
      lats: [],
      traps: [],
      abs: [],
      obliques: [],
      serratus: [],
      quads: [],
      hamstrings: [],
      calves: [],
      glutes: [],
      thighCores: [],
      calfCores: [],
      wardrobeTorso: [],
      wardrobeArms: [],
      wardrobeLegs: []
    };

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

    // --- REALISTIC HUMAN DERMAL & MUSCLE SHADING ---
    // Primary human skin: Warm masculine undertones, subtle hemoglobin subsurface warmth
    this.matSkin = new THREE.MeshStandardMaterial({
      color: 0xdfaa8b, // Healthy, warm masculine human skin tone
      roughness: 0.52,
      metalness: 0.02,
      emissive: 0x2e1208, // Subtle subsurface scattering glow (blood warmth)
      emissiveIntensity: 0.16
    });

    // Muscle highlight: specular dermal sheen on muscle peaks (deltoid, bicep peak, upper chest, abs)
    this.matSkinHighlight = new THREE.MeshStandardMaterial({
      color: 0xefbe9b,
      roughness: 0.42,
      metalness: 0.03,
      emissive: 0x3a180b,
      emissiveIntensity: 0.14
    });

    // Muscle shadow/separation: deep anatomical grooves (linea alba, intercostal cuts, serratus, inframammary fold)
    this.matSkinShadow = new THREE.MeshStandardMaterial({
      color: 0xb87353,
      roughness: 0.68,
      metalness: 0.02
    });

    // Subtle natural masculine vascularity (veins on pumped biceps/forearms)
    this.matVein = new THREE.MeshStandardMaterial({
      color: 0x668599,
      roughness: 0.35,
      metalness: 0.04,
      transparent: true,
      opacity: 0.0 // Ramped up dynamically when muscle level is high
    });

    // --- REALISTIC HUMAN HAIR GROWTH & FOLLICULAR MATERIALS ---
    this.matHair = new THREE.MeshStandardMaterial({
      color: 0x1a1614, // Deep espresso brunette base root tone
      roughness: 0.65,
      metalness: 0.06
    });

    this.matHairHighlight = new THREE.MeshStandardMaterial({
      color: 0x2e241d, // Sun-kissed warm chestnut strand highlight
      roughness: 0.56,
      metalness: 0.08
    });

    this.matHairDeep = new THREE.MeshStandardMaterial({
      color: 0x0e0c0a, // Deep root / under-layer follicular shadow
      roughness: 0.78,
      metalness: 0.04
    });

    this.matHairFine = new THREE.MeshStandardMaterial({
      color: 0x261f1a, // Fine hairline transition micro-strands
      roughness: 0.62,
      metalness: 0.05
    });

    this.matBeardShadow = new THREE.MeshStandardMaterial({
      color: 0xb57c62, // Subtle masculine 5 o'clock stubble shadow framing jaw & chin
      roughness: 0.75,
      metalness: 0.02
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

    this.matTeeth = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Pearlescent clean white enamel
      roughness: 0.20,
      metalness: 0.05
    });

    this.matEyelash = new THREE.MeshStandardMaterial({
      color: 0x0f0e0d, // Ultra-fine dark lash margin
      roughness: 0.85
    });

    // --- BIOLOGICAL ORAL ANATOMY & LIVING EYE MATERIALS ---
    this.matTongue = new THREE.MeshStandardMaterial({
      color: 0xd46468, // Natural warm muscular tongue pink-red
      roughness: 0.42,
      metalness: 0.02
    });

    this.matTongueSulcus = new THREE.MeshStandardMaterial({
      color: 0xb54c52, // Deeper cleft tone for median longitudinal sulcus
      roughness: 0.50,
      metalness: 0.02
    });

    this.matGingiva = new THREE.MeshStandardMaterial({
      color: 0xc45c66, // Healthy pink gingival mucosa (gums)
      roughness: 0.46,
      metalness: 0.02
    });

    this.matOralCavity = new THREE.MeshStandardMaterial({
      color: 0x220c10, // Deep warm mucosal shadow of the oral pharynx
      roughness: 0.90,
      metalness: 0.04
    });

    this.matHumanIris = new THREE.MeshStandardMaterial({
      color: 0x2e5984, // Rich handsome deep cerulean/slate blue human iris
      roughness: 0.24,
      metalness: 0.08
    });

    this.matHumanIrisCollarette = new THREE.MeshStandardMaterial({
      color: 0x4a7c9f, // Pupillary collarette & ciliary striae ring
      roughness: 0.30,
      metalness: 0.06
    });

    this.matHumanIrisFibers = new THREE.MeshStandardMaterial({
      color: 0x6ba4c8, // Radial ciliary fibers
      roughness: 0.28,
      metalness: 0.05
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
      color: 0x1c120c, // Hand-burnished mahogany espresso leather
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
    if (this.matHumanIris) {
      this.matHumanIris.color.setHex(p.eyeColor || p.accent);
    }
    if (this.matHumanIrisCollarette) {
      this.matHumanIrisCollarette.color.setHex(p.glow || p.accent);
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
    this.headGroup.scale.set(0.68, 0.68, 0.68); // 8-head canonical athletic human male proportion

    // ==========================================
    // 1. MASCULINE CRANIUM & FOREHEAD (FRONTAL BONE)
    // ==========================================
    // Proportional masculine cranium foundation
    const craniumGeo = new THREE.SphereGeometry(0.50, 36, 36);
    craniumGeo.scale(0.88, 1.05, 0.94);
    const cranium = new THREE.Mesh(craniumGeo, this.matSkin);
    cranium.position.set(0, 0.02, -0.02);
    this.headGroup.add(cranium);

    // Curved Frontal Bone (Smooth forehead curvature without box edges)
    const foreheadGeo = new THREE.SphereGeometry(0.36, 24, 24);
    foreheadGeo.scale(1.18, 0.74, 0.82);
    const forehead = new THREE.Mesh(foreheadGeo, this.matSkin);
    forehead.position.set(0, 0.22, 0.26);
    forehead.rotation.x = -0.10;
    this.headGroup.add(forehead);

    // Central Glabella (Depression between the brows above nasal root)
    const glabella = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), this.matSkin);
    glabella.scale.set(1.2, 0.8, 0.6);
    glabella.position.set(0, 0.145, 0.405);
    this.headGroup.add(glabella);

    // Supraorbital Brow Ridge (Left & Right sculpted masculine brow arches)
    [-0.19, 0.19].forEach((bx) => {
      const isLeft = bx < 0;
      const browArchGeo = new THREE.SphereGeometry(0.14, 16, 16);
      browArchGeo.scale(1.28, 0.42, 0.72);
      const browArch = new THREE.Mesh(browArchGeo, this.matSkin);
      browArch.position.set(bx, 0.155, 0.395);
      browArch.rotation.z = isLeft ? -0.08 : 0.08;
      browArch.rotation.y = isLeft ? 0.12 : -0.12;
      this.headGroup.add(browArch);
    });

    // ==========================================
    // 2. CHISELED ZYGOMATIC CHEEKBONES & MIDFACE
    // ==========================================
    [-0.21, 0.21].forEach((cx) => {
      const isLeft = cx < 0;
      // Zygomatic Cheekbone prominence
      const cheekGeo = new THREE.SphereGeometry(0.155, 20, 20);
      cheekGeo.scale(0.92, 1.15, 0.86);
      const cheek = new THREE.Mesh(cheekGeo, this.matSkin);
      cheek.position.set(cx, -0.035, 0.315);
      cheek.rotation.y = isLeft ? 0.18 : -0.18;
      cheek.rotation.z = isLeft ? -0.08 : 0.08;
      this.headGroup.add(cheek);

      // Maxillary Midface Contour (curves toward nasolabial fold)
      const maxilla = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 14), this.matSkin);
      maxilla.scale.set(0.85, 1.25, 0.90);
      maxilla.position.set(cx * 0.62, -0.115, 0.380);
      maxilla.rotation.y = isLeft ? 0.22 : -0.22;
      this.headGroup.add(maxilla);

      // Submalar Hollow Shadow (Athletic chiseled cheek hollow)
      const submalar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), this.matSkinShadow);
      submalar.position.set(cx * 1.12, -0.14, 0.26);
      submalar.rotation.z = isLeft ? 0.24 : -0.24;
      this.headGroup.add(submalar);
    });

    // ==========================================
    // 3. DEFINED MANDIBLE JAWLINE & SQUARE CHIN
    // ==========================================
    [-0.19, 0.19].forEach((jx) => {
      const isLeft = jx < 0;
      // Mandibular Angle (Gonion / jawline corner)
      const jawAngleGeo = new THREE.SphereGeometry(0.125, 16, 16);
      jawAngleGeo.scale(0.82, 1.35, 1.35);
      const jawAngle = new THREE.Mesh(jawAngleGeo, this.matSkin);
      jawAngle.position.set(jx, -0.22, 0.14);
      jawAngle.rotation.y = isLeft ? 0.28 : -0.28;
      jawAngle.rotation.z = isLeft ? -0.14 : 0.14;
      this.headGroup.add(jawAngle);

      // Mandibular Body (Sharp jawline ridge tapering toward chin)
      const jawRidge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.22), this.matSkin);
      jawRidge.position.set(jx * 0.72, -0.27, 0.24);
      jawRidge.rotation.y = isLeft ? 0.38 : -0.38;
      jawRidge.rotation.z = isLeft ? -0.18 : 0.18;
      this.headGroup.add(jawRidge);
    });

    // Strong Square Male Chin (Mental Protuberance)
    const chinGeo = new THREE.SphereGeometry(0.155, 18, 18);
    chinGeo.scale(1.22, 0.82, 1.05);
    const chin = new THREE.Mesh(chinGeo, this.matSkin);
    chin.position.set(0, -0.32, 0.33);
    this.headGroup.add(chin);

    // Dual Mental Tubercles (Left & Right chin corners defining handsome square chin)
    [-0.065, 0.065].forEach((tx) => {
      const tubercle = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), this.matSkin);
      tubercle.scale.set(0.95, 0.90, 1.15);
      tubercle.position.set(tx, -0.325, 0.410);
      this.headGroup.add(tubercle);
    });

    // Handsome Masculine Chin Cleft (Central dimple groove in shadow material)
    const chinCleft = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.075, 0.024), this.matSkinShadow);
    chinCleft.position.set(0, -0.325, 0.428);
    this.headGroup.add(chinCleft);

    // ==========================================
    // 4. NORMAL HUMAN HAIR GROWTH SYSTEM
    // ==========================================
    const hairRoot = new THREE.Group();

    // 4a. Anatomical Cranial Scalp Base (Follicular Sub-layer)
    // Conforms cleanly to vertex, parietal bones, and occipital contour
    const hairCapGeo = new THREE.SphereGeometry(0.512, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.54);
    hairCapGeo.scale(0.92, 1.05, 0.98);
    const hairCap = new THREE.Mesh(hairCapGeo, this.matHairDeep);
    hairCap.position.set(0, 0.055, -0.015);
    hairRoot.add(hairCap);

    // 4b. Natural Hairline Boundary & Feathered Baby Hair Locks
    // Real hairlines curve gently with a subtle central peak, temporal recession, and parietal points
    const hairlinePoints = [
      // Central Forehead Peak (Apex)
      { x: 0.0, y: 0.385, z: 0.370, scale: [0.075, 0.024, 0.050], rotX: 0.28, rotZ: 0.0, mat: this.matHairHighlight },
      // Left Frontal Arc
      { x: -0.075, y: 0.380, z: 0.362, scale: [0.070, 0.022, 0.048], rotX: 0.26, rotZ: -0.12, mat: this.matHair },
      { x: -0.145, y: 0.368, z: 0.342, scale: [0.065, 0.022, 0.045], rotX: 0.24, rotZ: -0.22, mat: this.matHairHighlight },
      // Left Temporal Recession & Fronto-Temporal Angle
      { x: -0.215, y: 0.345, z: 0.305, scale: [0.060, 0.025, 0.045], rotX: 0.20, rotZ: -0.35, mat: this.matHairFine },
      { x: -0.275, y: 0.305, z: 0.245, scale: [0.055, 0.030, 0.045], rotX: 0.15, rotZ: -0.45, mat: this.matHairFine },
      // Right Frontal Arc
      { x: 0.075, y: 0.380, z: 0.362, scale: [0.070, 0.022, 0.048], rotX: 0.26, rotZ: 0.12, mat: this.matHair },
      { x: 0.145, y: 0.368, z: 0.342, scale: [0.065, 0.022, 0.045], rotX: 0.24, rotZ: 0.22, mat: this.matHairHighlight },
      // Right Temporal Recession & Fronto-Temporal Angle
      { x: 0.215, y: 0.345, z: 0.305, scale: [0.060, 0.025, 0.045], rotX: 0.20, rotZ: 0.35, mat: this.matHairFine },
      { x: 0.275, y: 0.305, z: 0.245, scale: [0.055, 0.030, 0.045], rotX: 0.15, rotZ: 0.45, mat: this.matHairFine }
    ];

    hairlinePoints.forEach(p => {
      const lock = new THREE.Mesh(new THREE.CylinderGeometry(p.scale[0] * 0.4, p.scale[0], p.scale[1], 10), p.mat);
      lock.position.set(p.x, p.y, p.z);
      lock.rotation.x = p.rotX;
      lock.rotation.z = p.rotZ;
      hairRoot.add(lock);
    });

    // 4c. Crown Whorl & Volumetric Top Hair Growth Strands
    // Flowing from parietal crown vertex radiating forward and laterally
    const topStrands = [
      // Central & Crown Whorl Core
      { x: 0.02, y: 0.525, z: -0.06, sx: 0.38, sy: 0.11, sz: 0.34, rotX: -0.04, rotY: 0.04, rotZ: 0.02, mat: this.matHair },
      { x: -0.08, y: 0.520, z: -0.02, sx: 0.24, sy: 0.10, sz: 0.32, rotX: -0.03, rotY: -0.08, rotZ: -0.06, mat: this.matHairHighlight },
      { x: 0.10, y: 0.518, z: -0.02, sx: 0.24, sy: 0.10, sz: 0.32, rotX: -0.03, rotY: 0.08, rotZ: 0.06, mat: this.matHairHighlight },
      // Mid-Scalp Forward Flow Clumps
      { x: -0.12, y: 0.510, z: 0.12, sx: 0.18, sy: 0.09, sz: 0.26, rotX: 0.08, rotY: -0.10, rotZ: -0.08, mat: this.matHair },
      { x: 0.0, y: 0.515, z: 0.14, sx: 0.22, sy: 0.10, sz: 0.28, rotX: 0.10, rotY: 0.02, rotZ: 0.01, mat: this.matHairHighlight },
      { x: 0.12, y: 0.510, z: 0.12, sx: 0.18, sy: 0.09, sz: 0.26, rotX: 0.08, rotY: 0.10, rotZ: 0.08, mat: this.matHair }
    ];

    topStrands.forEach(s => {
      const lockGeo = new THREE.BoxGeometry(s.sx, s.sy, s.sz);
      const lockMesh = new THREE.Mesh(lockGeo, s.mat);
      lockMesh.position.set(s.x, s.y, s.z);
      lockMesh.rotation.set(s.rotX, s.rotY, s.rotZ);
      hairRoot.add(lockMesh);
    });

    // 4d. Front Textured Quiff / Fringe Locks (Natural forward & upward swept locks with subtle micro-sway)
    const quiffGroup = new THREE.Group();
    quiffGroup.position.set(0, 0.46, 0.24);

    const quiffLocks = [
      // Central Swept Lock (Flowing forward and gently upward)
      { x: 0.0, y: 0.03, z: 0.06, rTop: 0.028, rBot: 0.075, len: 0.26, rotX: 0.32, rotY: 0.02, rotZ: 0.04, mat: this.matHairHighlight },
      // Left Side Fringe Locks
      { x: -0.085, y: 0.02, z: 0.04, rTop: 0.024, rBot: 0.065, len: 0.24, rotX: 0.28, rotY: -0.14, rotZ: -0.12, mat: this.matHair },
      { x: -0.165, y: -0.01, z: 0.01, rTop: 0.020, rBot: 0.055, len: 0.20, rotX: 0.22, rotY: -0.22, rotZ: -0.20, mat: this.matHairHighlight },
      // Right Side Swept Fringe Locks
      { x: 0.085, y: 0.02, z: 0.04, rTop: 0.024, rBot: 0.065, len: 0.24, rotX: 0.28, rotY: 0.14, rotZ: 0.12, mat: this.matHair },
      { x: 0.165, y: -0.01, z: 0.01, rTop: 0.020, rBot: 0.055, len: 0.20, rotX: 0.22, rotY: 0.22, rotZ: 0.20, mat: this.matHairHighlight },
      // Crest Top Strands
      { x: -0.04, y: 0.05, z: -0.02, rTop: 0.022, rBot: 0.060, len: 0.22, rotX: 0.18, rotY: -0.06, rotZ: 0.02, mat: this.matHair },
      { x: 0.05, y: 0.05, z: -0.02, rTop: 0.022, rBot: 0.060, len: 0.22, rotX: 0.18, rotY: 0.06, rotZ: -0.02, mat: this.matHairHighlight }
    ];

    quiffLocks.forEach(q => {
      const qGeo = new THREE.CylinderGeometry(q.rTop, q.rBot, q.len, 12);
      const qMesh = new THREE.Mesh(qGeo, q.mat);
      qMesh.position.set(q.x, q.y, q.z);
      qMesh.rotation.set(q.rotX, q.rotY, q.rotZ);
      quiffGroup.add(qMesh);
    });

    this.hairQuiff = quiffGroup;
    hairRoot.add(quiffGroup);

    // 4e. Parietal Ridge & Lateral Temple Hair Flow (Left & Right Sides)
    [-0.32, 0.32].forEach((tx) => {
      const isLeft = tx < 0;
      // Upper parietal ridge volume
      const parietalLock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.065, 0.085, 0.28, 12),
        this.matHair
      );
      parietalLock.position.set(tx * 1.05, 0.28, 0.02);
      parietalLock.rotation.z = isLeft ? 0.30 : -0.30;
      parietalLock.rotation.y = isLeft ? 0.18 : -0.18;
      hairRoot.add(parietalLock);

      // Supra-auricular curved lock (curves gracefully over the top of the ear)
      const earArchLockGeo = new THREE.TorusGeometry(0.12, 0.032, 10, 20, Math.PI * 0.65);
      const earArchLock = new THREE.Mesh(earArchLockGeo, this.matHairDeep);
      earArchLock.position.set(isLeft ? -0.38 : 0.38, 0.16, -0.02);
      earArchLock.rotation.y = Math.PI / 2;
      earArchLock.rotation.x = isLeft ? -0.22 : 0.22;
      hairRoot.add(earArchLock);
    });

    // 4f. Natural Tapered Masculine Sideburns (Descend naturally in front of tragus to mid-ear level)
    [-0.41, 0.41].forEach((sx) => {
      const isLeft = sx < 0;
      const sideburnGroup = new THREE.Group();
      sideburnGroup.position.set(sx, 0.05, 0.07);

      // Upper thicker sideburn base
      const sbUpper = new THREE.Mesh(
        new THREE.BoxGeometry(0.038, 0.14, 0.09),
        this.matHair
      );
      sideburnGroup.add(sbUpper);

      // Lower feathered tapering point (graduated masculine fade)
      const sbLower = new THREE.Mesh(
        new THREE.ConeGeometry(0.022, 0.09, 10),
        this.matHairFine
      );
      sbLower.position.set(0, -0.09, -0.005);
      sbLower.rotation.x = Math.PI;
      sideburnGroup.add(sbLower);

      hairRoot.add(sideburnGroup);
    });

    // 4g. Occipital & Nape Taper (Back of head curving smoothly into neck)
    const occipitalBulge = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      this.matHairDeep
    );
    occipitalBulge.scale.set(1.45, 1.0, 0.72);
    occipitalBulge.position.set(0, 0.08, -0.38);
    hairRoot.add(occipitalBulge);

    // Nape taper hugging cervical curvature
    const napeLocks = [
      { x: 0.0, y: -0.10, z: -0.36, w: 0.28, h: 0.20, d: 0.12, rotX: -0.20, mat: this.matHair },
      { x: -0.12, y: -0.12, z: -0.33, w: 0.16, h: 0.18, d: 0.10, rotX: -0.18, rotZ: -0.10, mat: this.matHairDeep },
      { x: 0.12, y: -0.12, z: -0.33, w: 0.16, h: 0.18, d: 0.10, rotX: -0.18, rotZ: 0.10, mat: this.matHairDeep }
    ];

    napeLocks.forEach(n => {
      const napeMesh = new THREE.Mesh(new THREE.BoxGeometry(n.w, n.h, n.d), n.mat);
      napeMesh.position.set(n.x, n.y, n.z);
      napeMesh.rotation.x = n.rotX;
      if (n.rotZ) napeMesh.rotation.z = n.rotZ;
      hairRoot.add(napeMesh);
    });

    // 4h. Subtle Natural Masculine Jawline Shadow (Delicate 5 o'clock stubble shadow)
    [-0.24, 0.24].forEach((jx) => {
      const isLeft = jx < 0;
      const jawStubble = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.022, 0.20, 10),
        this.matBeardShadow
      );
      jawStubble.position.set(jx, -0.22, 0.25);
      jawStubble.rotation.z = isLeft ? -0.48 : 0.48;
      jawStubble.rotation.y = isLeft ? 0.32 : -0.32;
      hairRoot.add(jawStubble);
    });

    this.hairGroup = hairRoot;
    this.headGroup.add(hairRoot);

    // ==========================================
    // 5. AUTHENTIC ANATOMICAL HUMAN EARS
    // ==========================================
    [-0.45, 0.45].forEach((ex) => {
      const isLeft = ex < 0;
      const earGroup = new THREE.Group();
      earGroup.position.set(ex, 0.025, -0.02);
      earGroup.rotation.y = isLeft ? -0.22 : 0.22; // Natural 12-15 degree cranial ear angle

      // 5a. Auricle Concha Base & Acoustic Meatus Canal Entrance
      const conchaBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.035, 0.030, 16),
        this.matSkinShadow
      );
      conchaBase.rotation.z = Math.PI / 2;
      conchaBase.scale.set(1.0, 1.45, 0.85);
      conchaBase.position.set(isLeft ? -0.008 : 0.008, 0.005, 0.0);
      earGroup.add(conchaBase);

      const earCanal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.010, 0.025, 12),
        this.matOralCavity
      );
      earCanal.rotation.z = Math.PI / 2;
      earCanal.position.set(isLeft ? -0.018 : 0.018, -0.005, 0.005);
      earGroup.add(earCanal);

      // 5b. Outer Helix Rim (Cartilaginous superior and posterior rim)
      const helixGeo = new THREE.TorusGeometry(0.066, 0.0125, 12, 28, Math.PI * 1.25);
      const helix = new THREE.Mesh(helixGeo, this.matSkin);
      helix.rotation.y = Math.PI / 2;
      helix.rotation.z = isLeft ? -0.25 : 0.25;
      helix.position.set(isLeft ? -0.012 : 0.012, 0.015, -0.005);
      earGroup.add(helix);

      // Crus of Helix (Ascending root of helix entering concha bowl)
      const crusGeo = new THREE.CylinderGeometry(0.007, 0.008, 0.042, 10);
      const crus = new THREE.Mesh(crusGeo, this.matSkin);
      crus.rotation.x = Math.PI / 2;
      crus.rotation.z = isLeft ? 0.45 : -0.45;
      crus.position.set(isLeft ? -0.010 : 0.010, 0.012, 0.012);
      earGroup.add(crus);

      // 5c. Antihelix Y-Fold (Inner cartilage fold with superior & inferior crura)
      const antihelixGeo = new THREE.TorusGeometry(0.045, 0.009, 10, 22, Math.PI * 0.95);
      const antihelix = new THREE.Mesh(antihelixGeo, this.matSkin);
      antihelix.rotation.y = Math.PI / 2;
      antihelix.rotation.z = isLeft ? -0.15 : 0.15;
      antihelix.position.set(isLeft ? -0.014 : 0.014, 0.010, -0.012);
      earGroup.add(antihelix);

      // Scaphoid Fossa (Anatomical groove between helix and antihelix)
      const scaphoidFossa = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.075, 8),
        this.matSkinShadow
      );
      scaphoidFossa.rotation.x = isLeft ? -0.25 : 0.25;
      scaphoidFossa.position.set(isLeft ? -0.016 : 0.016, 0.022, -0.024);
      earGroup.add(scaphoidFossa);

      // 5d. Tragus (Fleshy prominence anterior to external acoustic meatus)
      const tragusGeo = new THREE.SphereGeometry(0.014, 10, 10);
      tragusGeo.scale(0.70, 1.25, 0.95);
      const tragus = new THREE.Mesh(tragusGeo, this.matSkin);
      tragus.position.set(isLeft ? -0.006 : 0.006, -0.006, 0.025);
      earGroup.add(tragus);

      // 5e. Antitragus & Intertragic Notch
      const antitragusGeo = new THREE.SphereGeometry(0.012, 10, 10);
      antitragusGeo.scale(0.85, 0.95, 0.90);
      const antitragus = new THREE.Mesh(antitragusGeo, this.matSkin);
      antitragus.position.set(isLeft ? -0.012 : 0.012, -0.032, 0.008);
      earGroup.add(antitragus);

      // 5f. Fleshy Lobule (Natural soft male earlobe at base)
      const lobuleGeo = new THREE.SphereGeometry(0.022, 12, 12);
      lobuleGeo.scale(0.88, 1.35, 0.88);
      const lobule = new THREE.Mesh(lobuleGeo, this.matSkin);
      lobule.position.set(isLeft ? -0.010 : 0.010, -0.065, -0.002);
      earGroup.add(lobule);

      this.headGroup.add(earGroup);
    });

    // ==========================================
    // 6. MUSCULAR MALE NECK & ADAM'S APPLE
    // ==========================================
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.28, 24), this.matSkin);
    neck.position.set(0, -0.50, 0);
    this.headGroup.add(neck);

    // Sternocleidomastoid muscle bands running obliquely down neck
    [-0.10, 0.10].forEach((sx) => {
      const isLeft = sx < 0;
      const scm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.018, 0.26, 12), this.matSkin);
      scm.position.set(sx, -0.50, 0.12);
      scm.rotation.z = isLeft ? -0.18 : 0.18;
      scm.rotation.x = -0.12;
      this.headGroup.add(scm);
    });

    // Prominent Thyroid Cartilage (Adam's Apple)
    const adamsApple = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 16), this.matSkin);
    adamsApple.rotation.x = Math.PI / 2;
    adamsApple.position.set(0, -0.48, 0.195);
    this.headGroup.add(adamsApple);

    const collarRing = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.03, 16, 32), this.matChassis);
    collarRing.rotation.x = Math.PI / 2;
    collarRing.position.set(0, -0.62, 0);
    this.headGroup.add(collarRing);

    // ==========================================
    // 7. HIGH-FIDELITY ANATOMICAL MALE NOSE
    // ==========================================
    const noseGroup = new THREE.Group();
    noseGroup.position.set(0, 0.035, 0.42);

    // 7a. Nasion & Straight Nasal Dorsal Bridge
    const bridgeGeo = new THREE.CylinderGeometry(0.024, 0.034, 0.155, 16);
    bridgeGeo.scale(1.05, 1.0, 1.25);
    const bridge = new THREE.Mesh(bridgeGeo, this.matSkin);
    bridge.rotation.x = 0.30;
    bridge.position.set(0, 0.025, 0.035);
    noseGroup.add(bridge);

    // Lateral Nasal Sidewalls
    [-0.032, 0.032].forEach((nx) => {
      const isLeft = nx < 0;
      const sidewall = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.12, 0.04), this.matSkin);
      sidewall.position.set(nx, 0.020, 0.028);
      sidewall.rotation.y = isLeft ? 0.35 : -0.35;
      sidewall.rotation.x = 0.28;
      noseGroup.add(sidewall);
    });

    // 7b. Sculpted Nose Tip (Apex / Lobule with Supra-tip break)
    const tipGeo = new THREE.SphereGeometry(0.036, 16, 16);
    tipGeo.scale(1.15, 0.95, 1.20);
    const noseTip = new THREE.Mesh(tipGeo, this.matSkin);
    noseTip.position.set(0, -0.052, 0.105);
    noseGroup.add(noseTip);

    // 7c. Symmetrical Curved Alar Nostril Wings
    [-0.042, 0.042].forEach((nx) => {
      const ala = new THREE.Mesh(new THREE.SphereGeometry(0.023, 14, 14), this.matSkin);
      ala.scale.set(0.88, 0.82, 1.12);
      ala.position.set(nx, -0.062, 0.085);
      noseGroup.add(ala);

      // Anatomical Teardrop Nostril Openings
      const nostril = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.010, 0.016, 10), this.matEyeSocket);
      nostril.position.set(nx * 0.72, -0.078, 0.082);
      nostril.rotation.x = 0.55;
      noseGroup.add(nostril);
    });

    // 7d. Nasal Columella (Central column dividing nostrils)
    const columella = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.028, 0.030), this.matSkin);
    columella.position.set(0, -0.072, 0.082);
    noseGroup.add(columella);

    // 7e. Philtrum Columns & Central Groove
    [-0.016, 0.016].forEach((px) => {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.075, 10), this.matSkin);
      column.position.set(px, -0.125, 0.060);
      noseGroup.add(column);
    });

    const philtrumGroove = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.070, 0.012), this.matSkinShadow);
    philtrumGroove.position.set(0, -0.125, 0.058);
    noseGroup.add(philtrumGroove);

    this.faceNose = noseGroup;
    this.headGroup.add(noseGroup);

    // ==========================================
    // 8. HIGH-CLARITY ALMOND EYES & EYELIDS
    // ==========================================
    this.leftEye = this.createHumanoidEye(-0.19);
    this.rightEye = this.createHumanoidEye(0.19);
    this.headGroup.add(this.leftEye);
    this.headGroup.add(this.rightEye);

    // ==========================================
    // 9. GROOMED 3-PART MASCULINE EYEBROWS
    // ==========================================
    this.leftBrow = this.createEyebrow(-0.19, true);
    this.rightBrow = this.createEyebrow(0.19, false);
    this.headGroup.add(this.leftBrow);
    this.headGroup.add(this.rightBrow);

    // ==========================================
    // 10. ANATOMICAL ORAL CAVITY, TEETH, TONGUE & DYNAMIC LIPS
    // ==========================================
    const mouthRoot = new THREE.Group();
    mouthRoot.position.set(0, -0.22, 0.42);

    // 10a. Deep Oral Cavity Pharynx Chamber (Organic mucosal depth)
    const oralCavity = new THREE.Mesh(
      new THREE.BoxGeometry(0.155, 0.065, 0.060),
      this.matOralCavity
    );
    oralCavity.position.set(0, 0.0, -0.025);
    mouthRoot.add(oralCavity);

    // Buccal Mucosa Walls (Inner cheek tissue framing the oral cavity)
    [-0.075, 0.075].forEach((bx) => {
      const isLeft = bx < 0;
      const cheekWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.055, 0.050),
        this.matSkinShadow
      );
      cheekWall.position.set(bx, 0.0, -0.020);
      cheekWall.rotation.y = isLeft ? 0.25 : -0.25;
      mouthRoot.add(cheekWall);
    });

    // 10b. Maxillary (Upper) Dental Arch & Gingiva
    const upperJawGroup = new THREE.Group();
    upperJawGroup.position.set(0, 0.012, 0.004);

    // Upper Gingiva (Pink gum arch)
    const upperGingivaGeo = new THREE.TorusGeometry(0.064, 0.008, 10, 24, Math.PI * 0.82);
    upperGingivaGeo.scale(1.15, 0.70, 1.0);
    const upperGingiva = new THREE.Mesh(upperGingivaGeo, this.matGingiva);
    upperGingiva.rotation.x = Math.PI / 2;
    upperGingiva.position.set(0, 0.008, -0.008);
    upperJawGroup.add(upperGingiva);

    // Upper Dental Arch: Individual Sculpted Teeth (Central/Lateral Incisors, Canines, Premolars)
    const upperTeethGroup = new THREE.Group();
    const upperTeethSpecs = [
      // Central Incisors (prominent clean enamel front incisors)
      { x: -0.008, y: 0.0, z: 0.009, w: 0.0135, h: 0.017, d: 0.010, rotY: 0.05 },
      { x:  0.008, y: 0.0, z: 0.009, w: 0.0135, h: 0.017, d: 0.010, rotY: -0.05 },
      // Lateral Incisors (slightly narrower)
      { x: -0.023, y: 0.001, z: 0.006, w: 0.0115, h: 0.015, d: 0.010, rotY: 0.16 },
      { x:  0.023, y: 0.001, z: 0.006, w: 0.0115, h: 0.015, d: 0.010, rotY: -0.16 },
      // Canines (cuspids, subtly longer/curved)
      { x: -0.037, y: -0.001, z: 0.001, w: 0.011, h: 0.016, d: 0.011, rotY: 0.32 },
      { x:  0.037, y: -0.001, z: 0.001, w: 0.011, h: 0.016, d: 0.011, rotY: -0.32 },
      // Premolars (curving backward into arch)
      { x: -0.050, y: 0.001, z: -0.007, w: 0.011, h: 0.014, d: 0.012, rotY: 0.48 },
      { x:  0.050, y: 0.001, z: -0.007, w: 0.011, h: 0.014, d: 0.012, rotY: -0.48 }
    ];

    upperTeethSpecs.forEach(t => {
      const toothGeo = new THREE.BoxGeometry(t.w, t.h, t.d);
      const tooth = new THREE.Mesh(toothGeo, this.matTeeth);
      tooth.position.set(t.x, t.y, t.z);
      tooth.rotation.y = t.rotY;
      upperTeethGroup.add(tooth);
    });
    upperJawGroup.add(upperTeethGroup);
    this.upperTeeth = upperTeethGroup;
    mouthRoot.add(upperJawGroup);

    // 10c. Anatomical Muscular Tongue
    // Sits on oral floor with median longitudinal sulcus and rounded apex tip
    const tongueGroup = new THREE.Group();
    tongueGroup.position.set(0, -0.016, -0.012);

    // Muscular Tongue Dorsum Body
    const tongueBodyGeo = new THREE.SphereGeometry(0.034, 16, 14);
    tongueBodyGeo.scale(1.22, 0.48, 1.48);
    const tongueBody = new THREE.Mesh(tongueBodyGeo, this.matTongue);
    tongueBody.position.set(0, 0.004, -0.004);
    tongueGroup.add(tongueBody);

    // Tongue Apex (Rounded Tip pointing toward front teeth)
    const tongueApexGeo = new THREE.SphereGeometry(0.018, 14, 12);
    tongApexGeo.scale(1.30, 0.42, 1.10);
    const tongueApex = new THREE.Mesh(tongueApexGeo, this.matTongue);
    tongueApex.position.set(0, 0.006, 0.022);
    tongueGroup.add(tongueApex);

    // Median Longitudinal Sulcus (Anatomical central furrow)
    const sulcusGeo = new THREE.BoxGeometry(0.0032, 0.006, 0.045);
    const sulcus = new THREE.Mesh(sulcusGeo, this.matTongueSulcus);
    sulcus.position.set(0, 0.011, 0.006);
    tongueGroup.add(sulcus);

    this.tongue = tongueGroup;
    mouthRoot.add(tongueGroup);

    // 10d. Mandibular (Lower) Dental Arch, Lower Gingiva & Lower Mouth / Jaw
    // Articulates dynamically on speech visemes, resting breath, and smiles
    const lowerMouthGroup = new THREE.Group();
    lowerMouthGroup.position.set(0, -0.006, 0.006);

    // Lower Gingiva (Pink gum arch)
    const lowerGingivaGeo = new THREE.TorusGeometry(0.058, 0.007, 10, 24, Math.PI * 0.80);
    lowerGingivaGeo.scale(1.10, 0.65, 1.0);
    const lowerGingiva = new THREE.Mesh(lowerGingivaGeo, this.matGingiva);
    lowerGingiva.rotation.x = -Math.PI / 2;
    lowerGingiva.position.set(0, -0.006, -0.007);
    lowerMouthGroup.add(lowerGingiva);

    // Lower Dental Arch: Individual Sculpted Teeth (Central/Lateral Incisors, Canines, Premolars)
    const lowerTeethGroup = new THREE.Group();
    const lowerTeethSpecs = [
      // Lower Central Incisors (tucked naturally inside upper overbite)
      { x: -0.0065, y: -0.001, z: 0.006, w: 0.011, h: 0.014, d: 0.009, rotY: 0.04 },
      { x:  0.0065, y: -0.001, z: 0.006, w: 0.011, h: 0.014, d: 0.009, rotY: -0.04 },
      // Lower Lateral Incisors
      { x: -0.0195, y: -0.001, z: 0.004, w: 0.011, h: 0.014, d: 0.009, rotY: 0.14 },
      { x:  0.0195, y: -0.001, z: 0.004, w: 0.011, h: 0.014, d: 0.009, rotY: -0.14 },
      // Lower Canines
      { x: -0.032,  y: -0.001, z: 0.000, w: 0.010, h: 0.015, d: 0.010, rotY: 0.28 },
      { x:  0.032,  y: -0.001, z: 0.000, w: 0.010, h: 0.015, d: 0.010, rotY: -0.28 },
      // Lower Premolars
      { x: -0.044,  y: -0.002, z: -0.006, w: 0.010, h: 0.013, d: 0.011, rotY: 0.42 },
      { x:  0.044,  y: -0.002, z: -0.006, w: 0.010, h: 0.013, d: 0.011, rotY: -0.42 }
    ];

    lowerTeethSpecs.forEach(t => {
      const toothGeo = new THREE.BoxGeometry(t.w, t.h, t.d);
      const tooth = new THREE.Mesh(toothGeo, this.matTeeth);
      tooth.position.set(t.x, t.y, t.z);
      tooth.rotation.y = t.rotY;
      lowerTeethGroup.add(tooth);
    });
    lowerMouthGroup.add(lowerTeethGroup);
    this.lowerTeeth = lowerTeethGroup;

    // Lower Lip (Dual Cushioned Muscle Pads & Central Vermilion Cushion)
    const lowerLipGroup = new THREE.Group();
    lowerLipGroup.position.set(0, -0.012, 0.018);

    [-0.034, 0.034].forEach((lx) => {
      const isLeft = lx < 0;
      const lowerPadGeo = new THREE.SphereGeometry(0.022, 14, 14);
      lowerPadGeo.scale(1.24, 0.88, 0.92);
      const lowerPad = new THREE.Mesh(lowerPadGeo, this.matLips);
      lowerPad.position.set(lx, 0.0, 0.0);
      lowerPad.rotation.z = isLeft ? 0.08 : -0.08;
      lowerLipGroup.add(lowerPad);
    });

    const lowerCenterCushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.012, 0.032, 12),
      this.matLips
    );
    lowerCenterCushion.rotation.z = Math.PI / 2;
    lowerCenterCushion.position.set(0, 0.001, 0.001);
    lowerLipGroup.add(lowerCenterCushion);

    lowerMouthGroup.add(lowerLipGroup);
    this.lowerLip = lowerLipGroup;

    this.lowerMouth = lowerMouthGroup;
    mouthRoot.add(lowerMouthGroup);

    // 10e. Upper Lip (Cupid's Bow, Procheilon Central Tubercle & Lateral Wings)
    const upperLipGroup = new THREE.Group();
    upperLipGroup.position.set(0, 0.018, 0.020);

    // Procheilon (Central Upper Tubercle)
    const upperTubercle = new THREE.Mesh(
      new THREE.SphereGeometry(0.020, 14, 14),
      this.matLips
    );
    upperTubercle.scale.set(1.18, 0.82, 0.92);
    upperTubercle.position.set(0, 0.002, 0.0);
    upperLipGroup.add(upperTubercle);

    // Cupid's Bow Crest Peaks & Lateral Vermilion Wings
    [-0.054, 0.054].forEach((lx) => {
      const isLeft = lx < 0;
      const upperWing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.008, 0.072, 12),
        this.matLips
      );
      upperWing.position.set(lx, -0.002, -0.004);
      upperWing.rotation.z = isLeft ? 1.36 : -1.36;
      upperWing.rotation.y = isLeft ? 0.22 : -0.22;
      upperLipGroup.add(upperWing);
    });
    this.upperLip = upperLipGroup;
    mouthRoot.add(upperLipGroup);

    // 10f. Oral Commissures (Natural dimple nodes at left and right corners of the mouth)
    [-0.088, 0.088].forEach((cx) => {
      const commissure = new THREE.Mesh(
        new THREE.SphereGeometry(0.010, 10, 10),
        this.matSkinShadow
      );
      commissure.position.set(cx, 0.004, 0.014);
      mouthRoot.add(commissure);
    });

    // 10g. Mentolabial Sulcus (Horizontal anatomical depression between lower lip & chin)
    const mentolabial = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.012, 0.016),
      this.matSkinShadow
    );
    mentolabial.position.set(0, -0.042, 0.014);
    mouthRoot.add(mentolabial);

    this.faceLips = mouthRoot;
    this.headGroup.add(mouthRoot);

    this.robotGroup.add(this.headGroup);
  }

  createHumanoidEye(xPos) {
    const isLeft = xPos < 0;
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(xPos, 0.065, 0.44);

    // 1. Almond-Shaped Palpebral Orbital Rim
    const almondArchGeo = new THREE.TorusGeometry(0.112, 0.014, 16, 32);
    almondArchGeo.scale(1.22, 0.88, 1.0);
    const socketRim = new THREE.Mesh(almondArchGeo, this.matSkin);
    socketRim.rotation.z = isLeft ? 0.08 : -0.08; // Positive canthal tilt
    eyeGroup.add(socketRim);

    // Medial Canthus (Inner eye corner pointing toward nose)
    const innerCorner = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), this.matSkin);
    innerCorner.scale.set(1.4, 0.8, 0.8);
    innerCorner.position.set(isLeft ? 0.092 : -0.092, -0.006, 0.012);
    eyeGroup.add(innerCorner);

    // Medial Lacrimal Caruncle (Natural pink inner tear node)
    const caruncle = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 10), this.matCaruncle);
    caruncle.scale.set(1.1, 0.85, 0.9);
    caruncle.position.set(isLeft ? 0.082 : -0.082, -0.006, 0.018);
    eyeGroup.add(caruncle);

    // Lateral Canthus (Outer eye corner with crisp taper)
    const outerCorner = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 10), this.matSkin);
    outerCorner.scale.set(1.2, 0.8, 0.8);
    outerCorner.position.set(isLeft ? -0.095 : 0.095, 0.008, 0.008);
    eyeGroup.add(outerCorner);

    // 2. Pure Pearlescent White Eyeball Sclera (100% clean white on BOTH eyes - zero black defect!)
    const eyeballGeo = new THREE.SphereGeometry(0.10, 32, 32);
    const eyeball = new THREE.Mesh(eyeballGeo, this.matSclera);
    eyeball.position.set(0, 0, -0.01);
    eyeGroup.add(eyeball);

    // 3. Moving Gaze Assembly (Biological Human Iris, Limbal Ring, Collarette, Obsidian Pupil, Catchlights)
    const gazeGroup = new THREE.Group();
    gazeGroup.position.set(0, 0, 0.038);
    eyeGroup.add(gazeGroup);

    // 3a. Deep Limbal Ring (Sharply defines the dark biological perimeter of the human cornea/iris)
    const limbalRing = new THREE.Mesh(new THREE.TorusGeometry(0.073, 0.0055, 16, 36), this.matLimbalRing);
    gazeGroup.add(limbalRing);

    // 3b. Living Biological Iris Stroma Base (Handsome hazel / deep slate-sapphire human iris)
    const irisDisk = new THREE.Mesh(new THREE.CircleGeometry(0.071, 36), this.matHumanIris);
    irisDisk.position.set(0, 0, 0.002);
    gazeGroup.add(irisDisk);

    // 3c. Pupillary Collarette (Concentric undulating ring dividing pupillary & ciliary zones)
    const collarette = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.0035, 12, 32), this.matHumanIrisCollarette);
    collarette.position.set(0, 0, 0.0035);
    gazeGroup.add(collarette);

    // 3d. Radial Ciliary Striae (12 delicate radial trabeculae fibers giving lifelike biological depth)
    const fibersGroup = new THREE.Group();
    fibersGroup.position.set(0, 0, 0.004);
    for (let f = 0; f < 12; f++) {
      const angle = (f / 12) * Math.PI * 2;
      const fiber = new THREE.Mesh(new THREE.BoxGeometry(0.0018, 0.022, 0.001), this.matHumanIrisFibers);
      const rad = 0.057;
      fiber.position.set(Math.cos(angle) * rad, Math.sin(angle) * rad, 0);
      fiber.rotation.z = angle + Math.PI / 2;
      fibersGroup.add(fiber);
    }
    gazeGroup.add(fibersGroup);

    // 3e. Deep Obsidian Human Pupil (Light-absorbing optical aperture - zero robotic laser diodes!)
    const pupilObsidian = new THREE.Mesh(new THREE.CircleGeometry(0.034, 32), this.matPupilObsidian);
    pupilObsidian.position.set(0, 0, 0.006);
    gazeGroup.add(pupilObsidian);

    // 3f. Primary Crisp Specular Corneal Catchlight (Glint at 2 o'clock for vibrant lively gaze)
    const catchlight1 = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 10), this.matCatchlight);
    catchlight1.position.set(0.018, 0.018, 0.018);
    gazeGroup.add(catchlight1);

    // 3g. Secondary Sub-Specular Catchlight (Soft reflection at 7 o'clock for wet optical realism)
    const catchlight2 = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 8), this.matCatchlight);
    catchlight2.position.set(-0.014, -0.014, 0.016);
    gazeGroup.add(catchlight2);

    // 4. Crystal-Clear Optical Cornea Lens Dome (Pure clarity, zero milky fog)
    const lensGeo = new THREE.SphereGeometry(0.104, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const lens = new THREE.Mesh(lensGeo, this.matEyeLens);
    lens.position.set(0, 0, 0.012);
    eyeGroup.add(lens);

    // 5. Upper Eyelash Fringe (Fine dark cilia defining the upper eyelid margin)
    const lashGeo = new THREE.TorusGeometry(0.092, 0.006, 8, 28, Math.PI * 0.88);
    lashGeo.scale(1.22, 0.86, 1.0);
    const lash = new THREE.Mesh(lashGeo, this.matEyelash);
    lash.rotation.z = Math.PI + (isLeft ? 0.08 : -0.08);
    lash.position.set(0, 0.018, 0.028);
    eyeGroup.add(lash);

    // Lower Eyelash Waterline / Subtle Shadow
    const lowerLashGeo = new THREE.TorusGeometry(0.088, 0.0035, 8, 24, Math.PI * 0.78);
    lowerLashGeo.scale(1.18, 0.82, 1.0);
    const lowerLash = new THREE.Mesh(lowerLashGeo, this.matSkinShadow);
    lowerLash.rotation.z = isLeft ? 0.08 : -0.08;
    lowerLash.position.set(0, -0.016, 0.024);
    eyeGroup.add(lowerLash);

    // 6. Supratarsal Upper Eyelid Crease (Natural double eyelid fold in skin shadow)
    const lidArchGeo = new THREE.TorusGeometry(0.104, 0.009, 12, 24, Math.PI * 0.85);
    lidArchGeo.scale(1.24, 0.86, 1.0);
    const lidArch = new THREE.Mesh(lidArchGeo, this.matSkinShadow);
    lidArch.rotation.z = Math.PI + (isLeft ? 0.08 : -0.08);
    lidArch.position.set(0, 0.038, 0.026);
    eyeGroup.add(lidArch);

    // 7. Natural Skin-Toned Eyelid Shutter for Blinking (Uses matSkin!)
    const lidGeo = new THREE.SphereGeometry(0.106, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const eyelid = new THREE.Mesh(lidGeo, this.matSkin);
    eyelid.position.set(0, 0, 0.016);
    eyelid.rotation.x = -Math.PI / 2; // Default open
    eyeGroup.add(eyelid);

    // 8. High-Definition Portrait Eye Light (Symmetrically illuminates both eyes)
    const eyeLight = new THREE.PointLight(this.themes[this.currentTheme].light, 1.2, 1.8);
    eyeLight.position.set(0, 0, 0.14);
    eyeGroup.add(eyeLight);

    if (isLeft) this.leftEyeLight = eyeLight;
    else this.rightEyeLight = eyeLight;

    eyeGroup.userData = {
      eyelid: eyelid,
      gazeGroup: gazeGroup,
      pupil: gazeGroup,
      pupilCore: pupilObsidian,
      irisDisk: irisDisk,
      collarette: collarette,
      catchlight1: catchlight1,
      catchlight2: catchlight2
    };

    return eyeGroup;
  }

  createEyebrow(xPos, isLeft) {
    const brow = new THREE.Group();
    brow.position.set(xPos, 0.19, 0.47);

    // Groomed Masculine 3-Part Arched Eyebrow:
    // 1. Head (Medial end at glabella: thicker, angled)
    const headGeo = new THREE.CylinderGeometry(0.019, 0.017, 0.075, 12);
    const head = new THREE.Mesh(headGeo, this.matEyebrow);
    head.position.set(isLeft ? 0.065 : -0.065, -0.008, 0.010);
    head.rotation.z = isLeft ? 1.42 : -1.42;
    head.rotation.y = isLeft ? -0.16 : 0.16;
    brow.add(head);

    // 2. Body (Central arch over supraorbital ridge)
    const bodyGeo = new THREE.CylinderGeometry(0.017, 0.014, 0.090, 12);
    const body = new THREE.Mesh(bodyGeo, this.matEyebrow);
    body.position.set(0, 0.002, 0.005);
    body.rotation.z = isLeft ? 1.54 : -1.54;
    brow.add(body);

    // 3. Tail (Lateral end tapering toward temple)
    const tailGeo = new THREE.CylinderGeometry(0.014, 0.008, 0.072, 12);
    const tail = new THREE.Mesh(tailGeo, this.matEyebrow);
    tail.position.set(isLeft ? -0.070 : 0.070, -0.012, -0.010);
    tail.rotation.z = isLeft ? 1.78 : -1.78;
    tail.rotation.y = isLeft ? 0.20 : -0.20;
    brow.add(tail);

    return brow;
  }

  buildHumanoidTorso() {
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.15, 0);

    // ==========================================
    // 1. ATHLETIC HUMAN TORSO FOUNDATION (RIBCAGE & SPINE)
    // ==========================================
    // Inner thoracic ribcage foundation with athletic human V-taper
    const ribcageGeo = new THREE.SphereGeometry(0.34, 24, 24);
    ribcageGeo.scale(1.16, 1.12, 0.76);
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

    // Acromion process & lateral shoulder contour connecting to deltoid
    [-0.32, 0.32].forEach((ax) => {
      const isLeft = ax < 0;
      const acromion = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.10, 0.18), this.matSkin);
      acromion.position.set(ax, 0.26, 0.01);
      acromion.rotation.z = isLeft ? -0.15 : 0.15;
      this.torsoGroup.add(acromion);
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
    upperArm.rotation.z = isLeft ? -0.14 : 0.14; // Naturally angled OUTSIDE the torso
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

    // 1. Natural Sculpted Human Palm
    // Trapezoidal palm base tapering gracefully from knuckles to wrist
    const palmGeo = new THREE.BoxGeometry(0.132, 0.125, 0.038);
    const palm = new THREE.Mesh(palmGeo, this.matSkin);
    palm.position.set(0, -0.062, 0);
    handGroup.add(palm);

    // Thenar Eminence (fleshy teardrop cushion at the base of the thumb)
    const thenarGeo = new THREE.SphereGeometry(0.036, 14, 14);
    thenarGeo.scale(1.18, 1.48, 0.92);
    const thenar = new THREE.Mesh(thenarGeo, this.matSkin);
    thenar.position.set(isLeft ? 0.046 : -0.046, -0.048, 0.012);
    handGroup.add(thenar);

    // Hypothenar Eminence (elongated muscular mound on outer/ulnar edge of palm)
    const hypothenarGeo = new THREE.SphereGeometry(0.030, 12, 12);
    hypothenarGeo.scale(0.95, 1.55, 0.82);
    const hypothenar = new THREE.Mesh(hypothenarGeo, this.matSkin);
    hypothenar.position.set(isLeft ? -0.046 : 0.046, -0.058, 0.010);
    handGroup.add(hypothenar);

    // Palmar Hollow & Life Line (Thenar Flexion Crease)
    const creaseGeo = new THREE.TorusGeometry(0.042, 0.0022, 8, 16, Math.PI * 0.55);
    const lifeLine = new THREE.Mesh(creaseGeo, this.matSkinShadow);
    lifeLine.position.set(isLeft ? 0.018 : -0.018, -0.052, 0.019);
    lifeLine.rotation.z = isLeft ? 0.45 : -0.45;
    handGroup.add(lifeLine);

    // Palmar Head & Heart Creases (transverse flexure lines across mid palm)
    const midCreaseGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.075, 8);
    const midCrease = new THREE.Mesh(midCreaseGeo, this.matSkinShadow);
    midCrease.position.set(0, -0.078, 0.019);
    midCrease.rotation.z = isLeft ? 0.18 : -0.18;
    midCrease.rotation.x = Math.PI / 2;
    handGroup.add(midCrease);

    // Dorsal Extensor Tendons (4 subtle anatomical ridges on back of hand running to knuckles)
    [-0.042, -0.014, 0.014, 0.042].forEach((tx) => {
      const tendonGeo = new THREE.CylinderGeometry(0.0022, 0.0016, 0.105, 8);
      const tendon = new THREE.Mesh(tendonGeo, this.matSkinShadow);
      tendon.position.set(tx * 0.78, -0.058, -0.019);
      tendon.rotation.z = (tx / 0.042) * (isLeft ? -0.06 : 0.06);
      handGroup.add(tendon);
    });

    // 4 Articulated Human Fingers along natural curved knuckle arch
    // Specs for 4 fingers: Index, Middle (longest), Ring, Pinky (shortest, lower set)
    const specs = [
      { name: "index",  x: isLeft ? 0.042 : -0.042, len: 0.126, yArch: 0.003, zArch: 0.001, spread: isLeft ? 0.07 : -0.07, r: 0.0120 },
      { name: "middle", x: isLeft ? 0.014 : -0.014, len: 0.140, yArch: 0.008, zArch: 0.003, spread: 0.0,                  r: 0.0125 },
      { name: "ring",   x: isLeft ? -0.014 : 0.014, len: 0.130, yArch: 0.004, zArch: 0.001, spread: isLeft ? -0.04 : 0.04,  r: 0.0118 },
      { name: "pinky",  x: isLeft ? -0.042 : 0.042, len: 0.104, yArch: -0.006, zArch: -0.003, spread: isLeft ? -0.09 : 0.09, r: 0.0105 }
    ];

    const fingers = [];

    specs.forEach((s, idx) => {
      // 1. Root Group at MCP Knuckle
      const fGroup = new THREE.Group();
      fGroup.position.set(s.x, -0.118 + s.yArch, s.zArch);
      fGroup.rotation.z = s.spread; // Natural resting finger spread / splay

      // Metacarpophalangeal (MCP) Knuckle Prominence
      const mcpKnuckle = new THREE.Mesh(new THREE.SphereGeometry(s.r * 1.15, 14, 14), this.matSkin);
      fGroup.add(mcpKnuckle);

      // Proximal Phalanx (P1)
      const p1Len = s.len * 0.44;
      const p1Geo = new THREE.CylinderGeometry(s.r * 0.92, s.r * 0.84, p1Len, 12);
      const p1 = new THREE.Mesh(p1Geo, this.matSkin);
      p1.position.set(0, -p1Len / 2, 0);
      fGroup.add(p1);

      // Palmar Pad on P1 (volar side +Z)
      const p1PadGeo = new THREE.SphereGeometry(s.r * 0.78, 10, 10);
      p1PadGeo.scale(0.85, 1.8, 0.45);
      const p1Pad = new THREE.Mesh(p1PadGeo, this.matSkin);
      p1Pad.position.set(0, -p1Len / 2, s.r * 0.42);
      fGroup.add(p1Pad);

      // 2. Proximal Interphalangeal (PIP) Joint Group
      const pipGroup = new THREE.Group();
      pipGroup.position.set(0, -p1Len, 0);

      // PIP Knuckle Joint Node
      const pipKnuckle = new THREE.Mesh(new THREE.SphereGeometry(s.r * 0.95, 12, 12), this.matSkin);
      pipGroup.add(pipKnuckle);

      // Volar Flexion Crease at PIP (palmar side +Z)
      const pipCrease = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0014, s.r * 1.6, 8), this.matSkinShadow);
      pipCrease.position.set(0, 0, s.r * 0.65);
      pipCrease.rotation.z = Math.PI / 2;
      pipGroup.add(pipCrease);

      // Intermediate Phalanx (P2)
      const p2Len = s.len * 0.31;
      const p2Geo = new THREE.CylinderGeometry(s.r * 0.82, s.r * 0.74, p2Len, 12);
      const p2 = new THREE.Mesh(p2Geo, this.matSkin);
      p2.position.set(0, -p2Len / 2, 0);
      pipGroup.add(p2);

      // Palmar Pad on P2 (volar side +Z)
      const p2PadGeo = new THREE.SphereGeometry(s.r * 0.70, 10, 10);
      p2PadGeo.scale(0.82, 1.7, 0.42);
      const p2Pad = new THREE.Mesh(p2PadGeo, this.matSkin);
      p2Pad.position.set(0, -p2Len / 2, s.r * 0.38);
      pipGroup.add(p2Pad);

      // 3. Distal Interphalangeal (DIP) Joint Group
      const dipGroup = new THREE.Group();
      dipGroup.position.set(0, -p2Len, 0);

      // DIP Knuckle Joint Node
      const dipKnuckle = new THREE.Mesh(new THREE.SphereGeometry(s.r * 0.80, 12, 12), this.matSkin);
      dipGroup.add(dipKnuckle);

      // Volar Flexion Crease at DIP (palmar side +Z)
      const dipCrease = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, s.r * 1.4, 8), this.matSkinShadow);
      dipCrease.position.set(0, 0, s.r * 0.55);
      dipCrease.rotation.z = Math.PI / 2;
      dipGroup.add(dipCrease);

      // Distal Phalanx (P3)
      const p3Len = s.len * 0.25;
      const p3Geo = new THREE.CylinderGeometry(s.r * 0.72, s.r * 0.58, p3Len, 12);
      const p3 = new THREE.Mesh(p3Geo, this.matSkin);
      p3.position.set(0, -p3Len / 2, 0);
      dipGroup.add(p3);

      // Natural Human Fingertip Pulp Pad (fleshy tactile pad on palmar side +Z)
      const pulpPadGeo = new THREE.SphereGeometry(s.r * 0.68, 12, 12);
      pulpPadGeo.scale(0.95, 1.35, 0.65);
      const pulpPad = new THREE.Mesh(pulpPadGeo, this.matSkin);
      pulpPad.position.set(0, -p3Len * 0.55, s.r * 0.35);
      dipGroup.add(pulpPad);

      // Rounded Soft Fingertip
      const tipGeo = new THREE.SphereGeometry(s.r * 0.60, 12, 12);
      const tip = new THREE.Mesh(tipGeo, this.matSkin);
      tip.position.set(0, -p3Len, 0);
      dipGroup.add(tip);

      // Natural Human Fingernail on Dorsal Face (-Z side)
      const nailWidth = s.r * 1.25;
      const nailHeight = p3Len * 0.55;
      const nailGeo = new THREE.BoxGeometry(nailWidth, nailHeight, s.r * 0.28);
      const nail = new THREE.Mesh(nailGeo, this.matNails);
      nail.position.set(0, -p3Len * 0.50, -s.r * 0.62);
      nail.rotation.x = -0.06;
      dipGroup.add(nail);

      // Cuticle Line at base of nail
      const cuticle = new THREE.Mesh(new THREE.CylinderGeometry(0.0010, 0.0010, nailWidth * 0.9, 8), this.matSkinShadow);
      cuticle.position.set(0, -p3Len * 0.22, -s.r * 0.65);
      cuticle.rotation.z = Math.PI / 2;
      dipGroup.add(cuticle);

      // Assemble hierarchy: DIP -> PIP -> MCP (fGroup) -> handGroup
      pipGroup.add(dipGroup);
      fGroup.add(pipGroup);
      handGroup.add(fGroup);

      // Store references for hierarchical 3-joint synergy animation
      fGroup.userData = {
        isThumb: false,
        side: side,
        index: idx,
        baseSpread: s.spread,
        pip: pipGroup,
        dip: dipGroup
      };

      fingers.push(fGroup);
    });

    // 5. Naturally Opposable Articulated Human Thumb
    const thumbGroup = new THREE.Group();
    const tx = isLeft ? 0.065 : -0.065;
    thumbGroup.position.set(tx, -0.048, 0.016);
    // Opposed inward toward fingers and tilted forward
    thumbGroup.rotation.z = isLeft ? -0.52 : 0.52;
    thumbGroup.rotation.y = isLeft ? -0.44 : 0.44;
    thumbGroup.rotation.x = 0.22;

    const tr = 0.0135; // Sturdier thumb radius

    // 1st Metacarpophalangeal (MCP) Joint Node
    const tKnuckle = new THREE.Mesh(new THREE.SphereGeometry(tr * 1.15, 14, 14), this.matSkin);
    thumbGroup.add(tKnuckle);

    // Thumb Proximal Phalanx
    const tp1Len = 0.048;
    const tp1Geo = new THREE.CylinderGeometry(tr * 0.95, tr * 0.85, tp1Len, 12);
    const tp1 = new THREE.Mesh(tp1Geo, this.matSkin);
    tp1.position.set(0, -tp1Len / 2, 0);
    thumbGroup.add(tp1);

    // Thumb Interphalangeal (IP) Joint Group
    const thumbIpGroup = new THREE.Group();
    thumbIpGroup.position.set(0, -tp1Len, 0);

    const tipKnuckle = new THREE.Mesh(new THREE.SphereGeometry(tr * 0.90, 12, 12), this.matSkin);
    thumbIpGroup.add(tipKnuckle);

    // Thumb Volar Crease at IP Joint
    const tipCrease = new THREE.Mesh(new THREE.CylinderGeometry(0.0014, 0.0014, tr * 1.6, 8), this.matSkinShadow);
    tipCrease.position.set(0, 0, tr * 0.62);
    tipCrease.rotation.z = Math.PI / 2;
    thumbIpGroup.add(tipCrease);

    // Thumb Distal Phalanx
    const tp2Len = 0.040;
    const tp2Geo = new THREE.CylinderGeometry(tr * 0.82, tr * 0.68, tp2Len, 12);
    const tp2 = new THREE.Mesh(tp2Geo, this.matSkin);
    tp2.position.set(0, -tp2Len / 2, 0);
    thumbIpGroup.add(tp2);

    // Broad Fleshy Palmar Thumb Pulp Pad (volar side +Z)
    const tPadGeo = new THREE.SphereGeometry(tr * 0.78, 12, 12);
    tPadGeo.scale(1.10, 1.45, 0.70);
    const tPad = new THREE.Mesh(tPadGeo, this.matSkin);
    tPad.position.set(0, -tp2Len * 0.55, tr * 0.40);
    thumbIpGroup.add(tPad);

    // Soft Rounded Thumb Tip
    const tTipGeo = new THREE.SphereGeometry(tr * 0.68, 12, 12);
    const tTip = new THREE.Mesh(tTipGeo, this.matSkin);
    tTip.position.set(0, -tp2Len, 0);
    thumbIpGroup.add(tTip);

    // Wide Convex Groomed Thumbnail on Dorsal Face (-Z)
    const tNailWidth = tr * 1.45;
    const tNailHeight = tp2Len * 0.58;
    const tNailGeo = new THREE.BoxGeometry(tNailWidth, tNailHeight, tr * 0.30);
    const tNail = new THREE.Mesh(tNailGeo, this.matNails);
    tNail.position.set(0, -tp2Len * 0.50, -tr * 0.65);
    tNail.rotation.x = -0.06;
    thumbIpGroup.add(tNail);

    // Thumbnail Cuticle
    const tCuticle = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0012, tNailWidth * 0.9, 8), this.matSkinShadow);
    tCuticle.position.set(0, -tp2Len * 0.20, -tr * 0.68);
    tCuticle.rotation.z = Math.PI / 2;
    thumbIpGroup.add(tCuticle);

    thumbGroup.add(thumbIpGroup);
    handGroup.add(thumbGroup);

    thumbGroup.userData = {
      isThumb: true,
      side: side,
      ip: thumbIpGroup,
      baseRotX: 0.22,
      baseRotY: isLeft ? -0.44 : 0.44,
      baseRotZ: isLeft ? -0.52 : 0.52
    };

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
      suit: [],
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
    // 0. DISCIPLINED BESPOKE TAILORED SUIT (OFFICER / EXECUTIVE DISCIPLINE DRESS)
    // ==========================================
    const suitTorso = new THREE.Group();
    suitTorso.position.set(0, 0, 0);

    // 1. Bespoke Tailored Wool Blazer Body (Athletic V-Taper Cut)
    const blazerBody = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.54, 0.32), this.matSuitNavy);
    blazerBody.position.set(0, 0.08, 0.10);
    suitTorso.add(blazerBody);

    // 2. Crisp White Poplin Dress Shirt (High Formal Standing Collar & Placket)
    const shirtPlacket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.36, 0.33), this.matShirtWhite);
    shirtPlacket.position.set(0, 0.13, 0.11);
    suitTorso.add(shirtPlacket);

    // Stiff Spread Shirt Collar wrapping the neck
    const collarLeft = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.02), this.matShirtCollar);
    collarLeft.position.set(-0.065, 0.33, 0.26);
    collarLeft.rotation.z = -0.45;
    collarLeft.rotation.y = 0.25;
    suitTorso.add(collarLeft);

    const collarRight = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.02), this.matShirtCollar);
    collarRight.position.set(0.065, 0.33, 0.26);
    collarRight.rotation.z = 0.45;
    collarRight.rotation.y = -0.25;
    suitTorso.add(collarRight);

    // Mother-of-pearl shirt buttons down placket
    [0.24, 0.16, 0.08].forEach((btnY) => {
      const shirtBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.008, 10), this.matShirtCollar);
      shirtBtn.rotation.x = Math.PI / 2;
      shirtBtn.position.set(0, btnY, 0.28);
      suitTorso.add(shirtBtn);
    });

    // 3. Disciplined Imperial Crimson Silk Necktie & Full Windsor Knot
    const suitTieKnot = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.052, 0.038), this.matTieRed);
    suitTieKnot.position.set(0, 0.27, 0.27);
    suitTorso.add(suitTieKnot);

    const suitTieBlade = new THREE.Mesh(new THREE.ConeGeometry(0.048, 0.34, 4), this.matTieRed);
    suitTieBlade.position.set(0, 0.10, 0.275);
    suitTieBlade.rotation.x = Math.PI;
    suitTorso.add(suitTieBlade);

    // Polished 18k Gold Tie Bar / Clip pinned horizontally at mid-chest
    const suitTieClip = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.010, 0.015), this.matTieClip);
    suitTieClip.position.set(0.005, 0.13, 0.292);
    suitTorso.add(suitTieClip);

    // 4. Disciplined Peak Lapels (Sharp angular satin finish)
    [-0.14, 0.14].forEach((lx) => {
      const isLeft = lx < 0;
      const lapelGeo = new THREE.BoxGeometry(0.12, 0.38, 0.03);
      const lapel = new THREE.Mesh(lapelGeo, this.matSuitLapel);
      lapel.position.set(lx, 0.14, 0.27);
      lapel.rotation.z = isLeft ? 0.32 : -0.32;
      lapel.rotation.y = isLeft ? -0.18 : 0.18;
      suitTorso.add(lapel);
    });

    // 5. Left Breast Welt Pocket & Crisp Folded Linen Pocket Square
    const breastPocket = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.022, 0.02), this.matSuitLapel);
    breastPocket.position.set(-0.20, 0.17, 0.27);
    suitTorso.add(breastPocket);

    const pocketSquare = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.014), this.matPocketSquare);
    pocketSquare.position.set(-0.20, 0.19, 0.272);
    pocketSquare.rotation.z = -0.08;
    suitTorso.add(pocketSquare);

    // Pocket Square Gold Edge Piping
    const pocketGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.006, 0.016), this.matTieClip);
    pocketGoldTrim.position.set(-0.20, 0.205, 0.274);
    suitTorso.add(pocketGoldTrim);

    // 6. Disciplined Honor / Academic Merit Ribbon Bar
    const ribbonGroup = new THREE.Group();
    ribbonGroup.position.set(-0.20, 0.125, 0.272);
    const ribbonBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.012, 0.012), this.matRibbonRed);
    ribbonBar1.position.set(-0.026, 0, 0);
    ribbonGroup.add(ribbonBar1);
    const ribbonBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.012, 0.012), this.matRibbonBlue);
    ribbonBar2.position.set(0, 0, 0);
    ribbonGroup.add(ribbonBar2);
    const ribbonBar3 = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.012, 0.012), this.matRibbonGold);
    ribbonBar3.position.set(0.026, 0, 0);
    ribbonGroup.add(ribbonBar3);
    suitTorso.add(ribbonGroup);

    // 7. Disciplined Gold Crested Buttons (Vertically Aligned)
    [0.02, -0.06, -0.14].forEach((by) => {
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.016, 14), this.matTieClip);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0.025, by, 0.275);
      suitTorso.add(btn);
    });

    // 8. Disciplined Italian Dark Leather Belt & Polished Buckle
    const suitBelt = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.052, 0.24), this.matBelt);
    suitBelt.position.set(0, -0.21, 0.06);
    suitTorso.add(suitBelt);

    const suitBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.062, 0.025), this.matBeltBuckle);
    suitBuckle.position.set(0, -0.21, 0.185);
    suitTorso.add(suitBuckle);

    const suitBuckleFrame = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.007, 12, 24), this.matBeltBuckle);
    suitBuckleFrame.position.set(0, -0.21, 0.188);
    suitTorso.add(suitBuckleFrame);

    register("suit", suitTorso, this.torsoGroup);

    // Disciplined Epaulettes on Shoulders & Blazer Sleeves with French Cuffs
    [-1, 1].forEach((dir) => {
      const isLeft = dir === -1;
      const armGroup = isLeft ? this.leftArm.group : this.rightArm.group;
      const upperArm = isLeft ? this.leftArm.upperArm : this.rightArm.upperArm;
      const forearm = isLeft ? this.leftArm.forearm : this.rightArm.forearm;

      // Disciplined Shoulder Epaulette (Formal Officer Strap with Gold Piping)
      const epauletteGroup = new THREE.Group();
      epauletteGroup.position.set(isLeft ? -0.02 : 0.02, 0.04, 0);

      const epauletteBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.024, 0.12), this.matSuitNavy);
      epauletteGroup.add(epauletteBase);

      const epauletteGoldCord = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.008, 8, 20), this.matTieClip);
      epauletteGoldCord.rotation.x = Math.PI / 2;
      epauletteGroup.add(epauletteGoldCord);

      const epauletteBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 10), this.matTieClip);
      epauletteBtn.position.set(isLeft ? 0.05 : -0.05, 0.016, 0);
      epauletteGroup.add(epauletteBtn);

      register("suit", epauletteGroup, armGroup);

      // Upper Arm Blazer Sleeve
      const upperSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.086, 0.34, 18), this.matSuitNavy);
      upperSleeve.position.set(0, -0.16, 0);
      register("suit", upperSleeve, upperArm);

      // Forearm Blazer Sleeve
      const lowerSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.076, 0.28, 18), this.matSuitNavy);
      lowerSleeve.position.set(0, -0.14, 0);
      register("suit", lowerSleeve, forearm);

      // Crisp White French Shirt Cuff extending from sleeve
      const frenchCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.066, 0.05, 16), this.matShirtWhite);
      frenchCuff.position.set(0, -0.28, 0);
      register("suit", frenchCuff, forearm);

      // Polished 18k Gold Cufflink
      const cufflink = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.015, 10), this.matTieClip);
      cufflink.rotation.x = Math.PI / 2;
      cufflink.position.set(isLeft ? 0.065 : -0.065, -0.28, 0);
      register("suit", cufflink, forearm);

      // Executive Disciplined Chronometer / Wristwatch on Left Wrist
      if (isLeft) {
        const watchGroup = new THREE.Group();
        watchGroup.position.set(0, -0.26, 0);

        const watchBand = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.012, 10, 24), this.matBelt);
        watchBand.rotation.x = Math.PI / 2;
        watchGroup.add(watchBand);

        const watchBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.014, 16), this.matTieClip);
        watchBezel.rotation.z = Math.PI / 2;
        watchBezel.position.set(0.062, 0, 0);
        watchGroup.add(watchBezel);

        const watchFace = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), this.matSuitNavy);
        watchFace.rotation.y = Math.PI / 2;
        watchFace.position.set(0.070, 0, 0);
        watchGroup.add(watchFace);

        register("suit", watchGroup, forearm);
      }
    });

    // Disciplined Tailored Wool Trousers & Mirror-Polished Oxford Shoes
    if (this.leftLeg && this.rightLeg) {
      [-1, 1].forEach((dir) => {
        const isLeft = dir === -1;
        const leg = isLeft ? this.leftLeg : this.rightLeg;

        // Tailored Wool Trouser Thigh with Razor Crease
        const suitTrouserThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.116, 0.100, 0.46, 20), this.matTrousers);
        suitTrouserThigh.position.set(0, -0.24, 0);
        register("suit", suitTrouserThigh, leg.thigh);

        // Pressed Front Crease on Thigh
        const suitCreaseThigh = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.44, 0.022), this.matTrouserCrease);
        suitCreaseThigh.position.set(0, -0.24, 0.106);
        register("suit", suitCreaseThigh, leg.thigh);

        // Tailored Wool Trouser Calf with Razor Crease
        const suitTrouserCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.102, 0.088, 0.46, 20), this.matTrousers);
        suitTrouserCalf.position.set(0, -0.25, 0);
        register("suit", suitTrouserCalf, leg.calf);

        // Pressed Front Crease on Calf
        const suitCreaseCalf = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.44, 0.020), this.matTrouserCrease);
        suitCreaseCalf.position.set(0, -0.25, 0.092);
        register("suit", suitCreaseCalf, leg.calf);

        // Hand-Burnished Mahogany Espresso Oxford Dress Shoe
        const suitShoeGroup = new THREE.Group();
        suitShoeGroup.position.set(0, 0, 0.03);

        // Shoe Upper with Sleek Toe Taper
        const shoeUpper = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.082, 0.30), this.matShoes);
        shoeUpper.position.set(0, 0, 0);
        suitShoeGroup.add(shoeUpper);

        // Mirror-Polished Cap Toe
        const capToe = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.074, 0.145, 16), this.matShoes);
        capToe.rotation.z = Math.PI / 2;
        capToe.position.set(0, 0.008, 0.145);
        suitShoeGroup.add(capToe);

        // Leather Welt & Stacked Heel Sole
        const shoeSole = new THREE.Mesh(new THREE.BoxGeometry(0.170, 0.022, 0.32), this.matSole);
        shoeSole.position.set(0, -0.042, 0.01);
        suitShoeGroup.add(shoeSole);

        const dressHeel = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.025, 0.11), this.matSole);
        dressHeel.position.set(0, -0.055, -0.09);
        suitShoeGroup.add(dressHeel);

        // Neat Dress Oxford Laces
        const shoeLaces = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.012, 0.085), this.matLaces);
        shoeLaces.position.set(0, 0.045, 0.05);
        suitShoeGroup.add(shoeLaces);

        register("suit", suitShoeGroup, leg.foot);
      });
    }

    // ==========================================
    // 1. CYBER MECHA EXOSKELETON ARMOR (TITANIUM PLATES & NEON CONDUITS)
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

      const leftDressShoe = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.082, 0.30), this.matChassis);
      leftDressShoe.position.set(0, 0, 0.03);
      register("student", leftDressShoe, this.leftLeg.foot);

      const rightDressShoe = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.082, 0.30), this.matChassis);
      rightDressShoe.position.set(0, 0, 0.03);
      register("student", rightDressShoe, this.rightLeg.foot);
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
      this.cameraLookTarget.set(0, 0.82, 0.10);
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

      // Natural human hair micro-dynamics (subtle organic response of front hair locks to movement & breathing)
      if (this.hairQuiff) {
        const hairSway = Math.sin(time * 3.2) * 0.010 + (this.expression === "speaking" ? Math.sin(time * 6.5) * 0.015 : 0);
        this.hairQuiff.rotation.x = hairSway;
        this.hairQuiff.rotation.z = Math.cos(time * 2.8) * 0.006;
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

      // Biological Human Pupil Response (Cognitive Dilation & Saccadic Fixation)
      let pupilScale = 1.0;
      if (this.expression === "thinking") {
        pupilScale = 1.14 + Math.sin(time * 3.0) * 0.04;
      } else if (this.expression === "speaking") {
        pupilScale = 1.08 + Math.sin(time * 4.5) * 0.05;
      } else if (this.expression === "surprised") {
        pupilScale = 1.24;
      } else {
        pupilScale = 1.0 + Math.sin(time * 1.5) * 0.02;
      }

      if (this.leftEye.userData.pupilCore) this.leftEye.userData.pupilCore.scale.set(pupilScale, pupilScale, 1);
      if (this.rightEye.userData.pupilCore) this.rightEye.userData.pupilCore.scale.set(pupilScale, pupilScale, 1);
      if (this.leftEyeLight) this.leftEyeLight.intensity = 1.2;
      if (this.rightEyeLight) this.rightEyeLight.intensity = 1.2;
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

    // 5. DYNAMIC HUMAN SPEECH, TONGUE, TEETH & LIPS ARTICULATION ("lips for a moment")
    if (this.lowerMouth && this.upperLip && this.tongue) {
      let targetJawX = 0;
      let targetJawY = 0;
      let targetUpperLipY = 0;
      let targetTongueY = 0;
      let targetTongueZ = 0;
      let targetTongueRotX = 0;

      if (this.expression === "speaking") {
        // 5a. Active Speech Articulation & Viseme Modulation:
        // Fluid conversational phoneme sequences (open vowels, labials, dentals, lingual consonants)
        const speechFreq = 13.5;
        const viseme1 = Math.sin(time * speechFreq);
        const viseme2 = Math.cos(time * (speechFreq * 0.72));
        const viseme3 = Math.sin(time * (speechFreq * 0.48));

        // Jaw drops downward and moves slightly forward to articulate syllables
        const jawDrop = Math.max(0, viseme1 * 0.16 + viseme2 * 0.08 + 0.08);
        targetJawX = jawDrop;
        targetJawY = -jawDrop * 0.025;

        // Upper lip elevates slightly, exposing the upper enamel incisors
        targetUpperLipY = Math.max(0, viseme2) * 0.007;

        // Active muscular tongue articulation:
        // Elevates and touches alveolar ridge / incisors for "t", "d", "n", "l" consonants;
        // drops and retracts for open vowels ("a", "o")
        targetTongueY = Math.sin(time * 11.0) * 0.008 + 0.004;
        targetTongueZ = Math.cos(time * 9.5) * 0.007;
        targetTongueRotX = Math.sin(time * 12.0) * 0.18;

      } else if (this.expression === "happy") {
        // 5b. Warm Charismatic Smile:
        // Lips part wide, exposing clean enamel teeth and tongue tip
        targetJawX = 0.085;
        targetJawY = -0.006;
        targetUpperLipY = 0.008;
        targetTongueY = 0.002;
        targetTongueZ = 0.003;
        targetTongueRotX = 0.05;

      } else if (this.expression === "thinking") {
        // 5c. Deep Contemplative Lip Compression:
        // Subtle pursing of the lips in deep focus
        targetJawX = 0.015;
        targetJawY = 0.002;
        targetUpperLipY = -0.003;
        targetTongueY = -0.002;
        targetTongueZ = -0.004;
        targetTongueRotX = -0.05;

      } else if (this.expression === "surprised") {
        // 5d. Inquisitive Surprised Expression:
        // Parted rounded "O" lips exposing dental arches and oral cavity
        targetJawX = 0.22;
        targetJawY = -0.015;
        targetUpperLipY = 0.010;
        targetTongueY = -0.005;
        targetTongueZ = -0.002;
        targetTongueRotX = 0.10;

      } else {
        // 5e. Idle Natural Resting Breath ("lips for a moment"):
        // Real human beings subtly micro-part their lips during natural breathing.
        // During the peak of inhalation, the lips gently separate ("lips for a moment"),
        // revealing a subtle glistening sliver of upper enamel teeth and resting tongue tip,
        // then softly relax back together during exhalation!
        const breathCycle = Math.sin(time * 2.2);
        const microPart = Math.max(0, breathCycle) * 0.038;
        targetJawX = microPart;
        targetJawY = -microPart * 0.012;
        targetUpperLipY = microPart * 0.003;
        targetTongueY = Math.sin(time * 2.2) * 0.0015;
        targetTongueZ = 0;
        targetTongueRotX = 0;
      }

      // Organic kinematic smoothing with tissue elasticity damping
      const mouthAlpha = Math.min(1.0, delta * 16.0);
      this.lowerMouth.rotation.x += (targetJawX - this.lowerMouth.rotation.x) * mouthAlpha;
      this.lowerMouth.position.y += (targetJawY - this.lowerMouth.position.y) * mouthAlpha;
      this.upperLip.position.y += (targetUpperLipY - this.upperLip.position.y) * mouthAlpha;
      this.tongue.position.y += (targetTongueY - this.tongue.position.y) * mouthAlpha;
      this.tongue.position.z += (targetTongueZ - this.tongue.position.z) * mouthAlpha;
      this.tongue.rotation.x += (targetTongueRotX - this.tongue.rotation.x) * mouthAlpha;
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

      // Inquisitive Contemplative Arm Gestures during Thinking (arms naturally outside body)
      if (this.expression === "thinking" && !this.currentAction) {
        targetLeft.upper = { x: 0.48 + breathe, y: 0.24, z: -0.28 };
        targetLeft.fore = { x: -1.82, y: 0.18, z: 0.08 };
        targetLeft.hand = { x: -0.10, y: 0.38, z: 0.14 };
        leftFingersTarget = 0.32; // gently curled fingers near chin
      } else if (this.expression === "speaking" && !this.currentAction) {
        // Conversational Explaining Gesture during Speech Streaming (gesturing outward from body)
        const talkWave = Math.sin(time * 5.0) * 0.14;
        targetRight.upper = { x: 0.32 + talkWave * 0.4, y: -0.12, z: 0.28 };
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
        // Distinct Farewell "Bye-Bye" Animation:
        // Mid-height forward arm stance with signature finger-curling fluttering wave & warm head tilt
        // Step 1 (0.0s - 0.6s): Right hand raises forward to chest/shoulder height with open palm facing user
        // Step 2 (0.6s - 2.6s): Hand rocks gently while fingers flutter in a distinct rhythmic "bye-bye" wave
        // Step 3 (2.6s - 3.2s): Hand lowers softly back to idle stance
        if (this.actionTimer < 0.6) {
          // Phase 1: Smooth lift forward to chest/shoulder level
          targetRight.upper = { x: -0.79, y: -0.62, z: 1.46 };
          targetRight.fore = { x: -0.40, y: -1.84, z: 1.35 };
          targetRight.hand = { x: 0.79, y: -0.68, z: -0.42 };
          rightFingersTarget = 0.08;
          targetHead.z = -0.10;
          targetHead.x = -0.05;
        } else if (this.actionTimer < 2.6) {
          // Phase 2: Distinct Farewell Wave — gentle hand sway + signature finger flutter ("bye-bye" 👋)
          const byeWave = Math.sin((this.actionTimer - 0.6) * 5.0) * 0.25;
          const fingerFlutter = Math.sin((this.actionTimer - 0.6) * 7.5) * 0.28;
          targetRight.upper = { x: -0.79, y: -0.62, z: 1.46 };
          targetRight.fore = { x: -0.40, y: -1.84, z: 1.35 + byeWave * 0.20 };
          targetRight.hand = { x: 0.79, y: -0.68, z: -0.42 + byeWave };
          rightFingersTarget = 0.20 + fingerFlutter; // Continuous rhythmic finger wave
          targetHead.z = -0.14 + byeWave * 0.04; // Kind affectionate head tilt
          targetHead.x = -0.06;
        } else {
          // Phase 3: Lower smoothly back down
          if (this.actionTimer > 3.2) {
            this.endAction();
          }
        }

        // Left arm in relaxed gentlemanly resting posture
        targetLeft.upper = { x: 0.12, y: 0.0, z: -0.15 };
        targetLeft.fore = { x: -0.85, y: -0.35, z: 0.0 };
        targetLeft.hand = { x: -0.10, y: -0.20, z: 0.0 };
      } else if (this.currentAction === "hifi") {
        this.actionTimer += delta;
        // Step-by-Step High-Five:
        // Right hand reaches distinctly FORWARD toward the user/camera (Z = 0.50, Y = 0.70, X = 0.55)
        if (this.hifiSlapped) {
          this.hifiSlapTimer += delta;
          // Kinetic physical recoil from slap with damped harmonic recovery
          const recoil = Math.sin(Math.min(Math.PI, this.hifiSlapTimer * 7.0)) * Math.exp(-this.hifiSlapTimer * 2.2) * 0.40;
          targetRight.upper = { x: 0.44 - recoil * 0.40, y: -0.47, z: 2.45 };
          targetRight.fore = { x: -0.98 + recoil * 0.30, y: 0.18, z: 0.65 };
          targetRight.hand = { x: 1.63, y: -0.68, z: 1.03 };
          rightFingersTarget = 0.02;

          targetLeft.upper = { x: -0.18, y: 0.0, z: -0.22 };
          targetHead.x = -recoil * 0.18;

          if (this.hifiSlapTimer > 0.85) {
            this.endAction();
          }
        } else {
          // Right hand held high, reaching FORWARD toward the user/camera, palm facing flat forward
          targetRight.upper = { x: 0.44, y: -0.47, z: 2.45 }; // Upper arm extends forward & out
          targetRight.fore = { x: -0.98, y: 0.18, z: 0.65 };  // Forearm reaches forward into screen at Z=0.50
          targetRight.hand = { x: 1.63, y: -0.68, z: 1.03 };  // Hand upright, flat palm facing user
          rightFingersTarget = -0.05; // Flat open high-five palm

          targetLeft.upper = { x: -0.15, y: 0.0, z: -0.20 };   // Braced athletic stance outside body
          targetLeft.fore = { x: -0.65, y: -0.35, z: 0.0 };
          targetLeft.hand = { x: 0.0, y: -0.30, z: 0.0 };
          leftFingersTarget = 0.20;

          targetHead.x = 0.05;

          if (this.actionTimer > 2.6) {
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
          // Steps 1 & 2: Right hand goes directly to touch the right ear with elbow flared OUTSIDE body
          targetRight.upper = { x: -0.12, y: 0.17, z: 2.48 };
          targetRight.fore = { x: -1.20, y: -0.03, z: 1.41 };
          targetRight.hand = { x: -0.13, y: 0.07, z: 0.53 }; // fingertips touch right ear directly
          rightFingersTarget = 0.0; // Pinned flat fingers touching ear

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

        if (this.actionTimer > 2.4) {
          this.endAction();
        }
      } else if (this.expression === "speaking") {
        // Conversational Gesturing: Both hands articulate with natural speech rhythm outside body
        const wave1 = Math.sin(time * 3.8) * 0.16;
        const wave2 = Math.cos(time * 3.2) * 0.14;
        targetRight.upper = { x: 0.32 + wave1 * 0.4, y: -0.12, z: 0.25 };
        targetRight.fore = { x: -1.25 + wave1, y: -0.25, z: 0.0 };
        targetRight.hand = { x: 0.10, y: -0.30 + wave1 * 0.6, z: 0.0 };

        targetLeft.upper = { x: 0.30 + wave2 * 0.4, y: 0.12, z: -0.25 };
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

      // 7. Realistic 3-Joint Human Finger Articulation (MCP, PIP, DIP Synergy + Splay)
      const updateHumanFingers = (fingerList, baseTarget, isSalute, isHighFive) => {
        fingerList.forEach((f) => {
          const ud = f.userData;
          if (!ud) return;

          if (ud.isThumb) {
            // Human Thumb Kinematics
            if (isSalute) {
              // Military salute: thumb aligned cleanly along index finger
              const tRotZ = ud.side === "left" ? -0.22 : 0.22;
              f.rotation.z += (tRotZ - f.rotation.z) * alpha;
              f.rotation.x += (0.10 - f.rotation.x) * alpha;
              if (ud.ip) ud.ip.rotation.x += (0.05 - ud.ip.rotation.x) * alpha;
            } else if (isHighFive) {
              // High-Five: thumb abducted wide away from fingers
              const tRotZ = ud.side === "left" ? 0.18 : -0.18;
              f.rotation.z += (tRotZ - f.rotation.z) * alpha;
              f.rotation.x += (0.16 - f.rotation.x) * alpha;
              if (ud.ip) ud.ip.rotation.x += (0.0 - ud.ip.rotation.x) * alpha;
            } else {
              // Natural thumb curl toward palm center
              const tRotZ = ud.baseRotZ + (baseTarget > 0.15 ? (ud.side === "left" ? -0.12 : 0.12) * baseTarget : 0);
              f.rotation.z += (tRotZ - f.rotation.z) * alpha;
              const tRotX = ud.baseRotX - baseTarget * 0.45;
              f.rotation.x += (tRotX - f.rotation.x) * alpha;
              if (ud.ip) {
                const ipTarget = -Math.max(0, baseTarget * 0.75);
                ud.ip.rotation.x += (ipTarget - ud.ip.rotation.x) * alpha;
              }
            }
          } else {
            // 4 Articulated Human Fingers (Index, Middle, Ring, Pinky)
            // Natural resting cascade: pinky curls slightly more than index
            const restCascade = baseTarget > 0.05 ? ud.index * 0.035 : 0;
            const curl = baseTarget + restCascade;

            // Rotation around X: negative curls forward into palm (+Z)
            const mcpRotX = -curl;
            const pipRotX = -curl * 1.20;
            const dipRotX = -curl * 0.78;

            f.rotation.x += (mcpRotX - f.rotation.x) * alpha;

            // Abduction / Adduction (finger splay)
            let splay = ud.baseSpread;
            if (isSalute) {
              splay = 0; // Pinned straight and tight together
            } else if (isHighFive) {
              splay = ud.baseSpread * 1.45; // Gracefully fanned open for high five
            } else if (baseTarget > 0.35) {
              splay = ud.baseSpread * 0.25; // Fingers converge when closing into a fist
            }
            f.rotation.z += (splay - f.rotation.z) * alpha;

            // Hierarchical PIP and DIP joint flexion
            if (ud.pip) {
              ud.pip.rotation.x += (pipRotX - ud.pip.rotation.x) * alpha;
            }
            if (ud.dip) {
              ud.dip.rotation.x += (dipRotX - ud.dip.rotation.x) * alpha;
            }
          }
        });
      };

      const isRightSalute = this.currentAction === "salute";
      const isRightHighFive = this.currentAction === "hifi";
      updateHumanFingers(this.leftFingers, leftFingersTarget, false, false);
      updateHumanFingers(this.rightFingers, rightFingersTarget, isRightSalute, isRightHighFive);
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
