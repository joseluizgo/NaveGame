import * as THREE from 'three';

/**
 * Environmental Hazards & Maze Obstacles
 * Manages destructible barricades, toxic chemical pools, laser spikes, and concrete maze dividing walls.
 */
export class HazardManager {
  constructor(scene) {
    this.scene = scene;
    this.hazards = [];

    // Shared Materials
    this.barricadeMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8, metalness: 0.1 });
    this.hazardStripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.toxicPoolMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    this.spikeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    this.concreteWallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9, metalness: 0.1 });
  }

  spawnLevelHazards(hazardsConfig = []) {
    this.clear();

    hazardsConfig.forEach(cfg => {
      const group = new THREE.Group();
      group.position.set(cfg.x, 0, cfg.z);

      let hitBox = { width: cfg.width || 2.5, depth: cfg.depth || 1.5 };
      let destructible = false;
      let hp = cfg.hp || 0;

      if (cfg.type === 'barricade') {
        destructible = true;
        // Wood beam structure
        const w = cfg.width || 2.8;
        const beamGeo = new THREE.BoxGeometry(w, 0.35, 0.35);
        const b1 = new THREE.Mesh(beamGeo, this.barricadeMat);
        b1.position.y = 0.4;
        const b2 = new THREE.Mesh(beamGeo, this.barricadeMat);
        b2.position.y = 0.9;

        // Support posts
        const postGeo = new THREE.BoxGeometry(0.3, 1.2, 0.3);
        const p1 = new THREE.Mesh(postGeo, this.barricadeMat);
        p1.position.set(-w / 2 + 0.2, 0.6, 0);
        const p2 = new THREE.Mesh(postGeo, this.barricadeMat);
        p2.position.set(w / 2 - 0.2, 0.6, 0);

        // Warning striped board
        const stripeBoard = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.25, 0.4), this.hazardStripeMat);
        stripeBoard.position.y = 0.65;

        group.add(b1, b2, p1, p2, stripeBoard);
        hitBox = { width: w, depth: 1.2, height: 1.2 };
      } else if (cfg.type === 'toxic_pool') {
        const w = cfg.width || 3.2;
        const poolGeo = new THREE.PlaneGeometry(w, 4.0);
        poolGeo.rotateX(-Math.PI / 2);
        const pool = new THREE.Mesh(poolGeo, this.toxicPoolMat);
        pool.position.y = 0.04;
        group.add(pool);

        // Warning border markers
        const coneGeo = new THREE.ConeGeometry(0.18, 0.5, 6);
        const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
        const c1 = new THREE.Mesh(coneGeo, coneMat);
        c1.position.set(-w / 2, 0.25, -1.8);
        const c2 = new THREE.Mesh(coneGeo, coneMat);
        c2.position.set(w / 2, 0.25, 1.8);
        group.add(c1, c2);

        hitBox = { width: w, depth: 4.0, height: 0.5 };
      } else if (cfg.type === 'spikes') {
        const w = cfg.width || 3.0;
        const count = Math.floor(w / 0.5);
        const spikeGeo = new THREE.ConeGeometry(0.16, 0.6, 6);
        for (let i = 0; i < count; i++) {
          const s = new THREE.Mesh(spikeGeo, this.spikeMat);
          s.position.set((i - (count - 1) / 2) * 0.5, 0.3, 0);
          group.add(s);
        }
        hitBox = { width: w, depth: 1.0, height: 0.8 };
      } else if (cfg.type === 'concrete_wall') {
        // High concrete barrier creating maze partitions
        const w = cfg.width || 1.2;
        const d = cfg.depth || 30;
        const wallGeo = new THREE.BoxGeometry(w, 2.0, d);
        const wall = new THREE.Mesh(wallGeo, this.concreteWallMat);
        wall.position.y = 1.0;
        wall.castShadow = true;
        wall.receiveShadow = true;
        group.add(wall);

        // Neon warning edge on top
        const neonGeo = new THREE.BoxGeometry(w + 0.1, 0.1, d);
        const neonMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const neon = new THREE.Mesh(neonGeo, neonMat);
        neon.position.y = 2.05;
        group.add(neon);

        hitBox = { width: w, depth: d, height: 2.0 };
      }

      this.scene.add(group);
      this.hazards.push({
        id: Math.random().toString(),
        type: cfg.type,
        group,
        hitBox,
        destructible,
        hp,
        maxHp: hp,
        destroyed: false
      });
    });
  }

  update(dt) {
    // Pulse toxic pools
    const time = Date.now() * 0.005;
    for (const h of this.hazards) {
      if (h.destroyed) continue;
      if (h.type === 'toxic_pool') {
        h.group.children[0].scale.x = 1.0 + Math.sin(time) * 0.05;
      }
    }
  }

  // Check bullet collisions with destructible barricades
  checkBulletCollisions(bullets, onDestruct) {
    for (const h of this.hazards) {
      if (h.destroyed || !h.destructible) continue;

      const hPos = h.group.position;
      const hw = h.hitBox.width / 2;
      const hd = h.hitBox.depth / 2;

      for (let i = bullets.bullets.length - 1; i >= 0; i--) {
        const b = bullets.bullets[i];
        const bPos = b.mesh.position;

        if (
          Math.abs(bPos.z - hPos.z) < hd &&
          Math.abs(bPos.x - hPos.x) < hw &&
          bPos.y < (h.hitBox.height || 1.5)
        ) {
          // Bullet hits barricade
          h.hp -= b.damage;
          bullets.removeBullet(i);

          if (h.hp <= 0) {
            h.destroyed = true;
            this.scene.remove(h.group);
            if (onDestruct) onDestruct(hPos);
            break;
          }
        }
      }
    }
  }

  // Check player collisions with hazards
  checkPlayerCollisions(player, onPlayerHit) {
    const pPos = player.position;

    for (const h of this.hazards) {
      if (h.destroyed) continue;

      const hPos = h.group.position;
      const hw = h.hitBox.width / 2 + 0.6;
      const hd = h.hitBox.depth / 2 + 0.5;

      if (Math.abs(pPos.z - hPos.z) < hd && Math.abs(pPos.x - hPos.x) < hw) {
        // Player touched hazard!
        if (h.type === 'concrete_wall') {
          // Push player out horizontally away from center of wall
          const pushDir = pPos.x > hPos.x ? 1 : -1;
          player.targetX = hPos.x + pushDir * (hw + 0.3);
          if (onPlayerHit) onPlayerHit('wall', 10, hPos);
        } else if (h.type === 'barricade') {
          h.destroyed = true;
          this.scene.remove(h.group);
          if (onPlayerHit) onPlayerHit('barricade', 25, hPos);
        } else if (h.type === 'toxic_pool') {
          if (onPlayerHit) onPlayerHit('toxic', 15, hPos);
        } else if (h.type === 'spikes') {
          if (onPlayerHit) onPlayerHit('spikes', 20, hPos);
        }
      }
    }
  }

  clear() {
    this.hazards.forEach(h => {
      this.scene.remove(h.group);
    });
    this.hazards = [];
  }
}

