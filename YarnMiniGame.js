import { soundManager } from '../audio/SoundManager.js';

/**
 * YarnMiniGame — Yumak Sarma (Timing oyunu)
 * Yumağın etrafında dönen ibre. Yeşil bölgede tıklarsan puan.
 * 20 saniye süre. Zorluk artar (bölge daralır, ibre hızlanır).
 */
export default class YarnMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'YarnMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._timeLeft = 20;
    this._gameOver = false;
    this._angle = 0;
    this._speed = 2.5;          // derece/frame
    this._zoneStart = 0;
    this._zoneSize = 60;        // derece
    this._yarnScale = 1;
    this._cooldown = false;
  }

  create() {
    const W = 480, H = 360;
    const CX = W / 2, CY = 170;
    const RADIUS = 80;

    this.add.rectangle(0, 0, W, H, 0x2d1b4e).setOrigin(0, 0);

    this.add.text(W / 2, 18, 'YUMAK SARMA!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffd166'
    }).setOrigin(0.5);

    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('YarnMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f'
    });
    this._timeTxt = this.add.text(W - 20, 14, 'SURE: 20', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946'
    }).setOrigin(1, 0);

    // Dış çember (arkaplan)
    this._outerCircle = this.add.circle(CX, CY, RADIUS + 12, 0x3d2b5e);
    this._outerCircle.setStrokeStyle(3, 0x5a3d8a);

    // Yeşil hedef bölge — graphics ile çizilecek
    this._zoneGfx = this.add.graphics();
    this._drawZone(CX, CY, RADIUS);

    // Yumak
    this._yarn = this.add.image(CX, CY, 'ball').setScale(4);

    // İbre (dönen çizgi)
    this._needle = this.add.graphics();
    this._needleCX = CX;
    this._needleCY = CY;
    this._needleR = RADIUS;

    // Sonuç göstergesi
    this._resultTxt = this.add.text(CX, CY + RADIUS + 40, '', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff'
    }).setOrigin(0.5);

    // Tıklama
    this.input.on('pointerdown', () => this._tryHit());
    this.input.keyboard.on('keydown-SPACE', () => this._tryHit());

    // Süre
    this.time.addEvent({
      delay: 1000,
      callback: this._countdown,
      callbackScope: this,
      loop: true,
    });

    this.add.text(W / 2, H - 16, 'YESIL BOLGEDE TIKLA!', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#888'
    }).setOrigin(0.5);
  }

  update() {
    if (this._gameOver) return;

    // İbre döndür
    this._angle = (this._angle + this._speed) % 360;
    this._drawNeedle();
  }

  _drawZone(cx, cy, r) {
    this._zoneGfx.clear();
    this._zoneGfx.fillStyle(0x2a9d8f, 0.4);
    this._zoneGfx.lineStyle(3, 0x2a9d8f, 0.8);

    const startRad = Phaser.Math.DegToRad(this._zoneStart);
    const endRad   = Phaser.Math.DegToRad(this._zoneStart + this._zoneSize);

    this._zoneGfx.beginPath();
    this._zoneGfx.moveTo(cx, cy);
    this._zoneGfx.arc(cx, cy, r + 10, startRad, endRad, false);
    this._zoneGfx.closePath();
    this._zoneGfx.fillPath();
    this._zoneGfx.strokePath();
  }

  _drawNeedle() {
    this._needle.clear();
    const rad = Phaser.Math.DegToRad(this._angle);
    const ex = this._needleCX + Math.cos(rad) * this._needleR;
    const ey = this._needleCY + Math.sin(rad) * this._needleR;

    this._needle.lineStyle(4, 0xe63946, 1);
    this._needle.beginPath();
    this._needle.moveTo(this._needleCX, this._needleCY);
    this._needle.lineTo(ex, ey);
    this._needle.strokePath();

    // İbre ucu noktası
    this._needle.fillStyle(0xff4444, 1);
    this._needle.fillCircle(ex, ey, 5);
  }

  _tryHit() {
    if (this._gameOver || this._cooldown) return;
    this._cooldown = true;
    this.time.delayedCall(300, () => { this._cooldown = false; });

    // İbre açısı yeşil bölgede mi?
    let a = this._angle % 360;
    let zs = this._zoneStart % 360;
    let ze = (this._zoneStart + this._zoneSize) % 360;

    let inZone = false;
    if (ze > zs) {
      inZone = a >= zs && a <= ze;
    } else {
      // Wrap-around
      inZone = a >= zs || a <= ze;
    }

    if (inZone) {
      // Başarılı!
      this._score++;
      this._scoreTxt.setText('PUAN: ' + this._score);
      soundManager.playScore();

      // Yumak büyüme efekti
      this._yarnScale += 0.15;
      this.tweens.add({
        targets: this._yarn,
        scale: Math.min(this._yarnScale + 4, 7),
        duration: 200,
        yoyo: true,
        ease: 'Back.easeOut',
      });

      this._resultTxt.setText('HARIKA!').setStyle({ fill: '#2a9d8f' });

      // Zorluk artışı
      this._speed = Math.min(this._speed + 0.2, 6);
      this._zoneSize = Math.max(this._zoneSize - 3, 20);

      // Yeşil bölge yeni rastgele pozisyon
      this._zoneStart = Phaser.Math.Between(0, 359);
      this._drawZone(this._needleCX, this._needleCY, this._needleR);
    } else {
      // Başarısız
      this._resultTxt.setText('KACIRDIN!').setStyle({ fill: '#e63946' });
      soundManager.playBounce();

      // Yumak titreme
      this.tweens.add({
        targets: this._yarn,
        x: this._yarn.x + 5,
        duration: 50,
        yoyo: true,
        repeat: 3,
      });
    }

    // Sonuç yazısını temizle
    this.time.delayedCall(800, () => {
      if (this._resultTxt.active) this._resultTxt.setText('');
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
      this.scene.stop('YarnMiniGame');
    });
  }
}
