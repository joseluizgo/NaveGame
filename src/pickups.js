import * as THREE from 'three';

/**
 * Pickup System
 * Manages 3D Medkits, Ammo Crates, Lore Holographic Data-Pads, and Supply Caches.
 * Features smooth floating/hover animations, glowing halos, and player proximity pickup.
 */
export class PickupManager {
  constructor(scene) {
    this.scene = scene;
    this.pickups = [];

    // Shared Geometries & Materials
    this.boxGeo = new THREE.BoxGeometry(0.9, 0.7, 0.9);
    this.crossHorizGeo = new THREE.BoxGeometry(0.5, 0.16, 0.12);
    this.crossVertGeo = new THREE.BoxGeometry(0.16, 0.5, 0.12);

    this.medkitMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.1 });
    this.greenGlowMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
    this.ammoMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.8 });
    this.ammoGlowMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff });
    this.loreMat = new THREE.MeshStandardMaterial({ color: 0x8b5cf6, roughness: 0.2, metalness: 0.9 });
    this.loreGlowMat = new THREE.MeshBasicMaterial({ color: 0xc084fc });
    this.haloGeo = new THREE.RingGeometry(0.7, 0.9, 24);
    this.haloGeo.rotateX(-Math.PI / 2);
  }

  spawnLevelPickups(pickupsConfig = [], loreConfig = []) {
    this.clear();

    // 1. Spawn Standard Pickups (Medkits, Ammo, Coins)
    pickupsConfig.forEach(cfg => {
      const group = new THREE.Group();
      group.position.set(cfg.x, 0.55, cfg.z);

      let haloMatColor = 0x22c55e;
      let mesh;

      if (cfg.type === 'medkit') {
        haloMatColor = 0x22c55e;
        mesh = new THREE.Mesh(this.boxGeo, this.medkitMat);
        mesh.castShadow = true;

        // Red/Green Cross symbols on faces
        const hCross = new THREE.Mesh(this.crossHorizGeo, this.greenGlowMat);
        hCross.position.z = 0.46;
        const vCross = new THREE.Mesh(this.crossVertGeo, this.greenGlowMat);
        vCross.position.z = 0.46;
        mesh.add(hCross, vCross);
        group.add(mesh);
      } else if (cfg.type === 'ammo') {
        haloMatColor = 0x00f7ff;
        mesh = new THREE.Mesh(this.boxGeo, this.ammoMat);
        mesh.castShadow = true;

        // Energy battery bands
        const band = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.2, 1.0), this.ammoGlowMat);
        mesh.add(band);
        group.add(mesh);
      } else {
        // Coins / Supply Cache
        haloMatColor = 0xffbe0b;
        const coinGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.15, 16);
        coinGeo.rotateX(Math.PI / 2);
        mesh = new THREE.Mesh(coinGeo, new THREE.MeshStandardMaterial({ color: 0xffbe0b, metalness: 0.9, roughness: 0.1 }));
        mesh.castShadow = true;
        group.add(mesh);
      }

      // Ground Pulsing Halo
      const haloMat = new THREE.MeshBasicMaterial({
        color: haloMatColor,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const halo = new THREE.Mesh(this.haloGeo, haloMat);
      halo.position.y = -0.5;
      group.add(halo);

      this.scene.add(group);
      this.pickups.push({
        type: cfg.type,
        group,
        mesh,
        halo,
        data: cfg,
        collected: false,
        baseY: 0.65,
        animOffset: Math.random() * Math.PI * 2
      });
    });

    // 2. Spawn Lore Data-Pads
    loreConfig.forEach(lore => {
      const group = new THREE.Group();
      group.position.set(lore.x, 0.7, lore.z);

      // Data-pad holographic tablet
      const tabletGeo = new THREE.BoxGeometry(0.7, 0.08, 0.9);
      const tablet = new THREE.Mesh(tabletGeo, this.loreMat);
      tablet.castShadow = true;

      // Holographic screen projector cone / beam
      const beamGeo = new THREE.CylinderGeometry(0.4, 0.1, 1.2, 12, 1, true);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 0.6;
      tablet.add(beam);

      // Floating holographic badge icon
      const badgeGeo = new THREE.OctahedronGeometry(0.25);
      const badgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
      const badge = new THREE.Mesh(badgeGeo, badgeMat);
      badge.position.y = 1.1;
      tablet.add(badge);

      group.add(tablet);

      // Halo ring
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      const halo = new THREE.Mesh(this.haloGeo, haloMat);
      halo.position.y = -0.65;
      group.add(halo);

      this.scene.add(group);
      this.pickups.push({
        type: 'lore',
        group,
        mesh: tablet,
        halo,
        data: lore,
        collected: false,
        baseY: 0.75,
        animOffset: Math.random() * Math.PI * 2
      });
    });
  }

  update(dt, playerPos) {
    const time = Date.now() * 0.003;

    for (const p of this.pickups) {
      if (p.collected) continue;

      // Smooth floating bob and spin
      p.mesh.rotation.y += dt * 1.8;
      p.group.position.y = p.baseY + Math.sin(time + p.animOffset) * 0.15;

      // Halo pulse
      if (p.halo) {
        const pulse = 1.0 + Math.sin(time * 2 + p.animOffset) * 0.15;
        p.halo.scale.set(pulse, pulse, pulse);
      }
    }
  }

  // Check collision between player and any active pickup
  checkPlayerCollisions(player, onCollect) {
    const pPos = player.position;
    const collectRadius = 1.8;
    const collectRadiusSq = collectRadius * collectRadius;

    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      if (p.collected) continue;

      const pos = p.group.position;
      const dx = pPos.x - pos.x;
      const dz = pPos.z - pos.z;
      const distSq = dx * dx + dz * dz;

      if (distSq < collectRadiusSq) {
        p.collected = true;
        this.scene.remove(p.group);
        if (onCollect) {
          onCollect(p.type, p.data, pos);
        }
      }
    }
  }

  clear() {
    this.pickups.forEach(p => {
      this.scene.remove(p.group);
    });
    this.pickups = [];
  }
}

