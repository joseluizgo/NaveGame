import * as THREE from 'three';

/**
 * Zombie System & Enemy Variety
 * Supports 4 distinct zombie classes + 4 level-specific boss variants:
 * 1. Walker: Slow, shambling traditional undead
 * 2. Runner: Agile, sprinting zombie with glowing red eyes and forward lean
 * 3. Patroller: Tactical zombie swaying and patrolling side-to-side across lanes
 * 4. Armored: Heavy-duty military zombie with metal helmet and high HP
 * 5. Level Bosses:
 *    - Level 1: Mutated Brute
 *    - Level 2: Acidic Chemical Abomination
 *    - Level 3: Cyber Armored Centurion
 *    - Level 4: Colossal Titan with dual-phase health and ground-pound presence
 */
let zombieIdCounter = 0;

export class ZombieMob {
  constructor(scene, zPosition, mobType = 'walker', formationType = 'line', level = 1, count = 4) {
    this.scene = scene;
    this.zPosition = zPosition;
    this.mobType = mobType;
    this.formationType = formationType;
    this.level = level;
    this.zombies = [];
    this.isDead = false;

    this.spawnFormation(count);
  }

  spawnFormation(requestedCount) {
    const lvl = this.level;

    // Check if boss
    if (this.mobType.includes('boss')) {
      let bossHp = 140;
      let bossVariant = 'brute';
      if (this.mobType === 'toxic_boss') {
        bossHp = 220;
        bossVariant = 'toxic';
      } else if (this.mobType === 'armored_boss') {
        bossHp = 340;
        bossVariant = 'armored';
      } else if (this.mobType === 'titan_boss') {
        bossHp = 520;
        bossVariant = 'titan';
      }

      const boss = new Zombie(this.scene, 0, this.zPosition, bossHp, true, bossVariant, lvl);
      this.zombies.push(boss);
      return;
    }

    const count = requestedCount || 4;

    // Determine positions based on formation
    const positions = [];
    if (this.formationType === 'pair') {
      positions.push({ x: -1.6, z: 0 }, { x: 1.6, z: 0 });
    } else if (this.formationType === 'line') {
      const spacing = 1.9;
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * spacing;
        positions.push({ x, z: (Math.random() - 0.5) * 1.2 });
      }
    } else if (this.formationType === 'flank') {
      // Spawn at road edges
      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const x = side * (3.5 + Math.random() * 1.5);
        positions.push({ x, z: Math.floor(i / 2) * 2.8 });
      }
    } else if (this.formationType === 'v-shape') {
      for (let i = 0; i < count; i++) {
        const tier = Math.floor((i + 1) / 2);
        const side = i % 2 === 0 ? -1 : 1;
        const x = i === 0 ? 0 : side * tier * 2.0;
        const z = tier * 2.2;
        positions.push({ x, z });
      }
    } else {
      // Grid block
      const cols = Math.min(4, count);
      const rows = Math.ceil(count / cols);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r * cols + c >= count) break;
          const x = (c - (cols - 1) / 2) * 2.2;
          const z = r * 2.4;
          positions.push({ x, z });
        }
      }
    }

    // Spawn individual zombies
    positions.forEach((pos, idx) => {
      let subType = 'walker';
      let hp = 4 + lvl * 2;

      if (this.mobType === 'runner' || (this.mobType === 'mixed_runner' && idx % 2 === 0)) {
        subType = 'runner';
        hp = Math.round((3 + lvl * 1.5) * 0.85); // faster, slightly less hp
      } else if (this.mobType === 'patroller') {
        subType = 'patroller';
        hp = 5 + lvl * 2;
      } else if (this.mobType === 'armored' || (this.mobType === 'mixed_heavy' && idx % 2 === 0)) {
        subType = 'armored';
        hp = Math.round((6 + lvl * 3) * 1.8); // high defense
      } else if (this.mobType === 'escape_rush') {
        subType = 'runner';
        hp = 5 + lvl * 1.5;
      }

      const z = new Zombie(this.scene, pos.x, this.zPosition + pos.z, hp, false, subType, lvl);
      this.zombies.push(z);
    });
  }

  update(dt, playerZ) {
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      if (z.isDead) {
        z.destroy();
        this.zombies.splice(i, 1);
      } else {
        z.update(dt, playerZ);
      }
    }

    if (this.zombies.length === 0) {
      this.isDead = true;
    }
  }

  destroy() {
    this.zombies.forEach(z => z.destroy());
    this.zombies = [];
  }
}

export class Zombie {
  constructor(scene, x, z, maxHp, isBoss = false, variant = 'walker', level = 1) {
    this.scene = scene;
    this.id = ++zombieIdCounter;
    this.isBoss = isBoss;
    this.variant = variant; // 'walker' | 'runner' | 'patroller' | 'armored' | 'toxic' | 'titan'
    this.maxHp = maxHp;
    this.hp = maxHp;
    this.level = level;
    this.isDead = false;

    this.flashTimer = 0;
    this.animTime = Math.random() * 10;
    this.patrolOriginX = x;
    this.patrolSpeed = 2.2 + Math.random() * 0.8;
    this.patrolAmplitude = 2.6;

    // Movement forward speed along +Z (towards oncoming player)
    this.forwardSpeed = 1.6;
    if (this.variant === 'runner') this.forwardSpeed = 6.2;
    if (this.variant === 'patroller') this.forwardSpeed = 2.0;
    if (this.variant === 'armored') this.forwardSpeed = 1.2;
    if (this.isBoss) {
      this.forwardSpeed = this.variant === 'titan' ? 2.8 : 2.0;
    }

    // Scale
    if (this.isBoss) {
      this.scale = this.variant === 'titan' ? 3.4 : 2.8;
    } else if (this.variant === 'runner') {
      this.scale = 1.15;
    } else if (this.variant === 'armored') {
      this.scale = 1.35;
    } else {
      this.scale = 1.25;
    }

    this.group = new THREE.Group();
    this.group.position.set(x, 0, z);

    this.buildModel();
    this.buildHpBar();
    this.scene.add(this.group);
  }

  buildModel() {
    const s = this.scale;

    // Dynamic Skin / Clothing colors by variant
    let skinColor = 0x22c55e; // default green
    let shirtColor = 0x0284c7; // blue
    let eyeColor = 0xfacc15; // yellow glow

    if (this.variant === 'runner') {
      skinColor = 0xd97706; // sickly reddish orange
      shirtColor = 0x7f1d1d; // crimson torn rags
      eyeColor = 0xff0033; // bright red predator eyes
    } else if (this.variant === 'patroller') {
      skinColor = 0x059669; // tactical teal undead
      shirtColor = 0x1e293b; // security uniform
      eyeColor = 0x00f7ff; // cyan cyber optic
    } else if (this.variant === 'armored') {
      skinColor = 0x475569; // pale grey decayed
      shirtColor = 0x0f172a; // heavy kevlar
      eyeColor = 0xffbe0b; // amber
    } else if (this.isBoss) {
      if (this.variant === 'toxic') {
        skinColor = 0x10b981; // vibrant radioactive toxic green
        shirtColor = 0x064e3b;
        eyeColor = 0x84cc16;
      } else if (this.variant === 'armored') {
        skinColor = 0x64748b;
        shirtColor = 0x1e1b4b;
        eyeColor = 0xff3366;
      } else if (this.variant === 'titan') {
        skinColor = 0x581c87; // dark void purple titan
        shirtColor = 0x18022b;
        eyeColor = 0xff0055;
      } else {
        skinColor = 0x9333ea; // mutant brute
        shirtColor = 0x1e1b4b;
        eyeColor = 0xff0055;
      }
    }

    this.skinMat = new THREE.MeshLambertMaterial({
      color: skinColor,
      emissive: 0x000000
    });

    const shirtMat = new THREE.MeshLambertMaterial({
      color: shirtColor
    });

    const pantsMat = new THREE.MeshLambertMaterial({
      color: 0x1e293b
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.7 * s, 0.9 * s, 0.45 * s);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.05 * s;
    torso.castShadow = true;
    this.group.add(torso);

    // Armored chest plate
    if (this.variant === 'armored' || (this.isBoss && this.variant === 'armored')) {
      const plateGeo = new THREE.BoxGeometry(0.76 * s, 0.65 * s, 0.52 * s);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.2 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.y = 1.1 * s;
      this.group.add(plate);
    }

    // 2. Head
    const headGeo = new THREE.BoxGeometry(0.55 * s, 0.55 * s, 0.55 * s);
    this.head = new THREE.Mesh(headGeo, this.skinMat);
    this.head.position.y = 1.8 * s;
    this.head.castShadow = true;
    this.group.add(this.head);

    // Glowing Eyes
    const eyeGeo = new THREE.BoxGeometry(0.12 * s, 0.1 * s, 0.05 * s);
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const lEye = new THREE.Mesh(eyeGeo, eyeMat);
    lEye.position.set(-0.14 * s, 1.82 * s, 0.28 * s);
    const rEye = new THREE.Mesh(eyeGeo, eyeMat);
    rEye.position.set(0.14 * s, 1.82 * s, 0.28 * s);
    this.group.add(lEye, rEye);

    // Armored Combat Helmet
    if (this.variant === 'armored' || (this.isBoss && this.variant === 'armored')) {
      const helmGeo = new THREE.BoxGeometry(0.65 * s, 0.3 * s, 0.65 * s);
      const helmMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
      const helm = new THREE.Mesh(helmGeo, helmMat);
      helm.position.y = 2.05 * s;
      this.group.add(helm);
    }

    // 3. Outstretched Arms
    const armGeo = new THREE.BoxGeometry(0.22 * s, 0.22 * s, 0.85 * s);
    this.lArm = new THREE.Mesh(armGeo, this.skinMat);
    this.lArm.position.set(-0.48 * s, 1.25 * s, 0.35 * s);
    this.rArm = new THREE.Mesh(armGeo, this.skinMat);
    this.rArm.position.set(0.48 * s, 1.25 * s, 0.35 * s);
    this.group.add(this.lArm, this.rArm);

    // 4. Legs
    const legGeo = new THREE.BoxGeometry(0.28 * s, 0.7 * s, 0.3 * s);
    this.lLeg = new THREE.Mesh(legGeo, pantsMat);
    this.lLeg.position.set(-0.2 * s, 0.35 * s, 0);
    this.rLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rLeg.position.set(0.2 * s, 0.35 * s, 0);
    this.group.add(this.lLeg, this.rLeg);

    // Boss Adornments
    if (this.isBoss) {
      if (this.variant === 'titan') {
        // Colossal Spiked Energy Crown & Shoulder Spikes
        const crownGeo = new THREE.ConeGeometry(0.55 * s, 0.8 * s, 6);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0x990022, metalness: 0.9 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.y = 2.45 * s;
        this.group.add(crown);

        // Shoulder magma horns
        const hornGeo = new THREE.ConeGeometry(0.25 * s, 0.6 * s, 5);
        hornGeo.rotateZ(0.5);
        const lHorn = new THREE.Mesh(hornGeo, crownMat);
        lHorn.position.set(-0.6 * s, 1.6 * s, 0);
        hornGeo.rotateZ(-1.0);
        const rHorn = new THREE.Mesh(hornGeo, crownMat);
        rHorn.position.set(0.6 * s, 1.6 * s, 0);
        this.group.add(lHorn, rHorn);
      } else {
        const crownGeo = new THREE.ConeGeometry(0.4 * s, 0.5 * s, 5);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0xffbe0b, metalness: 0.8 });
        const crown = new THREE.Mesh(crownGeo, crownMat);
        crown.position.y = 2.3 * s;
        this.group.add(crown);
      }
    }

    // Runner Aggressive Forward Lean
    if (this.variant === 'runner') {
      this.group.rotation.x = 0.25; // sprint angle
    }
  }

  buildHpBar() {
    const s = this.scale;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 72;
    this.hpCanvas = canvas;
    this.hpCtx = canvas.getContext('2d');

    this.hpTexture = new THREE.CanvasTexture(canvas);
    const hpGeo = new THREE.PlaneGeometry(1.6 * s, 0.45 * s);
    const hpMat = new THREE.MeshBasicMaterial({
      map: this.hpTexture,
      transparent: true,
      side: THREE.DoubleSide
    });

    this.hpMesh = new THREE.Mesh(hpGeo, hpMat);
    this.hpMesh.position.y = (this.isBoss ? 3.1 : 2.45) * s;
    this.group.add(this.hpMesh);

    this.updateHpBarVisual();
  }

  updateHpBarVisual() {
    const ctx = this.hpCtx;
    const w = this.hpCanvas.width;
    const h = this.hpCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.strokeStyle = this.isBoss ? '#ffbe0b' : '#ffffff';
    ctx.lineWidth = this.isBoss ? 6 : 4;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, 20);
    ctx.fill();
    ctx.stroke();

    // Health bar fill
    const fillRatio = Math.max(0, this.hp / this.maxHp);
    const barWidth = (w - 24) * fillRatio;

    const grad = ctx.createLinearGradient(12, 0, w - 12, 0);
    if (this.isBoss) {
      grad.addColorStop(0, '#ff0055');
      grad.addColorStop(1, '#ffbe0b');
    } else if (fillRatio > 0.5) {
      grad.addColorStop(0, '#22c55e');
      grad.addColorStop(1, '#86efac');
    } else if (fillRatio > 0.25) {
      grad.addColorStop(0, '#eab308');
      grad.addColorStop(1, '#fde047');
    } else {
      grad.addColorStop(0, '#ef4444');
      grad.addColorStop(1, '#f87171');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(12, 12, Math.max(16, barWidth), h - 24, 14);
    ctx.fill();

    // HP Text & Type Indicator
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;

    let label = `${this.hp}`;
    if (this.isBoss) {
      label = `BOSS: ${this.hp}`;
      ctx.font = 'bold 30px "Outfit", sans-serif';
    }
    ctx.fillText(label, w / 2, h / 2);

    this.hpTexture.needsUpdate = true;
  }

  takeDamage(amount) {
    if (this.isDead) return 0;

    this.hp = Math.max(0, this.hp - amount);
    this.updateHpBarVisual();

    // Hit flash reaction
    this.flashTimer = 0.08;
    this.skinMat.emissive.setHex(0xffffff);

    // Knockback
    const knockback = this.isBoss ? 0.05 : 0.2;
    this.group.position.z += knockback;

    if (this.hp <= 0) {
      this.isDead = true;
      return this.isBoss ? 350 : (this.variant === 'armored' ? 25 : 12);
    }
    return 1;
  }

  update(dt, playerZ) {
    // Forward advance towards oncoming player
    this.group.position.z += this.forwardSpeed * dt;

    // Patroller horizontal sway logic
    if (this.variant === 'patroller') {
      this.group.position.x = this.patrolOriginX + Math.sin(Date.now() * 0.0025 * this.patrolSpeed) * this.patrolAmplitude;
    }

    // Animation rhythm
    const animRate = this.variant === 'runner' ? 12.0 : 5.0;
    this.animTime += dt * animRate;

    // Flash recovery
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.skinMat.emissive.setHex(0x000000);
      }
    }

    // Wobble and arm movement
    const wobble = Math.sin(this.animTime);
    this.group.rotation.y = wobble * 0.15;
    this.group.position.y = Math.abs(Math.sin(this.animTime * 2)) * 0.12;

    this.lArm.position.y = (1.25 + wobble * 0.15) * this.scale;
    this.rArm.position.y = (1.25 - wobble * 0.15) * this.scale;

    // Leg swinging
    this.lLeg.rotation.x = wobble * 0.35;
    this.rLeg.rotation.x = -wobble * 0.35;

    // HP Bar always faces camera
    if (this.hpMesh) {
      this.hpMesh.rotation.y = -this.group.rotation.y;
    }
  }

  checkBulletCollision(bullet) {
    if (this.isDead) return false;

    const bPos = bullet.mesh.position;
    const zPos = this.group.position;
    const hitRadius = this.isBoss ? (this.variant === 'titan' ? 3.2 : 2.5) : (1.1 * (this.scale / 1.25));

    const dx = bPos.x - zPos.x;
    const dy = bPos.y - (1.1 * this.scale);
    const dz = bPos.z - zPos.z;

    const distSq = dx * dx + dy * dy + dz * dz;
    return distSq < hitRadius * hitRadius;
  }

  checkPlayerCollision(player) {
    if (this.isDead) return false;

    const pPos = player.position;
    const zPos = this.group.position;
    const crashRadius = this.isBoss ? (this.variant === 'titan' ? 3.0 : 2.5) : 1.3;

    const dx = pPos.x - zPos.x;
    const dz = pPos.z - zPos.z;

    return (dx * dx + dz * dz) < (crashRadius * crashRadius);
  }

  destroy() {
    this.scene.remove(this.group);
    if (this.hpTexture) this.hpTexture.dispose();
  }

  get position() {
    return this.group.position;
  }
}
