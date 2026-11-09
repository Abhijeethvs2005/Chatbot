/**
 * NOVA-3D Robot System Engine (v3.0 Mecha / Robotics Lab Edition)
 * Articulated procedural 3D Robot System featuring:
 * - Multi-segment mecha chassis with carbon-fiber accents
 * - Rotating dual gyroscope rings around quantum core reactor
 * - Dynamic OLED canvas visor with expressive states
 * - Inverse kinematics head & eye cursor tracking
 * - Floating magnetic hands with energy force-fields
 * - Dual ion plasma thruster exhausts with dynamic particles
 * - 3D holographic HUD diagnostic nodes
 * - Theme switcher: Cyber Cyan, Amber Hazard, Quantum Violet, Cleanroom White
 * Built by a student roboticist for students.
 */

class Robot3D {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) {
      console.error("Canvas container not found:", canvasContainerId);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Groups
    this.robotGroup = null;
    this.headGroup = null;
    this.torsoGroup = null;
    this.leftHand = null;
    this.rightHand = null;
    this.gyroGroup = null;
    this.holoHudGroup = null;
    this.thrusterParticles = null;
    this.ambientNodes = null;

    // Visor canvas
    this.visorMesh = null;
    this.visorCanvas = null;
    this.visorCtx = null;
    this.visorTexture = null;
    this.visorExpression = "idle";
    this.visorFrame = 0;

    // Subsystems & Meshes for dynamic theming
    this.themeMaterials = {};
    this.currentTheme = "cyber_cyan";
    this.coreMesh = null;
    this.coreLight = null;
    this.thrusterLight = null;
    this.gyroRing1 = null;
    this.gyroRing2 = null;
    this.leftAntenna = null;
    this.rightAntenna = null;

    // Animation & State
    this.clock = new THREE.Clock();
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isOverdrive = false;
    this.isPoked = false;
    this.spinAngle = 0;
    this.cameraMode = "command"; // 'command', 'core', 'orbit'

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth / 2;
    const height = this.container.clientHeight || window.innerHeight;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    this.camera.position.set(0, 0.8, 5.4);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.setupLighting();

    // 5. Materials & Themes
    this.initMaterials();

    // 6. Dynamic Visor Canvas
    this.initVisorCanvas();

    // 7. Build Robot System
    this.buildRobotSystem();

    // 8. 3D Holographic Diagnostic HUD
    this.buildHoloHUD();

    // 9. Ambient Particle Field
    this.buildAmbientNodes();

    // 10. Event Listeners
    window.addEventListener("resize", () => this.onResize());
    window.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.renderer.domElement.addEventListener("click", () => this.pokeRobot());

    // 11. Render Loop
    this.animate();
  }

  setupLighting() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xdbeafe, 0.9);
    this.scene.add(this.ambientLight);

    // Key front light
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.keyLight.position.set(5, 7, 6);
    this.scene.add(this.keyLight);

    // Cyber Rim accent light
    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    this.rimLight.position.set(-6, 4, -4);
    this.scene.add(this.rimLight);

    // Underside bounce light
    this.bounceLight = new THREE.DirectionalLight(0x6366f1, 0.8);
    this.bounceLight.position.set(0, -4, 3);
    this.scene.add(this.bounceLight);

    // Core point light
    this.coreLight = new THREE.PointLight(0x38bdf8, 2.5, 4);
    this.coreLight.position.set(0, 0.15, 0.5);
    this.scene.add(this.coreLight);

    // Thruster point light
    this.thrusterLight = new THREE.PointLight(0x06b6d4, 3.0, 5);
    this.thrusterLight.position.set(0, -0.7, 0);
    this.scene.add(this.thrusterLight);
  }

  initMaterials() {
    // Cyber Cyan Theme
    this.themePresets = {
      cyber_cyan: {
        armorColor: 0xf8fafc,
        frameColor: 0x0f172a,
        accentColor: 0x38bdf8,
        emissiveColor: 0x0284c7,
        coreColor: 0x38bdf8,
        lightColor: 0x38bdf8,
        name: "Cyber Cyan"
      },
      amber_hazard: {
        armorColor: 0x1e293b,
        frameColor: 0x0a0f1d,
        accentColor: 0xfbbf24,
        emissiveColor: 0xd97706,
        coreColor: 0xf59e0b,
        lightColor: 0xf59e0b,
        name: "Amber Industrial"
      },
      quantum_violet: {
        armorColor: 0x18181b,
        frameColor: 0x09090b,
        accentColor: 0xc084fc,
        emissiveColor: 0x9333ea,
        coreColor: 0xa855f7,
        lightColor: 0xa855f7,
        name: "Quantum Void"
      },
      cleanroom_white: {
        armorColor: 0xffffff,
        frameColor: 0x334155,
        accentColor: 0x2563eb,
        emissiveColor: 0x1d4ed8,
        coreColor: 0x60a5fa,
        lightColor: 0x3b82f6,
        name: "Cleanroom White"
      }
    };

    const preset = this.themePresets[this.currentTheme];

    this.armorMaterial = new THREE.MeshStandardMaterial({
      color: preset.armorColor,
      roughness: 0.18,
      metalness: 0.25,
    });

    this.frameMaterial = new THREE.MeshStandardMaterial({
      color: preset.frameColor,
      roughness: 0.45,
      metalness: 0.8,
    });

    this.accentGlowMaterial = new THREE.MeshStandardMaterial({
      color: preset.accentColor,
      emissive: preset.emissiveColor,
      emissiveIntensity: 1.0,
      roughness: 0.1,
      metalness: 0.4,
    });

    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a1128,
      transmission: 0.6,
      opacity: 0.9,
      transparent: true,
      roughness: 0.05,
      ior: 1.5,
    });
  }

  setTheme(themeKey) {
    if (!this.themePresets[themeKey]) return;
    this.currentTheme = themeKey;
    const p = this.themePresets[themeKey];

    this.armorMaterial.color.setHex(p.armorColor);
    this.frameMaterial.color.setHex(p.frameColor);
    this.accentGlowMaterial.color.setHex(p.accentColor);
    this.accentGlowMaterial.emissive.setHex(p.emissiveColor);

    if (this.coreLight) this.coreLight.color.setHex(p.coreColor);
    if (this.thrusterLight) this.thrusterLight.color.setHex(p.lightColor);
    if (this.rimLight) this.rimLight.color.setHex(p.lightColor);

    this.updateVisorFace(this.visorExpression);
  }

  initVisorCanvas() {
    this.visorCanvas = document.createElement("canvas");
    this.visorCanvas.width = 512;
    this.visorCanvas.height = 256;
    this.visorCtx = this.visorCanvas.getContext("2d");

    this.visorTexture = new THREE.CanvasTexture(this.visorCanvas);
    this.visorTexture.minFilter = THREE.LinearFilter;
    this.visorTexture.magFilter = THREE.LinearFilter;
    this.updateVisorFace("idle");
  }

  updateVisorFace(expression) {
    const ctx = this.visorCtx;
    const w = this.visorCanvas.width;
    const h = this.visorCanvas.height;
    const preset = this.themePresets[this.currentTheme];
    const hexAccent = "#" + preset.accentColor.toString(16).padStart(6, "0");

    // Clear background
    ctx.fillStyle = "#050914";
    ctx.fillRect(0, 0, w, h);

    // Hexagonal / grid scan lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = hexAccent;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = hexAccent;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";

    const t = this.visorFrame;
    const eyeY = h * 0.48;
    const leftX = w * 0.33;
    const rightX = w * 0.67;

    if (expression === "idle") {
      // Natural blink
      const blink = Math.sin(t * 0.04) > 0.95 ? 3 : 26;
      this.drawPill(ctx, leftX - 22, eyeY - blink, 44, blink * 2, 18);
      this.drawPill(ctx, rightX - 22, eyeY - blink, 44, blink * 2, 18);

      // Cute robotic smile
      ctx.beginPath();
      ctx.arc(w / 2, eyeY + 44, 18, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();

    } else if (expression === "happy") {
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(leftX, eyeY + 8, 30, 1.15 * Math.PI, 1.85 * Math.PI, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rightX, eyeY + 8, 30, 1.15 * Math.PI, 1.85 * Math.PI, false);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w / 2, eyeY + 34, 28, 0.1 * Math.PI, 0.9 * Math.PI, false);
      ctx.stroke();

    } else if (expression === "thinking" || this.isOverdrive) {
      // Neural Matrix Scanner Rings
      const angle = t * 0.15;
      ctx.lineWidth = 7;
      [leftX, rightX].forEach((cx) => {
        ctx.beginPath();
        ctx.arc(cx, eyeY, 28, angle, angle + 1.2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, eyeY, 14, -angle * 1.5, -angle * 1.5 + Math.PI);
        ctx.stroke();
      });

      // Computational wave mouth
      ctx.beginPath();
      for (let x = w * 0.4; x <= w * 0.6; x += 4) {
        const my = eyeY + 46 + Math.sin(x * 0.25 + t * 0.3) * 6;
        if (x === w * 0.4) ctx.moveTo(x, my);
        else ctx.lineTo(x, my);
      }
      ctx.stroke();

    } else if (expression === "speaking") {
      // Audio spectrum visualizer
      const wave = Math.abs(Math.sin(t * 0.35)) * 22 + 12;
      this.drawPill(ctx, leftX - 20, eyeY - wave, 40, wave * 2, 16);
      this.drawPill(ctx, rightX - 20, eyeY - wave, 40, wave * 2, 16);

      const bars = 9;
      const barW = 5;
      const spacing = 8;
      const startX = w / 2 - (bars * spacing) / 2;
      ctx.fillStyle = hexAccent;

      for (let i = 0; i < bars; i++) {
        const barH = 6 + Math.abs(Math.sin(t * 0.45 + i * 0.7)) * 28;
        ctx.fillRect(startX + i * spacing, eyeY + 46 - barH / 2, barW, barH);
      }

    } else if (expression === "surprised") {
      ctx.beginPath();
      ctx.arc(leftX, eyeY, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rightX, eyeY, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(w / 2, eyeY + 46, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    if (this.visorTexture) {
      this.visorTexture.needsUpdate = true;
    }
  }

  drawPill(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  buildRobotSystem() {
    this.robotGroup = new THREE.Group();
    this.scene.add(this.robotGroup);

    // 1. HEAD UNIT
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.78, 0);

    // Helmet outer shell
    const helmetGeo = new THREE.SphereGeometry(0.74, 36, 36);
    helmetGeo.scale(1, 0.94, 0.94);
    const helmetMesh = new THREE.Mesh(helmetGeo, this.armorMaterial);
    helmetMesh.castShadow = true;
    this.headGroup.add(helmetMesh);

    // Visor Glass Bezel (Carbon frame)
    const visorBezelGeo = new THREE.CylinderGeometry(0.56, 0.56, 0.46, 32, 1, false, -Math.PI / 2.3, (Math.PI * 2) / 2.3);
    const visorBezelMesh = new THREE.Mesh(visorBezelGeo, this.frameMaterial);
    visorBezelMesh.rotation.y = Math.PI / 2;
    visorBezelMesh.position.set(0, 0.05, 0.26);
    this.headGroup.add(visorBezelMesh);

    // Dynamic Visor Screen Mesh
    const visorGeo = new THREE.PlaneGeometry(0.86, 0.5, 16, 16);
    const vPos = visorGeo.attributes.position;
    for (let i = 0; i < vPos.count; i++) {
      const vx = vPos.getX(i);
      vPos.setZ(i, -Math.pow(vx, 2) * 0.38);
    }
    visorGeo.computeVertexNormals();

    const visorMat = new THREE.MeshBasicMaterial({
      map: this.visorTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    this.visorMesh = new THREE.Mesh(visorGeo, visorMat);
    this.visorMesh.position.set(0, 0.05, 0.6);
    this.headGroup.add(this.visorMesh);

    // Articulated Radar Antennas on Head
    this.leftAntenna = this.createAntenna(-0.76);
    this.rightAntenna = this.createAntenna(0.76);
    this.headGroup.add(this.leftAntenna);
    this.headGroup.add(this.rightAntenna);

    this.robotGroup.add(this.headGroup);

    // 2. TORSO / MECHA CHASSIS
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0, 0);

    // Inner Carbon Core
    const innerFrame = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.88, 24), this.frameMaterial);
    this.torsoGroup.add(innerFrame);

    // Outer Armor Plates
    const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.72, 0.16), this.armorMaterial);
    frontPlate.position.set(0, 0.04, 0.26);
    this.torsoGroup.add(frontPlate);

    // Shoulder Armor Pods
    [-0.56, 0.56].forEach((x) => {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), this.armorMaterial);
      shoulder.position.set(x, 0.36, 0);
      shoulder.scale.set(1.2, 0.8, 1);
      this.torsoGroup.add(shoulder);

      // Energy conduit tube
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x * 0.7, 0.28, 0.1),
        new THREE.Vector3(x * 0.4, 0.18, 0.32),
        new THREE.Vector3(x * 0.2, 0.12, 0.42)
      ]);
      const tubeGeo = new THREE.TubeGeometry(curve, 12, 0.024, 8, false);
      const conduit = new THREE.Mesh(tubeGeo, this.accentGlowMaterial);
      this.torsoGroup.add(conduit);
    });

    // Quantum Core Reactor
    const coreHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 32), this.frameMaterial);
    coreHousing.rotation.x = Math.PI / 2;
    coreHousing.position.set(0, 0.14, 0.36);
    this.torsoGroup.add(coreHousing);

    const coreGeo = new THREE.CircleGeometry(0.15, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.coreMesh.position.set(0, 0.14, 0.41);
    this.torsoGroup.add(this.coreMesh);

    // Rotating Gyroscope Rings around Reactor
    this.gyroGroup = new THREE.Group();
    this.gyroGroup.position.set(0, 0.14, 0.42);

    this.gyroRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 12, 32), this.accentGlowMaterial);
    this.gyroRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.012, 12, 32), this.frameMaterial);
    this.gyroGroup.add(this.gyroRing1);
    this.gyroGroup.add(this.gyroRing2);
    this.torsoGroup.add(this.gyroGroup);

    this.robotGroup.add(this.torsoGroup);

    // 3. FLOATING MAGNETIC HANDS
    this.leftHand = this.createHand(-1.0);
    this.rightHand = this.createHand(1.0);
    this.robotGroup.add(this.leftHand);
    this.robotGroup.add(this.rightHand);

    // 4. DUAL ION THRUSTER ENGINES
    this.buildThrusters();
  }

  createAntenna(x) {
    const group = new THREE.Group();
    group.position.set(x, 0.06, 0);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.14, 24), this.frameMaterial);
    base.rotation.z = Math.PI / 2;
    group.add(base);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 16, 32), this.accentGlowMaterial);
    ring.rotation.y = Math.PI / 2;
    group.add(ring);

    // Mini antenna prong
    const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 12), this.frameMaterial);
    prong.position.set(0, 0.18, 0);
    prong.rotation.z = x > 0 ? -0.2 : 0.2;
    group.add(prong);

    return group;
  }

  createHand(xPos) {
    const handGroup = new THREE.Group();
    handGroup.position.set(xPos, 0.14, 0);

    // Floating magnetic palm
    const palm = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 24), this.armorMaterial);
    palm.scale.set(1, 0.78, 1.25);
    handGroup.add(palm);

    // Glowing magnetic force-field cuff
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 16, 24), this.accentGlowMaterial);
    cuff.position.set(0, 0.08, 0);
    cuff.rotation.x = Math.PI / 2;
    handGroup.add(cuff);

    // Magnetic force-field aura sphere
    const auraGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      wireframe: true
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    handGroup.add(aura);

    // Articulated fingers
    [-0.07, 0.07].forEach((fOffset) => {
      const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.09, 12), this.armorMaterial);
      finger.position.set(fOffset, -0.06, 0.18);
      finger.rotation.x = 0.45;
      handGroup.add(finger);
    });

    return handGroup;
  }

  buildThrusters() {
    const thrusterGroup = new THREE.Group();
    thrusterGroup.position.set(0, -0.52, 0);

    // Main anti-grav ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.07, 16, 48), this.accentGlowMaterial);
    ring.rotation.x = Math.PI / 2;
    thrusterGroup.add(ring);

    // Dual exhaust nozzles
    [-0.18, 0.18].forEach((x) => {
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.2, 20), this.frameMaterial);
      nozzle.position.set(x, -0.08, 0);
      thrusterGroup.add(nozzle);
    });

    this.robotGroup.add(thrusterGroup);

    // Dynamic Plasma Particle System
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.45;
      positions[i * 3 + 1] = -0.58 - Math.random() * 0.7;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.45;
      scales[i] = Math.random();
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));

    const material = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.09,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.thrusterParticles = new THREE.Points(geometry, material);
    this.robotGroup.add(this.thrusterParticles);
  }

  buildHoloHUD() {
    this.holoHudGroup = new THREE.Group();

    // Floating 3D holographic brackets & coordinate lines around robot
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });

    // Target reticle
    const circleGeo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const theta = (i / 32) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * 1.5, Math.sin(theta) * 1.5, 0));
    }
    circleGeo.setFromPoints(pts);

    const reticle = new THREE.Line(circleGeo, lineMat);
    reticle.position.set(0, 0.3, -0.4);
    this.holoHudGroup.add(reticle);

    this.scene.add(this.holoHudGroup);
  }

  buildAmbientNodes() {
    const count = 100;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12 + 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });

    this.ambientNodes = new THREE.Points(geo, mat);
    this.scene.add(this.ambientNodes);
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
    if (window.AudioEngine) {
      window.AudioEngine.playRobotChirp();
    }
    setTimeout(() => {
      this.isPoked = false;
      this.setExpression("idle");
    }, 1300);
  }

  setExpression(expr) {
    this.visorExpression = expr;
    this.updateVisorFace(expr);
  }

  triggerOverdrive(durationMs = 2500) {
    this.isOverdrive = true;
    this.setExpression("thinking");
    if (window.AudioEngine) {
      window.AudioEngine.playServoHum();
    }
    setTimeout(() => {
      this.isOverdrive = false;
      this.setExpression("idle");
    }, durationMs);
  }

  setCameraView(viewMode) {
    this.cameraMode = viewMode;
    if (viewMode === "command") {
      this.camera.position.set(0, 0.8, 5.4);
    } else if (viewMode === "core") {
      this.camera.position.set(0, 0.6, 3.2);
    } else if (viewMode === "orbit") {
      this.camera.position.set(2.4, 1.4, 4.6);
      this.camera.lookAt(0, 0.4, 0);
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();
    this.visorFrame++;

    if (this.visorFrame % 3 === 0) {
      this.updateVisorFace(this.visorExpression);
    }

    // Smooth Cursor Following
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    // Inverse Kinematics / Head tracking
    if (this.headGroup) {
      this.headGroup.rotation.y = this.mouse.x * 0.7;
      this.headGroup.rotation.x = -this.mouse.y * 0.45;
    }

    // Body Hovering Motion
    if (this.robotGroup) {
      const hoverSpeed = this.isOverdrive ? 4.5 : 2.2;
      const hoverY = Math.sin(time * hoverSpeed) * (this.isOverdrive ? 0.14 : 0.08);
      this.robotGroup.position.y = hoverY;

      if (this.isPoked) {
        this.spinAngle += delta * 12;
        this.robotGroup.rotation.y = this.spinAngle;
      } else {
        this.robotGroup.rotation.y += (this.mouse.x * 0.28 - this.robotGroup.rotation.y) * 0.06;
        this.robotGroup.rotation.z = -this.mouse.x * 0.06;
      }
    }

    // Rotating Gyroscope Rings around Core
    if (this.gyroRing1 && this.gyroRing2) {
      const gyroSpeed = this.isOverdrive ? 6.0 : 1.8;
      this.gyroRing1.rotation.z += delta * gyroSpeed;
      this.gyroRing2.rotation.x += delta * (gyroSpeed * 0.7);
    }

    // Swivel Antennas
    if (this.leftAntenna && this.rightAntenna) {
      const antennaSwivel = Math.sin(time * 3) * 0.15;
      this.leftAntenna.rotation.x = antennaSwivel;
      this.rightAntenna.rotation.x = -antennaSwivel;
    }

    // Floating Magnetic Hands
    if (this.leftHand && this.rightHand) {
      if (this.visorExpression === "speaking") {
        this.leftHand.position.y = 0.14 + Math.sin(time * 5.2) * 0.14;
        this.rightHand.position.y = 0.14 + Math.cos(time * 5.2) * 0.14;
        this.leftHand.position.z = 0.18 + Math.sin(time * 3.2) * 0.12;
        this.rightHand.position.z = 0.18 + Math.cos(time * 3.2) * 0.12;
      } else if (this.isOverdrive || this.visorExpression === "thinking") {
        this.leftHand.position.x = -0.7 + Math.sin(time * 4) * 0.05;
        this.rightHand.position.x = 0.7 - Math.sin(time * 4) * 0.05;
        this.leftHand.position.y = 0.26;
        this.rightHand.position.y = 0.26;
      } else {
        this.leftHand.position.y = 0.14 + Math.sin(time * 2.2) * 0.07;
        this.rightHand.position.y = 0.14 + Math.sin(time * 2.2 + 1.2) * 0.07;
        this.leftHand.position.x = -1.0;
        this.rightHand.position.x = 1.0;
        this.leftHand.position.z = 0;
        this.rightHand.position.z = 0;
      }
    }

    // Core Pulse & Lighting
    if (this.coreMesh) {
      const coreScale = this.isOverdrive
        ? 1.2 + Math.abs(Math.sin(time * 16)) * 0.6
        : 1.0 + Math.sin(time * 3.5) * 0.18;
      this.coreMesh.scale.set(coreScale, coreScale, 1);
    }
    if (this.coreLight) {
      this.coreLight.intensity = this.isOverdrive ? 4.5 : 2.5 + Math.sin(time * 8) * 0.8;
    }
    if (this.thrusterLight) {
      this.thrusterLight.intensity = this.isOverdrive ? 5.0 : 2.8 + Math.sin(time * 14) * 0.8;
    }

    // Thruster Particle Dynamics
    if (this.thrusterParticles) {
      const pos = this.thrusterParticles.geometry.attributes.position;
      const speed = this.isOverdrive ? 3.5 : 1.9;
      for (let i = 0; i < pos.count; i++) {
        let py = pos.getY(i);
        py -= delta * speed;
        if (py < -1.5) {
          py = -0.58;
          pos.setX(i, (Math.random() - 0.5) * 0.4);
          pos.setZ(i, (Math.random() - 0.5) * 0.4);
        }
        pos.setY(i, py);
      }
      this.thrusterParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Holographic Reticle rotation
    if (this.holoHudGroup) {
      this.holoHudGroup.rotation.z = time * 0.1;
    }

    if (this.ambientNodes) {
      this.ambientNodes.rotation.y = time * 0.025;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.Robot3D = Robot3D;
