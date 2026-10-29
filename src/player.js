import * as THREE from 'three';

/**
 * 3D Stylized Player Cannon Rig
 * Features twin plasma barrels with recoil kickback, glowing energy core,
 * hover thrusters, health & ammo resource management, and smooth horizontal interpolation with banking tilt.
 */
export class Player {
  constructor(scene) {
    this.scene = scene;

    // Movement & Track Constraints
    this.laneLimit = 4.8;
    this.targetX = 0;
    this.currentX = 0;
    this.speed = 18; // forward speed in units/sec
    this.tilt = 0;

    // Resource Management (Health & Ammo)
    this.maxHp = 100;
    this.hp = 100;
    this.maxAmmo = 140;
    this.ammo = 140;
    this.invulnTimer = 0;
    this.isDead = false;

    // Shooting Stats
    this.baseFireRate = 8; // shots per second
    this.fireRateMultiplier = 1;
    this.fireTimer = 0;
    this.bulletDamage = 1;
    this.bulletSpread = 1; // 1 = twin parallel, can fan out with powerups

    // Recoil animation state
    this.recoilLeft = 0;
    this.recoilRight = 0;

    this.group = new THREE.Group();
    this.buildModel();
    this.scene.add(this.group);

    this.reset();
  }

  reset() {
    this.group.position.set(0, 0.45, 0);
    this.targetX = 0;
    this.currentX = 0;
    this.tilt = 0;
    this.fireTimer = 0;
    this.fireRateMultiplier = 1;
    this.bulletSpread = 1;
    this.hp = this.maxHp;
    this.ammo = this.maxAmmo;
    this.invulnTimer = 0;
    this.isDead = false;

    if (this.chassisMat) {
      this.chassisMat.color.setHex(0x1e293b);
    }
  }

  setLaneLimit(width) {
    this.laneLimit = (width / 2) - 0.9;
  }

  buildModel() {
    // 1. Main armored chassis (Hexagonal sleek runner base)
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.4, 1.8);
    this.chassisMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25
    });
    this.chassis = new THREE.Mesh(bodyGeo, this.chassisMat);
    this.chassis.castShadow = true;
    this.chassis.receiveShadow = true;
    this.chassis.position.y = 0.2;
    this.group.add(this.chassis);

    // Glowing energy core on chassis top
    const coreGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
    this.coreMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff });
    const core = new THREE.Mesh(coreGeo, this.coreMat);
    core.position.set(0, 0.42, -0.1);
    this.group.add(core);

    // 2. Twin High-Tech Plasma Barrels
    const barrelGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.2, 12);
    barrelGeo.rotateX(-Math.PI / 2); // point forward along -Z

    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.15
    });

    const tipGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.2, 12);
    tipGeo.rotateX(-Math.PI / 2);
    const tipMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff });

    // Left Cannon Group
    this.leftCannon = new THREE.Group();
    const lBarrel = new THREE.Mesh(barrelGeo, barrelMat);
    const lTip = new THREE.Mesh(tipGeo, tipMat);
    lTip.position.z = -0.6;
    this.leftCannon.add(lBarrel, lTip);
    this.leftCannon.position.set(-0.45, 0.35, -0.6);
    this.group.add(this.leftCannon);

    // Right Cannon Group
    this.rightCannon = new THREE.Group();
    const rBarrel = new THREE.Mesh(barrelGeo, barrelMat);
    const rTip = new THREE.Mesh(tipGeo, tipMat);
    rTip.position.z = -0.6;
    this.rightCannon.add(rBarrel, rTip);
    this.rightCannon.position.set(0.45, 0.35, -0.6);
    this.group.add(this.rightCannon);

    // 3. Hover Thruster Jets underneath
    const jetGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.3, 12);
    const jetMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const lJet = new THREE.Mesh(jetGeo, jetMat);
    lJet.position.set(-0.6, 0.05, 0.6);
    const rJet = new THREE.Mesh(jetGeo, jetMat);
    rJet.position.set(0.6, 0.05, 0.6);
    this.group.add(lJet, rJet);

    // Thruster glow cones
    const flameGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
    flameGeo.rotateX(Math.PI);
    this.flameMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff, transparent: true, opacity: 0.8 });
    this.lFlame = new THREE.Mesh(flameGeo, this.flameMat);
    this.lFlame.position.set(-0.6, 0.05, 0.95);
    this.rFlame = new THREE.Mesh(flameGeo, this.flameMat);
    this.rFlame.position.set(0.6, 0.05, 0.95);
    this.group.add(this.lFlame, this.rFlame);

    // Point Light attached to player for glowing futuristic atmosphere
    this.light = new THREE.PointLight(0x00f7ff, 2.5, 10);
    this.light.position.set(0, 1.2, -0.5);
    this.group.add(this.light);
  }

  // Damage handling
  takeDamage(amount) {
    if (this.invulnTimer > 0 || this.isDead) return false;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = 0.6; // 0.6s grace period

    if (this.hp <= 0) {
      this.isDead = true;
    }
    return true;
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addAmmo(amount) {
    this.ammo = Math.min(this.maxAmmo, this.ammo + amount);
  }

  // Update position, input smoothing, animations, and continuous firing
  update(dt, onShootCallback) {
    if (this.isDead) return;

    // Invulnerability timer & visual flash
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      const flash = Math.sin(this.invulnTimer * 30) > 0;
      this.chassisMat.color.setHex(flash ? 0xff2244 : 0x1e293b);
      if (this.invulnTimer <= 0) {
        this.chassisMat.color.setHex(0x1e293b);
      }
    }

    // 1. Move forward along -Z
    this.group.position.z -= this.speed * dt;

    // 2. Smooth lateral movement (Lerp to targetX)
    const lerpSpeed = 16.0;
    this.currentX += (this.targetX - this.currentX) * Math.min(1, lerpSpeed * dt);
    this.group.position.x = this.currentX;

    // Banking tilt based on horizontal velocity
    const targetTilt = (this.targetX - this.currentX) * -0.25;
    this.tilt += (targetTilt - this.tilt) * Math.min(1, 10 * dt);
    this.group.rotation.z = this.tilt;
    this.group.rotation.y = this.tilt * 0.4;

    // Hover jet animation pulse
    const hoverScale = 0.85 + Math.sin(Date.now() * 0.02) * 0.25;
    this.lFlame.scale.set(1, 1, hoverScale);
    this.rFlame.scale.set(1, 1, hoverScale);

    // Recoil recovery
    this.recoilLeft = Math.max(0, this.recoilLeft - dt * 5.0);
    this.recoilRight = Math.max(0, this.recoilRight - dt * 5.0);
    this.leftCannon.position.z = -0.6 + this.recoilLeft * 0.25;
    this.rightCannon.position.z = -0.6 + this.recoilRight * 0.25;

    // 3. Continuous Firing with Ammo Management
    const effectiveFireRate = this.baseFireRate * this.fireRateMultiplier;
    this.fireTimer += dt;

    // When ammo runs out: Emergency mode shoots at lower rate (1 shot per 0.4s)
    const isOutOfAmmo = this.ammo <= 0;
    const interval = isOutOfAmmo ? 0.4 : (1.0 / effectiveFireRate);

    if (this.fireTimer >= interval) {
      this.fireTimer %= interval;
      if (!isOutOfAmmo) {
        this.ammo = Math.max(0, this.ammo - 1);
      }
      this.fire(onShootCallback, isOutOfAmmo);
    }
  }

  fire(onShootCallback, isEmergency = false) {
    this.recoilLeft = 1.0;
    this.recoilRight = 1.0;

    const leftMuzzle = new THREE.Vector3();
    this.leftCannon.getWorldPosition(leftMuzzle);
    leftMuzzle.z -= 0.6;

    const rightMuzzle = new THREE.Vector3();
    this.rightCannon.getWorldPosition(rightMuzzle);
    rightMuzzle.z -= 0.6;

    const damage = isEmergency ? Math.max(1, Math.floor(this.bulletDamage * 0.6)) : this.bulletDamage;

    if (onShootCallback) {
      onShootCallback(leftMuzzle, rightMuzzle, damage, this.bulletSpread, isEmergency);
    }
  }

  // Set target lateral position from mouse or touch event
  setTargetNormalizedX(normX) {
    this.targetX = THREE.MathUtils.clamp(normX * this.laneLimit, -this.laneLimit, this.laneLimit);
  }

  moveByDeltaX(deltaX) {
    this.targetX = THREE.MathUtils.clamp(this.targetX + deltaX, -this.laneLimit, this.laneLimit);
  }

  getEffectiveFireRate() {
    return Math.round(this.baseFireRate * this.fireRateMultiplier);
  }

  get position() {
    return this.group.position;
  }
}
