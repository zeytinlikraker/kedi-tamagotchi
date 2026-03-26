import { soundManager } from '../audio/SoundManager.js';

/**
 * GameSelectScene — Oyun Seçme Ekranı + Instruction Panel
 * 8 mini oyun butonu, seçince açıklama ekranı, sonra başla.
 */

const GAMES = [
  {
    key: 'FishMiniGame',
    label: 'Balik Yakalama',
    icon: '🐟',
    desc: [
      'Baliklar yukardan duser.',
      'Kediyi saga sola hareket ettir.',
      'Baliklari yakala!',
    ],
    controls: 'OK TUS / FARE',
    time: '20 saniye',
  },
  {
    key: 'MouseMiniGame',
    label: 'Fare Yakalama',
    icon: '🐭',
    desc: [
      'Deliklerden fareler cikar.',
      'Farelere tiklayarak yakala!',
      'Hizlari giderek artar.',
    ],
    controls: 'FARE TIKLAMA',
    time: '15 saniye',
  },
  {
    key: 'MemoryMiniGame',
    label: 'Hafiza Karti',
    icon: '🃏',
    desc: [
      'Kartlari tiklayarak cevir.',
      'Ayni ikonu bul ve esle!',
      '6 cifti bul, sure bitmeden.',
      'Hizli bitirirsen bonus puan!',
    ],
    controls: 'FARE TIKLAMA',
    time: '30 saniye',
  },
  {
    key: 'YarnMiniGame',
    label: 'Yumak Sarma',
    icon: '🧵',
    desc: [
      'Ibre yumak etrafinda doner.',
      'Yesil bolgede tikla = puan!',
      'Yanlis zamanda = kacirirsin.',
      'Zorluk giderek artar!',
    ],
    controls: 'TIKLA / SPACE',
    time: '20 saniye',
  },
  {
    key: 'TetrisMiniGame',
    label: 'Kedi Tetris',
    icon: '🧱',
    desc: [
      'Bloklar yukardan duser.',
      'Saga sola hareket ettir.',
      'Satir tamamla = puan!',
      'Uste ulasirsa oyun biter.',
    ],
    controls: 'OK TUS / TIKLA',
    time: 'Dolana kadar',
  },
  {
    key: 'FlyMiniGame',
    label: 'Sinek Yakalama',
    icon: '🪰',
    desc: [
      'Sinekler etrafta ucar.',
      'Tiklayarak yakala!',
      'Arilara tiklamaktan kacin.',
      'Ari = -3 puan!',
    ],
    controls: 'FARE TIKLAMA',
    time: '15 saniye',
  },
  {
    key: 'MilkMiniGame',
    label: 'Sut Doldurma',
    icon: '🥛',
    desc: [
      'Basili tut = sut akar.',
      'Hedef cizgiye ulasinca birak!',
      'Ne kadar yakinsan o kadar puan.',
      'Tasirirsan 0 puan!',
    ],
    controls: 'BASILI TUT / BIRAK',
    time: '5 tur',
  },
  {
    key: 'LootMiniGame',
    label: 'Kutu Ac',
    icon: '🎁',
    desc: [
      '3 kutudan birini sec.',
      'Altin balik, kalp, yumak veya...',
      'BOMBA cikarsa puan kaybedersin!',
      'Bazi turlarda ipucu verilir.',
    ],
    controls: 'FARE TIKLAMA',
    time: '5 tur',
  },
  {
    key: 'BirdMiniGame',
    label: 'Kus Gozleme',
    icon: '🐦',
    desc: [
      'Pencereden kuslar ucar.',
      'Tiklayarak yakala!',
      'Altin kus = 5 puan!',
      'Buluta tiklarsan -1 puan.',
    ],
    controls: 'FARE TIKLAMA',
    time: '20 saniye',
  },
];

export default class GameSelectScene extends Phaser.Scene {
  constructor() { super({ key: 'GameSelectScene' }); }

  init(data) {
    this._onSelect = data.onSelect || (() => {});
    this._onCancel = data.onCancel || (() => {});
    this._state = 'list'; // 'list' veya 'instruction'
  }

  create() {
    const W = 480, H = 360;

    // Arkaplan
    this.add.rectangle(0, 0, W, H, 0x0f0f1e, 0.95).setOrigin(0, 0);

    // ── LİSTE DURUMU ──────────────────────────────────────────────
    this._listGroup = this.add.group();

    // Başlık
    this._listGroup.add(
      this.add.text(W / 2, 24, 'OYUN SEC!', {
        fontFamily: '"Press Start 2P"', fontSize: '14px', fill: '#f4a261',
      }).setOrigin(0.5)
    );

    // 2 sütun x 5 satır grid (9 oyun)
    const COLS = 2;
    const BTN_W = 200, BTN_H = 42;
    const GAP_X = 16, GAP_Y = 6;
    const totalW = COLS * BTN_W + (COLS - 1) * GAP_X;
    const startX = (W - totalW) / 2;
    const startY = 55;

    GAMES.forEach((game, idx) => {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const bx = startX + col * (BTN_W + GAP_X);
      const by = startY + row * (BTN_H + GAP_Y);

      const bg = this.add.rectangle(bx + BTN_W / 2, by + BTN_H / 2, BTN_W, BTN_H, 0x1e1e3a)
        .setStrokeStyle(2, 0x457b9d)
        .setInteractive({ useHandCursor: true });
      this._listGroup.add(bg);

      const label = this.add.text(bx + BTN_W / 2, by + BTN_H / 2, `${game.icon} ${game.label}`, {
        fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#ffffff',
      }).setOrigin(0.5);
      this._listGroup.add(label);

      bg.on('pointerover', () => {
        bg.setFillStyle(0x2d2d55);
        bg.setStrokeStyle(2, 0xf4a261);
        label.setStyle({ fill: '#f4a261' });
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x1e1e3a);
        bg.setStrokeStyle(2, 0x457b9d);
        label.setStyle({ fill: '#ffffff' });
      });
      bg.on('pointerdown', () => {
        soundManager.playClick();
        this._showInstruction(game);
      });
    });

    // Geri butonu (listeden çık)
    const backBtn = this.add.text(W / 2, H - 30, '[ GERI ]', {
      fontFamily: '"Press Start 2P"', fontSize: '9px', fill: '#888',
      backgroundColor: '#1e1e3a', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this._listGroup.add(backBtn);

    backBtn.on('pointerover', () => backBtn.setStyle({ fill: '#e63946' }));
    backBtn.on('pointerout',  () => backBtn.setStyle({ fill: '#888' }));
    backBtn.on('pointerdown', () => {
      soundManager.playClick();
      this._onCancel();
      this.scene.stop('GameSelectScene');
    });

    // ── INSTRUCTION GRUBU (başta gizli) ───────────────────────────
    this._instrGroup = this.add.group();
    this._instrGroup.setVisible(false);
  }

  // ── INSTRUCTION EKRANI ──────────────────────────────────────────
  _showInstruction(game) {
    this._state = 'instruction';

    // Listeyi gizle
    this._listGroup.getChildren().forEach(c => c.setVisible(false));

    // Eski instruction varsa temizle
    this._instrGroup.clear(true, true);
    this._instrGroup.setVisible(true);

    const W = 480, H = 360;

    // Panel arkaplanı
    this._instrGroup.add(
      this.add.rectangle(W / 2, H / 2, 400, 300, 0x0f0f1e)
        .setStrokeStyle(3, 0xf4a261)
    );

    // Oyun başlığı
    this._instrGroup.add(
      this.add.text(W / 2, 55, `${game.icon} ${game.label.toUpperCase()}`, {
        fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#f4a261',
      }).setOrigin(0.5)
    );

    // Ayırıcı çizgi
    this._instrGroup.add(
      this.add.rectangle(W / 2, 72, 250, 2, 0x457b9d)
    );

    // "Nasil Oynanir?" başlığı
    this._instrGroup.add(
      this.add.text(W / 2, 90, 'NASIL OYNANIR?', {
        fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#457b9d',
      }).setOrigin(0.5)
    );

    // Açıklama satırları
    game.desc.forEach((line, i) => {
      this._instrGroup.add(
        this.add.text(W / 2, 112 + i * 18, line, {
          fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#cccccc',
        }).setOrigin(0.5)
      );
    });

    const infoY = 112 + game.desc.length * 18 + 14;

    // Kontrol bilgisi
    this._instrGroup.add(
      this.add.text(W / 2, infoY, `Kontrol: ${game.controls}`, {
        fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#2a9d8f',
      }).setOrigin(0.5)
    );

    // Süre bilgisi
    this._instrGroup.add(
      this.add.text(W / 2, infoY + 18, `Sure: ${game.time}`, {
        fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#2a9d8f',
      }).setOrigin(0.5)
    );

    // BAŞLA butonu
    const startBtn = this.add.text(W / 2, H - 70, '[ BASLA! ]', {
      fontFamily: '"Press Start 2P"', fontSize: '11px', fill: '#ffffff',
      backgroundColor: '#e63946', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this._instrGroup.add(startBtn);

    // Pulse animasyonu
    this.tweens.add({
      targets: startBtn,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    startBtn.on('pointerover', () => startBtn.setStyle({ fill: '#ffd166' }));
    startBtn.on('pointerout',  () => startBtn.setStyle({ fill: '#ffffff' }));
    startBtn.on('pointerdown', () => {
      soundManager.playClick();
      soundManager.stopBGM();
      soundManager.startGameBGM();
      this._onSelect(game.key);
      this.scene.stop('GameSelectScene');
    });

    // GERİ butonu (listeye dön)
    const backBtn = this.add.text(W / 2, H - 35, '[ GERI ]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this._instrGroup.add(backBtn);

    backBtn.on('pointerover', () => backBtn.setStyle({ fill: '#e63946' }));
    backBtn.on('pointerout',  () => backBtn.setStyle({ fill: '#888' }));
    backBtn.on('pointerdown', () => {
      soundManager.playClick();
      this._hideInstruction();
    });
  }

  _hideInstruction() {
    this._state = 'list';

    // Instruction gizle
    this._instrGroup.clear(true, true);
    this._instrGroup.setVisible(false);

    // Listeyi göster
    this._listGroup.getChildren().forEach(c => c.setVisible(true));
  }
}
