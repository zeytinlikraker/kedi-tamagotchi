import { soundManager } from '../audio/SoundManager.js';

/**
 * LootMiniGame — Kutu Aç (Mystery Box)
 * 3 kutudan birini seç, ödül kazan.
 * Bazı turlarda kutular gösterilip karıştırılır (hafıza).
 * 5 tur.
 */
const PRIZES = [
  { name: 'Altin Balik', points: 5, sprite: 'dream_fish', scale: 2, color: '#ffd166' },
  { name: 'Kalp',        points: 3, sprite: 'heart',      scale: 3, color: '#e63946' },
  { name: 'Yumak',       points: 2, sprite: 'ball',       scale: 2, color: '#f4a261' },
  { name: 'Fare',        points: 1, sprite: 'mouse_sprite', scale: 2, color: '#888888' },
  { name: 'BOMBA!',      points: -3, sprite: 'bomb',      scale: 2, color: '#ff2222' },
];

export default class LootMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'LootMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._round = 0;
    this._totalRounds = 5;
    this._gameOver = false;
    this._choosing = false;
  }

  create() {
    const W = 480, H = 360;
    this.add.rectangle(0, 0, W, H, 0x1a1a2e).setOrigin(0, 0);

    // Dekoratif yıldızlar
    for (let i = 0; i < 15; i++) {
      const s = this.add.rectangle(
        Phaser.Math.Between(10, W - 10),
        Phaser.Math.Between(10, H - 10),
        2, 2, 0xffd166, Phaser.Math.FloatBetween(0.1, 0.4)
      );
      this.tweens.add({
        targets: s, alpha: 0.1, duration: Phaser.Math.Between(800, 2000),
        yoyo: true, repeat: -1,
      });
    }

    this.add.text(W / 2, 18, 'KUTU AC!', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#ffd166',
    }).setOrigin(0.5);

    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('LootMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f',
    });
    this._roundTxt = this.add.text(W - 20, 14, 'TUR: 1/5', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
    }).setOrigin(1, 0);

    this._msgTxt = this.add.text(W / 2, H - 50, '', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(W / 2, H - 14, 'BIR KUTU SEC!', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#888',
    }).setOrigin(0.5);

    this._boxes = [];
    this._startRound();
  }

  _startRound() {
    this._round++;
    this._roundTxt.setText(`TUR: ${this._round}/${this._totalRounds}`);
    this._msgTxt.setText('');
    this._choosing = true;

    // Eski kutuları temizle
    this._boxes.forEach(b => {
      if (b.gfx && b.gfx.active) b.gfx.destroy();
      if (b.label && b.label.active) b.label.destroy();
    });
    this._boxes = [];

    const W = 480, H = 360;
    const boxColors = [0xe63946, 0x457b9d, 0x2a9d8f];
    const boxX = [120, 240, 360];
    const boxY = 160;

    // Her kutunun ödülünü belirle
    const roundPrizes = [];
    for (let i = 0; i < 3; i++) {
      roundPrizes.push(PRIZES[Phaser.Math.Between(0, PRIZES.length - 1)]);
    }
    // En az bir iyi ödül olsun
    if (roundPrizes.every(p => p.points < 0)) {
      roundPrizes[Phaser.Math.Between(0, 2)] = PRIZES[0];
    }

    // Bazı turlarda ödüller gösterilir, sonra karıştırılır
    const showHint = this._round >= 3 && Phaser.Math.Between(0, 1) === 0;

    for (let i = 0; i < 3; i++) {
      const bx = boxX[i];
      const gfx = this.add.image(bx, boxY, 'loot_box')
        .setScale(3.5)
        .setTint(boxColors[i])
        .setInteractive({ useHandCursor: true });

      const label = this.add.text(bx, boxY + 55, '?', {
        fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#ffd166',
      }).setOrigin(0.5);

      const box = { gfx, label, prize: roundPrizes[i], index: i };
      this._boxes.push(box);

      gfx.on('pointerover', () => {
        if (this._choosing) gfx.setScale(4);
      });
      gfx.on('pointerout', () => {
        if (this._choosing) gfx.setScale(3.5);
      });
      gfx.on('pointerdown', () => {
        if (this._choosing) this._selectBox(box);
      });
    }

    // İpucu göster (bazı turlarda)
    if (showHint) {
      this._msgTxt.setText('Dikkat! Odul gosteriliyor...');
      this._boxes.forEach(b => {
        b.label.setText(b.prize.points > 0 ? '★' : '💣');
      });
      this.time.delayedCall(1200, () => {
        this._boxes.forEach(b => b.label.setText('?'));
        this._msgTxt.setText('SEC!');
      });
    }
  }

  _selectBox(box) {
    this._choosing = false;
    soundManager.playClick();

    const W = 480;
    const prize = box.prize;

    // Kutu açılma animasyonu
    this.tweens.add({
      targets: box.gfx,
      y: box.gfx.y - 30,
      scaleX: 4.5,
      scaleY: 4.5,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Diğer kutuları soluklaştır
    this._boxes.forEach(b => {
      if (b !== box) {
        this.tweens.add({
          targets: [b.gfx, b.label],
          alpha: 0.2,
          duration: 300,
        });
      }
    });

    // Ödülü göster
    this.time.delayedCall(500, () => {
      // Ödül sprite
      const prizeImg = this.add.image(box.gfx.x, box.gfx.y + 10, prize.sprite)
        .setScale(prize.scale * 1.5)
        .setAlpha(0);
      this.tweens.add({
        targets: prizeImg,
        alpha: 1,
        scale: prize.scale * 2,
        duration: 400,
        ease: 'Back.easeOut',
      });

      box.label.setText(prize.name);
      box.label.setStyle({ fill: prize.color, fontSize: '7px' });

      // Puan güncelle
      this._score = Math.max(0, this._score + prize.points);
      this._scoreTxt.setText('PUAN: ' + this._score);

      if (prize.points > 0) {
        soundManager.playScore();
        this._msgTxt.setText(`+${prize.points} PUAN!`).setStyle({ fill: '#2a9d8f' });
      } else {
        soundManager.playWarning();
        this._msgTxt.setText(`${prize.points} PUAN!`).setStyle({ fill: '#e63946' });
        this.cameras.main.shake(200, 0.015);
      }

      // Sonraki tur veya oyun sonu
      this.time.delayedCall(1800, () => {
        prizeImg.destroy();
        if (this._round >= this._totalRounds) {
          this._endGame();
        } else {
          this._startRound();
        }
      });
    });
  }

  _endGame() {
    this._gameOver = true;
    soundManager.playGameOver();

    // Kutuları temizle
    this._boxes.forEach(b => {
      if (b.gfx && b.gfx.active) b.gfx.destroy();
      if (b.label && b.label.active) b.label.destroy();
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
      this.scene.stop('LootMiniGame');
    });
  }
}
