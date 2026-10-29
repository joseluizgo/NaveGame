import * as THREE from 'three';

/**
 * High-performance Particle FX System for Three.js
 * Handles muzzle flashes, gate bursts, zombie cartoon splatters, and victory confetti.
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // Pre-allocated geometries & materials for fast recycling
    this.sparkGeo = new THREE.SphereGeometry(0.12, 4, 4);
    this.chunkGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    this.confettiGeo = new THREE.PlaneGeometry(0.25, 0.15);

    // Materials
    this.cyanMat = new THREE.MeshBasicMaterial({ color: 0x00f7ff });
    this.goldMat = new THREE.MeshBasicMaterial({ color: 0xffbe0b });
    this.greenMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
    this.darkGreenMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    this.boneMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    this.redMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    this.shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x00f7ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
  }

  // Muzzle spark on gunfire
  createMuzzleFlash(pos) {
    const count = 4;
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.cyanMat);
      mesh.position.copy(pos);
      mesh.scale.setScalar(0.7 + Math.random() * 0.5);

      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 4;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * 1.5,
          Math.random() * 2 + 1,
          -speed // forward
        ),
        gravity: 0,
        drag: 0.85,
        life: 0.12,
        maxLife: 0.12
      });
    }
  }

  // Gate sparkle burst when bullets pass through
  createGateBurst(pos, isPositive = true) {
    const count = 18;
    const mat = isPositive ? this.goldMat : this.redMat;

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 1.2,
        pos.y + (Math.random() - 0.5) * 2.0,
        pos.z
      );

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          (Math.random() - 0.5) * 3
        ),
        gravity: 2.0,
        drag: 0.92,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  // Zombie death: bursting cartoon cubes & bone fragments
  createZombieExplosion(pos, isBoss = false) {
    const count = isBoss ? 60 : 16;
    const mats = [this.greenMat, this.darkGreenMat, this.boneMat, this.redMat];

    for (let i = 0; i < count; i++) {
      const mat = mats[Math.floor(Math.random() * mats.length)];
      const mesh = new THREE.Mesh(this.chunkGeo, mat);
      mesh.position.copy(pos);
      mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);

      const scale = (isBoss ? 1.5 : 0.9) * (0.6 + Math.random() * 0.8);
      mesh.scale.setScalar(scale);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = (isBoss ? 12 : 7) * (0.5 + Math.random() * 0.8);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.abs(Math.cos(phi)) * speed + 2,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        rotVel: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 10
        ),
        gravity: 16.0,
        drag: 0.97,
        life: 0.9,
        maxLife: 0.9
      });
    }

    // Expanding shockwave ring
    const ringGeo = new THREE.RingGeometry(0.5, 0.9, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeo, this.shockwaveMat.clone());
    ringMesh.position.set(pos.x, 0.1, pos.z);
    this.scene.add(ringMesh);

    this.particles.push({
      mesh: ringMesh,
      vel: new THREE.Vector3(0, 0, 0),
      scaleVel: isBoss ? 28 : 14,
      gravity: 0,
      drag: 1,
      life: 0.4,
      maxLife: 0.4,
      isRing: true
    });
  }

  // Golden / vibrant confetti celebration at finish line
  createVictoryConfetti(centerPos) {
    const count = 90;
    const colors = [0xffbe0b, 0x00f7ff, 0xff006e, 0x8338ec, 0x3a86ff, 0x00ff88];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(this.confettiGeo, mat);
      mesh.position.set(
        centerPos.x + (Math.random() - 0.5) * 12,
        centerPos.y + Math.random() * 8 + 4,
        centerPos.z + (Math.random() - 0.5) * 8
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          -1.5 - Math.random() * 2.5,
          (Math.random() - 0.5) * 3
        ),
        rotVel: new THREE.Vector3(
          Math.random() * 6 - 3,
          Math.random() * 6 - 3,
          Math.random() * 6 - 3
        ),
        gravity: 0.5,
        drag: 0.98,
        life: 3.5,
        maxLife: 3.5
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        if (p.mesh.geometry && p.isRing) p.mesh.geometry.dispose();
        if (p.mesh.material && (p.isRing || p.mesh.material.side === THREE.DoubleSide)) {
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.vel.y -= p.gravity * dt;
      p.vel.multiplyScalar(p.drag);
      p.mesh.position.addScaledVector(p.vel, dt);

      if (p.rotVel) {
        p.mesh.rotation.x += p.rotVel.x * dt;
        p.mesh.rotation.y += p.rotVel.y * dt;
        p.mesh.rotation.z += p.rotVel.z * dt;
      }

      if (p.isRing) {
        const progress = 1 - (p.life / p.maxLife);
        const s = 1 + progress * p.scaleVel;
        p.mesh.scale.set(s, s, s);
        p.mesh.material.opacity = 1 - progress;
      } else {
        // Fade out
        const alpha = Math.max(0, p.life / p.maxLife);
        p.mesh.scale.multiplyScalar(0.985);
      }
    }
  }

  clear() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      if (p.mesh.geometry && p.isRing) p.mesh.geometry.dispose();
      if (p.mesh.material && (p.isRing || p.mesh.material.side === THREE.DoubleSide)) {
        p.mesh.material.dispose();
      }
    }
    this.particles = [];
  }
}
