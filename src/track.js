import * as THREE from 'three';

/**
 * 3D Dynamic Track & Environment System
 * Generates elongated tracks with distinct phase visual identities:
 * Level 1: Deserted Suburbs (Sepia dusk, damaged asphalt, flickering beacons)
 * Level 2: Toxic Highway (Acid green sludge, biohazard yellow rails, radioactive beacons)
 * Level 3: Industrial Sector 7 (Crimson emergency corridors, heavy steel railings, hazard stripes)
 * Level 4: The Citadel Climax (Void violet storm, military runway lights, emergency extraction helipad)
 */
export class Track {
  constructor(scene, levelConfig) {
    this.scene = scene;
    this.config = levelConfig;
    this.trackLength = levelConfig.trackLength || 520;
    this.trackWidth = levelConfig.trackWidth || 11.2;
    this.levelId = levelConfig.id || 1;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildTrack();
    this.buildScenery();
    this.buildFinishLine();
  }

  buildTrack() {
    // 1. Road Geometry
    const roadGeo = new THREE.PlaneGeometry(this.trackWidth, this.trackLength, 1, 64);
    roadGeo.rotateX(-Math.PI / 2);

    // Procedural Road Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Level-specific base colors
    let baseColor = '#0a0f1d';
    let gridColor = 'rgba(0, 247, 255, 0.08)';
    let dashColor = 'rgba(0, 247, 255, 0.4)';
    let railNeonColor = 0x00f7ff;

    if (this.levelId === 2) {
      baseColor = '#051810';
      gridColor = 'rgba(52, 211, 153, 0.08)';
      dashColor = 'rgba(52, 211, 153, 0.4)';
      railNeonColor = 0x10b981;
    } else if (this.levelId === 3) {
      baseColor = '#180709';
      gridColor = 'rgba(239, 68, 68, 0.08)';
      dashColor = 'rgba(245, 158, 11, 0.45)';
      railNeonColor = 0xef4444;
    } else if (this.levelId === 4) {
      baseColor = '#10041a';
      gridColor = 'rgba(192, 132, 252, 0.09)';
      dashColor = 'rgba(192, 132, 252, 0.5)';
      railNeonColor = 0xa855f7;
    }

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 2;
    for (let y = 0; y < canvas.height; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Center dash lines
    ctx.strokeStyle = dashColor;
    ctx.lineWidth = 8;
    ctx.setLineDash([40, 40]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    const roadTex = new THREE.CanvasTexture(canvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, this.trackLength / 18);

    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: 0.65,
      metalness: 0.2
    });

    this.road = new THREE.Mesh(roadGeo, roadMat);
    this.road.position.set(0, 0, -this.trackLength / 2);
    this.road.receiveShadow = true;
    this.group.add(this.road);

    // 2. Heavy-Duty Side Rails
    const railGeo = new THREE.BoxGeometry(0.35, 0.7, this.trackLength);
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2
    });

    const lRail = new THREE.Mesh(railGeo, railMat);
    lRail.position.set(-this.trackWidth / 2 - 0.18, 0.35, -this.trackLength / 2);
    const rRail = new THREE.Mesh(railGeo, railMat);
    rRail.position.set(this.trackWidth / 2 + 0.18, 0.35, -this.trackLength / 2);
    this.group.add(lRail, rRail);

    // Glowing Neon Edge Strip
    const stripGeo = new THREE.BoxGeometry(0.12, 0.12, this.trackLength);
    const stripMat = new THREE.MeshBasicMaterial({ color: railNeonColor });

    const lStrip = new THREE.Mesh(stripGeo, stripMat);
    lStrip.position.set(-this.trackWidth / 2, 0.7, -this.trackLength / 2);
    const rStrip = new THREE.Mesh(stripGeo, stripMat);
    rStrip.position.set(this.trackWidth / 2, 0.7, -this.trackLength / 2);
    this.group.add(lStrip, rStrip);

    // 3. Ground Terrain
    const groundGeo = new THREE.PlaneGeometry(180, this.trackLength + 120);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      color: this.config.atmosphere?.groundColor || 0x070b14,
      roughness: 0.95,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, -0.4, -this.trackLength / 2);
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  buildScenery() {
    let beaconColor = 0x8338ec;
    if (this.levelId === 2) beaconColor = 0x10b981;
    if (this.levelId === 3) beaconColor = 0xef4444;
    if (this.levelId === 4) beaconColor = 0xc084fc;

    const pylonGeo = new THREE.CylinderGeometry(0.2, 0.5, 4.5, 6);
    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const beaconMat = new THREE.MeshBasicMaterial({ color: beaconColor });
    const beaconGeo = new THREE.SphereGeometry(0.35, 8, 8);

    const step = 32;
    for (let z = -15; z > -this.trackLength + 25; z -= step) {
      // Left side pylon
      const lPylon = new THREE.Mesh(pylonGeo, pylonMat);
      lPylon.position.set(-this.trackWidth / 2 - 3.8, 2.25, z);
      const lBeacon = new THREE.Mesh(beaconGeo, beaconMat);
      lBeacon.position.set(-this.trackWidth / 2 - 3.8, 4.7, z);

      // Right side pylon
      const rPylon = new THREE.Mesh(pylonGeo, pylonMat);
      rPylon.position.set(this.trackWidth / 2 + 3.8, 2.25, z);
      const rBeacon = new THREE.Mesh(beaconGeo, beaconMat);
      rBeacon.position.set(this.trackWidth / 2 + 3.8, 4.7, z);

      this.group.add(lPylon, lBeacon, rPylon, rBeacon);
    }
  }

  buildFinishLine() {
    const finishZ = -this.trackLength + 10;
    this.finishZ = finishZ;

    // Checkered line on road
    const checkCanvas = document.createElement('canvas');
    checkCanvas.width = 256;
    checkCanvas.height = 64;
    const ctx = checkCanvas.getContext('2d');
    const cols = 8;
    const rows = 2;
    const cw = checkCanvas.width / cols;
    const ch = checkCanvas.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(c * cw, r * ch, cw, ch);
      }
    }

    const checkTex = new THREE.CanvasTexture(checkCanvas);
    const lineGeo = new THREE.PlaneGeometry(this.trackWidth, 3.5);
    lineGeo.rotateX(-Math.PI / 2);
    const lineMat = new THREE.MeshBasicMaterial({ map: checkTex });
    const finishLineMesh = new THREE.Mesh(lineGeo, lineMat);
    finishLineMesh.position.set(0, 0.02, finishZ);
    this.group.add(finishLineMesh);

    // Arch structure
    const archH = 6.2;
    const archGeo = new THREE.BoxGeometry(0.9, archH, 0.9);
    const archMat = new THREE.MeshStandardMaterial({
      color: this.levelId === 4 ? 0x00f7ff : 0xffbe0b,
      metalness: 0.9,
      roughness: 0.2
    });

    const lArch = new THREE.Mesh(archGeo, archMat);
    lArch.position.set(-this.trackWidth / 2 - 0.45, archH / 2, finishZ);

    const rArch = new THREE.Mesh(archGeo, archMat);
    rArch.position.set(this.trackWidth / 2 + 0.45, archH / 2, finishZ);

    const topArchGeo = new THREE.BoxGeometry(this.trackWidth + 1.8, 1.1, 0.9);
    const topArch = new THREE.Mesh(topArchGeo, archMat);
    topArch.position.set(0, archH + 0.55, finishZ);

    this.group.add(lArch, rArch, topArch);

    // Banner Text
    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 512;
    bannerCanvas.height = 128;
    const bCtx = bannerCanvas.getContext('2d');
    bCtx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    bCtx.fillRect(0, 0, 512, 128);
    bCtx.strokeStyle = this.levelId === 4 ? '#00f7ff' : '#ffbe0b';
    bCtx.lineWidth = 6;
    bCtx.strokeRect(6, 6, 500, 116);
    bCtx.fillStyle = this.levelId === 4 ? '#00f7ff' : '#ffbe0b';
    bCtx.font = '900 60px "Outfit", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';
    bCtx.shadowColor = bCtx.fillStyle;
    bCtx.shadowBlur = 15;

    let bannerText = '🏆 CHEGADA 🏆';
    if (this.levelId === 4) bannerText = '🚁 ZONA DE EXTRAÇÃO 🚁';
    bCtx.fillText(bannerText, 256, 64);

    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const bannerGeo = new THREE.PlaneGeometry(7.0, 1.7);
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, archH + 0.55, finishZ + 0.5);
    this.group.add(banner);

    // If Level 4: Add Rescue Helicopter with Searchlight on the extraction pad!
    if (this.levelId === 4) {
      this.buildRescueHelicopter(finishZ - 12);
    }
  }

  buildRescueHelicopter(z) {
    const heliGroup = new THREE.Group();
    heliGroup.position.set(0, 4.0, z);

    // Fuselage
    const fuseGeo = new THREE.BoxGeometry(2.5, 1.8, 4.2);
    const fuseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const fuselage = new THREE.Mesh(fuseGeo, fuseMat);
    heliGroup.add(fuselage);

    // Cockpit glass
    const glassGeo = new THREE.BoxGeometry(2.2, 1.2, 1.4);
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff, transparent: true, opacity: 0.7 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 0.2, 1.8);
    heliGroup.add(glass);

    // Rotor blades
    const rotorGeo = new THREE.BoxGeometry(9.0, 0.1, 0.4);
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    this.heliRotor = new THREE.Mesh(rotorGeo, rotorMat);
    this.heliRotor.position.y = 1.2;
    heliGroup.add(this.heliRotor);

    // Searchlight pointing towards incoming player
    const light = new THREE.SpotLight(0x00f7ff, 6, 60, Math.PI / 6, 0.5);
    light.position.set(0, 0, 1.5);
    light.target.position.set(0, 0, 15);
    heliGroup.add(light);
    heliGroup.add(light.target);

    this.group.add(heliGroup);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
