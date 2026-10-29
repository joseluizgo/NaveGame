import * as THREE from 'three';
import { Player } from './player.js';
import { BulletManager } from './bullets.js';
import { GatePair } from './gates.js';
import { ZombieMob } from './zombies.js';
import { Track } from './track.js';
import { ParticleSystem } from './particles.js';
import { PickupManager } from './pickups.js';
import { HazardManager } from './hazards.js';
import { LEVEL_CONFIGS } from './levels.js';
import { sound } from './audio.js';
import { UIManager } from './ui.js';

/**
 * Main Game Controller
 * Manages Three.js scene, game loop, smooth camera follow, collision resolution,
 * 4 distinct level progression flows, trigger-based enemy spawning, and resource management.
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('bg-canvas');
    this.ui = new UIManager();

    // Game States: 'START' | 'PLAYING' | 'VICTORY' | 'GAMEOVER'
    this.state = 'START';
    this.currentLevel = 1;
    this.maxLevels = 4;
    this.score = 0;
    this.coins = 60; // starting bonus coins
    this.zombiesKilledInLevel = 0;
    this.comboCounter = 0;

    // Upgrades
    this.fireRateLevel = 1;
    this.damageLevel = 1;

    // Time tracking
    this.clock = new THREE.Clock();

    // Input state
    this.isDragging = false;
    this.lastTouchX = 0;
    this.keys = { left: false, right: false };

    // Trigger tracking
    this.activeTriggers = new Set();

    this.initThree();
    this.initAudioAndUI();
    this.initInputs();
    this.setupLevel(this.currentLevel);

    // Start render loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initThree() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.012);

    // 2. Camera (Third-person hyper-casual view)
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(58, aspect, 0.1, 400);
    this.cameraTarget = new THREE.Vector3(0, 1.2, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. Lighting
    this.hemiLight = new THREE.HemisphereLight(0x60a5fa, 0x0f172a, 1.2);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.dirLight.position.set(15, 30, 20);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 140;
    const d = 30;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // 5. Core Systems
    this.particles = new ParticleSystem(this.scene);
    this.bullets = new BulletManager(this.scene);
    this.player = new Player(this.scene);
    this.pickups = new PickupManager(this.scene);
    this.hazards = new HazardManager(this.scene);

    // Window resize handling
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initAudioAndUI() {
    // Sound mute toggle
    const soundBtn = document.getElementById('sound-btn');
    soundBtn.addEventListener('click', () => {
      sound.init();
      const muted = sound.toggleMute();
      soundBtn.textContent = muted ? '🔇' : '🔊';
    });

    // Start Button
    document.getElementById('btn-start').addEventListener('click', () => {
      sound.init();
      this.ui.hideStartModal();
      this.state = 'PLAYING';
    });

    // Retry Button
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.ui.hideDefeatModal();
      this.setupLevel(this.currentLevel);
      this.state = 'PLAYING';
    });

    // Next Level Button
    document.getElementById('btn-next-level').addEventListener('click', () => {
      this.ui.hideVictoryModal();
      if (this.currentLevel >= this.maxLevels) {
        // Campaign Loop / Replay
        this.currentLevel = 1;
      } else {
        this.currentLevel++;
      }
      this.setupLevel(this.currentLevel);
      this.state = 'PLAYING';
    });

    // Upgrades
    document.getElementById('btn-upgrade-firerate').addEventListener('click', () => {
      const cost = this.getFireRateCost();
      if (this.coins >= cost) {
        this.coins -= cost;
        this.fireRateLevel++;
        this.applyUpgrades();
        sound.playGatePass(true);
        this.ui.updateUpgradeButtons(this.coins, this.getFireRateCost(), this.getDamageCost());
        this.updateHUDDisplay();
      }
    });

    document.getElementById('btn-upgrade-damage').addEventListener('click', () => {
      const cost = this.getDamageCost();
      if (this.coins >= cost) {
        this.coins -= cost;
        this.damageLevel++;
        this.applyUpgrades();
        sound.playGatePass(true);
        this.ui.updateUpgradeButtons(this.coins, this.getFireRateCost(), this.getDamageCost());
        this.updateHUDDisplay();
      }
    });
  }

  getFireRateCost() {
    return 40 + (this.fireRateLevel - 1) * 35;
  }

  getDamageCost() {
    return 60 + (this.damageLevel - 1) * 50;
  }

  applyUpgrades() {
    this.player.fireRateMultiplier = 1 + (this.fireRateLevel - 1) * 0.28;
    this.player.bulletDamage = this.damageLevel;
    this.player.maxAmmo = 140 + (this.damageLevel - 1) * 25;
  }

  initInputs() {
    // Touch Events
    window.addEventListener('touchstart', (e) => {
      sound.init();
      this.ui.hideDragHint();
      if (e.touches.length > 0) {
        this.isDragging = true;
        this.lastTouchX = e.touches[0].clientX;
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length > 0) {
        const touchX = e.touches[0].clientX;
        const deltaX = (touchX - this.lastTouchX) * 0.024;
        this.player.moveByDeltaX(deltaX);
        this.lastTouchX = touchX;
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Mouse Events
    window.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.closest('#lore-card')) return;
      sound.init();
      this.ui.hideDragHint();
      this.isDragging = true;
      this.lastTouchX = e.clientX;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = (e.clientX - this.lastTouchX) * 0.022;
        this.player.moveByDeltaX(deltaX);
        this.lastTouchX = e.clientX;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Keyboard controls (Arrow Left/Right, A, D)
    window.addEventListener('keydown', (e) => {
      this.ui.hideDragHint();
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
    });
  }

  setupLevel(levelId) {
    // Clean old elements
    if (this.track) this.track.destroy();
    if (this.gatePairs) this.gatePairs.forEach(gp => gp.destroy());
    if (this.zombieMobs) this.zombieMobs.forEach(zm => zm.destroy());
    this.bullets.clear();
    this.particles.clear();
    this.pickups.clear();
    this.hazards.clear();
    this.activeTriggers.clear();

    // Fetch Level Configuration
    const levelConfig = LEVEL_CONFIGS[levelId] || LEVEL_CONFIGS[1];
    this.currentLevelConfig = levelConfig;

    // Apply Atmosphere
    const atmo = levelConfig.atmosphere || {};
    this.scene.background = new THREE.Color(atmo.skyColor || 0x060913);
    this.scene.fog.color.setHex(atmo.skyColor || 0x060913);
    this.scene.fog.density = atmo.fogDensity || 0.01;
    this.hemiLight.color.setHex(atmo.lightColor || 0x60a5fa);
    this.dirLight.color.setHex(atmo.lightColor || 0xffffff);

    // Build Long Track
    this.track = new Track(this.scene, levelConfig);
    this.trackLength = levelConfig.trackLength;
    this.finishZ = -this.trackLength + 10;

    // Player Initialization & Lane Constraints
    this.player.reset();
    this.player.setLaneLimit(levelConfig.trackWidth);
    this.applyUpgrades();

    // Camera initial position
    this.camera.position.set(0, 5.5, 9.5);

    this.zombiesKilledInLevel = 0;
    this.comboCounter = 0;

    // Spawn Pickups and Lore Terminals
    this.pickups.spawnLevelPickups(levelConfig.pickups, levelConfig.loreDataPads);

    // Spawn Environmental Hazards & Maze Walls
    this.hazards.spawnLevelHazards(levelConfig.hazards);

    // Spawn Multiplication & Arithmetic Gates
    this.gatePairs = [];
    if (levelConfig.gates) {
      levelConfig.gates.forEach(gCfg => {
        const gp = new GatePair(this.scene, gCfg.z, gCfg.left, gCfg.right);
        this.gatePairs.push(gp);
      });
    }

    // Initialize Empty Zombie Mobs (Zombies are triggered dynamically based on distance!)
    this.zombieMobs = [];

    this.updateHUDDisplay();
  }

  onShoot(leftMuzzle, rightMuzzle, damage, spread, isEmergency = false) {
    this.bullets.spawnPlayerShots(leftMuzzle, rightMuzzle, damage, spread);
    this.particles.createMuzzleFlash(leftMuzzle);
    this.particles.createMuzzleFlash(rightMuzzle);
    sound.playShoot();
  }

  loop(timestamp) {
    requestAnimationFrame((t) => this.loop(t));

    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.state === 'PLAYING') {
      this.updatePlaying(dt);
    }

    // Always update visual particles
    this.particles.update(dt);

    // Smooth Camera Follow
    this.updateCamera(dt);

    // Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  updatePlaying(dt) {
    // Keyboard lateral movement
    if (this.keys.left) this.player.moveByDeltaX(-18 * dt);
    if (this.keys.right) this.player.moveByDeltaX(18 * dt);

    // Update Player & Automatic firing
    this.player.update(dt, (lMuzzle, rMuzzle, damage, spread, isEmergency) => {
      this.onShoot(lMuzzle, rMuzzle, damage, spread, isEmergency);
    });

    // Directional light follows player forward
    this.dirLight.position.z = this.player.position.z + 15;
    this.dirLight.target.position.z = this.player.position.z;
    this.dirLight.target.updateMatrixWorld();

    // Update Projectiles
    this.bullets.update(dt, this.player.position.z);

    // Update Pickups and Hazards
    this.pickups.update(dt, this.player.position);
    this.hazards.update(dt);

    // Update Gates
    this.gatePairs.forEach(gp => gp.update(dt, this.player.position.z));

    // Update Zombie Mobs
    this.zombieMobs.forEach(mob => mob.update(dt, this.player.position.z));

    // Check Trigger-Based Zombie Spawning!
    this.checkDistanceTriggers();

    // Check Collisions
    this.handleCollisions();

    // Track Progress & HUD Update
    this.updateHUDDisplay();

    // Check Victory Condition (Player crossed finish line)
    if (this.player.position.z <= this.finishZ) {
      this.onVictory();
    }
  }

  checkDistanceTriggers() {
    const playerZ = this.player.position.z;
    const triggers = this.currentLevelConfig.triggers || [];

    triggers.forEach(trig => {
      if (!this.activeTriggers.has(trig.id) && playerZ <= trig.triggerZ) {
        this.activeTriggers.add(trig.id);

        // Alert text and sound effect
        if (trig.alertText) {
          this.ui.showCinematicAlert(trig.alertText);
          if (trig.id.includes('alarm')) {
            sound.playAlarm();
          } else {
            sound.playZombieGrowl();
          }
        }

        // Spawn zombie mob dynamically at designated spawn point
        const mob = new ZombieMob(
          this.scene,
          trig.spawnZ,
          trig.type,
          trig.formation,
          this.currentLevel,
          trig.count
        );
        this.zombieMobs.push(mob);
      }
    });
  }

  handleCollisions() {
    const playerZ = this.player.position.z;

    // 1. Player vs Pickups (Health, Ammo, Lore, Coins)
    this.pickups.checkPlayerCollisions(this.player, (type, data, pos) => {
      if (type === 'medkit') {
        this.player.heal(data.heal || 35);
        sound.playHeal();
        this.ui.spawnFloating3DText(`+${data.heal || 35} HP ❤️`, pos, this.camera, 'positive');
      } else if (type === 'ammo') {
        this.player.addAmmo(data.ammo || 60);
        sound.playAmmo();
        this.ui.spawnFloating3DText(`+${data.ammo || 60} BALAS ⚡`, pos, this.camera, 'positive');
      } else if (type === 'coins') {
        const amt = data.coins || 30;
        this.coins += amt;
        sound.playGatePass(true);
        this.ui.spawnFloating3DText(`+${amt} 🪙`, pos, this.camera, 'multiplier');
      } else if (type === 'lore') {
        sound.playLore();
        this.coins += 25;
        this.ui.showLoreCard(data);
        this.ui.spawnFloating3DText(`LORE DESCOBERTO! +25 🪙`, pos, this.camera, 'multiplier');
      }
    });

    // 2. Hazards vs Bullets
    this.hazards.checkBulletCollisions(this.bullets, (destructPos) => {
      sound.playZombieDeath();
      this.particles.createZombieExplosion(destructPos, false);
      this.ui.spawnFloating3DText('DESTRUÍDO!', destructPos, this.camera, 'positive');
    });

    // 3. Hazards vs Player
    this.hazards.checkPlayerCollisions(this.player, (type, damage, hPos) => {
      const tookHit = this.player.takeDamage(damage);
      if (tookHit) {
        sound.playPlayerHurt();
        this.ui.triggerScreenShake(true);
        this.ui.spawnFloating3DText(`-${damage} HP`, this.player.position, this.camera, 'negative');

        if (this.player.isDead) {
          this.onDefeat(type === 'toxic' ? 'Seu veículo foi corroído por ácido químico!' : 'Seu veículo colidiu com as barricadas!');
          return;
        }
      }
    });

    // 4. Bullet vs Gates Collision
    for (const gp of this.gatePairs) {
      if (Math.abs(gp.zPosition - playerZ) > 90) continue;

      const gates = [gp.leftGate, gp.rightGate];
      for (const gate of gates) {
        for (let bIdx = this.bullets.bullets.length - 1; bIdx >= 0; bIdx--) {
          const bullet = this.bullets.bullets[bIdx];

          if (gate.checkBulletCollision(bullet)) {
            const isPos = gate.config.isPositive;
            sound.playGatePass(isPos);
            this.particles.createGateBurst(bullet.mesh.position, isPos);

            if (gate.config.type === 'multiply') {
              const spawnCount = Math.max(1, (gate.config.value - 1) * 2);
              this.bullets.duplicateAtGate(bullet, gate, spawnCount);
              this.ui.spawnFloating3DText(`x${gate.config.value}!`, gate.meshGroup.position, this.camera, 'multiplier');
            } else if (gate.config.type === 'add') {
              this.bullets.duplicateAtGate(bullet, gate, 4);
              this.ui.spawnFloating3DText(`+${gate.config.value}`, gate.meshGroup.position, this.camera, 'positive');
            } else if (gate.config.type === 'sub' || gate.config.type === 'div') {
              this.bullets.removeBullet(bIdx);
              this.ui.spawnFloating3DText(gate.config.type === 'div' ? '÷2' : `-${gate.config.value}`, gate.meshGroup.position, this.camera, 'negative');
            }
          }
        }
      }
    }

    // 5. Bullet vs Zombie Collision
    for (const mob of this.zombieMobs) {
      if (mob.isDead) continue;

      for (const zombie of mob.zombies) {
        if (zombie.isDead) continue;

        if (Math.abs(zombie.position.z - playerZ) > 85) continue;

        for (let bIdx = this.bullets.bullets.length - 1; bIdx >= 0; bIdx--) {
          const bullet = this.bullets.bullets[bIdx];

          if (zombie.checkBulletCollision(bullet)) {
            const scoreGained = zombie.takeDamage(bullet.damage);
            this.score += scoreGained;

            sound.playZombieHit();
            this.particles.createMuzzleFlash(bullet.mesh.position);
            this.ui.spawnFloating3DText(`-${bullet.damage}`, zombie.position, this.camera, 'damage');

            this.bullets.removeBullet(bIdx);

            if (zombie.isDead) {
              this.zombiesKilledInLevel++;
              this.coins += zombie.isBoss ? 60 : (zombie.variant === 'armored' ? 5 : 3);

              if (zombie.isBoss) {
                sound.playBossDefeat();
                this.particles.createZombieExplosion(zombie.position, true);
                this.ui.triggerScreenShake(true);
                this.ui.showCombo('BOSS ANIQUILADO! 💥');
              } else {
                sound.playZombieDeath();
                this.particles.createZombieExplosion(zombie.position, false);
                this.ui.triggerScreenShake(false);

                this.comboCounter++;
                if (this.comboCounter % 6 === 0) {
                  this.ui.showCombo(`COMBO x${Math.min(10, Math.floor(this.comboCounter / 3))}!`);
                }
              }
              break;
            }
          }
        }

        // 6. Player vs Living Zombie (Takes Health damage instead of instant death!)
        if (zombie.checkPlayerCollision(this.player)) {
          const dmg = zombie.isBoss ? 45 : 22;
          const tookHit = this.player.takeDamage(dmg);

          if (tookHit) {
            sound.playPlayerHurt();
            this.ui.triggerScreenShake(true);
            this.ui.spawnFloating3DText(`-${dmg} HP! 💔`, this.player.position, this.camera, 'negative');

            // Knockback zombie
            zombie.group.position.z -= 2.0;

            if (this.player.isDead) {
              this.onDefeat('A horda de zumbis destruiu seu canhão!');
              return;
            }
          }
        }
      }
    }
  }

  updateHUDDisplay() {
    const totalDist = Math.abs(this.finishZ);
    const currDist = Math.abs(this.player.position.z);
    const progressPercent = Math.min(100, (currDist / totalDist) * 100);

    // Current Sector Name based on pacing design
    let sectorText = "🧭 ZONA DE EXPLORAÇÃO SEGURA";
    const safeDist = this.currentLevelConfig.safeExplorationDistance || 180;
    if (currDist < safeDist) {
      sectorText = "🧭 ZONA DE EXPLORAÇÃO SEGURA";
    } else if (currDist < totalDist * 0.55) {
      sectorText = "⚠️ ZONA DE PRIMEIRO CONTATO";
    } else if (currDist < totalDist * 0.85) {
      sectorText = "🧟 CONFRONTO COM A HORDA";
    } else {
      sectorText = this.currentLevel === 4 ? "🚁 EXTRAÇÃO CLIMÁTICA / FUGA" : "💀 CLÍMAX / CHEFE FINAL";
    }

    this.ui.updateHUD(
      this.score,
      this.coins,
      this.currentLevelConfig,
      progressPercent,
      this.player.getEffectiveFireRate(),
      this.player.bulletDamage,
      this.bullets.getActiveCount(),
      this.player.hp,
      this.player.maxHp,
      this.player.ammo,
      this.player.maxAmmo,
      sectorText
    );
  }

  updateCamera(dt) {
    const pPos = this.player.position;
    const targetCamX = pPos.x * 0.45;
    const targetCamY = 5.2;
    const targetCamZ = pPos.z + 8.8;

    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, 10 * dt);
    this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1, 8 * dt);
    this.camera.position.z += (targetCamZ - this.camera.position.z) * Math.min(1, 18 * dt);

    this.cameraTarget.set(pPos.x * 0.3, 1.4, pPos.z - 6.0);
    this.camera.lookAt(this.cameraTarget);
  }

  onVictory() {
    this.state = 'VICTORY';
    sound.playVictory();
    this.particles.createVictoryConfetti(this.player.position);

    const bonusCoins = 80 + this.currentLevel * 40;
    this.coins += bonusCoins;

    const isCampaignComplete = this.currentLevel >= this.maxLevels;

    this.ui.showVictoryModal({
      level: this.currentLevel,
      zombiesKilled: this.zombiesKilledInLevel,
      score: this.score,
      coinsEarned: bonusCoins,
      coins: this.coins,
      firerateCost: this.getFireRateCost(),
      damageCost: this.getDamageCost()
    }, isCampaignComplete);
  }

  onDefeat(reason) {
    this.state = 'GAMEOVER';
    sound.playGameOver();
    this.ui.triggerScreenShake(true);

    const totalDist = Math.abs(this.finishZ);
    const currDist = Math.abs(this.player.position.z);
    const progressPercent = Math.min(100, (currDist / totalDist) * 100);

    this.ui.showDefeatModal({
      progress: progressPercent,
      score: this.score,
      reason: reason
    });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}

// Instantiate game on load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
