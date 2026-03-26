import { soundManager } from '../audio/SoundManager.js';

/**
 * MemoryMiniGame — Hafıza Kartı Eşleştirme
 * 4x3 grid (12 kart = 6 çift). Kartları çevir, eşlerini bul.
 * 30 saniye süre.
 */
export default class MemoryMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'MemoryMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._timeLeft = 30;
    this._gameOver = false;
    this._flipped = [];     // şu an açık olan kartlar (max 2)
    this._matched = 0;      // eşleşen çift sayısı
    this._locked = false;   // eşleşme kontrolü sırasında kilitli
    this._cards = [];
  }

  create() {
    const W = 480, H = 360;
    this.add.rectangle(0, 0, W, H, 0x1a1a3e).setOrigin(0, 0);

    this.add.text(W / 2, 18, 'HAFIZA KARTI!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffd166'
    }).setOrigin(0.5);

    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('MemoryMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f'
    });
    this._timeTxt = this.add.text(W - 20, 14, 'SURE: 30', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946'
    }).setOrigin(1, 0);

    // Kart grid oluştur — 4 sütun x 3 satır = 12 kart = 6 çift
    const COLS = 4, ROWS = 3;
    const CARD_W = 56, CARD_H = 72;
    const GAP_X = 16, GAP_Y = 12;
    const totalW = COLS * CARD_W + (COLS - 1) * GAP_X;
    const totalH = ROWS * CARD_H + (ROWS - 1) * GAP_Y;
    const startX = (W - totalW) / 2 + CARD_W / 2;
    const startY = 55 + CARD_H / 2;

    // 6 çift oluştur ve karıştır
    const iconIds = [];
    for (let i = 0; i < 6; i++) { iconIds.push(i, i); }
    Phaser.Utils.Array.Shuffle(iconIds);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        const cx = startX + col * (CARD_W + GAP_X);
        const cy = startY + row * (CARD_H + GAP_Y);
        const iconId = iconIds[idx];

        // Kart arka yüz
        const back = this.add.image(cx, cy, 'card_back')
          .setScale(2.3)
          .setInteractive({ useHandCursor: true });

        // Kart ön yüz (gizli)
        const front = this.add.image(cx, cy, 'card_icons', iconId)
          .setScale(2.3)
          .setVisible(false);

        const card = { back, front, iconId, flipped: false, matched: false, cx, cy };
        this._cards.push(card);

        back.on('pointerdown', () => this._flipCard(card));
        back.on('pointerover', () => { if (!card.flipped) back.setTint(0xccccff); });
        back.on('pointerout',  () => back.clearTint());
      }
    }

    // Süre
    this.time.addEvent({
      delay: 1000,
      callback: this._countdown,
      callbackScope: this,
      loop: true,
    });

    this.add.text(W / 2, H - 16, 'KARTLARI CEVIR, ESLERINI BUL', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#888'
    }).setOrigin(0.5);
  }

  _flipCard(card) {
    if (this._locked || this._gameOver || card.flipped || card.matched) return;

    card.flipped = true;
    card.back.setVisible(false);
    card.front.setVisible(true);
    soundManager.playClick();

    this._flipped.push(card);

    if (this._flipped.length === 2) {
      this._locked = true;
      this._checkMatch();
    }
  }

  _checkMatch() {
    const [a, b] = this._flipped;

    if (a.iconId === b.iconId) {
      // Eşleşti!
      a.matched = true;
      b.matched = true;
      this._matched++;
      this._score++;
      this._scoreTxt.setText('PUAN: ' + this._score);
      soundManager.playScore();

      // Kalp efekti
      [a, b].forEach(c => {
        const heart = this.add.image(c.cx, c.cy, 'heart').setScale(3);
        this.tweens.add({
          targets: heart,
          y: heart.y - 30,
          alpha: 0,
          duration: 600,
          onComplete: () => heart.destroy(),
        });
      });

      // Kartları küçült ve kaybet
      this.time.delayedCall(400, () => {
        [a, b].forEach(c => {
          this.tweens.add({
            targets: [c.front, c.back],
            scale: 0,
            alpha: 0,
            duration: 300,
          });
        });
        this._flipped = [];
        this._locked = false;

        // Hepsini buldun mu?
        if (this._matched >= 6) {
          const timeBonus = Math.floor(this._timeLeft / 3);
          this._score += timeBonus;
          this._endGame();
        }
      });
    } else {
      // Eşleşmedi — geri çevir
      this.time.delayedCall(800, () => {
        a.flipped = false;
        b.flipped = false;
        a.front.setVisible(false);
        a.back.setVisible(true);
        b.front.setVisible(false);
        b.back.setVisible(true);
        this._flipped = [];
        this._locked = false;
      });
    }
  }

  _countdown() {
    this._timeLeft--;
    this._timeTxt.setText('SURE: ' + this._timeLeft);
    if (this._timeLeft <= 0) this._endGame();
  }

  _endGame() {
    if (this._gameOver) return;
    this._gameOver = true;
    soundManager.playGameOver();
    this.time.removeAllEvents();

    const W = 480, H = 360;
    this.add.rectangle(W / 2, H / 2, 320, 160, 0x0f0f1e, 0.95).setOrigin(0.5);
    this.add.text(W / 2, H / 2 - 50, this._matched >= 6 ? 'TEBRIKLER!' : 'SURE BITTI!', {
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
      this.scene.stop('MemoryMiniGame');
    });
  }
}
