import * as THREE from 'three';

/**
 * Bullet Manager
 * Handles rapid laser projectiles, fan-outs, gate crossings, and collision detection.
 */
export class BulletManager {
  constructor(scene) {
    this.scene = scene;
    this.bullets = [];

    // Pre-create shared bullet geometry and glowing cyan material
    this.bulletGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 8);
    this.bulletGeo.rotateX(-Math.PI / 2); // point forward along -Z

    this.bulletMat = new THREE.MeshBasicMaterial({
      color: 0x00f7ff
    });

    this.bulletSpeed = 56; // Units per second
  }

  // Spawn initial shots from player cannons
  spawnPlayerShots(leftMuzzle, rightMuzzle, damage, spreadCount = 1) {
    this.createBullet(leftMuzzle, new THREE.Vector3(0, 0, -this.bulletSpeed), damage);
    this.createBullet(rightMuzzle, new THREE.Vector3(0, 0, -this.bulletSpeed), damage);

    if (spreadCount > 1) {
      // Extra angled spread shots
      this.createBullet(leftMuzzle, new THREE.Vector3(-6, 0, -this.bulletSpeed), damage);
      this.createBullet(rightMuzzle, new THREE.Vector3(6, 0, -this.bulletSpeed), damage);
    }
  }

  createBullet(pos, vel, damage) {
    const mesh = new THREE.Mesh(this.bulletGeo, this.bulletMat);
    mesh.position.copy(pos);
    mesh.scale.set(1, 1, 1);

    this.scene.add(mesh);
    this.bullets.push({
      mesh,
      vel: vel.clone(),
      damage: damage,
      life: 1.6, // seconds before despawn
      passedGates: new Set()
    });
  }

  // Duplicate / multiply bullets when passing through a gate
  duplicateAtGate(originalBullet, gate, countToSpawn) {
    const clampedCount = Math.min(countToSpawn, 15); // keep performance high
    for (let i = 0; i < clampedCount; i++) {
      const offsetX = (Math.random() - 0.5) * 1.6;
      const offsetY = (Math.random() - 0.5) * 0.8;
      const angle = (Math.random() - 0.5) * 0.35; // slight fan angle

      const spawnPos = new THREE.Vector3(
        originalBullet.mesh.position.x + offsetX,
        originalBullet.mesh.position.y + offsetY,
        originalBullet.mesh.position.z - 0.2
      );

      const vel = new THREE.Vector3(
        Math.sin(angle) * 14,
        0,
        -this.bulletSpeed
      );

      const newB = {
        mesh: new THREE.Mesh(this.bulletGeo, this.bulletMat),
        vel,
        damage: originalBullet.damage,
        life: 1.6,
        passedGates: new Set(originalBullet.passedGates)
      };
      newB.passedGates.add(gate.id);
      newB.mesh.position.copy(spawnPos);

      this.scene.add(newB.mesh);
      this.bullets.push(newB);
    }
  }

  update(dt, playerZ) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life -= dt;

      // Update position
      b.mesh.position.addScaledVector(b.vel, dt);

      // Despawn if life expired or travelled too far ahead of player
      if (b.life <= 0 || b.mesh.position.z < playerZ - 90) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }
  }

  // Remove a specific bullet (e.g. upon hitting a zombie)
  removeBullet(index) {
    if (this.bullets[index]) {
      this.scene.remove(this.bullets[index].mesh);
      this.bullets.splice(index, 1);
    }
  }

  clear() {
    for (const b of this.bullets) {
      this.scene.remove(b.mesh);
    }
    this.bullets = [];
  }

  getActiveCount() {
    return this.bullets.length;
  }
}
