import { soundManager } from '../audio/SoundManager.js';

/**
 * BirdMiniGame — Kuş Gözleme
 * Pencereden kuşlar uçar, tıklayarak yakala.
 * Farklı kuş türleri farklı puan.
 * Buluta tıklarsan -1 puan.
 * 20 saniye süre.
 */
export default class BirdMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'BirdMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._timeLeft = 20;
    this._gameOver = false;
    this._objects = [];
  }

  create() {
    const W = 480, H = 360;

    // Gökyüzü arkaplan
    this.add.rectangle(0, 0, W, H, 0x87ceeb).setOrigin(0, 0);

    // Pencere çerçevesi efekti (kenarlar koyu — odadan dışarı bakış)
    // Üst
    this.add.rectangle(0, 0, W, 35, 0xd4a5c7).setOrigin(0, 0);
    // Alt
    this.add.rectangle(0, H - 40, W, 40, 0xd4a5c7).setOrigin(0, 0);
    // Sol
    this.add.rectangle(0, 0, 30, H, 0xd4a5c7).setOrigin(0, 0);
    // Sağ
    this.add.rectangle(W - 30, 0, 30, H, 0xd4a5c7).setOrigin(0, 0);
    // Pencere pervazı
    this.add.rectangle(0, H - 42, W, 6, 0x8b6914).setOrigin(0, 0);
    // Pencere çapraz
    this.add.rectangle(W / 2 - 2, 35, 4, H - 75, 0x0096c7).setOrigin(0, 0).setAlpha(0.5);
    this.add.rectangle(30, (H - 75) / 2 + 35, W - 60, 4, 0x0096c7).setAlpha(0.5);

    // Dekor bulutları (arkaplan, tıklanamaz)
    for (let i = 0; i < 3; i++) {
      const c = this.add.image(
        Phaser.Math.Between(60, W - 60),
        Phaser.Math.Between(50, 120),
        'cloud'
      ).setScale(Phaser.Math.FloatBetween(2, 3.5)).setAlpha(0.4);
      this.tweens.add({
        targets: c, x: c.x - 40, duration: 10000, yoyo: true, repeat: -1,
      });
    }

    this.add.text(W / 2, 14, 'KUS GOZLEME!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#1a1a2e',
    }).setOrigin(0.5);

    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('BirdMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f',
    });
    this._timeTxt = this.add.text(W - 40, 14, 'SURE: 20', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
    }).setOrigin(1, 0);

    // Kuş spawn timer
    this.time.addEvent({
      delay: 1000,
      callback: this._spawnObject,
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

    // Kedi silüeti (alt köşede, camdan bakıyor)
    const catSil = this.add.sprite(80, H - 55, 'cat_sheet', 0)
      .setScale(2).setAlpha(0.6).setTint(0x333333);

    this.add.text(W / 2, H - 20, 'KUSLARA TIKLA! BULUTLARDAN KACIN!', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#8a6090',
    }).setOrigin(0.5);
  }

  _spawnObject() {
    if (this._gameOver) return;
    const W = 480, H = 360;

    // Bulut mu kuş mu? (%25 bulut)
    const isCloud = Phaser.Math.Between(0, 3) === 0;

    if (isCloud) {
      this._spawnCloud();
    } else {
      this._spawnBird();
    }
  }

  _spawnBird() {
    const W = 480, H = 360;
    // Kuş türü seç
    const roll = Phaser.Math.Between(0, 9);
    let birdType, points, speed;

    if (roll < 5) {
      birdType = 'bird_brown'; points = 1; speed = Phaser.Math.Between(2000, 3500);
    } else if (roll < 8) {
      birdType = 'bird_blue'; points = 2; speed = Phaser.Math.Between(1500, 2500);
    } else {
      birdType = 'bird_gold'; points = 5; speed = Phaser.Math.Between(1000, 1800);
    }

    const fromLeft = Phaser.Math.Between(0, 1) === 0;
    const startX = fromLeft ? -20 : W + 20;
    const endX = fromLeft ? W + 20 : -20;
    const y = Phaser.Math.Between(60, H - 80);

    const bird = this.add.image(startX, y, birdType)
      .setScale(3)
      .setFlipX(!fromLeft)
      .setInteractive({ useHandCursor: true });

    const obj = { gfx: bird, alive: true, type: 'bird', points };
    this._objects.push(obj);

    // Uçuş + hafif dalgalanma
    this.tweens.add({
      targets: bird,
      x: endX,
      duration: speed,
      ease: 'Linear',
      onComplete: () => {
        if (bird.active) bird.destroy();
        obj.alive = false;
      },
    });
    this.tweens.add({
      targets: bird,
      y: y + Phaser.Math.Between(-20, 20),
      duration: speed / 3,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });

    bird.on('pointerdown', () => {
      if (!obj.alive || this._gameOver) return;
      obj.alive = false;
      this._score += points;
      this._scoreTxt.setText('PUAN: ' + this._score);
      soundManager.playScore();

      // Tüy efekti
      for (let i = 0; i < 4; i++) {
        const f = this.add.image(
          bird.x + Phaser.Math.Between(-15, 15),
          bird.y + Phaser.Math.Between(-10, 10),
          'feather'
        ).setScale(2).setAngle(Phaser.Math.Between(0, 360));
        this.tweens.add({
          targets: f,
          y: f.y + 40,
          x: f.x + Phaser.Math.Between(-20, 20),
          alpha: 0,
          angle: f.angle + Phaser.Math.Between(-90, 90),
          duration: 600,
          onComplete: () => f.destroy(),
        });
      }

      // Puan popup
      const popup = this.add.text(bird.x, bird.y - 20, `+${points}`, {
        fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffd166',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: popup, y: popup.y - 30, alpha: 0, duration: 600,
        onComplete: () => popup.destroy(),
      });

      this.tweens.killTweensOf(bird);
      bird.destroy();
    });
  }

  _spawnCloud() {
    const W = 480, H = 360;
    const fromLeft = Phaser.Math.Between(0, 1) === 0;
    const startX = fromLeft ? -30 : W + 30;
    const endX = fromLeft ? W + 30 : -30;
    const y = Phaser.Math.Between(60, H - 100);

    const cloud = this.add.image(startX, y, 'cloud')
      .setScale(Phaser.Math.FloatBetween(2, 3))
      .setAlpha(0.8)
      .setInteractive({ useHandCursor: true });

    const obj = { gfx: cloud, alive: true, type: 'cloud' };
    this._objects.push(obj);

    this.tweens.add({
      targets: cloud,
      x: endX,
      duration: Phaser.Math.Between(4000, 7000),
      ease: 'Linear',
      onComplete: () => {
        if (cloud.active) cloud.destroy();
        obj.alive = false;
      },
    });

    cloud.on('pointerdown', () => {
      if (!obj.alive || this._gameOver) return;
      obj.alive = false;
      this._score = Math.max(0, this._score - 1);
      this._scoreTxt.setText('PUAN: ' + this._score);
      soundManager.playBounce();

      // Kırmızı X efekti
      const x = this.add.text(cloud.x, cloud.y, 'X', {
        fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#e63946',
      }).setOrigin(0.5);
      this.tweens.add({
        targets: x, scale: 2, alpha: 0, duration: 400,
        onComplete: () => x.destroy(),
      });

      this.tweens.killTweensOf(cloud);
      this.tweens.add({
        targets: cloud, alpha: 0, duration: 200,
        onComplete: () => cloud.destroy(),
      });
    });
  }

  _countdown() {
    this._timeLeft--;
    this._timeTxt.setText('SURE: ' + this._timeLeft);
    if (this._timeLeft <= 0) this._endGame();
  }

  _endGame() {
    this._gameOver = true;
    soundManager.playGameOver();
    this.time.removeAllEvents();
    this._objects.forEach(o => {
      if (o.gfx && o.gfx.active) { this.tweens.killTweensOf(o.gfx); o.gfx.destroy(); }
    });

    const W = 480, H = 360;
    this.add.rectangle(W / 2, H / 2, 320, 160, 0x0f0f1e, 0.95).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 50, 'OYUN BITTI!', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#ffd166',
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 10, `PUAN: ${this._score}`, {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#2a9d8f',
    }).setOrigin(0.5);
    const bonus = Math.min(this._score * 3, 30);
    this.add.text(W / 2, H / 2 + 20, `+${bonus} MUTLULUK`, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
    }).setOrigin(0.5);
    const btn = this.add.text(W / 2, H / 2 + 55, '[ DEVAM ]', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', fill: '#ffffff',
      backgroundColor: '#457b9d', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setStyle({ fill: '#ffd166' }));
    btn.on('pointerout',  () => btn.setStyle({ fill: '#ffffff' }));
    btn.on('pointerdown', () => {
      this._onComplete(bonus);
      this.scene.stop('BirdMiniGame');
    });
  }
}
