import * as THREE from 'three';

/**
 * UI Manager
 * Handles HUD updates, Resource Bars (HP, Ammo), Sector Trackers,
 * Holographic Lore Popups, Cinematic Wave Alerts, and Victory/Defeat Modals.
 */
export class UIManager {
  constructor() {
    // DOM Elements
    this.gameContainer = document.getElementById('game-container');
    this.floatingContainer = document.getElementById('floating-text-container');

    // HUD Elements
    this.levelNum = document.getElementById('level-num');
    this.levelNameVal = document.getElementById('level-name-val');
    this.levelSubtitleVal = document.getElementById('level-subtitle-val');
    this.scoreVal = document.getElementById('score-val');
    this.coinsVal = document.getElementById('coins-val');
    this.progressFill = document.getElementById('progress-fill');
    this.runnerIcon = document.getElementById('runner-icon');
    this.progressText = document.getElementById('progress-text');
    this.sectorStatus = document.getElementById('sector-status');

    // Resources
    this.hpFill = document.getElementById('hp-fill');
    this.hpText = document.getElementById('hp-text');
    this.ammoFill = document.getElementById('ammo-fill');
    this.ammoText = document.getElementById('ammo-text');

    this.fireRateVal = document.getElementById('firerate-val');
    this.damageVal = document.getElementById('damage-val');
    this.activeBulletsVal = document.getElementById('active-bullets-val');
    this.dragHint = document.getElementById('drag-hint');
    this.comboBanner = document.getElementById('combo-banner');
    this.comboText = document.getElementById('combo-text');
    this.soundBtn = document.getElementById('sound-btn');

    // Cinematic & Lore
    this.cinematicAlert = document.getElementById('cinematic-alert');
    this.cinematicAlertText = document.getElementById('cinematic-alert-text');
    this.loreCard = document.getElementById('lore-card');
    this.loreTitle = document.getElementById('lore-title');
    this.loreBody = document.getElementById('lore-body');
    this.loreCloseBtn = document.getElementById('lore-close-btn');

    if (this.loreCloseBtn) {
      this.loreCloseBtn.addEventListener('click', () => {
        this.hideLoreCard();
      });
    }

    // Modals
    this.startScreen = document.getElementById('start-screen');
    this.victoryScreen = document.getElementById('victory-screen');
    this.defeatScreen = document.getElementById('defeat-screen');

    // Victory Elements
    this.victoryMainTitle = document.getElementById('victory-main-title');
    this.victorySubTitle = document.getElementById('victory-sub-title');
    this.vZombies = document.getElementById('v-zombies-count');
    this.vScore = document.getElementById('v-score-count');
    this.vCoins = document.getElementById('v-coins-count');
    this.firerateCost = document.getElementById('firerate-cost');
    this.damageCost = document.getElementById('damage-cost');
    this.btnNextLevel = document.getElementById('btn-next-level');

    // Defeat Elements
    this.dProgress = document.getElementById('d-progress-val');
    this.dScore = document.getElementById('d-score-val');
    this.defeatReason = document.getElementById('defeat-reason');

    // Scratch vector for 3D projection
    this.projVec = new THREE.Vector3();
    this.comboTimeout = null;
    this.alertTimeout = null;
    this.loreTimeout = null;
  }

  updateHUD(score, coins, levelConfig, progressPercent, fireRate, damage, activeBullets, hp, maxHp, ammo, maxAmmo, sectorText) {
    this.scoreVal.textContent = Math.round(score);
    this.coinsVal.textContent = Math.round(coins);
    this.levelNum.textContent = levelConfig.id;

    if (this.levelNameVal) this.levelNameVal.textContent = levelConfig.name;
    if (this.levelSubtitleVal) this.levelSubtitleVal.textContent = levelConfig.subtitle;

    // HP Bar
    const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
    if (this.hpFill) {
      this.hpFill.style.width = `${Math.round(hpRatio * 100)}%`;
      if (hpRatio < 0.3) {
        this.hpFill.style.background = 'linear-gradient(90deg, #dc2626, #ef4444)';
      } else {
        this.hpFill.style.background = 'linear-gradient(90deg, #16a34a, #22c55e)';
      }
    }
    if (this.hpText) this.hpText.textContent = `${Math.round(hp)}/${maxHp}`;

    // Ammo Bar
    const ammoRatio = Math.max(0, Math.min(1, ammo / maxAmmo));
    if (this.ammoFill) {
      this.ammoFill.style.width = `${Math.round(ammoRatio * 100)}%`;
      if (ammo <= 0) {
        this.ammoFill.style.background = 'linear-gradient(90deg, #ef4444, #f97316)';
      } else {
        this.ammoFill.style.background = 'linear-gradient(90deg, #0284c7, #00f7ff)';
      }
    }
    if (this.ammoText) {
      this.ammoText.textContent = ammo <= 0 ? 'EMERGÊNCIA!' : `${Math.round(ammo)}/${maxAmmo}`;
    }

    // Progress Bar
    const clampedProg = Math.max(0, Math.min(100, Math.round(progressPercent)));
    this.progressFill.style.width = `${clampedProg}%`;
    this.runnerIcon.style.left = `${clampedProg}%`;
    this.progressText.textContent = `${clampedProg}%`;

    if (this.sectorStatus && sectorText) {
      this.sectorStatus.textContent = sectorText;
    }

    this.fireRateVal.textContent = fireRate;
    this.damageVal.textContent = damage;
    this.activeBulletsVal.textContent = activeBullets;
  }

  showCinematicAlert(text) {
    if (!this.cinematicAlert) return;
    this.cinematicAlertText.textContent = text;
    this.cinematicAlert.classList.remove('hidden');

    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      this.cinematicAlert.classList.add('hidden');
    }, 2400);
  }

  showLoreCard(loreData) {
    if (!this.loreCard) return;
    this.loreTitle.textContent = loreData.title || "ARQUIVO DE SOBREVIVENTE";
    this.loreBody.textContent = loreData.text || "";
    this.loreCard.classList.remove('hidden');

    if (this.loreTimeout) clearTimeout(this.loreTimeout);
    this.loreTimeout = setTimeout(() => {
      this.hideLoreCard();
    }, 6000);
  }

  hideLoreCard() {
    if (this.loreCard) {
      this.loreCard.classList.add('hidden');
    }
  }

  hideDragHint() {
    if (this.dragHint) {
      this.dragHint.style.opacity = '0';
      setTimeout(() => {
        if (this.dragHint) this.dragHint.style.display = 'none';
      }, 400);
    }
  }

  showCombo(text) {
    if (!this.comboBanner) return;
    this.comboText.textContent = text;
    this.comboBanner.classList.remove('hidden');

    if (this.comboTimeout) clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => {
      this.comboBanner.classList.add('hidden');
    }, 1200);
  }

  // Camera screen shake
  triggerScreenShake(isHeavy = false) {
    const cls = isHeavy ? 'screen-shake-heavy' : 'screen-shake-light';
    this.gameContainer.classList.remove('screen-shake-light', 'screen-shake-heavy');
    void this.gameContainer.offsetWidth;
    this.gameContainer.classList.add(cls);

    setTimeout(() => {
      this.gameContainer.classList.remove(cls);
    }, isHeavy ? 300 : 150);
  }

  spawnFloating3DText(text, worldPos, camera, type = 'positive') {
    this.projVec.copy(worldPos);
    this.projVec.project(camera);

    if (this.projVec.z > 1) return;

    const x = (this.projVec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-(this.projVec.y * 0.5) + 0.5) * window.innerHeight;

    this.spawnFloating2DText(text, x, y, type);
  }

  spawnFloating2DText(text, x, y, type = 'positive') {
    const el = document.createElement('div');
    el.className = `floating-num ${type}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    this.floatingContainer.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 750);
  }

  showStartModal() {
    this.startScreen.classList.remove('hidden');
    this.victoryScreen.classList.add('hidden');
    this.defeatScreen.classList.add('hidden');
  }

  hideStartModal() {
    this.startScreen.classList.add('hidden');
  }

  showVictoryModal(stats, isCampaignComplete = false) {
    this.vZombies.textContent = stats.zombiesKilled;
    this.vScore.textContent = Math.round(stats.score);
    this.vCoins.textContent = `+${stats.coinsEarned} 🪙`;

    if (isCampaignComplete) {
      this.victoryMainTitle.textContent = "🏆 CAMPANHA CONCLUÍDA! 🏆";
      this.victorySubTitle.textContent = "Você aniquilou o Titã Colossal e escapou da Quarentena com vida!";
      this.btnNextLevel.textContent = "REJOGAR CAMPANHA 🔄";
    } else {
      this.victoryMainTitle.textContent = "VITÓRIA NA FASE!";
      this.victorySubTitle.textContent = `Fase ${stats.level} superada com maestria!`;
      this.btnNextLevel.textContent = "PRÓXIMA FASE ➔";
    }

    this.updateUpgradeButtons(stats.coins, stats.firerateCost, stats.damageCost);

    this.victoryScreen.classList.remove('hidden');
    this.defeatScreen.classList.add('hidden');
  }

  updateUpgradeButtons(coins, fireCost, dmgCost) {
    const btnFire = document.getElementById('btn-upgrade-firerate');
    const btnDmg = document.getElementById('btn-upgrade-damage');

    this.firerateCost.textContent = `${fireCost} 🪙`;
    this.damageCost.textContent = `${dmgCost} 🪙`;

    btnFire.disabled = coins < fireCost;
    btnDmg.disabled = coins < dmgCost;
  }

  hideVictoryModal() {
    this.victoryScreen.classList.add('hidden');
  }

  showDefeatModal(stats) {
    this.dProgress.textContent = `${Math.round(stats.progress)}%`;
    this.dScore.textContent = Math.round(stats.score);
    if (stats.reason) this.defeatReason.textContent = stats.reason;

    this.defeatScreen.classList.remove('hidden');
    this.victoryScreen.classList.add('hidden');
  }

  hideDefeatModal() {
    this.defeatScreen.classList.add('hidden');
  }
}
