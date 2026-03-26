import { soundManager } from '../audio/SoundManager.js';

/**
 * MouseMiniGame — Fare Yakalama (Whack-a-Mole)
 * 3x3 grid delik, fareler rastgele çıkar, tıkla yakala.
 * 15 saniye süre.
 */
export default class MouseMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'MouseMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._timeLeft = 15;
    this._holes = [];
    this._activeMice = [];
    this._gameOver = false;
    this._showDuration = 1200; // ms — fare görünme süresi
  }

  create() {
    const W = 480, H = 360;
    this.add.rectangle(0, 0, W, H, 0x2d6a4f).setOrigin(0, 0);

    this.add.text(W / 2, 18, 'FARE YAKALAMA!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffd166'
    }).setOrigin(0.5);

    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('MouseMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f'
    });
    this._timeTxt = this.add.text(W - 20, 14, 'SURE: 15', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946'
    }).setOrigin(1, 0);

    // 3x3 delik grid
    const gridStartX = 120, gridStartY = 70;
    const gapX = 120, gapY = 80;

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cx = gridStartX + col * gapX;
        const cy = gridStartY + row * gapY;

        // Delik
        this.add.ellipse(cx, cy + 20, 60, 20, 0x1a3a2a);
        this.add.ellipse(cx, cy + 18, 52, 14, 0x0d2618);

        this._holes.push({ x: cx, y: cy, active: false, mouse: null, timer: null });
      }
    }

    // Fare spawn timer
    this._spawnTimer = this.time.addEvent({
      delay: 800,
      callback: this._spawnMouse,
      callbackScope: this,
      loop: true,
    });

    // Süre
    this._countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: this._countdown,
      callbackScope: this,
      loop: true,
    });

    this.add.text(W / 2, H - 20, 'FARELERE TIKLA!', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#888'
    }).setOrigin(0.5);
  }

  _spawnMouse() {
    if (this._gameOver) return;

    // Boş delik bul
    const empty = this._holes.filter(h => !h.active);
    if (empty.length === 0) return;

    const hole = Phaser.Utils.Array.GetRandom(empty);
    hole.active = true;

    // Fare sprite
    const mouse = this.add.image(hole.x, hole.y + 10, 'mouse_sprite')
      .setScale(2.5)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0);

    hole.mouse = mouse;

    // Yukarı çık animasyonu
    this.tweens.add({
      targets: mouse,
      y: hole.y - 8,
      alpha: 1,
      duration: 150,
      ease: 'Back.easeOut',
    });

    // Tıklama
    mouse.on('pointerdown', () => {
      if (!hole.active) return;
      this._catchMouse(hole);
    });

    // Belirli süre sonra geri in
    hole.timer = this.time.delayedCall(this._showDuration, () => {
      this._hideMouse(hole);
    });

    // Zorluk artışı — zamanla kısalt
    this._showDuration = Math.max(500, this._showDuration - 15);
  }

  _catchMouse(hole) {
    if (!hole.active || !hole.mouse) return;
    hole.active = false;
    if (hole.timer) hole.timer.remove();

    this._score++;
    this._scoreTxt.setText('PUAN: ' + this._score);
    soundManager.playScore();

    // Pençe efekti
    const paw = this.add.image(hole.x, hole.y - 8, 'paw').setScale(2.5);
    this.tweens.add({
      targets: paw,
      scale: 3.5,
      alpha: 0,
      duration: 400,
      onComplete: () => paw.destroy(),
    });

    // Fare kaybol
    this.tweens.add({
      targets: hole.mouse,
      y: hole.y + 20,
      alpha: 0,
      scale: 0.5,
      duration: 150,
      onComplete: () => { hole.mouse.destroy(); hole.mouse = null; },
    });
  }

  _hideMouse(hole) {
    if (!hole.active || !hole.mouse) return;
    hole.active = false;
    this.tweens.add({
      targets: hole.mouse,
      y: hole.y + 20,
      alpha: 0,
      duration: 200,
      onComplete: () => { if (hole.mouse) { hole.mouse.destroy(); hole.mouse = null; } },
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

    // Kalan fareleri temizle
    this._holes.forEach(h => {
      if (h.mouse) { h.mouse.destroy(); h.mouse = null; }
      h.active = false;
    });

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
      this.scene.stop('MouseMiniGame');
    });
  }
}
