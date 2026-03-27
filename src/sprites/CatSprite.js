/**
 * CatSprite — Kedi state machine + animasyon yönetimi
 * Phaser 3 üzerinde çalışır.
 */
export default class CatSprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y, ageStage = 'adult') {
    this.scene = scene;
    this.state = 'idle';
    this._ageStage = ageStage;

    // Scale yaş aşamasına göre
    const scaleMap = { kitten: 2.0, young: 2.5, adult: 3.0 };
    const scale = scaleMap[ageStage] || 3.0;

    // Sprite oluştur
    this.sprite = scene.add.sprite(x, y, 'cat_sheet', 0)
      .setScale(scale)
      .setOrigin(0.5, 1);

    this._defineAnimations();
    this._startIdle();

    // Tween referansları
    this._bounceTween  = null;
    this._floatTween   = null;
    this._zzzGroup     = [];
    this._bubbleGroup  = [];
    this._heartGroup   = [];
    this._walkTimer    = null;
    this._sleepReturnX = undefined;
    this._sleepReturnY = undefined;
    this._busy = false;
    this._isWalking = false;

    // Aksesuarlar (3 slot)
    this._accessories = { head: null, neck: null, eyes: null };

    // Rastgele yürüme
    this._startWalkTimer();
  }

  // ── ANİMASYON TANIMLAMALARI ──────────────────────────────────────
  _defineAnimations() {
    const anims = this.scene.anims;
    const f = (nums) => nums.map(n => ({ key: 'cat_sheet', frame: n }));

    if (!anims.exists('cat_idle')) {
      anims.create({ key: 'cat_idle',     frames: f([0, 1]), frameRate: 2,   repeat: -1 });
    }
    if (!anims.exists('cat_happy')) {
      anims.create({ key: 'cat_happy',    frames: f([2, 3]), frameRate: 4,   repeat: 6 });
    }
    if (!anims.exists('cat_hungry')) {
      anims.create({ key: 'cat_hungry',   frames: f([4, 5]), frameRate: 1,   repeat: -1 });
    }
    if (!anims.exists('cat_sleeping')) {
      anims.create({ key: 'cat_sleeping', frames: f([6, 7]), frameRate: 0.5, repeat: -1 });
    }
    if (!anims.exists('cat_bathing')) {
      anims.create({ key: 'cat_bathing',  frames: f([8]),    frameRate: 1,   repeat: -1 });
    }
    if (!anims.exists('cat_dead')) {
      anims.create({ key: 'cat_dead',     frames: f([9]),    frameRate: 1,   repeat: -1 });
    }
    if (!anims.exists('cat_tired')) {
      anims.create({ key: 'cat_tired',    frames: f([10, 11]), frameRate: 1, repeat: -1 });
    }
    if (!anims.exists('cat_bored')) {
      anims.create({ key: 'cat_bored',    frames: f([12, 13]), frameRate: 0.8, repeat: -1 });
    }
    if (!anims.exists('cat_sick')) {
      anims.create({ key: 'cat_sick',     frames: f([14, 15]), frameRate: 1.5, repeat: -1 });
    }
  }

  // ── STATE GEÇİŞLERİ ─────────────────────────────────────────────
  setState(newState) {
    if (this.state === newState) return;
    const prev = this.state;
    this.state = newState;

    this._clearEffects();

    switch (newState) {
      case 'idle':     this._startIdle();    break;
      case 'happy':    this._startHappy();   break;
      case 'hungry':   this._startHungry();  break;
      case 'sleeping': this._startSleep();   break;
      case 'bathing':  this._startBath();    break;
      case 'dead':     this._startDead();    break;
      case 'tired':    this._startTired();   break;
      case 'bored':    this._startBored();   break;
      case 'sick':     this._startSick();    break;
    }
  }

  _startIdle() {
    this.sprite.play('cat_idle');

    // Yataktan uyanıyorsak, eski pozisyona yürüyerek dön
    if (this._sleepReturnX !== undefined) {
      const returnX = this._sleepReturnX;
      const returnY = this._sleepReturnY || this._baseY;
      this._sleepReturnX = undefined;
      this._sleepReturnY = undefined;
      const dir = returnX > this.sprite.x ? 1 : -1;
      this.sprite.setFlipX(dir < 0);

      const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, returnX, returnY);
      this.scene.tweens.add({
        targets: this.sprite,
        x: returnX,
        y: returnY,
        duration: dist * 6,
        ease: 'Linear',
        onComplete: () => {
          this.sprite.setFlipX(false);
          this._baseY = returnY;
          this._floatTween = this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y - 4,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        },
      });
      return;
    }

    this._floatTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 4,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _startHappy() {
    this.sprite.play('cat_happy');
    this._spawnHearts();
    this._bounceTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 18,
      duration: 200,
      yoyo: true,
      repeat: 5,
      ease: 'Power2',
      onComplete: () => {
        if (this.state === 'happy') this.setState('idle');
      },
    });
  }

  _startHungry() {
    this.sprite.play('cat_hungry');
  }

  _startTired() {
    this.sprite.play('cat_tired');
    // Hafif yavaş sallanma — uykulu his
    this._floatTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _startBored() {
    this.sprite.play('cat_bored');
    // Hafif float
    this._floatTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  _startSick() {
    this.sprite.play('cat_sick');
    // Yavaş titreşim — hasta his
    this._floatTween = this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 2,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Periyodik hapşırma efekti
    this._spawnSneeze();
  }

  _spawnSneeze() {
    const loop = () => {
      if (this.state !== 'sick' || !this.sprite.active) return;
      const sneeze = this.scene.add.text(
        this.sprite.x + 20, this.sprite.y - 90, '🤧', { fontSize: '18px' }
      ).setDepth(500);
      this.scene.tweens.add({
        targets: sneeze,
        y: sneeze.y - 25,
        alpha: 0,
        duration: 1200,
        onComplete: () => sneeze.destroy(),
      });
      this.scene.time.delayedCall(3000, loop);
    };
    this.scene.time.delayedCall(1000, loop);
  }

  _startSleep() {
    // Mevcut pozisyonu kaydet (uyandığında dönecek)
    this._sleepReturnX = this.sprite.x;
    this._sleepReturnY = this.sprite.y;

    // Yatağa doğru yürü (yatak x=420, y=248)
    const bedX = 420;
    const bedY = 248;
    const dir = bedX > this.sprite.x ? 1 : -1;
    this.sprite.setFlipX(dir < 0);
    this.sprite.play('cat_idle');

    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, bedX, bedY);
    this.scene.tweens.add({
      targets: this.sprite,
      x: bedX,
      y: bedY,
      duration: dist * 6,
      ease: 'Linear',
      onComplete: () => {
        this.sprite.setFlipX(false);
        this._baseY = bedY;
        this.sprite.play('cat_sleeping');
        this._spawnZzz();
      },
    });
  }

  _startBath() {
    this.sprite.play('cat_bathing');
    this._spawnBubbles();
  }

  _startDead() {
    this.sprite.play('cat_dead');
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  // ── EFEKTLER ─────────────────────────────────────────────────────
  _spawnHearts() {
    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(i * 120, () => {
        if (!this.sprite.active) return;
        const ox = Phaser.Math.Between(-30, 30);
        const heart = this.scene.add.image(
          this.sprite.x + ox,
          this.sprite.y - 80,
          'heart'
        ).setScale(2).setAlpha(1);
        this._heartGroup.push(heart);
        this.scene.tweens.add({
          targets: heart,
          y: heart.y - 40,
          alpha: 0,
          duration: 900,
          ease: 'Power1',
          onComplete: () => heart.destroy(),
        });
      });
    }
  }

  _spawnZzz() {
    const loop = () => {
      if (this.state !== 'sleeping' || !this.sprite.active) return;
      const zzz = this.scene.add.image(
        this.sprite.x + 30,
        this.sprite.y - 100,
        'zzz'
      ).setScale(2).setAlpha(0.9).setTint(0x90e0ef);
      this._zzzGroup.push(zzz);
      this.scene.tweens.add({
        targets: zzz,
        y: zzz.y - 30,
        x: zzz.x + 10,
        alpha: 0,
        scale: 3,
        duration: 1500,
        onComplete: () => zzz.destroy(),
      });
      this.scene.time.delayedCall(1800, loop);
    };
    this.scene.time.delayedCall(400, loop);
  }

  _spawnBubbles() {
    const loop = () => {
      if (this.state !== 'bathing' || !this.sprite.active) return;
      for (let i = 0; i < 3; i++) {
        const bx = this.sprite.x + Phaser.Math.Between(-40, 40);
        const b = this.scene.add.image(bx, this.sprite.y - 50, 'bubble')
          .setScale(Phaser.Math.FloatBetween(1, 2.5)).setAlpha(0.85);
        this._bubbleGroup.push(b);
        this.scene.tweens.add({
          targets: b,
          y: b.y - Phaser.Math.Between(30, 70),
          alpha: 0,
          duration: Phaser.Math.Between(700, 1200),
          onComplete: () => b.destroy(),
        });
      }
      this.scene.time.delayedCall(600, loop);
    };
    loop();
  }

  _clearEffects() {
    const wasBouncing = !!this._bounceTween;
    if (this._bounceTween)  { this._bounceTween.stop();  this._bounceTween  = null; }
    if (this._floatTween)   { this._floatTween.stop();   this._floatTween   = null; }
    this.scene.tweens.killTweensOf(this.sprite);
    this._isWalking = false;
    // Reset alpha
    this.sprite.setAlpha(1);
    // Bounce/float ortasında kesilmişse y'yi baseY'ye döndür
    if (wasBouncing || this._baseY) {
      this.sprite.y = this._baseY || this.sprite.y;
    }
  }

  // ── YÜRÜME ───────────────────────────────────────────────────────
  _startWalkTimer() {
    this._baseY = this.sprite.y;
    const schedule = () => {
      const delay = Phaser.Math.Between(4000, 9000);
      this._walkTimer = this.scene.time.delayedCall(delay, () => {
        if (this.state === 'idle' && !this._busy) this._doWalk();
        schedule();
      });
    };
    schedule();
  }

  _doWalk() {
    const targetX = Phaser.Math.Between(100, 380);
    const targetY = Phaser.Math.Between(250, 320);
    const dir = targetX > this.sprite.x ? 1 : -1;
    this.sprite.setFlipX(dir < 0);
    this._isWalking = true;
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, targetX, targetY);
    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      duration: dist * 8,
      ease: 'Linear',
      onComplete: () => {
        this.sprite.setFlipX(false);
        this._baseY = targetY;
        this._isWalking = false;
      },
    });
  }

  // ── BUSY / WALKING / AGE KONTROLÜ ───────────────────────────────
  setBusy(val) { this._busy = val; }
  get isWalking() { return this._isWalking; }
  get ageStage() { return this._ageStage; }

  setAgeStage(stage) {
    if (this._ageStage === stage) return;
    this._ageStage = stage;

    const scaleMap = { kitten: 2.0, young: 2.5, adult: 3.0 };
    const newScale = scaleMap[stage] || 3.0;
    this.sprite.setScale(newScale);

    // Animasyonları yeniden tanımla (yeni texture frame'leri için)
    this._redefineAnimations();

    // Mevcut state'i yeniden başlat
    const currentState = this.state;
    this.state = '';
    this.setState(currentState);
  }

  _redefineAnimations() {
    const anims = this.scene.anims;
    const f = (nums) => nums.map(n => ({ key: 'cat_sheet', frame: n }));

    ['cat_idle','cat_happy','cat_hungry','cat_sleeping','cat_bathing','cat_dead','cat_tired','cat_bored'].forEach(k => {
      if (anims.exists(k)) anims.remove(k);
    });

    anims.create({ key: 'cat_idle',     frames: f([0, 1]),   frameRate: 2,   repeat: -1 });
    anims.create({ key: 'cat_happy',    frames: f([2, 3]),   frameRate: 4,   repeat: 6 });
    anims.create({ key: 'cat_hungry',   frames: f([4, 5]),   frameRate: 1,   repeat: -1 });
    anims.create({ key: 'cat_sleeping', frames: f([6, 7]),   frameRate: 0.5, repeat: -1 });
    anims.create({ key: 'cat_bathing',  frames: f([8]),      frameRate: 1,   repeat: -1 });
    anims.create({ key: 'cat_dead',     frames: f([9]),      frameRate: 1,   repeat: -1 });
    anims.create({ key: 'cat_tired',    frames: f([10, 11]), frameRate: 1,   repeat: -1 });
    anims.create({ key: 'cat_bored',    frames: f([12, 13]), frameRate: 0.8, repeat: -1 });
    anims.create({ key: 'cat_sick',     frames: f([14, 15]), frameRate: 1.5, repeat: -1 });
  }

  // ── OYUNCU TIKLAMASI İLE YÜRÜME ─────────────────────────────────
  walkTo(targetX, targetY, onArrive) {
    const walkable = ['idle', 'happy', 'hungry', 'tired', 'bored', 'sick'];
    if (!walkable.includes(this.state)) return;

    targetX = Phaser.Math.Clamp(targetX, 60, 440);
    targetY = Phaser.Math.Clamp(targetY || this._baseY, 244, 340);

    // Mevcut yürüme tween'ini iptal et
    this.scene.tweens.killTweensOf(this.sprite);

    // Yönü ayarla
    const dir = targetX > this.sprite.x ? 1 : -1;
    this.sprite.setFlipX(dir < 0);
    this._isWalking = true;

    // Mesafe bazlı süre
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, targetX, targetY);

    // Yürüme tween'i (x + y)
    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      duration: dist * 6,
      ease: 'Linear',
      onComplete: () => {
        this.sprite.setFlipX(false);
        this._baseY = targetY;
        this._isWalking = false;
        if (onArrive) onArrive();
      },
    });
  }

  // ── DOKUNMA (tıklama) ────────────────────────────────────────────
  enablePointerInteraction(onPetCallback) {
    this.sprite.setInteractive();
    this.sprite.on('pointerdown', () => {
      if (this.state === 'sleeping' || this.state === 'dead') return;
      onPetCallback();
    });
    this.sprite.on('pointerover', () => {
      if (this.state !== 'dead') this.sprite.setTint(0xffe0b2);
    });
    this.sprite.on('pointerout', () => {
      this.sprite.clearTint();
    });
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  // ── AKSESUAR SİSTEMİ ──────────────────────────────────────────
  setAccessory(slot, key, texture) {
    // Varsa eskiyi kaldır
    this.removeAccessory(slot);

    const spr = this.scene.add.image(this.sprite.x, this.sprite.y, texture)
      .setScale(this.sprite.scaleX * 0.8)
      .setOrigin(0.5, 0.5)
      .setDepth(this.sprite.depth + 1);

    this._accessories[slot] = { key, sprite: spr };
    this.updateAccessories();
  }

  removeAccessory(slot) {
    if (this._accessories[slot] && this._accessories[slot].sprite) {
      this._accessories[slot].sprite.destroy();
    }
    this._accessories[slot] = null;
  }

  removeAllAccessories() {
    for (const slot of Object.keys(this._accessories)) {
      this.removeAccessory(slot);
    }
  }

  getAccessoryKeys() {
    const result = {};
    for (const [slot, data] of Object.entries(this._accessories)) {
      result[slot] = data ? data.key : null;
    }
    return result;
  }

  updateAccessories() {
    const offsets = this._getAccessoryOffsets();
    const lying = this.sprite.anims.currentAnim && this.sprite.anims.currentAnim.key === 'cat_sleeping';

    for (const [slot, data] of Object.entries(this._accessories)) {
      if (data && data.sprite && data.sprite.active) {
        if (lying) {
          data.sprite.setVisible(false);
        } else {
          data.sprite.setVisible(true);
          const offset = offsets[slot];
          data.sprite.setPosition(
            this.sprite.x + (this.sprite.flipX ? -offset.x : offset.x),
            this.sprite.y + offset.y
          );
          data.sprite.setDepth(this.sprite.depth + 1);
          data.sprite.setFlipX(this.sprite.flipX);
          data.sprite.setAlpha(this.sprite.alpha);
          data.sprite.setScale(this.sprite.scaleX * 0.8);
        }
      }
    }
  }

  _getAccessoryOffsets() {
    // Yaş aşamasına göre offset'ler
    const offsets = {
      kitten: {
        head: { x: 0, y: -62 },
        eyes: { x: 0, y: -50 },
        neck: { x: 0, y: -28 },
      },
      young: {
        head: { x: 0, y: -76 },
        eyes: { x: 0, y: -64 },
        neck: { x: 0, y: -42 },
      },
      adult: {
        head: { x: 0, y: -90 },
        eyes: { x: 0, y: -76 },
        neck: { x: 0, y: -50 },
      },
    };
    return offsets[this._ageStage] || offsets.adult;
  }
}
