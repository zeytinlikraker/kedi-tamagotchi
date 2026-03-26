import { soundManager } from '../audio/SoundManager.js';

/**
 * DreamMiniGame — Rüya Mini Oyunu
 * Kedi bulutların üstünde süzülür.
 * Altın balıkları topla, kabus bulutlarından kaç.
 * 15 saniye veya kabusa çarpana kadar.
 */
export default class DreamMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'DreamMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._timeLeft = 15;
    this._gameOver = false;
    this._catY = 180;
    this._targetY = 180;
    this._collectibles = [];
    this._nightmares = [];
    this._speed = 2;
  }

  create() {
    const W = 480, H = 360;

    // Rüya arkaplanı (koyu mor gradient)
    this.add.rectangle(0, 0, W, H, 0x1a0a2e).setOrigin(0, 0);
    this.add.rectangle(0, H * 0.6, W, H * 0.4, 0x120820).setOrigin(0, 0);

    // Yıldızlar
    for (let i = 0; i < 40; i++) {
      const sx = Phaser.Math.Between(0, W);
      const sy = Phaser.Math.Between(0, H);
      const s = this.add.rectangle(sx, sy, 2, 2, 0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8));
      this.tweens.add({
        targets: s,
        alpha: Phaser.Math.FloatBetween(0.1, 0.3),
        duration: Phaser.Math.Between(600, 2000),
        yoyo: true,
        repeat: -1,
      });
    }

    // Süzülen dekor bulutları
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(40, H - 60),
        'cloud'
      ).setScale(Phaser.Math.FloatBetween(2, 4))
       .setAlpha(0.12)
       .setTint(0xccaaff);
      this.tweens.add({
        targets: c,
        x: c.x - W - 100,
        duration: Phaser.Math.Between(15000, 25000),
        repeat: -1,
        onRepeat: () => { c.x = W + 50; c.y = Phaser.Math.Between(40, H - 60); },
      });
    }

    // Başlık
    this.add.text(W / 2, 16, '~ RUYA ALEMI ~', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffd166',
    }).setOrigin(0.5).setAlpha(0.8);

    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('DreamMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffd166',
    });
    this._timeTxt = this.add.text(W - 20, 14, 'SURE: 15', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
    }).setOrigin(1, 0);

    // Kedi (parlayan rüya efekti)
    const f = (nums) => nums.map(n => ({ key: 'cat_sheet', frame: n }));
    if (!this.anims.exists('dream_idle')) {
      this.anims.create({ key: 'dream_idle', frames: f([0, 1]), frameRate: 3, repeat: -1 });
    }

    this._catGfx = this.add.sprite(70, this._catY, 'cat_sheet', 0)
      .setScale(2.5)
      .setOrigin(0.5, 0.5);
    this._catGfx.play('dream_idle');

    // Parlama efekti (kedi etrafında)
    this._glow = this.add.circle(70, this._catY, 30, 0xffd166, 0.1);
    this.tweens.add({
      targets: this._glow,
      alpha: 0.2,
      scale: 1.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Fare ile kontrol
    this.input.on('pointermove', (ptr) => {
      if (!this._gameOver) this._targetY = Phaser.Math.Clamp(ptr.y, 40, H - 40);
    });
    this.input.on('pointerdown', (ptr) => {
      if (!this._gameOver) this._targetY = Phaser.Math.Clamp(ptr.y, 40, H - 40);
    });

    // Klavye kontrolü
    this._keys = this.input.keyboard.createCursorKeys();

    // Balık spawn
    this.time.addEvent({
      delay: 900,
      callback: this._spawnFish,
      callbackScope: this,
      loop: true,
    });

    // Kabus spawn
    this.time.addEvent({
      delay: 2000,
      callback: this._spawnNightmare,
      callbackScope: this,
      loop: true,
    });

    // Süre
    this.time.addEvent({
      delay: 1000,
      callback: this._countdown,
      callbackScope: this,
      loop: true,
    });

    // İpucu
    this.add.text(W / 2, H - 14, 'FARE / OK TUSLARI ILE HAREKET ET', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#776699',
    }).setOrigin(0.5);
  }

  update() {
    if (this._gameOver) return;
    const H = 360;

    // Klavye kontrol
    if (this._keys.up.isDown) {
      this._targetY = Math.max(40, this._targetY - 4);
    } else if (this._keys.down.isDown) {
      this._targetY = Math.min(H - 40, this._targetY + 4);
    }

    // Kedi yumuşak takip
    const dy = this._targetY - this._catY;
    this._catY += dy * 0.08;
    this._catGfx.y = this._catY;
    this._glow.y = this._catY;

    // Hafif salınım (rüya hissi)
    this._catGfx.x = 70 + Math.sin(this.time.now * 0.002) * 4;
    this._glow.x = this._catGfx.x;

    const catBounds = new Phaser.Geom.Circle(this._catGfx.x, this._catY, 22);

    // Collectibles
    for (let i = this._collectibles.length - 1; i >= 0; i--) {
      const col = this._collectibles[i];
      col.gfx.x -= this._speed;

      const dist = Phaser.Math.Distance.Between(
        this._catGfx.x, this._catY, col.gfx.x, col.gfx.y
      );
      if (dist < 35) {
        this._score += col.points;
        this._scoreTxt.setText('PUAN: ' + this._score);
        soundManager.playScore();

        // Parlama efekti
        const spark = this.add.circle(col.gfx.x, col.gfx.y, 8, 0xffd166, 0.6);
        this.tweens.add({
          targets: spark,
          scale: 3, alpha: 0, duration: 400,
          onComplete: () => spark.destroy(),
        });

        col.gfx.destroy();
        this._collectibles.splice(i, 1);
        continue;
      }

      if (col.gfx.x < -30) {
        col.gfx.destroy();
        this._collectibles.splice(i, 1);
      }
    }

    // Nightmares
    for (let i = this._nightmares.length - 1; i >= 0; i--) {
      const nm = this._nightmares[i];
      nm.gfx.x -= this._speed * 0.8;

      const dist = Phaser.Math.Distance.Between(
        this._catGfx.x, this._catY, nm.gfx.x, nm.gfx.y
      );
      if (dist < 30) {
        this._hitNightmare();
        return;
      }

      if (nm.gfx.x < -50) {
        nm.gfx.destroy();
        this._nightmares.splice(i, 1);
      }
    }

    // Hız artışı
    this._speed = 2 + (15 - this._timeLeft) * 0.12;
  }

  _spawnFish() {
    if (this._gameOver) return;
    const W = 480, H = 360;
    const y = Phaser.Math.Between(50, H - 60);
    const isStar = Phaser.Math.Between(0, 3) === 0; // %25 yıldız

    if (isStar) {
      const gfx = this.add.image(W + 20, y, 'star')
        .setScale(3).setTint(0xffd166);
      // Döndürme
      this.tweens.add({
        targets: gfx, angle: 360, duration: 2000, repeat: -1,
      });
      this._collectibles.push({ gfx, points: 2 });
    } else {
      const gfx = this.add.image(W + 20, y, 'dream_fish').setScale(2);
      // Hafif salınım
      this.tweens.add({
        targets: gfx, y: y - 10, duration: 800, yoyo: true, repeat: -1,
      });
      this._collectibles.push({ gfx, points: 1 });
    }
  }

  _spawnNightmare() {
    if (this._gameOver) return;
    const W = 480, H = 360;
    const y = Phaser.Math.Between(50, H - 60);
    const gfx = this.add.image(W + 30, y, 'nightmare_cloud').setScale(2);

    // Titreşim efekti
    this.tweens.add({
      targets: gfx,
      y: y + Phaser.Math.Between(-15, 15),
      duration: Phaser.Math.Between(600, 1200),
      yoyo: true,
      repeat: -1,
    });

    this._nightmares.push({ gfx });
  }

  _hitNightmare() {
    this._gameOver = true;
    soundManager.playWarning();
    this.time.removeAllEvents();

    // Ekran sarsıntısı
    this.cameras.main.shake(300, 0.02);

    // Kedi kırmızı flash
    this._catGfx.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      if (this._catGfx.active) this._catGfx.clearTint();
    });

    // Temizlik
    this._collectibles.forEach(c => { if (c.gfx.active) c.gfx.destroy(); });
    this._nightmares.forEach(n => { if (n.gfx.active) n.gfx.destroy(); });
    this._collectibles = [];
    this._nightmares = [];

    this.time.delayedCall(600, () => this._showResult('KABUS!'));
  }

  _countdown() {
    this._timeLeft--;
    this._timeTxt.setText('SURE: ' + this._timeLeft);
    if (this._timeLeft <= 0) {
      this._gameOver = true;
      this.time.removeAllEvents();
      this._collectibles.forEach(c => { if (c.gfx.active) c.gfx.destroy(); });
      this._nightmares.forEach(n => { if (n.gfx.active) n.gfx.destroy(); });
      this._collectibles = [];
      this._nightmares = [];
      this._showResult('RUYA BITTI!');
    }
  }

  _showResult(title) {
    const W = 480, H = 360;
    const energyBonus = Math.min(10 + this._score * 2, 30);

    this.add.rectangle(W / 2, H / 2, 320, 180, 0x1a0a2e, 0.95)
      .setStrokeStyle(2, 0xffd166).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 60, title, {
      fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#ffd166',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 25, `PUAN: ${this._score}`, {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 + 5, `+${energyBonus} ENERJI`, {
      fontFamily: '"Press Start 2P"', fontSize: '9px', fill: '#2a9d8f',
    }).setOrigin(0.5);

    if (this._score > 0) {
      this.add.text(W / 2, H / 2 + 25, 'Guzel ruyalar gordun!', {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ccaaff',
      }).setOrigin(0.5);
    } else {
      this.add.text(W / 2, H / 2 + 25, 'Kabuslar kovaladilar!', {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ff6666',
      }).setOrigin(0.5);
    }

    const btn = this.add.text(W / 2, H / 2 + 60, '[ UYAN ]', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffffff',
      backgroundColor: '#457b9d', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ fill: '#ffd166' }));
    btn.on('pointerout',  () => btn.setStyle({ fill: '#ffffff' }));
    btn.on('pointerdown', () => {
      this._onComplete(energyBonus);
      this.scene.stop('DreamMiniGame');
    });
  }
}
