import { soundManager } from '../audio/SoundManager.js';

/**
 * WordMiniGame — Kelime Bulmaca
 * Karışık harflerden kedi temalı kelime oluştur.
 * 5 tur, 45 saniye süre.
 */

const WORD_DATA = [
  // 4 harfli (kolay)
  { word: 'MAMA', hint: 'Kedinin yiyecegi' },
  { word: 'PATI', hint: 'Kedinin ayagi' },
  { word: 'KEDI', hint: 'Bu oyundaki hayvan' },
  { word: 'UYKU', hint: 'Kedinin en sevdigi aktivite' },
  { word: 'OYUN', hint: 'Kedi bununla eglenir' },
  // 5 harfli (orta)
  { word: 'MIYAV', hint: 'Kedinin sesi' },
  { word: 'BALIK', hint: 'Kedinin en sevdigi yemek' },
  { word: 'YUMAK', hint: 'Kedinin oyuncagi' },
  { word: 'KULAK', hint: 'Kedinin duyma organi' },
  { word: 'SEKER', hint: 'Tatli bir sey' },
  { word: 'TEKIR', hint: 'Bir kedi turu' },
  { word: 'PAMUK', hint: 'Yumusak ve beyaz' },
  { word: 'DUMAN', hint: 'Gri renkte' },
  { word: 'BULUT', hint: 'Gokyuzundeki beyaz' },
  // 6 harfli (zor)
  { word: 'PENCE', hint: 'Kedinin tirnaklari' },
  { word: 'FINDIK', hint: 'Kucuk ve kahverengi' },
  { word: 'KUYRUK', hint: 'Kedinin arkasindaki' },
];

export default class WordMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'WordMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._round = 0;
    this._totalRounds = 5;
    this._timeLeft = 45;
    this._gameOver = false;
    this._currentWord = '';
    this._currentHint = '';
    this._enteredLetters = [];
    this._letterButtons = [];
    this._slotTexts = [];
    this._usedWords = [];
  }

  create() {
    const W = 480, H = 360;
    this.add.rectangle(0, 0, W, H, 0x1a1a2e).setOrigin(0, 0);

    // Çıkış butonu
    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('WordMiniGame'); });

    this.add.text(W / 2, 18, 'KELIME BULMACA!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffd166',
    }).setOrigin(0.5);

    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f',
    });
    this._timeTxt = this.add.text(W - 20, 14, 'SURE: 45', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
    }).setOrigin(1, 0);
    this._roundTxt = this.add.text(W / 2, 36, 'TUR: 1/5', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#888',
    }).setOrigin(0.5);

    // İpucu
    this._hintTxt = this.add.text(W / 2, 120, '', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#457b9d',
    }).setOrigin(0.5);

    // Sonuç mesajı
    this._resultTxt = this.add.text(W / 2, 150, '', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f',
    }).setOrigin(0.5);

    // Geri al butonu
    this._undoBtn = this.add.text(W / 2, 260, '[ <- GERI ]', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#e63946',
      backgroundColor: '#1e1e3a', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this._undoBtn.on('pointerover', () => this._undoBtn.setStyle({ fill: '#ff6666' }));
    this._undoBtn.on('pointerout',  () => this._undoBtn.setStyle({ fill: '#e63946' }));
    this._undoBtn.on('pointerdown', () => this._undoLetter());

    // Süre timer
    this.time.addEvent({
      delay: 1000,
      callback: this._countdown,
      callbackScope: this,
      loop: true,
    });

    this.add.text(W / 2, H - 14, 'HARFLERE TIKLAYARAK KELIMEYI BUL!', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#555',
    }).setOrigin(0.5);

    // İlk kelimeyi başlat
    this._startWord();
  }

  _getWordForRound() {
    let pool;
    if (this._round <= 2) {
      pool = WORD_DATA.filter(w => w.word.length <= 4);
    } else if (this._round <= 4) {
      pool = WORD_DATA.filter(w => w.word.length === 5);
    } else {
      pool = WORD_DATA.filter(w => w.word.length >= 6);
    }
    // Kullanılmamış kelimelerden seç
    const available = pool.filter(w => !this._usedWords.includes(w.word));
    if (available.length === 0) return pool[Phaser.Math.Between(0, pool.length - 1)];
    return available[Phaser.Math.Between(0, available.length - 1)];
  }

  _startWord() {
    this._round++;
    this._roundTxt.setText(`TUR: ${this._round}/${this._totalRounds}`);
    this._resultTxt.setText('');

    // Kelime seç
    const wordData = this._getWordForRound();
    this._currentWord = wordData.word;
    this._currentHint = wordData.hint;
    this._usedWords.push(this._currentWord);
    this._enteredLetters = [];

    // Eski UI temizle
    this._slotTexts.forEach(s => s.destroy());
    this._slotTexts = [];
    this._letterButtons.forEach(b => { b.bg.destroy(); b.txt.destroy(); });
    this._letterButtons = [];

    // İpucu
    this._hintTxt.setText('Ipucu: ' + this._currentHint);

    const W = 480;
    const word = this._currentWord;
    const len = word.length;

    // Boş kutular (üstte)
    const slotW = 32, slotGap = 8;
    const slotsTotal = len * slotW + (len - 1) * slotGap;
    const slotStartX = (W - slotsTotal) / 2 + slotW / 2;

    for (let i = 0; i < len; i++) {
      const sx = slotStartX + i * (slotW + slotGap);
      const sy = 80;
      this.add.rectangle(sx, sy, slotW, slotW, 0x2d2d44)
        .setStrokeStyle(2, 0x457b9d);

      const slotTxt = this.add.text(sx, sy, '', {
        fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#ffffff',
      }).setOrigin(0.5);
      this._slotTexts.push(slotTxt);
    }

    // Harfleri karıştır
    const shuffled = Phaser.Utils.Array.Shuffle([...word]);

    // Harf butonları (altta)
    const btnW = 36, btnGap = 8;
    const btnsTotal = len * btnW + (len - 1) * btnGap;
    const btnStartX = (W - btnsTotal) / 2 + btnW / 2;

    shuffled.forEach((letter, i) => {
      const bx = btnStartX + i * (btnW + btnGap);
      const by = 200;

      const bg = this.add.rectangle(bx, by, btnW, btnW, 0x1e1e3a)
        .setStrokeStyle(2, 0xf4a261)
        .setInteractive({ useHandCursor: true });

      const txt = this.add.text(bx, by, letter, {
        fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#f4a261',
      }).setOrigin(0.5);

      const btnObj = { bg, txt, letter, index: i, used: false };
      this._letterButtons.push(btnObj);

      bg.on('pointerover', () => {
        if (!btnObj.used) { bg.setFillStyle(0x2d2d55); bg.setStrokeStyle(2, 0xffd166); }
      });
      bg.on('pointerout', () => {
        if (!btnObj.used) { bg.setFillStyle(0x1e1e3a); bg.setStrokeStyle(2, 0xf4a261); }
      });
      bg.on('pointerdown', () => {
        if (!btnObj.used && !this._gameOver) this._onLetterClick(btnObj);
      });
    });
  }

  _onLetterClick(btnObj) {
    if (this._enteredLetters.length >= this._currentWord.length) return;

    soundManager.playClick();
    btnObj.used = true;
    btnObj.bg.setFillStyle(0x0a0a1e);
    btnObj.bg.setStrokeStyle(2, 0x333355);
    btnObj.txt.setStyle({ fill: '#333355' });

    this._enteredLetters.push(btnObj);

    // Kutulara yerleştir
    const idx = this._enteredLetters.length - 1;
    this._slotTexts[idx].setText(btnObj.letter);

    // Tüm kutular doldu mu?
    if (this._enteredLetters.length === this._currentWord.length) {
      this._checkWord();
    }
  }

  _undoLetter() {
    if (this._enteredLetters.length === 0 || this._gameOver) return;
    soundManager.playClick();

    const btnObj = this._enteredLetters.pop();
    btnObj.used = false;
    btnObj.bg.setFillStyle(0x1e1e3a);
    btnObj.bg.setStrokeStyle(2, 0xf4a261);
    btnObj.txt.setStyle({ fill: '#f4a261' });

    // Kutudan kaldır
    this._slotTexts[this._enteredLetters.length].setText('');
  }

  _checkWord() {
    const entered = this._enteredLetters.map(b => b.letter).join('');

    if (entered === this._currentWord) {
      // Doğru!
      this._score += 2;
      this._scoreTxt.setText('PUAN: ' + this._score);
      soundManager.playScore();
      this._resultTxt.setText('DOGRU!').setStyle({ fill: '#2a9d8f' });

      // Kutulara yeşil efekt
      this._slotTexts.forEach(s => s.setStyle({ fill: '#2a9d8f' }));

      // Sonraki kelime veya oyun sonu
      this.time.delayedCall(1200, () => {
        if (this._round >= this._totalRounds) {
          // Tüm kelimeleri bildi — bonus
          this._score += 3;
          this._scoreTxt.setText('PUAN: ' + this._score);
          this._endGame();
        } else {
          this._startWord();
        }
      });
    } else {
      // Yanlış!
      soundManager.playBounce();
      this._resultTxt.setText('YANLIS! Tekrar dene.').setStyle({ fill: '#e63946' });

      // Kutulara kırmızı flash
      this._slotTexts.forEach(s => s.setStyle({ fill: '#e63946' }));

      // 0.8 sn sonra temizle
      this.time.delayedCall(800, () => {
        this._enteredLetters.forEach(b => {
          b.used = false;
          b.bg.setFillStyle(0x1e1e3a);
          b.bg.setStrokeStyle(2, 0xf4a261);
          b.txt.setStyle({ fill: '#f4a261' });
        });
        this._enteredLetters = [];
        this._slotTexts.forEach(s => { s.setText(''); s.setStyle({ fill: '#ffffff' }); });
        this._resultTxt.setText('');
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
    this.add.rectangle(W / 2, H / 2, 320, 160, 0x0f0f1e, 0.95).setOrigin(0.5).setDepth(100);
    this.add.text(W / 2, H / 2 - 50, 'OYUN BITTI!', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#ffd166',
    }).setOrigin(0.5).setDepth(100);
    this.add.text(W / 2, H / 2 - 10, `PUAN: ${this._score}`, {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#2a9d8f',
    }).setOrigin(0.5).setDepth(100);
    const bonus = Math.min(this._score * 3, 30);
    this.add.text(W / 2, H / 2 + 20, `+${bonus} MUTLULUK`, {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
    }).setOrigin(0.5).setDepth(100);
    const btn = this.add.text(W / 2, H / 2 + 55, '[ DEVAM ]', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', fill: '#ffffff',
      backgroundColor: '#457b9d', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    btn.on('pointerover', () => btn.setStyle({ fill: '#ffd166' }));
    btn.on('pointerout',  () => btn.setStyle({ fill: '#ffffff' }));
    btn.on('pointerdown', () => {
      this._onComplete(bonus);
      this.scene.stop('WordMiniGame');
    });
  }
}
