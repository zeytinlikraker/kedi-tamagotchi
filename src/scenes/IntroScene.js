import { COLOR_PALETTES, DEFAULT_COLOR, generateCatSheet } from './BootScene.js';
import { soundManager } from '../audio/SoundManager.js';

// ── HAZIR İSİM LİSTESİ ────────────────────────────────────────────
const CAT_NAMES = [
  'Misir', 'Pamuk', 'Boncuk', 'Minnos', 'Tekir',
  'Pasa', 'Seker', 'Tarcin', 'Bulut', 'Findik',
  'Karamel', 'Poncik', 'Duman', 'Zeytin', 'Limon',
  'Cakil', 'Patik', 'Pati', 'Ponpon', 'Safran',
];

const SAVE_KEY = 'kedi_tamagotchi_save';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  init() {
    this._colorKeys = Object.keys(COLOR_PALETTES);
    this._selectedColor = DEFAULT_COLOR;
    this._nameIndex = Phaser.Math.Between(0, CAT_NAMES.length - 1);
    this._customName = '';
    this._usingCustom = false;
  }

  create() {
    const W = 480, H = 360;

    // Arkaplan
    this.add.rectangle(0, 0, W, H, 0x16213e).setOrigin(0, 0);

    // Dekoratif yıldızlar
    for (let i = 0; i < 25; i++) {
      const sx = Phaser.Math.Between(10, W - 10);
      const sy = Phaser.Math.Between(10, H - 10);
      const star = this.add.rectangle(sx, sy, 2, 2, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.7));
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 0.4),
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }

    // ── BAŞLIK ──
    this.add.text(W / 2, 28, 'KEDI TAMAGOTCHI', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#f4a261',
    }).setOrigin(0.5);

    this.add.text(W / 2, 52, 'Kedini olustur!', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ccc',
    }).setOrigin(0.5);

    // ── KED? ÖNİZLEME ──
    this._previewSprite = this.add.sprite(W / 2, 140, 'cat_sheet', 0)
      .setScale(4)
      .setOrigin(0.5, 0.5);

    // Idle animasyon — preview için
    this._previewSprite.play('cat_idle');

    // Hafif bounce
    this.tweens.add({
      targets: this._previewSprite,
      y: 136,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── RENK SEÇİMİ ──
    this.add.text(W / 2, 190, 'RENK SEC', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#f4a261',
    }).setOrigin(0.5);

    const totalColors = this._colorKeys.length;
    const swatchSize = 24;
    const swatchGap = 10;
    const rowWidth = totalColors * swatchSize + (totalColors - 1) * swatchGap;
    const startX = (W - rowWidth) / 2 + swatchSize / 2;

    this._colorSwatches = [];
    this._colorBorders = [];

    this._colorKeys.forEach((key, i) => {
      const cx = startX + i * (swatchSize + swatchGap);
      const cy = 212;
      const pal = COLOR_PALETTES[key];

      // Dış border (seçili olunca parlak)
      const border = this.add.rectangle(cx, cy, swatchSize + 6, swatchSize + 6, 0x444466)
        .setStrokeStyle(2, 0x444466);
      this._colorBorders.push(border);

      // Renk karesi
      const swatch = this.add.rectangle(cx, cy, swatchSize, swatchSize, pal.body)
        .setInteractive({ useHandCursor: true });
      this._colorSwatches.push(swatch);

      // Renk adı — hover
      swatch.on('pointerover', () => {
        swatch.setScale(1.2);
      });
      swatch.on('pointerout', () => {
        swatch.setScale(1);
      });
      swatch.on('pointerdown', () => {
        this._selectColor(key);
        soundManager.playClick();
      });
    });

    this._updateColorHighlight();

    // ── İSİM SEÇİMİ ──
    this.add.text(W / 2, 242, 'ISIM SEC', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#f4a261',
    }).setOrigin(0.5);

    // Sol ok
    const leftArrow = this.add.text(W / 2 - 100, 266, '<', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#457b9d',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    leftArrow.on('pointerdown', () => {
      this._prevName();
      soundManager.playClick();
    });
    leftArrow.on('pointerover', () => leftArrow.setStyle({ fill: '#f4a261' }));
    leftArrow.on('pointerout',  () => leftArrow.setStyle({ fill: '#457b9d' }));

    // İsim gösterimi
    this._nameText = this.add.text(W / 2, 266, CAT_NAMES[this._nameIndex], {
      fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#ffffff',
    }).setOrigin(0.5);

    // Sağ ok
    const rightArrow = this.add.text(W / 2 + 100, 266, '>', {
      fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#457b9d',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    rightArrow.on('pointerdown', () => {
      this._nextName();
      soundManager.playClick();
    });
    rightArrow.on('pointerover', () => rightArrow.setStyle({ fill: '#f4a261' }));
    rightArrow.on('pointerout',  () => rightArrow.setStyle({ fill: '#457b9d' }));

    // Custom isim butonu
    const customBtn = this.add.text(W / 2, 290, '[ veya kendi ismini yaz ]', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    customBtn.on('pointerdown', () => {
      this._showCustomInput();
      soundManager.playClick();
    });
    customBtn.on('pointerover', () => customBtn.setStyle({ fill: '#f4a261' }));
    customBtn.on('pointerout',  () => customBtn.setStyle({ fill: '#888' }));

    // ── BAŞLA BUTONU ──
    const startBtn = this.add.text(W / 2, 330, '[ BASLA! ]', {
      fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#ffffff',
      backgroundColor: '#e63946', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ffd166' }));
    startBtn.on('pointerout',  () => startBtn.setStyle({ fill: '#ffffff' }));
    startBtn.on('pointerdown', () => this._startGame());

    // Başla butonuna hafif pulse
    this.tweens.add({
      targets: startBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── SES BAŞLAT (ilk etkileşimde) ──
    this.input.on('pointerdown', () => {
      if (!this._soundInited) {
        this._soundInited = true;
        soundManager.init();
        soundManager.resume();
        soundManager.startBGM();
      }
    });
    this._soundInited = false;

    // Custom input event listener
    this._setupCustomInput();
  }

  // ── RENK SEÇİMİ ─────────────────────────────────────────────────
  _selectColor(colorKey) {
    this._selectedColor = colorKey;
    this._updateColorHighlight();

    // Sprite animasyonunu durdur (eski texture referansını bırak)
    this._previewSprite.stop();
    this._previewSprite.setTexture('__DEFAULT');

    // Yeni renkte texture üret (yavru olarak — yeni oyun)
    generateCatSheet(this, colorKey, 'kitten');

    // Animasyon frame'lerini yeniden tanımla
    this._redefineAnims();

    // Preview sprite'ı yeni texture ile güncelle
    this._previewSprite.setTexture('cat_sheet', 0);
    this._previewSprite.play('cat_idle');
  }

  _redefineAnims() {
    const anims = this.anims;
    const f = (nums) => nums.map(n => ({ key: 'cat_sheet', frame: n }));

    // Mevcut animasyonları sil ve yeniden oluştur
    ['cat_idle', 'cat_happy', 'cat_hungry', 'cat_sleeping', 'cat_bathing', 'cat_dead', 'cat_tired', 'cat_bored'].forEach(k => {
      if (anims.exists(k)) anims.remove(k);
    });

    anims.create({ key: 'cat_idle',     frames: f([0, 1]),   frameRate: 2,   repeat: -1 });
    anims.create({ key: 'cat_happy',    frames: f([2, 3]),   frameRate: 4,   repeat: 6 });
    anims.create({ key: 'cat_hungry',   frames: f([4, 5]),   frameRate: 1,   repeat: -1 });
    anims.create({ key: 'cat_sleeping', frames: f([6, 7]),   frameRate: 0.5, repeat: -1 });
    anims.create({ key: 'cat_bathing',  frames: f([8]),      frameRate: 1,   repeat: -1 });
    anims.create({ key: 'cat_dead',     frames: f([9]),      frameRate: 1,   repeat: -1 });
    anims.create({ key: 'cat_tired',    frames: f([10, 11]), frameRate: 1,   repeat: -1 });
    anims.create({ key: 'cat_bored',    frames: f([12, 13]), frameRate: 0.8, repeat: -1 });
  }

  _updateColorHighlight() {
    this._colorKeys.forEach((key, i) => {
      const border = this._colorBorders[i];
      if (key === this._selectedColor) {
        border.setFillStyle(0xf4a261);
        border.setStrokeStyle(2, 0xffd166);
      } else {
        border.setFillStyle(0x444466);
        border.setStrokeStyle(2, 0x444466);
      }
    });
  }

  // ── İSİM SEÇİMİ ─────────────────────────────────────────────────
  _prevName() {
    this._usingCustom = false;
    this._hideCustomInput();
    this._nameIndex = (this._nameIndex - 1 + CAT_NAMES.length) % CAT_NAMES.length;
    this._nameText.setText(CAT_NAMES[this._nameIndex]);
  }

  _nextName() {
    this._usingCustom = false;
    this._hideCustomInput();
    this._nameIndex = (this._nameIndex + 1) % CAT_NAMES.length;
    this._nameText.setText(CAT_NAMES[this._nameIndex]);
  }

  _getCurrentName() {
    if (this._usingCustom && this._customName.trim().length > 0) {
      return this._customName.trim();
    }
    return CAT_NAMES[this._nameIndex];
  }

  // ── CUSTOM INPUT ─────────────────────────────────────────────────
  _setupCustomInput() {
    const input = document.getElementById('custom-name-input');
    if (!input) return;
    input.addEventListener('input', () => {
      this._customName = input.value;
      this._usingCustom = true;
      if (this._customName.trim().length > 0) {
        this._nameText.setText(this._customName.trim());
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      }
    });
  }

  _showCustomInput() {
    const input = document.getElementById('custom-name-input');
    if (!input) return;
    input.style.display = 'block';
    input.value = '';
    input.focus();
    this._usingCustom = true;
    this._nameText.setText('...');
  }

  _hideCustomInput() {
    const input = document.getElementById('custom-name-input');
    if (input) input.style.display = 'none';
  }

  // ── OYUNU BAŞLAT ─────────────────────────────────────────────────
  _startGame() {
    const name  = this._getCurrentName();
    const color = this._selectedColor;

    // Custom input'u gizle
    this._hideCustomInput();

    // İlk kayıt oluştur
    const saveData = {
      stats: { hunger: 80, happiness: 80, energy: 80, cleanliness: 80, fun: 80 },
      sleeping: false,
      savedAt: Date.now(),
      catName: name,
      catColor: color,
      birthDate: new Date().toISOString(),
      totalFeeds: 0, totalPets: 0, totalGames: 0, totalBaths: 0, totalCleans: 0,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));

    // HTML başlık güncelle
    document.getElementById('cat-name-display').textContent = name;

    // Ses efekti
    soundManager.playScore();

    // Kedi sprite'ı zaten doğru renkte — GameScene'e geç
    this.scene.start('GameScene', { catName: name, catColor: color });
  }
}
