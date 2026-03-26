import { soundManager } from '../audio/SoundManager.js';

/**
 * FlyMiniGame — Sinek Yakalama
 * Sinekler ekranda uçar, tıklayarak yakala.
 * Arıya tıklarsan puan kaybedersin.
 * 15 saniye süre.
 */
export default class FlyMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'FlyMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._timeLeft = 15;
    this._gameOver = false;
    this._insects = [];
  }

  create() {
    const W = 480, H = 360;
    this.add.rectangle(0, 0, W, H, 0xd4c4a0).setOrigin(0, 0);
    // Duvar deseni
    for (let x = 0; x < W; x += 40) {
      for (let y = 0; y < H; y += 40) {
        this.add.rectangle(x + 20, y + 20, 2, 2, 0xc4b490, 0.3);
      }
    }

    this.add.text(W / 2, 18, 'SINEK YAKALAMA!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#222222',
    }).setOrigin(0.5);
    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('FlyMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f',
    });
    this._timeTxt = this.add.text(W - 20, 14, 'SURE: 15', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
    }).setOrigin(1, 0);

    // Sinek spawn
    this.time.addEvent({
      delay: 700,
      callback: this._spawnInsect,
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

    this.add.text(W / 2, H - 14, 'SINEKLERE TIKLA! ARILARDAN KACIN!', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#888',
    }).setOrigin(0.5);
  }

  _spawnInsect() {
    if (this._gameOver) return;
    const W = 480, H = 360;
    const isBee = Phaser.Math.Between(0, 4) === 0; // %20 arı
    const x = Phaser.Math.Between(30, W - 30);
    const y = Phaser.Math.Between(40, H - 50);

    const sprite = isBee ? 'bee_sprite' : 'fly_sprite';
    const insect = this.add.image(x, y, sprite)
      .setScale(isBee ? 2.5 : 2.8)
      .setInteractive({ useHandCursor: true });

    const obj = { gfx: insect, isBee, alive: true };
    this._insects.push(obj);

    // Zigzag hareket
    const moveInsect = () => {
      if (!obj.alive || !insect.active) return;
      const nx = Phaser.Math.Between(30, W - 30);
      const ny = Phaser.Math.Between(40, H - 50);
      const speed = isBee ? 1200 : Phaser.Math.Between(800, 1500);
      insect.setFlipX(nx < insect.x);
      this.tweens.add({
        targets: insect,
        x: nx, y: ny,
        duration: speed,
        ease: 'Sine.easeInOut',
        onComplete: moveInsect,
      });
    };
    moveInsect();

    // Tıklama
    insect.on('pointerdown', () => {
      if (!obj.alive || this._gameOver) return;
      obj.alive = false;

      if (isBee) {
        // Arıya tıkladın — ceza!
        this._score = Math.max(0, this._score - 3);
        this._scoreTxt.setText('PUAN: ' + this._score);
        soundManager.playWarning();
        this._ui_flash(insect.x, insect.y, 0xff0000);
      } else {
        // Sinek yakaladın
        this._score++;
        this._scoreTxt.setText('PUAN: ' + this._score);
        soundManager.playScore();
        // Pençe efekti
        const paw = this.add.image(insect.x, insect.y, 'paw').setScale(2.5);
        this.tweens.add({
          targets: paw, scale: 3.5, alpha: 0, duration: 400,
          onComplete: () => paw.destroy(),
        });
      }

      this.tweens.killTweensOf(insect);
      this.tweens.add({
        targets: insect, scale: 0, alpha: 0, duration: 200,
        onComplete: () => insect.destroy(),
      });
    });

    // 4 sn sonra kaybol
    this.time.delayedCall(4000, () => {
      if (obj.alive && insect.active) {
        obj.alive = false;
        this.tweens.killTweensOf(insect);
        this.tweens.add({
          targets: insect, alpha: 0, duration: 300,
          onComplete: () => insect.destroy(),
        });
      }
    });
  }

  _ui_flash(x, y, color) {
    const flash = this.add.circle(x, y, 20, color, 0.5);
    this.tweens.add({
      targets: flash, scale: 3, alpha: 0, duration: 400,
      onComplete: () => flash.destroy(),
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
    this._insects.forEach(i => { if (i.gfx.active) i.gfx.destroy(); });

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
      this.scene.stop('FlyMiniGame');
    });
  }
}
