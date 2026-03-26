import { soundManager } from '../audio/SoundManager.js';

/**
 * IdCardScene — Kedi Kimlik Kartı
 * Ayrı scene olarak açılır, tüm oyun objelerinin üstünde görünür.
 */
export default class IdCardScene extends Phaser.Scene {
  constructor() { super({ key: 'IdCardScene' }); }

  init(data) {
    this._catName    = data.catName    || 'Misir';
    this._catColor   = data.catColor   || 'orange';
    this._birthDate  = data.birthDate  || new Date().toISOString();
    this._ageStage   = data.ageStage   || 'adult';
    this._totalFeeds = data.totalFeeds || 0;
    this._totalPets  = data.totalPets  || 0;
    this._totalGames = data.totalGames || 0;
    this._totalBaths = data.totalBaths || 0;
    this._totalCleans= data.totalCleans|| 0;
  }

  create() {
    const W = 480, H = 360;
    const CX = W / 2, CY = H / 2;
    const CARD_W = 340, CARD_H = 290;

    // Koyu overlay (arka plan — tıklayınca kapat)
    const overlay = this.add.rectangle(CX, CY, W, H, 0x000000, 0.75)
      .setInteractive();
    overlay.on('pointerdown', () => this._close());

    // Kart arkaplanı
    this.add.rectangle(CX, CY, CARD_W, CARD_H, 0x0f0f1e)
      .setStrokeStyle(3, 0xf4a261);

    // Başlık
    this.add.text(CX, CY - CARD_H / 2 + 18, '🐱 KEDI KIMLIK KARTI', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#f4a261',
    }).setOrigin(0.5);

    // Üst ayırıcı
    this.add.rectangle(CX, CY - CARD_H / 2 + 32, CARD_W - 20, 1, 0x457b9d);

    // Kedi sprite çerçevesi (arkada)
    this.add.rectangle(CX - 100, CY - 30, 90, 100, 0x1e1e3a)
      .setStrokeStyle(2, 0x457b9d);

    // Kedi sprite (idle animasyonu)
    const catSprite = this.add.sprite(CX - 100, CY - 30, 'cat_sheet', 0)
      .setScale(2.5).setOrigin(0.5, 0.5);

    // Animasyon tanımla (scene'e özel, çakışma olmasın)
    if (!this.anims.exists('idcard_idle')) {
      this.anims.create({
        key: 'idcard_idle',
        frames: [{ key: 'cat_sheet', frame: 0 }, { key: 'cat_sheet', frame: 1 }],
        frameRate: 2,
        repeat: -1,
      });
    }
    catSprite.play('idcard_idle');

    // Bilgiler (sağ tarafta)
    const infoX = CX + 10;
    const infoStartY = CY - 90;
    const lineH = 22;

    // Renk label
    const colorLabel = this._getColorLabel(this._catColor);

    // Doğum tarihi ve yaş
    const birth = new Date(this._birthDate);
    const now = new Date();
    const diffDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24));
    const dateStr = `${birth.getDate().toString().padStart(2, '0')}.${(birth.getMonth() + 1).toString().padStart(2, '0')}.${birth.getFullYear()}`;
    const ageStr = diffDays === 0 ? 'Bugun dogdu!' : diffDays === 1 ? '1 gunluk' : `${diffDays} gunluk`;

    const stageLabels = { kitten: 'Yavru', young: 'Genc', adult: 'Yetiskin' };
    const stageLabel = stageLabels[this._ageStage] || 'Yetiskin';

    const lines = [
      { label: 'Isim:', value: this._catName },
      { label: 'Renk:', value: colorLabel },
      { label: 'Asama:', value: stageLabel },
      { label: 'Dogum:', value: dateStr },
      { label: 'Yas:', value: ageStr },
    ];

    lines.forEach((line, i) => {
      this.add.text(infoX, infoStartY + i * lineH, line.label, {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#888',
      });
      this.add.text(infoX + 60, infoStartY + i * lineH, line.value, {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ffffff',
      });
    });

    // İstatistikler ayırıcı
    const statY = CY + 50;
    this.add.rectangle(CX, statY - 8, CARD_W - 20, 1, 0x457b9d);
    this.add.text(CX, statY, 'ISTATISTIKLER', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#457b9d',
    }).setOrigin(0.5);

    // İstatistik değerleri (2 sütun)
    const stats = [
      { icon: '🍖', label: 'Besleme', value: this._totalFeeds },
      { icon: '💖', label: 'Sevme', value: this._totalPets },
      { icon: '🎮', label: 'Oyun', value: this._totalGames },
      { icon: '🛁', label: 'Banyo', value: this._totalBaths },
      { icon: '✨', label: 'Temizlik', value: this._totalCleans },
    ];

    stats.forEach((stat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = CX - 130 + col * 170;
      const sy = statY + 18 + row * 20;
      this.add.text(sx, sy, `${stat.icon} ${stat.label}: ${stat.value}`, {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#cccccc',
      });
    });

    // Kapat butonu
    const closeBtn = this.add.text(CX, CY + CARD_H / 2 - 20, '[ KAPAT ]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#ffffff',
      backgroundColor: '#457b9d', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ffd166' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ fill: '#ffffff' }));
    closeBtn.on('pointerdown', () => this._close());

    soundManager.playClick();
  }

  _close() {
    soundManager.playClick();
    this.scene.stop('IdCardScene');
  }

  _getColorLabel(colorKey) {
    const labels = {
      orange: 'Turuncu', gray: 'Gri', black: 'Siyah', white: 'Beyaz',
      brown: 'Kahverengi', tabby: 'Tekir', pink: 'Pembe', blue: 'Mavi',
    };
    return labels[colorKey] || colorKey;
  }
}
