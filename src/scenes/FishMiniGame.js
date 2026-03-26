import { soundManager } from '../audio/SoundManager.js';

/**
 * FishMiniGame — Balık Yakalama Mini Oyunu
 * Balıklar yukarıdan aşağı düşer, kedi sağa-sola hareket eder.
 * Klavye (sol/sağ ok) veya fare/dokunma ile kedi kontrol edilir.
 * 20 saniye süre, her balık yakalamada +1 puan.
 */
export default class FishMiniGame extends Phaser.Scene {
  constructor() {
    super({ key: 'FishMiniGame' });
  }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score     = 0;
    this._timeLeft  = 20;
    this._catX      = 240;
    this._fishes    = [];
    this._keys      = null;
    this._gameOver  = false;
    this._targetX   = null;
  }

  create() {
    const W = 480, H = 360;

    // Arkaplan
    this.add.rectangle(0, 0, W, H, 0x0d3b6e).setOrigin(0, 0);
    // Su yüzeyi efekti
    for (let x = 0; x < W; x += 32) {
      this.add.rectangle(x, 0, 30, H, 0x0d3b6e + (x % 2 === 0 ? 0x010508 : 0), 1).setOrigin(0, 0);
    }
    // Zemin
    this.add.rectangle(0, H - 60, W, 60, 0x6b4c2a).setOrigin(0, 0);
    this.add.rectangle(0, H - 60, W, 4, 0x8b6914).setOrigin(0, 0);

    this.add.text(W / 2, 18, 'BALIK YAKALAMA!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffd166'
    }).setOrigin(0.5);

    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('FishMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f'
    });
    this._timeTxt = this.add.text(W - 20, 14, 'SURE: 20', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946'
    }).setOrigin(1, 0);

    // Kedi
    this._catGfx = this.add.sprite(this._catX, H - 60, 'cat_sheet', 0)
      .setScale(2.5)
      .setOrigin(0.5, 1);

    const f = (nums) => nums.map(n => ({ key: 'cat_sheet', frame: n }));
    if (!this.anims.exists('fish_idle')) {
      this.anims.create({ key: 'fish_idle',  frames: f([0, 1]), frameRate: 3, repeat: -1 });
    }
    if (!this.anims.exists('fish_happy')) {
      this.anims.create({ key: 'fish_happy', frames: f([2, 3]), frameRate: 6, repeat: 2 });
    }
    this._catGfx.play('fish_idle');

    // Klavye
    this._keys = this.input.keyboard.createCursorKeys();

    // Fare / dokunma ile kedi hareketi
    this.input.on('pointermove', (ptr) => {
      if (!this._gameOver) this._targetX = Phaser.Math.Clamp(ptr.x, 40, 440);
    });
    this.input.on('pointerdown', (ptr) => {
      if (!this._gameOver) this._targetX = Phaser.Math.Clamp(ptr.x, 40, 440);
    });

    // Balık spawn timer
    this._spawnTimer = this.time.addEvent({
      delay: 1200,
      callback: this._spawnFish,
      callbackScope: this,
      loop: true,
    });

    // Süre sayacı
    this._countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: this._countdown,
      callbackScope: this,
      loop: true,
    });

    // İpucu
    this.add.text(W / 2, H - 24, 'OK TUS / FARE ILE HAREKET ET', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#888'
    }).setOrigin(0.5);
  }

  update() {
    if (this._gameOver) return;

    const W = 480;
    const speed = 5;

    // Klavye hareketi
    if (this._keys.left.isDown) {
      this._catX = Math.max(40, this._catX - speed);
      this._catGfx.setFlipX(true);
      this._targetX = null;
    } else if (this._keys.right.isDown) {
      this._catX = Math.min(440, this._catX + speed);
      this._catGfx.setFlipX(false);
      this._targetX = null;
    } else if (this._targetX !== null) {
      // Fare takibi
      const dx = this._targetX - this._catX;
      if (Math.abs(dx) < speed) {
        this._catX = this._targetX;
        this._targetX = null;
      } else {
        this._catX += dx > 0 ? speed : -speed;
        this._catGfx.setFlipX(dx < 0);
      }
    }

    this._catGfx.x = this._catX;

    // Balık çarpışma kontrolü
    const catBounds = new Phaser.Geom.Rectangle(
      this._catX - 28, this._catGfx.y - 56, 56, 56
    );

    for (let i = this._fishes.length - 1; i >= 0; i--) {
      const fish = this._fishes[i];
      if (!fish.active) {
        this._fishes.splice(i, 1);
        continue;
      }

      const fishBounds = new Phaser.Geom.Rectangle(
        fish.x - 12, fish.y - 10, 24, 20
      );

      if (Phaser.Geom.Intersects.RectangleToRectangle(catBounds, fishBounds)) {
        this._catchFish(fish, i);
      }
    }
  }

  _spawnFish() {
    if (this._gameOver) return;
    const W = 480;
    const x = Phaser.Math.Between(30, W - 30);
    const fish = this.add.image(x, -20, 'fish').setScale(2).setAngle(90);
    this._fishes.push(fish);

    // Balık düşme hareketi
    this.tweens.add({
      targets: fish,
      y: 320,
      duration: Phaser.Math.Between(1800, 3200),
      ease: 'Linear',
      onComplete: () => {
        if (fish.active) fish.destroy();
        const idx = this._fishes.indexOf(fish);
        if (idx >= 0) this._fishes.splice(idx, 1);
      }
    });
  }

  _catchFish(fish, idx) {
    this._score++;
    this._scoreTxt.setText('PUAN: ' + this._score);
    soundManager.playScore();
    fish.destroy();
    this._fishes.splice(idx, 1);

    // Kalp
    const heart = this.add.image(this._catX, this._catGfx.y - 80, 'heart').setScale(3);
    this.tweens.add({
      targets: heart,
      y: heart.y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => heart.destroy(),
    });

    // Kedi sevinç
    this._catGfx.play('fish_happy');
    this.time.delayedCall(500, () => {
      if (this._catGfx.active) this._catGfx.play('fish_idle');
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

    // Tüm balıkları temizle
    this._fishes.forEach(f => { if (f.active) f.destroy(); });
    this._fishes = [];

    const W = 480, H = 360;
    this.add.rectangle(W / 2, H / 2, 320, 160, 0x0f0f1e, 0.95).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 50, 'OYUN BITTI!', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#ffd166'
    }).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 10, `PUAN: ${this._score}`, {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#2a9d8f'
    }).setOrigin(0.5);

    const bonus = Math.min(this._score * 3, 30);
    this.add.text(W / 2, H / 2 + 20, `+${bonus} MUTLULUK`, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946'
    }).setOrigin(0.5);

    const btn = this.add.text(W / 2, H / 2 + 55, '[ DEVAM ]', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', fill: '#ffffff',
      backgroundColor: '#457b9d', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ fill: '#ffd166' }));
    btn.on('pointerout',  () => btn.setStyle({ fill: '#ffffff' }));
    btn.on('pointerdown', () => {
      this._onComplete(bonus);
      this.scene.stop('FishMiniGame');
    });
  }
}
