import CatSprite from '../sprites/CatSprite.js';
import StatsUI   from '../ui/StatsUI.js';
import { soundManager } from '../audio/SoundManager.js';
import { generateCatSheet } from './BootScene.js';

const SAVE_KEY = 'kedi_tamagotchi_save';

// Stat azalma hızları (her tick = 1 saniye)
const DECAY = {
  hunger:      1 / 30,   // 30 saniyede 1 puan
  happiness:   1 / 45,
  energy:      1 / 60,
  cleanliness: 1 / 90,
  fun:         1 / 40,   // 40 saniyede 1 puan
};

// Eylem artışları
const GAIN = {
  feed:    { hunger: 30 },
  pet:     { happiness: 20 },
  bath:    { cleanliness: 40 },
  sleep_per_tick: { energy: 1 / 5 }, // uyurken enerji kazanır
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this._initData = data || {};
    this._stats = this._loadStats();
    this._sleeping = false;
    this._dead = false;
    this._actionLocked = false;

    // Kedi adı ve rengi — IntroScene'den veya save'den
    const save = this._loadRaw();
    this._catName  = this._initData.catName  || (save && save.catName)  || 'Misir';
    this._catColor = this._initData.catColor || (save && save.catColor) || 'orange';

    // Tuvalet sistemi
    this._litterDirt = (save && save.litterDirt !== undefined) ? save.litterDirt : 0;
    this._poopSprites = [];
    this._litterSprite = null;
    this._toiletTimer = null;
    this._catInToilet = false;

    // Sekme arka plan takibi
    this._lastActiveTime = null;
    this._resetting = false;

    // Kedi yaş aşaması
    this._birthDate   = (save && save.birthDate)   || new Date().toISOString();
    const diffDays = Math.floor((Date.now() - new Date(this._birthDate)) / (1000*60*60*24));
    this._currentAgeStage = diffDays <= 2 ? 'kitten' : diffDays <= 6 ? 'young' : 'adult';

    // Kedi kimlik kartı istatistikleri
    this._totalFeeds  = (save && save.totalFeeds)  || 0;
    this._totalPets   = (save && save.totalPets)   || 0;
    this._totalGames  = (save && save.totalGames)  || 0;
    this._totalBaths  = (save && save.totalBaths)  || 0;
    this._totalCleans = (save && save.totalCleans) || 0;
  }

  create() {
    // Kedi adı başlığını güncelle + tıklama ile kimlik kartı
    document.getElementById('cat-name-display').textContent = this._catName;
    document.getElementById('cat-name-display').addEventListener('click', () => {
      this._showIdCard();
    });

    // Arkaplan
    this.add.image(0, 0, 'room_bg').setOrigin(0, 0);

    // Gece modu elementleri (arkaplanın üstünde, kedinin altında)
    this._createNightElements();

    // Kedi (yaş aşamasına göre scale)
    this._cat = new CatSprite(this, 240, 270, this._currentAgeStage);
    this._petTriggered = false;
    this._cat.enablePointerInteraction(() => this._onCatPet());

    // Oda tıklama — kedi tıklanan yere yürüsün
    this._uiTriggered = false;
    this.input.on('pointerdown', (ptr) => {
      if (this._petTriggered || this._uiTriggered) {
        this._petTriggered = false;
        this._uiTriggered = false;
        return;
      }
      if (this._sleeping || this._dead || this._catInToilet) return;
      this._cat.walkTo(ptr.x, ptr.y);
    });

    // UI
    this._ui = new StatsUI();
    this._ui.update(this._stats);
    this._ui.updateSleepButtons(false);

    // Buton bağlantıları
    this._bindButtons();

    // Yiyecek görseli (kase, dekoratif)
    this.add.image(80, 248, 'food').setScale(2).setAlpha(0.85).setDepth(248);

    // Kedi tuvaleti
    this._createLitterBox();

    // Stat azalma timer (saniyede bir tick)
    this.time.addEvent({
      delay: 1000,
      callback: this._tick,
      callbackScope: this,
      loop: true,
    });

    // Uyku kazanım timer
    this._sleepGainTimer = this.time.addEvent({
      delay: 1000,
      callback: this._sleepTick,
      callbackScope: this,
      loop: true,
      paused: true,
    });

    // Otomatik kayıt — 10 saniyede bir
    this.time.addEvent({
      delay: 10000,
      callback: this._save,
      callbackScope: this,
      loop: true,
    });

    // Başlangıçta stat'a göre durum belirle
    this._evaluateCatState();

    // Büyüme kontrolü (5 dakikada bir, yetişkin olunca durur)
    if (this._currentAgeStage !== 'adult') {
      this._growthTimer = this.time.addEvent({
        delay: 300000,
        callback: this._checkGrowth,
        callbackScope: this,
        loop: true,
      });
    }

    // ── SEKME ARKA PLAN TAKİBİ ──────────────────────────────────
    document.addEventListener('visibilitychange', () => {
      if (this._resetting) return;
      if (document.hidden) {
        this._lastActiveTime = Date.now();
        this._save();
      } else {
        this._applyOfflineDecay();
      }
    });

    // ── SES ──────────────────────────────────────────────────────
    this._soundInited = false;
    this._warningPlayed = false;

    // Müzik butonu
    const bgmBtn = document.getElementById('btn-mute-bgm');
    bgmBtn.textContent = soundManager.bgmMuted ? '🎵❌' : '🎵';
    bgmBtn.addEventListener('click', () => {
      this._ensureSound();
      const muted = soundManager.toggleBGM();
      bgmBtn.textContent = muted ? '🎵❌' : '🎵';
    });

    // Ses efektleri butonu
    const sfxBtn = document.getElementById('btn-mute-sfx');
    sfxBtn.textContent = soundManager.sfxMuted ? '🔇' : '🔊';
    sfxBtn.addEventListener('click', () => {
      this._ensureSound();
      const muted = soundManager.toggleSFX();
      sfxBtn.textContent = muted ? '🔇' : '🔊';
    });

    // Sıfırla butonu
    document.getElementById('btn-reset').addEventListener('click', () => {
      if (confirm('Oyunu sifirlamak istediginize emin misiniz?')) {
        this._resetting = true;
        localStorage.removeItem(SAVE_KEY);
        localStorage.removeItem('kedi_bgm_muted');
        localStorage.removeItem('kedi_sfx_muted');
        soundManager.stopBGM();
        location.reload();
      }
    });

    // Dolap butonu
    document.getElementById('btn-wardrobe').addEventListener('click', () => {
      this._ensureSound();
      soundManager.playClick();
      this._openWardrobe();
    });

    // Kayıtlı aksesuarları uygula
    this._applyLoadedAccessories();

    // İlk kullanıcı etkileşiminde ses başlat
    this.input.on('pointerdown', () => this._ensureSound(), this);
  }

  update() {
    // Kedi depth'ini y pozisyonuna göre güncelle + aksesuarları takip ettir
    if (this._cat && this._cat.sprite) {
      this._cat.sprite.setDepth(this._cat.sprite.y);
      this._cat.updateAccessories();
    }
  }

  _ensureSound() {
    if (this._soundInited) {
      soundManager.resume();
      return;
    }
    this._soundInited = true;
    soundManager.init();
    soundManager.resume();
    soundManager.startBGM();
  }

  // ── STAT AZALMA ─────────────────────────────────────────────────
  _tick() {
    if (this._dead) return;
    if (this._sleeping) return; // uyurken azalma yok

    for (const key of Object.keys(DECAY)) {
      this._stats[key] = Math.max(0, this._stats[key] - DECAY[key]);
    }

    // Tuvalet çok kirliyse temizlik ekstra azalır
    if (this._litterDirt >= 4) {
      this._stats.cleanliness = Math.max(0, this._stats.cleanliness - 0.03);
    }

    // Fun düşükse happiness ekstra azalır (kedi sıkılmaktan mutsuz)
    if (this._stats.fun < 20) {
      this._stats.happiness = Math.max(0, this._stats.happiness - DECAY.happiness * 0.5);
    }

    this._ui.update(this._stats);
    this._evaluateCatState();
    this._checkDeath();
  }

  _sleepTick() {
    if (!this._sleeping || this._dead) return;
    this._stats.energy = Math.min(100, this._stats.energy + GAIN.sleep_per_tick.energy);
    // Uyurken mutluluk ve temizlik hafif azalsın
    this._stats.happiness   = Math.max(0, this._stats.happiness   - 0.005);
    this._stats.cleanliness = Math.max(0, this._stats.cleanliness - 0.003);
    this._ui.update(this._stats);

    // Enerji dolunca otomatik uyan
    if (this._stats.energy >= 100) {
      this._wakeUp(true);
    }
  }

  // ── DURUM DEĞERLENDİRME ─────────────────────────────────────────
  _evaluateCatState() {
    if (this._dead || this._sleeping) return;
    // Kedi yürüyorken state değiştirme (tween kesilir)
    if (this._cat.isWalking) return;
    // Happy animasyonu koruma süresi — 2 sn boyunca override etme
    if (this._happyUntil && Date.now() < this._happyUntil) return;

    const s = this._stats;

    // Öncelik sırasına göre yüz ifadesi belirle
    let targetState = 'idle';

    if (s.hunger < 25) {
      targetState = 'hungry';       // aç — üzgün yüz
    } else if (s.energy < 25) {
      targetState = 'tired';        // yorgun — yarı kapalı gözler
    } else if (s.cleanliness < 25) {
      targetState = 'hungry';       // kirli — üzgün yüz (aynı ifade)
    } else if (s.fun < 25) {
      targetState = 'bored';        // sıkılmış — yana bakan gözler
    }

    // Sadece farklıysa değiştir (gereksiz state geçişi önle)
    if (this._cat.state !== targetState) {
      this._cat.setState(targetState);
    }

    // Herhangi bir stat 15'in altına düşünce uyarı sesi
    const anyLow = s.hunger < 15 || s.happiness < 15 || s.energy < 15 || s.cleanliness < 15 || s.fun < 15;
    if (anyLow && !this._warningPlayed) {
      this._warningPlayed = true;
      soundManager.playWarning();
    } else if (!anyLow) {
      this._warningPlayed = false;
    }
  }

  _checkDeath() {
    const s = this._stats;
    if (s.hunger <= 0 && s.happiness <= 0 && s.energy <= 0) {
      this._dead = true;
      this._cat.setState('dead');
      soundManager.playGameOver();
      this._ui.showMessage('Kedi cok uzgun... Lutfen ilgilen!', 5000);
      // Tüm butonları devre dışı bırak (wake hariç)
      ['btn-feed','btn-pet','btn-play','btn-sleep','btn-bath','btn-wake'].forEach(id => {
        this._ui.setButtonEnabled(id, false);
      });
      // 5 saniye sonra canlandır (mercy mechanic)
      this.time.delayedCall(5000, () => {
        this._dead = false;
        this._stats.hunger      = 30;
        this._stats.happiness   = 30;
        this._stats.energy      = 30;
        this._stats.cleanliness = 30;
        this._ui.update(this._stats);
        this._cat.setState('idle');
        this._ui.updateSleepButtons(false);
        ['btn-feed','btn-pet','btn-play','btn-bath'].forEach(id => {
          this._ui.setButtonEnabled(id, true);
        });
        this._ui.showMessage('Kedi iyilesti! Dikkatli ol!', 3000);
      });
    }
  }

  // ── EYLEMLER ────────────────────────────────────────────────────
  _onCatPet() {
    this._petTriggered = true;
    if (this._actionLocked || this._dead || this._sleeping) return;
    this._applyGain({ happiness: 15 });
    this._happyUntil = Date.now() + 2000;
    this._cat.setState('happy');
    this._ui.showMessage('Mrrr... 💖', 1500);
    this._totalPets++;
    soundManager.playPurr();
    this._save();
  }

  _bindButtons() {
    const bind = (id, fn) => {
      document.getElementById(id).addEventListener('click', () => {
        this._ensureSound();
        soundManager.playClick();
        fn();
      });
    };
    bind('btn-feed',  () => this._action_feed());
    bind('btn-pet',   () => this._onCatPet());
    bind('btn-play',  () => this._action_play());
    bind('btn-sleep', () => this._action_sleep());
    bind('btn-bath',  () => this._action_bath());
    bind('btn-wake',  () => this._wakeUp(false));
  }

  _action_feed() {
    if (this._actionLocked || this._dead || this._sleeping) return;
    if (this._stats.hunger >= 95) {
      this._ui.showMessage('Kedi tok, yemek istemiyor!', 1800);
      return;
    }
    this._lockAction(1500);
    this._applyGain(GAIN.feed);
    this._happyUntil = Date.now() + 2000;
    this._cat.setState('happy');

    // Yemek animasyonu - yiyecek sprite kediye gider
    const food = this.add.image(80, 248, 'food').setScale(3);
    this.tweens.add({
      targets: food,
      x: this._cat.x,
      y: this._cat.y - 50,
      scale: 1,
      duration: 600,
      ease: 'Power2',
      onComplete: () => food.destroy(),
    });

    this._totalFeeds++;
    soundManager.playFeed();
    this._ui.showMessage('Afiyetle yedi! 🍖', 2000);
    this._save();

    // Tok olunca kısa süre sonra tuvalete gitsin
    if (this._stats.hunger >= 90) {
      this.time.delayedCall(5000, () => {
        if (!this._sleeping && !this._dead && !this._catInToilet) {
          this._catNeedToilet();
        }
      });
    }
  }

  _action_play() {
    if (this._actionLocked || this._dead || this._sleeping) return;
    if (this._stats.energy < 15) {
      this._ui.showMessage('Kedi cok yorgun, oynamak istemiyor!', 2000);
      return;
    }
    // Butonları kilitle (mini oyun sırasında basılmasın)
    this._setButtonsEnabled(false);
    // Oyun seçme ekranını aç
    this.scene.launch('GameSelectScene', {
      onSelect: (gameKey) => {
        this.scene.launch(gameKey, {
          onComplete: (bonus) => this._onMiniGameComplete(bonus),
        });
      },
      onCancel: () => {
        this._setButtonsEnabled(true);
        this.scene.resume('GameScene');
      },
    });
    this.scene.pause('GameScene');
  }

  _onMiniGameComplete(bonus) {
    soundManager.stopGameBGM();
    soundManager.startBGM();
    this.scene.resume('GameScene');
    this._setButtonsEnabled(true);
    if (bonus > 0) {
      this._totalGames++;
      this._applyGain({ happiness: 15 + bonus, energy: -10, fun: 20 + bonus });
      this._happyUntil = Date.now() + 2000;
      this._cat.setState('happy');
      this._ui.update(this._stats);
      this._ui.showMessage(`Harika! +${15 + bonus} mutluluk!`, 2000);
    } else {
      this._ui.showMessage('Oyundan ciktin.', 1500);
    }
    this._save();
  }

  _action_sleep() {
    if (this._actionLocked || this._dead || this._sleeping) return;
    this._sleeping = true;
    this._cat.setState('sleeping');
    this._ui.updateSleepButtons(true);
    this._ui.showMessage('Iyi geceler... 😴', 2000);
    soundManager.playSleep();
    this._showNight();
    this._sleepGainTimer.paused = false;
    this._save();

    // 3 saniye sonra rüya butonu göster
    this._dreamBtnTimer = this.time.delayedCall(3000, () => {
      if (this._sleeping) this._showDreamButton();
    });
  }

  _wakeUp(auto = false) {
    if (!this._sleeping) return;
    this._sleeping = false;
    this._sleepGainTimer.paused = true;
    this._cat.setState('idle');
    this._ui.updateSleepButtons(false);
    soundManager.playWake();
    this._hideNight();
    this._hideDreamButton();
    if (this._dreamBtnTimer) { this._dreamBtnTimer.remove(); this._dreamBtnTimer = null; }
    this._ui.showMessage(auto ? 'Kedi dinlendi, uyandi!' : 'Gunaydın! ☀️', 2000);
    this._save();
  }

  _action_bath() {
    if (this._actionLocked || this._dead || this._sleeping) return;
    if (this._stats.cleanliness >= 95) {
      this._ui.showMessage('Kedi zaten temiz!', 1800);
      return;
    }
    this._lockAction(3000);
    this._cat.setState('bathing');
    soundManager.playBath();
    this.time.delayedCall(2800, () => {
      this._applyGain(GAIN.bath);
      if (this._cat.state === 'bathing') this._cat.setState('idle');
      this._totalBaths++;
      this._ui.showMessage('Kupkuru temiz! 🛁', 2000);
      this._save();
    });
  }

  // ── GECE MODU ───────────────────────────────────────────────────
  _createNightElements() {
    // Tüm ekranı kaplayan hafif karanlık overlay
    this._nightOverlay = this.add.rectangle(0, 0, 480, 360, 0x0a0a1e)
      .setOrigin(0, 0).setAlpha(0).setDepth(0);

    // Pencere üzerine gece gökyüzü (pencere: x=30, y=30, w=90, h=70)
    this._nightWindow = this.add.rectangle(75, 65, 90, 70, 0x0a1628)
      .setAlpha(0).setDepth(1);

    // Ay (pencere içinde)
    this._moon = this.add.image(60, 50, 'moon')
      .setScale(2.5).setAlpha(0).setDepth(2);

    // Yıldızlar (pencere içinde)
    this._stars = [];
    const starPositions = [
      { x: 42, y: 42 }, { x: 95, y: 38 },
      { x: 55, y: 72 }, { x: 82, y: 55 },
      { x: 105, y: 75 }, { x: 70, y: 40 },
    ];
    starPositions.forEach(pos => {
      const star = this.add.image(pos.x, pos.y, 'star')
        .setScale(Phaser.Math.FloatBetween(1, 1.8))
        .setAlpha(0).setDepth(2);
      this._stars.push(star);
    });

    this._isNight = false;
  }

  _showNight() {
    if (this._isNight) return;
    this._isNight = true;

    // Oda karanlık overlay
    this.tweens.add({
      targets: this._nightOverlay,
      alpha: 0.3,
      duration: 800,
      ease: 'Sine.easeInOut',
    });

    // Pencere gece gökyüzü
    this.tweens.add({
      targets: this._nightWindow,
      alpha: 0.9,
      duration: 800,
      ease: 'Sine.easeInOut',
    });

    // Ay belirsin
    this.tweens.add({
      targets: this._moon,
      alpha: 1,
      duration: 1000,
      delay: 300,
      ease: 'Sine.easeInOut',
    });

    // Yıldızlar belirsin + twinkle
    this._stars.forEach((star, i) => {
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.6, 1),
        duration: 600,
        delay: 400 + i * 120,
        ease: 'Sine.easeInOut',
      });
      // Twinkle efekti
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.3, 0.5),
        duration: Phaser.Math.Between(800, 1500),
        delay: 1200 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  _hideNight() {
    if (!this._isNight) return;
    this._isNight = false;

    // Tüm twinkle tween'lerini durdur
    this._stars.forEach(star => {
      this.tweens.killTweensOf(star);
    });

    // Overlay fade-out
    this.tweens.add({
      targets: this._nightOverlay,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeInOut',
    });

    // Pencere fade-out
    this.tweens.add({
      targets: this._nightWindow,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeInOut',
    });

    // Ay fade-out
    this.tweens.add({
      targets: this._moon,
      alpha: 0,
      duration: 500,
      ease: 'Sine.easeInOut',
    });

    // Yıldızlar fade-out
    this._stars.forEach((star, i) => {
      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: 400,
        delay: i * 50,
        ease: 'Sine.easeInOut',
      });
    });
  }

  // ── AKSESUAR / DOLAP SİSTEMİ ─────────────────────────────────────
  _openWardrobe() {
    if (this.scene.isActive('WardrobeScene')) return;

    this.scene.launch('WardrobeScene', {
      catSprite: this._cat,
      currentSlots: this._cat.getAccessoryKeys(),
      ageStage: this._currentAgeStage,
      onClose: (slots) => {
        // Kapanınca kaydet
        this._save();
      },
    });
  }

  _applyLoadedAccessories() {
    try {
      const save = this._loadRaw();
      if (!save || !save.accessories) return;

      const ACCESSORY_TEXTURES = {
        hat: 'acc_hat', ribbon: 'acc_ribbon', crown: 'acc_crown', flower: 'acc_flower',
        bowtie: 'acc_bowtie', collar: 'acc_collar', scarf: 'acc_scarf',
        sunglasses: 'acc_sunglasses', glasses: 'acc_glasses',
      };

      for (const [slot, key] of Object.entries(save.accessories)) {
        if (key && ACCESSORY_TEXTURES[key]) {
          this._cat.setAccessory(slot, key, ACCESSORY_TEXTURES[key]);
        }
      }
    } catch (e) {
      console.warn('Aksesuar yukleme hatasi:', e);
    }
  }

  // ── BÜYÜME SİSTEMİ ──────────────────────────────────────────────
  _checkGrowth() {
    // Zaten yetişkinse kontrol etme, timer'ı kaldır
    if (this._currentAgeStage === 'adult') {
      if (this._growthTimer) {
        this._growthTimer.remove();
        this._growthTimer = null;
      }
      return;
    }

    const diffDays = Math.floor((Date.now() - new Date(this._birthDate)) / (1000*60*60*24));
    const newStage = diffDays <= 2 ? 'kitten' : diffDays <= 6 ? 'young' : 'adult';

    if (newStage !== this._currentAgeStage) {
      const oldStage = this._currentAgeStage;
      this._currentAgeStage = newStage;

      // Sprite sheet'i yeni yaş aşamasıyla yeniden üret
      generateCatSheet(this, this._catColor, newStage);

      // Kedi sprite'ı güncelle
      this._cat.setAgeStage(newStage);

      // Kutlama!
      this._celebrateGrowth(newStage);
    }
  }

  _celebrateGrowth(stage) {
    const stageNames = { kitten: 'yavru', young: 'genc', adult: 'yetiskin' };
    const name = stageNames[stage] || stage;

    // Ses
    soundManager.playGrowth();

    // Mesaj
    this._ui.showMessage(`Kedin buyudu! Artik ${name} bir kedi!`, 4000);

    // Happy state (2 sn koruma)
    this._happyUntil = Date.now() + 3000;
    this._cat.setState('happy');

    // Yıldız efektleri (kedinin etrafında)
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 100, () => {
        const sx = this._cat.x + Phaser.Math.Between(-40, 40);
        const sy = this._cat.y - Phaser.Math.Between(20, 80);
        const star = this.add.image(sx, sy, 'star').setScale(3).setTint(0xffd166).setDepth(500);
        this.tweens.add({
          targets: star,
          y: star.y - 30,
          alpha: 0,
          scale: 5,
          duration: 800,
          ease: 'Power1',
          onComplete: () => star.destroy(),
        });
      });
    }

    // Ekran hafif beyaz flash
    const flash = this.add.rectangle(240, 180, 480, 360, 0xffffff, 0.4).setDepth(499);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 600,
      onComplete: () => flash.destroy(),
    });
  }

  // ── KİMLİK KARTI ────────────────────────────────────────────────
  _showIdCard() {
    // Zaten açıksa tekrar açma
    if (this.scene.isActive('IdCardScene')) return;

    this.scene.launch('IdCardScene', {
      catName: this._catName,
      catColor: this._catColor,
      birthDate: this._birthDate,
      ageStage: this._currentAgeStage,
      totalFeeds: this._totalFeeds,
      totalPets: this._totalPets,
      totalGames: this._totalGames,
      totalBaths: this._totalBaths,
      totalCleans: this._totalCleans,
    });
  }

  // ── TUVALET SİSTEMİ ──────────────────────────────────────────────
  _createLitterBox() {
    this._litterSprite = this.add.image(50, 310, 'litter_clean')
      .setScale(2.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(310);

    this._litterSprite.on('pointerdown', () => this._cleanLitterBox());
    this._litterSprite.on('pointerover', () => this._litterSprite.setTint(0xddddff));
    this._litterSprite.on('pointerout',  () => this._litterSprite.clearTint());

    // Mevcut kirlliği uygula (save'den yüklenen)
    this._updateLitterVisual();

    // Tuvalet ihtiyacı timer'ı başlat
    this._scheduleToiletNeed();
  }

  _scheduleToiletNeed() {
    const delay = Phaser.Math.Between(120000, 180000); // 2-3 dakika
    this._toiletTimer = this.time.delayedCall(delay, () => {
      if (!this._sleeping && !this._dead && !this._catInToilet) {
        this._catNeedToilet();
      }
      this._scheduleToiletNeed(); // tekrar planla
    });
  }

  _catNeedToilet() {
    if (this._catInToilet) return;

    if (this._litterDirt >= 4) {
      // Tuvalet çok kirli, kedi gitmek istemiyor
      this._ui.showMessage('Tuvalet cok kirli! Temizle!', 2500);
      soundManager.playWarning();
      return;
    }

    this._catInToilet = true;
    this._cat.setBusy(true);
    this._ui.showMessage('Kedi tuvalete gidiyor...', 1500);

    // Kedi tuvalete yürüsün
    this._cat.walkTo(50, 310, () => this._catUseToilet());
  }

  _catUseToilet() {
    if (!this._catInToilet) return;

    // Yaş aşamasına göre dinamik scale
    const normalScale = { kitten: 2.0, young: 2.5, adult: 3.0 }[this._currentAgeStage] || 3.0;

    // Kedi küçülür (tuvalete girdi hissi)
    this.tweens.add({
      targets: this._cat.sprite,
      scaleX: normalScale * 0.5,
      scaleY: normalScale * 0.5,
      alpha: 0.4,
      duration: 300,
    });

    // 2.5 sn bekle
    this.time.delayedCall(2500, () => {
      // Normal boyuta dön
      this.tweens.add({
        targets: this._cat.sprite,
        scaleX: normalScale,
        scaleY: normalScale,
        alpha: 1,
        duration: 300,
      });

      // Temizlik düş + kirllik art
      this._applyGain({ cleanliness: -20 });
      this._litterDirt = Math.min(5, this._litterDirt + 1);
      this._updateLitterVisual();
      this._catInToilet = false;
      this._cat.setBusy(false);
      this._ui.showMessage('Kedi tuvaleti kullandi!', 2000);
      this._save();
    });
  }

  _cleanLitterBox() {
    this._uiTriggered = true;
    if (this._litterDirt === 0) {
      this._ui.showMessage('Tuvalet zaten temiz!', 1500);
      return;
    }
    this._litterDirt = 0;
    this._updateLitterVisual();
    this._totalCleans++;
    soundManager.playBath();
    this._ui.showMessage('Tuvalet temizlendi! ✨', 2000);
    this._save();

    // Kediler temiz tuvaleti hemen kullanmaya bayılır!
    this.time.delayedCall(5000, () => {
      if (!this._sleeping && !this._dead && !this._catInToilet) {
        this._ui.showMessage('Temiz tuvalet! Kedi hemen kullaniyor...', 1800);
        this.time.delayedCall(2000, () => {
          if (!this._sleeping && !this._dead && !this._catInToilet) {
            this._catNeedToilet();
          }
        });
      }
    });
  }

  _updateLitterVisual() {
    // Tuvalet texture güncelle
    if (this._litterDirt <= 1) {
      this._litterSprite.setTexture('litter_clean');
    } else if (this._litterDirt <= 3) {
      this._litterSprite.setTexture('litter_dirty');
    } else {
      this._litterSprite.setTexture('litter_filthy');
    }

    // Mevcut kakaları temizle
    this._poopSprites.forEach(p => p.destroy());
    this._poopSprites = [];

    // Kirliliğe göre kaka sprite'ları ekle
    const poopPositions = [
      { x: 50, y: 290 },   // üst
      { x: 32, y: 315 },   // ön/sol
      { x: 72, y: 308 },   // sağ
    ];

    const poopCount = this._litterDirt <= 1 ? 0 :
                      this._litterDirt === 2 ? 1 :
                      this._litterDirt === 3 ? 2 : 3;

    for (let i = 0; i < poopCount; i++) {
      const pos = poopPositions[i];
      const poop = this.add.image(pos.x, pos.y, 'poop')
        .setScale(2)
        .setDepth(pos.y);
      this._poopSprites.push(poop);
    }
  }

  // ── RÜYA SİSTEMİ ────────────────────────────────────────────────
  _showDreamButton() {
    if (!this._sleeping || this._dreamBtn) return;

    this._dreamBtn = this.add.text(this._cat.x, this._cat.y - 110, '💭 Ruya Gor', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffd166',
      backgroundColor: 'rgba(30,20,50,0.85)', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    // Pulse animasyonu
    this.tweens.add({
      targets: this._dreamBtn,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this._dreamBtn.on('pointerover', () => this._dreamBtn.setStyle({ fill: '#ffffff' }));
    this._dreamBtn.on('pointerout',  () => this._dreamBtn.setStyle({ fill: '#ffd166' }));
    this._dreamBtn.on('pointerdown', () => this._startDream());
  }

  _hideDreamButton() {
    if (this._dreamBtn) {
      this.tweens.killTweensOf(this._dreamBtn);
      this._dreamBtn.destroy();
      this._dreamBtn = null;
    }
  }

  _startDream() {
    this._hideDreamButton();
    soundManager.playClick();
    this.scene.launch('DreamMiniGame', {
      onComplete: (energyBonus) => this._onDreamComplete(energyBonus),
    });
  }

  _onDreamComplete(energyBonus) {
    this._applyGain({ energy: energyBonus });
    this._ui.update(this._stats);
    this._ui.showMessage(`Guzel ruyalar! +${energyBonus} enerji!`, 2500);
    this._save();

    // Enerji dolunca otomatik uyan
    if (this._stats.energy >= 100) {
      this._wakeUp(true);
      return;
    }

    // Hâlâ uyuyorsa 3 sn sonra tekrar rüya butonu göster
    this._dreamBtnTimer = this.time.delayedCall(3000, () => {
      if (this._sleeping) this._showDreamButton();
    });
  }

  // ── YARDIMCILAR ─────────────────────────────────────────────────
  _applyGain(gains) {
    for (const [key, val] of Object.entries(gains)) {
      if (this._stats[key] !== undefined) {
        this._stats[key] = Math.max(0, Math.min(100, this._stats[key] + val));
      }
    }
    this._ui.update(this._stats);
  }

  _applyOfflineDecay() {
    try {
    if (!this._lastActiveTime) return;
    const elapsed = (Date.now() - this._lastActiveTime) / 1000;
    this._lastActiveTime = null;

    if (elapsed < 5) return; // 5 saniyeden az ise hesaplama yapma

    if (!this._sleeping) {
      for (const key of Object.keys(DECAY)) {
        this._stats[key] = Math.max(0, this._stats[key] - elapsed * DECAY[key]);
      }
      // Fun düşükse happiness ekstra azalır
      if (this._stats.fun < 20) {
        this._stats.happiness = Math.max(0, this._stats.happiness - elapsed * DECAY.happiness * 0.5);
      }
      // Kirli tuvalet cezası
      if (this._litterDirt >= 4) {
        this._stats.cleanliness = Math.max(0, this._stats.cleanliness - elapsed * 0.03);
      }
    } else {
      // Uyuyorduysa enerji kazan (maks 30)
      const energyGain = Math.min(30, elapsed * GAIN.sleep_per_tick.energy);
      this._stats.energy = Math.min(100, this._stats.energy + energyGain);
      this._stats.happiness   = Math.max(0, this._stats.happiness   - elapsed * 0.005);
      this._stats.cleanliness = Math.max(0, this._stats.cleanliness - elapsed * 0.003);
      this._stats.fun         = Math.max(0, this._stats.fun         - elapsed * DECAY.fun);
    }

    this._ui.update(this._stats);
    this._evaluateCatState();
    this._save();

    // Bildirim
    const mins = Math.floor(elapsed / 60);
    if (mins >= 1) {
      this._ui.showMessage(`${mins} dakika uzaktaydin!`, 2500);
    }
    } catch (e) {
      console.warn('Offline decay hatasi:', e);
    }
  }

  _setButtonsEnabled(enabled) {
    ['btn-feed','btn-pet','btn-play','btn-sleep','btn-bath','btn-wake'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = !enabled;
    });
  }

  _lockAction(ms) {
    this._actionLocked = true;
    this.time.delayedCall(ms, () => { this._actionLocked = false; });
  }

  // ── KAYIT / YÜKLEME ─────────────────────────────────────────────
  _save() {
    if (this._resetting) return;
    const data = {
      stats: this._stats,
      sleeping: this._sleeping,
      savedAt: Date.now(),
      catName: this._catName,
      catColor: this._catColor,
      litterDirt: this._litterDirt,
      birthDate: this._birthDate,
      totalFeeds: this._totalFeeds,
      totalPets: this._totalPets,
      totalGames: this._totalGames,
      totalBaths: this._totalBaths,
      totalCleans: this._totalCleans,
      accessories: this._cat ? this._cat.getAccessoryKeys() : { head: null, neck: null, eyes: null },
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  _loadStats() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this._defaultStats();
      const data = JSON.parse(raw);

      // Çevrimdışı geçen zamanı hesapla
      const elapsed = (Date.now() - (data.savedAt || Date.now())) / 1000;
      const s = data.stats || this._defaultStats();

      // Eski save uyumluluğu — fun yoksa default ver
      if (s.fun === undefined) s.fun = 80;

      if (!data.sleeping) {
        // Uyumuyordu, zamanla azalt
        s.hunger      = Math.max(0, s.hunger      - elapsed * DECAY.hunger);
        s.happiness   = Math.max(0, s.happiness   - elapsed * DECAY.happiness);
        s.energy      = Math.max(0, s.energy      - elapsed * DECAY.energy);
        s.cleanliness = Math.max(0, s.cleanliness - elapsed * DECAY.cleanliness);
        s.fun         = Math.max(0, s.fun         - elapsed * DECAY.fun);
      } else {
        // Uyuyordu — enerji kazan (maks 30 puan çevrimdışı artış)
        const energyGain = Math.min(30, elapsed * GAIN.sleep_per_tick.energy);
        s.energy = Math.min(100, s.energy + energyGain);
        // Uyurken de happiness, cleanliness ve fun hafif azalır
        s.happiness   = Math.max(0, s.happiness   - elapsed * 0.005);
        s.cleanliness = Math.max(0, s.cleanliness - elapsed * 0.003);
        s.fun         = Math.max(0, (s.fun || 80) - elapsed * DECAY.fun);
      }
      return s;
    } catch (e) {
      return this._defaultStats();
    }
  }

  _defaultStats() {
    return { hunger: 80, happiness: 80, energy: 80, cleanliness: 80, fun: 80 };
  }

  _loadRaw() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
}
