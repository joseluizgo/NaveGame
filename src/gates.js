import * as THREE from 'three';

/**
 * Gate System
 * Manages 3D Neon multiplication and arithmetic gates across the track.
 */
let gateIdCounter = 0;

export class GatePair {
  constructor(scene, zPosition, leftConfig, rightConfig) {
    this.scene = scene;
    this.zPosition = zPosition;
    this.group = new THREE.Group();
    this.group.position.z = zPosition;

    // Create Left & Right Gates
    this.leftGate = new Gate(scene, -2.5, leftConfig);
    this.rightGate = new Gate(scene, 2.5, rightConfig);

    this.group.add(this.leftGate.meshGroup);
    this.group.add(this.rightGate.meshGroup);

    this.scene.add(this.group);
  }

  update(dt, playerZ) {
    this.leftGate.update(dt);
    this.rightGate.update(dt);
  }

  destroy() {
    this.scene.remove(this.group);
    this.leftGate.destroy();
    this.rightGate.destroy();
  }
}

export class Gate {
  constructor(scene, xOffset, config) {
    this.scene = scene;
    this.id = ++gateIdCounter;
    this.xOffset = xOffset;
    this.config = config; // { type: 'add'|'multiply'|'sub'|'div', value: 10, isPositive: true }
    this.width = 4.4;
    this.height = 3.2;

    this.meshGroup = new THREE.Group();
    this.meshGroup.position.x = xOffset;

    this.pulseScale = 1.0;
    this.hitCount = 0;
    this.lastTriggerTime = 0;

    this.buildGate();
  }

  buildGate() {
    const isPos = this.config.isPositive;
    const themeColor = isPos ? (this.config.type === 'multiply' ? 0xffbe0b : 0x00f7ff) : 0xff3366;
    const emissiveColor = isPos ? 0x00d2ff : 0xcc0033;

    // 1. Portal Frame Arch (Pillars & Top bar)
    const frameGeo = new THREE.BoxGeometry(0.25, this.height, 0.35);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.2
    });

    const lPillar = new THREE.Mesh(frameGeo, frameMat);
    lPillar.position.set(-this.width / 2, this.height / 2, 0);

    const rPillar = new THREE.Mesh(frameGeo, frameMat);
    rPillar.position.set(this.width / 2, this.height / 2, 0);

    const topBarGeo = new THREE.BoxGeometry(this.width + 0.25, 0.3, 0.35);
    const topBar = new THREE.Mesh(topBarGeo, frameMat);
    topBar.position.set(0, this.height, 0);

    this.meshGroup.add(lPillar, rPillar, topBar);

    // Glowing Neon Border Accents
    const borderMat = new THREE.MeshBasicMaterial({ color: themeColor });
    const lGlow = new THREE.Mesh(new THREE.BoxGeometry(0.08, this.height, 0.4), borderMat);
    lGlow.position.set(-this.width / 2, this.height / 2, 0);

    const rGlow = new THREE.Mesh(new THREE.BoxGeometry(0.08, this.height, 0.4), borderMat);
    rGlow.position.set(this.width / 2, this.height / 2, 0);

    const topGlow = new THREE.Mesh(new THREE.BoxGeometry(this.width, 0.08, 0.4), borderMat);
    topGlow.position.set(0, this.height + 0.15, 0);

    this.meshGroup.add(lGlow, rGlow, topGlow);

    // 2. Translucent Energy Forcefield Barrier
    const shieldGeo = new THREE.PlaneGeometry(this.width - 0.1, this.height - 0.1);
    this.shieldMat = new THREE.MeshStandardMaterial({
      color: themeColor,
      emissive: emissiveColor,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.shield = new THREE.Mesh(shieldGeo, this.shieldMat);
    this.shield.position.set(0, this.height / 2, 0);
    this.meshGroup.add(this.shield);

    // 3. Dynamic High-Res Text Banner (Canvas Texture)
    const textTexture = this.generateTextTexture();
    const bannerGeo = new THREE.PlaneGeometry(2.4, 1.4);
    const bannerMat = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      side: THREE.DoubleSide
    });
    const banner = new THREE.Mesh(bannerGeo, bannerMat);
    banner.position.set(0, this.height / 2 + 0.2, 0.05);
    this.banner = banner;
    this.meshGroup.add(banner);
  }

  generateTextTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');

    const isPos = this.config.isPositive;
    let label = '';
    if (this.config.type === 'multiply') label = `x${this.config.value}`;
    else if (this.config.type === 'add') label = `+${this.config.value}`;
    else if (this.config.type === 'div') label = `÷${this.config.value}`;
    else label = `-${this.config.value}`;

    // Background pill badge
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.fillStyle = isPos ? 'rgba(0, 20, 50, 0.85)' : 'rgba(50, 0, 15, 0.85)';
    ctx.strokeStyle = isPos ? (this.config.type === 'multiply' ? '#ffbe0b' : '#00f7ff') : '#ff3366';
    ctx.lineWidth = 10;

    // Draw rounded rect
    const r = 36;
    const x = 20, y = 20, w = canvas.width - 40, h = canvas.height - 40;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Text Shadow & Glow
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 110px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, canvas.width / 2, canvas.height / 2);
    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  // Trigger pulse animation when hit by bullets
  triggerPulse() {
    this.pulseScale = 1.12;
  }

  update(dt) {
    // Smoothly return pulse scale to 1.0
    if (this.pulseScale > 1.0) {
      this.pulseScale = Math.max(1.0, this.pulseScale - dt * 1.5);
      this.meshGroup.scale.set(this.pulseScale, this.pulseScale, 1.0);
    }

    // Shield subtle glow breathing
    if (this.shieldMat) {
      this.shieldMat.opacity = 0.42 + Math.sin(Date.now() * 0.005) * 0.08;
    }
  }

  // Check collision between a bullet and this gate
  checkBulletCollision(bullet) {
    if (bullet.passedGates.has(this.id)) return false;

    // World position of gate
    const gateWorldPos = new THREE.Vector3();
    this.meshGroup.getWorldPosition(gateWorldPos);

    const bPos = bullet.mesh.position;
    const dz = Math.abs(bPos.z - gateWorldPos.z);

    // If bullet crosses gate Z plane within tolerance
    if (dz < 1.4) {
      const dx = Math.abs(bPos.x - gateWorldPos.x);
      const dy = bPos.y;

      if (dx < this.width / 2 && dy > 0 && dy < this.height) {
        bullet.passedGates.add(this.id);
        this.triggerPulse();
        return true;
      }
    }
    return false;
  }

  // Check collision with player direct crash (if player runs directly into gate pillar)
  checkPlayerCollision(player) {
    const gateWorldPos = new THREE.Vector3();
    this.meshGroup.getWorldPosition(gateWorldPos);

    const dz = Math.abs(player.position.z - gateWorldPos.z);
    if (dz < 1.0) {
      const dx = Math.abs(player.position.x - gateWorldPos.x);
      if (dx < this.width / 2) {
        return true;
      }
    }
    return false;
  }

  destroy() {
    if (this.banner && this.banner.material.map) {
      this.banner.material.map.dispose();
      this.banner.material.dispose();
    }
  }
}
