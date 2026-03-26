import { soundManager } from '../audio/SoundManager.js';

/**
 * MilkMiniGame — Süt Doldurma
 * Bardağa süt doldur, hedef çizgiye ulaşınca bırak.
 * 5 tur, her turda hedef farklı.
 * Ne kadar yakınsan o kadar puan.
 */
export default class MilkMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'MilkMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._round = 0;
    this._totalRounds = 5;
    this._filling = false;
    this._milkLevel = 0;
    this._targetLevel = 0;
    this._fillSpeed = 0;
    this._gameOver = false;
    this._roundActive = false;
  }

  create() {
    const W = 480, H = 360;
    this.add.rectangle(0, 0, W, H, 0x1a2a3e).setOrigin(0, 0);

    this.add.text(W / 2, 18, 'SUT DOLDURMA!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffd166',
    }).setOrigin(0.5);

    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('MilkMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f',
    });
    this._roundTxt = this.add.text(W - 20, 14, 'TUR: 1/5', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
    }).setOrigin(1, 0);

    // Bardak (büyük, ortada)
    this._glassX = W / 2;
    this._glassY = 80;
    this._glassW = 80;
    this._glassH = 200;

    // Bardak çizimi
    this._glassBg = this.add.rectangle(this._glassX, this._glassY + this._glassH / 2,
      this._glassW, this._glassH, 0x90c8e8, 0.3)
      .setStrokeStyle(3, 0x70a8d0);

    // Süt seviyesi (alttan dolar)
    this._milkGfx = this.add.rectangle(
      this._glassX, this._glassY + this._glassH, this._glassW - 6, 0, 0xf0f0f0
    ).setOrigin(0.5, 1);

    // Hedef çizgisi
    this._targetLine = this.add.rectangle(
      this._glassX, this._glassY + this._glassH, this._glassW + 20, 3, 0x2a9d8f
    ).setOrigin(0.5, 0.5);

    // Hedef label
    this._targetLabel = this.add.text(this._glassX + this._glassW / 2 + 18, 0, 'HEDEF', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#2a9d8f',
    }).setOrigin(0, 0.5);

    // Musluk
    this.add.rectangle(this._glassX, this._glassY - 20, 20, 16, 0x888888);
    this.add.rectangle(this._glassX, this._glassY - 10, 8, 6, 0x666666);

    // Akan süt stream (gizli başta)
    this._milkStream = this.add.rectangle(
      this._glassX, this._glassY - 4, 4, 0, 0xf0f0f0
    ).setOrigin(0.5, 0).setAlpha(0);

    // Sonuç mesajı
    this._resultTxt = this.add.text(W / 2, H - 60, '', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff',
    }).setOrigin(0.5);

    // Tıklama / dokunma kontrol
    this.input.on('pointerdown', () => { if (this._roundActive && !this._filling) this._startFill(); });
    this.input.on('pointerup',   () => { if (this._filling) this._stopFill(); });
    this.input.on('pointerout',  () => { if (this._filling) this._stopFill(); });
    this.input.on('gameout',     () => { if (this._filling) this._stopFill(); });

    // Space kontrol
    this.input.keyboard.on('keydown-SPACE', () => { if (this._roundActive && !this._filling) this._startFill(); });
    this.input.keyboard.on('keyup-SPACE',   () => { if (this._filling) this._stopFill(); });

    this.add.text(W / 2, H - 14, 'BASILI TUT = SUT AKAR, BIRAK = DURUR', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#555',
    }).setOrigin(0.5);

    // İlk turu başlat
    this._startRound();
  }

  update() {
    if (this._filling && this._roundActive) {
      this._milkLevel = Math.min(this._glassH - 6, this._milkLevel + this._fillSpeed);
      this._milkGfx.setSize(this._glassW - 6, this._milkLevel);

      // Süt stream yüksekliği
      const streamH = this._glassY + this._glassH - this._milkLevel - (this._glassY - 4);
      this._milkStream.height = Math.max(0, streamH);

      // Taşma kontrolü
      if (this._milkLevel >= this._glassH - 6) {
        this._stopFill();
      }
    }
  }

  _startRound() {
    this._round++;
    this._roundTxt.setText(`TUR: ${this._round}/${this._totalRounds}`);
    this._milkLevel = 0;
    this._milkGfx.setSize(this._glassW - 6, 0);
    this._filling = false;
    this._roundActive = true;
    this._resultTxt.setText('');

    // Rastgele hedef (bardağın %20-%80'i arası)
    this._targetLevel = Phaser.Math.Between(
      Math.floor(this._glassH * 0.2),
      Math.floor(this._glassH * 0.8)
    );

    // Hedef çizgisini güncelle
    const targetY = this._glassY + this._glassH - this._targetLevel;
    this._targetLine.y = targetY;
    this._targetLabel.y = targetY;

    // Dolum hızı (her turda biraz farklı)
    this._fillSpeed = 0.8 + this._round * 0.2;
  }

  _startFill() {
    this._filling = true;
    this._milkStream.setAlpha(1);
  }

  _stopFill() {
    this._filling = false;
    this._milkStream.setAlpha(0);
    this._milkStream.height = 0;
    this._roundActive = false;

    // Puan hesapla
    const diff = Math.abs(this._milkLevel - this._targetLevel);
    let points = 0;
    let msg = '';

    if (this._milkLevel >= this._glassH - 8) {
      // Taştı!
      points = 0;
      msg = 'TASTI! 0 puan';
      this._resultTxt.setStyle({ fill: '#e63946' });
    } else if (diff < 5) {
      points = 3;
      msg = 'MUKEMMEL! +3 puan';
      this._resultTxt.setStyle({ fill: '#2a9d8f' });
    } else if (diff < 15) {
      points = 2;
      msg = 'IYI! +2 puan';
      this._resultTxt.setStyle({ fill: '#ffd166' });
    } else if (diff < 30) {
      points = 1;
      msg = 'FENA DEGIL! +1 puan';
      this._resultTxt.setStyle({ fill: '#ffffff' });
    } else {
      points = 0;
      msg = 'KACIRILDI! 0 puan';
      this._resultTxt.setStyle({ fill: '#e63946' });
    }

    this._score += points;
    this._scoreTxt.setText('PUAN: ' + this._score);
    this._resultTxt.setText(msg);

    if (points > 0) soundManager.playScore();
    else soundManager.playBounce();

    // Sonraki tur veya oyun sonu
    this.time.delayedCall(1500, () => {
      if (this._round >= this._totalRounds) {
        this._endGame();
      } else {
        this._startRound();
      }
    });
  }

  _endGame() {
    this._gameOver = true;
    soundManager.playGameOver();

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
      this.scene.stop('MilkMiniGame');
    });
  }
}
