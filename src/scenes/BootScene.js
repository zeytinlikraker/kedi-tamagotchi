// ── RENK PALETLERİ (8 adet) ────────────────────────────────────────
export const COLOR_PALETTES = {
  orange:  { body: 0xf4a261, dark: 0xc4622a, stripe: 0xc4622a, nose: 0xe63946, label: 'Turuncu' },
  gray:    { body: 0xb0b0b0, dark: 0x707070, stripe: 0x606060, nose: 0xd47070, label: 'Gri' },
  black:   { body: 0x3a3a3a, dark: 0x1a1a1a, stripe: 0x2a2a2a, nose: 0xc06060, label: 'Siyah' },
  white:   { body: 0xf0f0f0, dark: 0xc0c0c0, stripe: 0xd0d0d0, nose: 0xf09090, label: 'Beyaz' },
  brown:   { body: 0xa0724a, dark: 0x6b4c2a, stripe: 0x5a3d20, nose: 0xd46050, label: 'Kahverengi' },
  tabby:   { body: 0xd4a843, dark: 0x8b6914, stripe: 0x6b5010, nose: 0xe06050, label: 'Tekir' },
  pink:    { body: 0xf4a0c0, dark: 0xc06080, stripe: 0xb05070, nose: 0xff7090, label: 'Pembe' },
  blue:    { body: 0x7ec8e3, dark: 0x4a8fa8, stripe: 0x3a7a92, nose: 0xd07080, label: 'Mavi' },
};

export const DEFAULT_COLOR = 'orange';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.text(w / 2, h / 2 - 20, 'YUKLUYOR...', {
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      fill: '#f4a261',
    }).setOrigin(0.5);

    const barBg = this.add.rectangle(w / 2, h / 2 + 10, 200, 14, 0x2d2d44);
    const bar   = this.add.rectangle(w / 2 - 100, h / 2 + 10, 0, 10, 0xf4a261).setOrigin(0, 0.5);
    this.load.on('progress', (v) => { bar.width = 200 * v; });
  }

  create() {
    // Kedi dışı ortak assetleri üret
    this._generateRoomBackground();
    this._generateFoodSprite();
    this._generateBallSprite();
    this._generateFishSprite();
    this._generateHeartSprite();
    this._generateZzzSprite();
    this._generateBubbleSprite();
    this._generateMouseSprite();
    this._generateLaserDotSprite();
    this._generateCardSprites();
    this._generatePawSprite();
    this._generatePlatformBlockSprite();
    this._generateCloudSprite();
    this._generateMoonSprite();
    this._generateStarSprite();
    this._generateDreamFishSprite();
    this._generateNightmareCloudSprite();
    this._generateLitterBoxSprites();
    this._generatePoopSprite();
    this._generateFlySprite();
    this._generateBeeSprite();
    this._generateMilkGlassSprite();
    this._generateLootBoxSprite();
    this._generateBombSprite();
    this._generateBirdSprites();
    this._generateFeatherSprite();
    this._generateTetrisBlockSprite();
    this._generateAccessorySprites();
    this._generateMedicineSprite();
    this._generateSneezeBubbleSprite();
    // Save kontrol — varsa direkt oyuna, yoksa giriş ekranına
    const SAVE_KEY = 'kedi_tamagotchi_save';
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        const color = data.catColor || DEFAULT_COLOR;
        // Yaş hesapla
        const birthDate = data.birthDate || new Date().toISOString();
        const diffDays = Math.floor((Date.now() - new Date(birthDate)) / (1000*60*60*24));
        const ageStage = diffDays <= 2 ? 'kitten' : diffDays <= 6 ? 'young' : 'adult';
        this.generateCatWithColor(color, ageStage);
        this.scene.start('GameScene');
      } catch (e) {
        this.generateCatWithColor(DEFAULT_COLOR, 'kitten');
        this.scene.start('IntroScene');
      }
    } else {
      // İlk kez — IntroScene için varsayılan renkte kedi üret (önizleme)
      this.generateCatWithColor(DEFAULT_COLOR, 'kitten');
      this.scene.start('IntroScene');
    }
  }

  // create() içinde kullanım — BootScene aktifken çağrılır
  generateCatWithColor(colorKey, ageStage = 'adult') {
    generateCatSheet(this, colorKey, ageStage);
  }

  // ── ODA ARKAPLAN ─────────────────────────────────────────────────
  _generateRoomBackground() {
    const W = 480, H = 360;
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });

    gfx.fillStyle(0x6b4c2a, 1);
    gfx.fillRect(0, H * 0.65, W, H * 0.35);
    gfx.fillStyle(0x7a5a34, 1);
    for (let x = 0; x < W; x += 40) { gfx.fillRect(x, H * 0.65, 2, H * 0.35); }
    for (let y = H * 0.65; y < H; y += 20) { gfx.fillRect(0, y, W, 2); }

    gfx.fillStyle(0xd4a5c7, 1);
    gfx.fillRect(0, 0, W, H * 0.65 + 4);
    gfx.fillStyle(0xc48ab2, 1);
    for (let x = 0; x < W; x += 30) {
      for (let y = 0; y < H * 0.65; y += 30) {
        gfx.fillRect(x + 13, y + 5,  4, 4);
        gfx.fillRect(x + 5,  y + 18, 4, 4);
      }
    }
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillRect(0, H * 0.65, W, 6);

    gfx.fillStyle(0x90e0ef, 1);
    gfx.fillRect(30, 30, 90, 70);
    gfx.fillStyle(0x0096c7, 1);
    gfx.fillRect(30, 30, 90, 4); gfx.fillRect(30, 30, 4, 70);
    gfx.fillRect(116, 30, 4, 70); gfx.fillRect(30, 96, 90, 4);
    gfx.fillRect(72, 30, 4, 70); gfx.fillRect(30, 65, 90, 4);
    // Güneş (merkez x=61, y=48)
    const sx = 61, sy = 48;
    // Dış glow
    gfx.fillStyle(0xffd166, 0.15);
    gfx.fillCircle(sx, sy, 12);
    // Ana güneş dairesi
    gfx.fillStyle(0xffd166, 1);
    gfx.fillCircle(sx, sy, 6);
    // İç parlama
    gfx.fillStyle(0xfff3c4, 1);
    gfx.fillCircle(sx, sy, 3);
    // 8 ışın
    gfx.fillStyle(0xffb700, 1);
    gfx.fillRect(sx - 1, sy - 12, 2, 5);   // üst
    gfx.fillRect(sx - 1, sy + 7, 2, 5);    // alt
    gfx.fillRect(sx - 12, sy - 1, 5, 2);   // sol
    gfx.fillRect(sx + 7, sy - 1, 5, 2);    // sağ
    gfx.fillRect(sx - 9, sy - 9, 3, 2); gfx.fillRect(sx - 9, sy - 9, 2, 3);   // sol üst
    gfx.fillRect(sx + 7, sy - 9, 3, 2); gfx.fillRect(sx + 8, sy - 9, 2, 3);   // sağ üst
    gfx.fillRect(sx - 9, sy + 7, 3, 2); gfx.fillRect(sx - 9, sy + 7, 2, 3);   // sol alt
    gfx.fillRect(sx + 7, sy + 7, 3, 2); gfx.fillRect(sx + 8, sy + 7, 2, 3);   // sağ alt
    gfx.fillStyle(0xe63946, 1);
    gfx.fillRect(26, 28, 10, 80); gfx.fillRect(116, 28, 10, 80);

    // ── DUVAR SAATİ (x=190, y=38, duvarda) ──────────────────────
    // Çerçeve
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillCircle(190, 38, 12);
    // Kadran
    gfx.fillStyle(0xf0f0f0, 1);
    gfx.fillCircle(190, 38, 10);
    // Saat çizgileri (12, 3, 6, 9)
    gfx.fillStyle(0x555555, 1);
    gfx.fillRect(189, 29, 2, 3); // 12
    gfx.fillRect(189, 45, 2, 3); // 6
    gfx.fillRect(199, 37, 3, 2); // 3
    gfx.fillRect(178, 37, 3, 2); // 9
    // Akrep (kısa, yukarı-sağ)
    gfx.fillStyle(0x1a1a2e, 1);
    gfx.fillRect(190, 33, 2, 6);
    // Yelkovan (uzun, sağ)
    gfx.fillRect(190, 37, 7, 2);
    // Merkez nokta
    gfx.fillStyle(0xe63946, 1);
    gfx.fillCircle(190, 38, 2);

    // ── DUVAR RAFI + OBJELER (x=210, y=65) ────────────────────────
    // Raf tahtası
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillRect(200, 75, 90, 5);
    // Raf destekleri
    gfx.fillStyle(0x6b4c2a, 1);
    gfx.fillRect(210, 78, 4, 8);
    gfx.fillRect(276, 78, 4, 8);
    // Saksı çiçek (sol)
    gfx.fillStyle(0xc4622a, 1);
    gfx.fillRect(212, 66, 12, 10); // saksı
    gfx.fillStyle(0xa0724a, 1);
    gfx.fillRect(210, 66, 16, 3);  // saksı kenar
    gfx.fillStyle(0x2a9d8f, 1);
    gfx.fillRect(215, 56, 4, 10);  // gövde
    gfx.fillRect(211, 53, 5, 6);   // yaprak sol
    gfx.fillRect(218, 53, 5, 6);   // yaprak sağ
    gfx.fillStyle(0xe63946, 1);
    gfx.fillCircle(215, 52, 3);    // çiçek
    gfx.fillStyle(0xffd166, 1);
    gfx.fillCircle(215, 52, 1);    // çiçek merkez
    // Kitaplar (orta)
    gfx.fillStyle(0x457b9d, 1);
    gfx.fillRect(236, 60, 8, 16);  // mavi kitap
    gfx.fillStyle(0xe63946, 1);
    gfx.fillRect(245, 62, 7, 14);  // kırmızı kitap
    gfx.fillStyle(0x2a9d8f, 1);
    gfx.fillRect(253, 58, 8, 18);  // yeşil kitap (uzun)
    // Kitap sırt çizgileri
    gfx.fillStyle(0x3a6a8f, 1);
    gfx.fillRect(238, 62, 4, 1);
    gfx.fillStyle(0xc4222a, 1);
    gfx.fillRect(247, 65, 3, 1);
    // Kedi heykeli (sağ)
    gfx.fillStyle(0xf4a261, 1);
    gfx.fillRect(272, 66, 10, 10); // gövde
    gfx.fillRect(270, 68, 14, 6);  // geniş gövde
    gfx.fillRect(273, 62, 4, 5);   // baş
    gfx.fillRect(271, 60, 3, 3);   // kulak sol
    gfx.fillRect(277, 60, 3, 3);   // kulak sağ
    gfx.fillStyle(0x1a1a2e, 1);
    gfx.fillRect(274, 64, 1, 1);   // göz sol
    gfx.fillRect(276, 64, 1, 1);   // göz sağ

    // ── RESİM ÇERÇEVESİ (mevcut, sağ üst) ────────────────────────
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillRect(360, 40, 80, 60);
    gfx.fillStyle(0xffd166, 1);
    gfx.fillRect(364, 44, 72, 52);
    gfx.fillStyle(0x457b9d, 1);
    gfx.fillRect(368, 48, 64, 44);
    // Su dalgaları (üstte)
    gfx.fillStyle(0x2a6b8f, 1);
    gfx.fillRect(368, 50, 64, 2);
    gfx.fillRect(370, 54, 28, 1); gfx.fillRect(404, 53, 26, 1);
    // Büyük balık (ortada, sağa bakıyor)
    // Gövde
    gfx.fillStyle(0xf4a261, 1);
    gfx.fillEllipse(400, 72, 32, 18);
    // Karın (açık)
    gfx.fillStyle(0xffd166, 1);
    gfx.fillEllipse(400, 76, 26, 8);
    // Kuyruk
    gfx.fillStyle(0xc4622a, 1);
    gfx.fillRect(382, 64, 4, 6);
    gfx.fillRect(380, 66, 4, 8);
    gfx.fillRect(378, 68, 4, 6);
    gfx.fillRect(376, 64, 3, 16);
    // Üst yüzgeç
    gfx.fillRect(396, 60, 10, 4);
    gfx.fillRect(398, 58, 6, 3);
    // Göz
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(410, 69, 3);
    gfx.fillStyle(0x1a1a2e, 1);
    gfx.fillCircle(411, 69, 1.5);
    // Ağız
    gfx.fillStyle(0xc4622a, 1);
    gfx.fillRect(414, 73, 4, 1);
    // Küçük balık (sol alt köşede, yeşil)
    gfx.fillStyle(0x2a9d8f, 1);
    gfx.fillEllipse(380, 84, 14, 7);
    gfx.fillStyle(0x1a6b5f, 1);
    gfx.fillRect(372, 82, 3, 2);
    gfx.fillRect(371, 83, 3, 3);
    // Küçük balık göz
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(385, 83, 2, 2);
    gfx.fillStyle(0x1a1a2e, 1);
    gfx.fillRect(386, 83, 1, 1);
    // Kabarcıklar
    gfx.fillStyle(0xffffff, 0.5);
    gfx.fillCircle(416, 58, 2);
    gfx.fillCircle(420, 62, 1.5);
    gfx.fillCircle(424, 56, 1);

    // ── HALI / KİLİM (zeminde, x=170, y=252) ─────────────────────
    const carpetX = 170, carpetY = H * 0.65 + 6;
    // Halı ana gövde (bordo)
    gfx.fillStyle(0xa03030, 1);
    gfx.fillRect(carpetX, carpetY, 100, 22);
    // Halı kenar (turuncu saçak)
    gfx.fillStyle(0xf4a261, 1);
    gfx.fillRect(carpetX - 2, carpetY, 2, 22);
    gfx.fillRect(carpetX + 100, carpetY, 2, 22);
    // Üst-alt kenar süsü
    gfx.fillRect(carpetX, carpetY - 1, 100, 1);
    gfx.fillRect(carpetX, carpetY + 22, 100, 1);
    // Halı deseni — geometrik
    gfx.fillStyle(0xffd166, 1);
    for (let dx = 8; dx < 96; dx += 16) {
      gfx.fillRect(carpetX + dx, carpetY + 4, 6, 2);
      gfx.fillRect(carpetX + dx, carpetY + 14, 6, 2);
    }
    gfx.fillStyle(0xf0f0f0, 1);
    for (let dx = 14; dx < 96; dx += 16) {
      gfx.fillRect(carpetX + dx, carpetY + 9, 4, 2);
    }
    // Merkez elmas deseni
    gfx.fillStyle(0xffd166, 1);
    gfx.fillRect(carpetX + 46, carpetY + 7, 8, 8);
    gfx.fillStyle(0xa03030, 1);
    gfx.fillRect(carpetX + 48, carpetY + 9, 4, 4);

    // ── MAMA KASESİ (mevcut, sol alt) ─────────────────────────────
    gfx.fillStyle(0x457b9d, 1);
    gfx.fillEllipse(80, H * 0.65 + 14, 60, 18);
    gfx.fillStyle(0x2a9d8f, 1);
    gfx.fillEllipse(80, H * 0.65 + 12, 48, 12);
    gfx.fillStyle(0xffd166, 1);
    gfx.fillEllipse(80, H * 0.65 + 10, 38, 8);

    // ── SU KASESİ (mama kasesinin sağında, x=130) ─────────────────
    gfx.fillStyle(0x457b9d, 1);
    gfx.fillEllipse(132, H * 0.65 + 14, 42, 14);
    gfx.fillStyle(0x2a6b8f, 1);
    gfx.fillEllipse(132, H * 0.65 + 12, 34, 10);
    gfx.fillStyle(0x90e0ef, 1);
    gfx.fillEllipse(132, H * 0.65 + 10, 26, 6);
    // Su yansıma çizgisi
    gfx.fillStyle(0xffffff, 0.4);
    gfx.fillRect(125, H * 0.65 + 8, 10, 1);

    // ── OYUNCAK SEPETİ (zeminde, x=280) ───────────────────────────
    const bskX = 280, bskY = H * 0.65 + 2;
    // Sepet gövdesi
    gfx.fillStyle(0xa0724a, 1);
    gfx.fillEllipse(bskX, bskY + 10, 36, 20);
    gfx.fillStyle(0xc4622a, 1);
    gfx.fillEllipse(bskX, bskY + 8, 30, 14);
    // Hasır desen
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillRect(bskX - 12, bskY + 6, 24, 1);
    gfx.fillRect(bskX - 10, bskY + 10, 20, 1);
    gfx.fillRect(bskX - 8,  bskY + 14, 16, 1);
    // İçindeki yumak (kırmızı-sarı)
    gfx.fillStyle(0xe63946, 1);
    gfx.fillCircle(bskX - 5, bskY + 2, 6);
    gfx.fillStyle(0xffd166, 1);
    gfx.fillRect(bskX - 8, bskY + 1, 6, 1);
    gfx.fillRect(bskX - 7, bskY + 4, 5, 1);
    // İçindeki fare oyuncağı (gri)
    gfx.fillStyle(0x888888, 1);
    gfx.fillEllipse(bskX + 7, bskY + 3, 10, 6);
    gfx.fillStyle(0xccaaaa, 1);
    gfx.fillCircle(bskX + 4, bskY, 2);
    gfx.fillCircle(bskX + 10, bskY, 2);
    // Fare göz
    gfx.fillStyle(0x111111, 1);
    gfx.fillRect(bskX + 8, bskY + 2, 1, 1);

    // ── KEDİ AĞACI (sağ taraf, x=340, duvar-zemin geçişi) ────────
    const ctX = 345, groundY = H * 0.65;
    // Taban (geniş, koyu kahve)
    gfx.fillStyle(0x5a3d20, 1);
    gfx.fillRect(ctX - 18, groundY - 2, 36, 6);
    gfx.fillStyle(0x6b4c2a, 1);
    gfx.fillRect(ctX - 15, groundY - 4, 30, 4);
    // Alt gövde
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillRect(ctX - 4, groundY - 30, 8, 28);
    // Alt platform
    gfx.fillStyle(0xd4b896, 1);
    gfx.fillRect(ctX - 16, groundY - 34, 32, 6);
    gfx.fillStyle(0xb09070, 1);
    gfx.fillRect(ctX - 16, groundY - 34, 32, 2);
    // Halat sarma (alt gövde dekor)
    gfx.fillStyle(0xc4a060, 1);
    gfx.fillRect(ctX - 5, groundY - 18, 10, 2);
    gfx.fillRect(ctX - 5, groundY - 14, 10, 2);
    gfx.fillRect(ctX - 5, groundY - 10, 10, 2);
    // Orta gövde
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillRect(ctX - 3, groundY - 60, 6, 28);
    // Orta platform
    gfx.fillStyle(0xd4b896, 1);
    gfx.fillRect(ctX - 14, groundY - 64, 28, 6);
    gfx.fillStyle(0xb09070, 1);
    gfx.fillRect(ctX - 14, groundY - 64, 28, 2);
    // Halat sarma (orta gövde)
    gfx.fillStyle(0xc4a060, 1);
    gfx.fillRect(ctX - 4, groundY - 48, 8, 2);
    gfx.fillRect(ctX - 4, groundY - 44, 8, 2);
    // Üst gövde
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillRect(ctX - 3, groundY - 86, 6, 24);
    // Üst platform (en küçük)
    gfx.fillStyle(0xd4b896, 1);
    gfx.fillRect(ctX - 12, groundY - 90, 24, 6);
    gfx.fillStyle(0xb09070, 1);
    gfx.fillRect(ctX - 12, groundY - 90, 24, 2);
    // Sarkan top (kırmızı yumak, ipte)
    gfx.fillStyle(0x888888, 1);
    gfx.fillRect(ctX + 8, groundY - 80, 1, 10);  // ip
    gfx.fillStyle(0xe63946, 1);
    gfx.fillCircle(ctX + 8, groundY - 68, 4);     // top
    gfx.fillStyle(0xffd166, 1);
    gfx.fillRect(ctX + 6, groundY - 69, 3, 1);    // top desen

    // ── KEDİ YATAĞI (mevcut, sağ alt) ─────────────────────────────
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillEllipse(420, H * 0.65 + 8, 90, 26);
    gfx.fillStyle(0xc4622a, 1);
    gfx.fillEllipse(420, H * 0.65 + 5, 74, 18);
    gfx.fillStyle(0xf4a261, 1);
    gfx.fillEllipse(420, H * 0.65 + 3, 60, 12);

    gfx.generateTexture('room_bg', W, H);
    gfx.destroy();
  }

  // ── DİĞER ASSET'LER ─────────────────────────────────────────────
  _generateFoodSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x457b9d, 1); gfx.fillEllipse(12, 20, 24, 12);
    gfx.fillStyle(0xffd166, 1); gfx.fillEllipse(12, 18, 18, 8);
    gfx.fillStyle(0xe63946, 1);
    gfx.fillRect(7, 13, 10, 6); gfx.fillRect(5, 14, 4, 4); gfx.fillRect(17, 15, 2, 2);
    gfx.generateTexture('food', 24, 24);
    gfx.destroy();
  }

  _generateBallSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xe63946, 1); gfx.fillCircle(10, 10, 9);
    gfx.fillStyle(0xffd166, 1); gfx.fillCircle(10, 10, 7);
    gfx.fillStyle(0xe63946, 1);
    gfx.fillRect(6, 6, 8, 2); gfx.fillRect(5, 9, 10, 2); gfx.fillRect(6, 12, 8, 2);
    gfx.fillStyle(0xffd166, 1);
    gfx.fillRect(7, 7, 6, 1); gfx.fillRect(6, 10, 8, 1); gfx.fillRect(7, 13, 6, 1);
    gfx.generateTexture('ball', 20, 20);
    gfx.destroy();
  }

  _generateFishSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x457b9d, 1); gfx.fillEllipse(12, 10, 18, 10); gfx.fillRect(2, 7, 6, 6);
    gfx.fillStyle(0x2a9d8f, 1); gfx.fillRect(4, 8, 4, 4);
    gfx.fillStyle(0xffffff, 1); gfx.fillRect(18, 8, 2, 2);
    gfx.fillStyle(0x1a1a2e, 1); gfx.fillRect(19, 8, 1, 1);
    gfx.generateTexture('fish', 24, 20);
    gfx.destroy();
  }

  _generateHeartSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xe63946, 1);
    ['0110110','1111111','1111111','0111110','0011100','0001000'].forEach((row, y) => {
      [...row].forEach((cell, x) => { if (cell === '1') gfx.fillRect(x + 1, y + 1, 1, 1); });
    });
    gfx.generateTexture('heart', 10, 9);
    gfx.destroy();
  }

  _generateZzzSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x90e0ef, 1);
    ['111','001','010','100','111'].forEach((row, y) => {
      [...row].forEach((cell, x) => { if (cell === '1') gfx.fillRect(x * 2, y * 2, 2, 2); });
    });
    gfx.generateTexture('zzz', 8, 12);
    gfx.destroy();
  }

  _generateBubbleSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xade8f4, 0.8); gfx.fillCircle(6, 6, 5);
    gfx.fillStyle(0xffffff, 0.9); gfx.fillRect(3, 3, 2, 2);
    gfx.generateTexture('bubble', 12, 12);
    gfx.destroy();
  }

  // ── FARE (Mouse) ────────────────────────────────────────────────
  _generateMouseSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Gövde
    gfx.fillStyle(0x888888, 1);
    gfx.fillEllipse(8, 8, 14, 10);
    // Kulaklar
    gfx.fillStyle(0xccaaaa, 1);
    gfx.fillCircle(3, 3, 3);
    gfx.fillCircle(13, 3, 3);
    // Gözler
    gfx.fillStyle(0x111111, 1);
    gfx.fillRect(5, 6, 2, 2);
    gfx.fillRect(10, 6, 2, 2);
    // Burun
    gfx.fillStyle(0xff8888, 1);
    gfx.fillRect(7, 9, 2, 2);
    // Kuyruk
    gfx.fillStyle(0xcc9999, 1);
    gfx.fillRect(14, 10, 4, 1);
    gfx.fillRect(17, 9, 2, 1);
    gfx.generateTexture('mouse_sprite', 20, 14);
    gfx.destroy();
  }

  // ── LAZER NOKTASI ───────────────────────────────────────────────
  _generateLaserDotSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xff0000, 0.3); gfx.fillCircle(6, 6, 6);
    gfx.fillStyle(0xff0000, 0.6); gfx.fillCircle(6, 6, 4);
    gfx.fillStyle(0xff4444, 1);   gfx.fillCircle(6, 6, 2);
    gfx.fillStyle(0xffffff, 1);   gfx.fillRect(5, 5, 2, 2);
    gfx.generateTexture('laser_dot', 12, 12);
    gfx.destroy();
  }

  // ── KART SPRITE'LARI (arka + 6 ikon) ────────────────────────────
  _generateCardSprites() {
    // Kart arkası — soru işareti
    const gBack = this.make.graphics({ x: 0, y: 0, add: false });
    gBack.fillStyle(0x2a2a5a, 1); gBack.fillRect(0, 0, 24, 32);
    gBack.fillStyle(0x3a3a7a, 1); gBack.fillRect(2, 2, 20, 28);
    gBack.fillStyle(0xf4a261, 1);
    // "?" piksel
    gBack.fillRect(9, 8, 6, 2);
    gBack.fillRect(13, 10, 2, 4);
    gBack.fillRect(9, 14, 6, 2);
    gBack.fillRect(9, 16, 2, 4);
    gBack.fillRect(9, 22, 2, 2);
    gBack.generateTexture('card_back', 24, 32);
    gBack.destroy();

    // 6 ikon — her biri 24x32, spritesheet olarak
    const ICONS = 6;
    const gIcons = this.make.graphics({ x: 0, y: 0, add: false });
    const colors = [0xe63946, 0x457b9d, 0xf4a261, 0x2a9d8f, 0x888888, 0xffd166];
    const names  = ['balik','kalp','yumak','mama','fare','pati'];

    for (let i = 0; i < ICONS; i++) {
      const ox = i * 24;
      // Kart arka planı
      gIcons.fillStyle(0xf0f0f0, 1); gIcons.fillRect(ox, 0, 24, 32);
      gIcons.fillStyle(0xe0e0e0, 1); gIcons.fillRect(ox + 1, 1, 22, 30);
      // İkon (basit şekiller)
      gIcons.fillStyle(colors[i], 1);
      switch (i) {
        case 0: // balık
          gIcons.fillEllipse(ox + 12, 14, 14, 8);
          gIcons.fillRect(ox + 3, 12, 4, 5);
          break;
        case 1: // kalp
          gIcons.fillCircle(ox + 9, 12, 4);
          gIcons.fillCircle(ox + 15, 12, 4);
          gIcons.fillRect(ox + 6, 14, 12, 8);
          break;
        case 2: // yumak
          gIcons.fillCircle(ox + 12, 16, 7);
          gIcons.fillStyle(0xffd166, 1);
          gIcons.fillRect(ox + 8, 14, 8, 2);
          gIcons.fillRect(ox + 8, 18, 8, 2);
          break;
        case 3: // mama
          gIcons.fillEllipse(ox + 12, 20, 16, 8);
          gIcons.fillStyle(0xffd166, 1);
          gIcons.fillEllipse(ox + 12, 18, 12, 5);
          break;
        case 4: // fare
          gIcons.fillEllipse(ox + 12, 16, 12, 8);
          gIcons.fillStyle(0xccaaaa, 1);
          gIcons.fillCircle(ox + 7, 11, 3);
          gIcons.fillCircle(ox + 17, 11, 3);
          break;
        case 5: // pati
          gIcons.fillCircle(ox + 12, 18, 5);
          gIcons.fillCircle(ox + 7, 12, 3);
          gIcons.fillCircle(ox + 17, 12, 3);
          gIcons.fillCircle(ox + 10, 10, 3);
          gIcons.fillCircle(ox + 14, 10, 3);
          break;
      }
    }
    gIcons.generateTexture('card_icons', 24 * ICONS, 32);
    gIcons.destroy();
    // Frame tanımla
    const tex = this.textures.get('card_icons');
    for (let i = 0; i < ICONS; i++) {
      tex.add(i, 0, i * 24, 0, 24, 32);
    }
  }

  // ── PENÇE ───────────────────────────────────────────────────────
  _generatePawSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xf4a261, 1);
    gfx.fillCircle(8, 10, 5);
    gfx.fillCircle(4, 5, 3);
    gfx.fillCircle(12, 5, 3);
    gfx.fillCircle(3, 9, 2);
    gfx.fillCircle(13, 9, 2);
    gfx.generateTexture('paw', 16, 16);
    gfx.destroy();
  }

  // ── PLATFORM BLOK ───────────────────────────────────────────────
  _generatePlatformBlockSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x6b4c2a, 1); gfx.fillRect(0, 0, 32, 32);
    gfx.fillStyle(0x7a5a34, 1);
    gfx.fillRect(1, 1, 14, 14); gfx.fillRect(17, 1, 14, 14);
    gfx.fillRect(1, 17, 14, 14); gfx.fillRect(17, 17, 14, 14);
    gfx.fillStyle(0x5a3d20, 1);
    gfx.fillRect(0, 0, 32, 2); gfx.fillRect(0, 15, 32, 2);
    gfx.fillRect(15, 0, 2, 32);
    gfx.generateTexture('platform_block', 32, 32);
    gfx.destroy();
  }

  // ── BULUT ───────────────────────────────────────────────────────
  _generateCloudSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff, 0.7);
    gfx.fillEllipse(16, 10, 24, 12);
    gfx.fillEllipse(8, 12, 16, 10);
    gfx.fillEllipse(24, 12, 16, 10);
    gfx.generateTexture('cloud', 32, 18);
    gfx.destroy();
  }

  // ── AY ──────────────────────────────────────────────────────────
  _generateMoonSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Sarı daire (dolunay)
    gfx.fillStyle(0xffd166, 1);
    gfx.fillCircle(8, 8, 7);
    // Hilal efekti — koyu daire ile kırpma
    gfx.fillStyle(0x0a1628, 1);
    gfx.fillCircle(11, 6, 6);
    // Parlaklık noktası
    gfx.fillStyle(0xfff3c4, 1);
    gfx.fillRect(4, 5, 2, 2);
    gfx.generateTexture('moon', 16, 16);
    gfx.destroy();
  }

  // ── YILDIZ ──────────────────────────────────────────────────────
  _generateStarSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff, 1);
    // Artı şeklinde yıldız
    gfx.fillRect(2, 0, 2, 6);
    gfx.fillRect(0, 2, 6, 2);
    // Köşe parlaklık
    gfx.fillStyle(0xfff3c4, 0.6);
    gfx.fillRect(1, 1, 1, 1);
    gfx.fillRect(4, 1, 1, 1);
    gfx.fillRect(1, 4, 1, 1);
    gfx.fillRect(4, 4, 1, 1);
    gfx.generateTexture('star', 6, 6);
    gfx.destroy();
  }

  // ── RÜYA BALIĞI (altın sarısı, parlamalı) ──────────────────────
  _generateDreamFishSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Dış parlama
    gfx.fillStyle(0xffd166, 0.2);
    gfx.fillEllipse(14, 10, 26, 16);
    // Gövde
    gfx.fillStyle(0xffd166, 1);
    gfx.fillEllipse(14, 10, 20, 12);
    // Karın
    gfx.fillStyle(0xfff3c4, 1);
    gfx.fillEllipse(14, 12, 14, 6);
    // Kuyruk
    gfx.fillStyle(0xf4a261, 1);
    gfx.fillRect(2, 6, 6, 8);
    gfx.fillRect(0, 7, 4, 6);
    // Üst yüzgeç
    gfx.fillRect(12, 2, 6, 3);
    // Göz
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(20, 8, 2);
    gfx.fillStyle(0x1a1a2e, 1);
    gfx.fillCircle(21, 8, 1);
    // Parıltı yıldız
    gfx.fillStyle(0xffffff, 0.8);
    gfx.fillRect(8, 4, 2, 2);
    gfx.generateTexture('dream_fish', 28, 22);
    gfx.destroy();
  }

  // ── KABUS BULUTU (koyu mor, kızıl gözlü) ──────────────────────
  _generateNightmareCloudSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Dış kızıl aura
    gfx.fillStyle(0x8b0000, 0.2);
    gfx.fillEllipse(20, 14, 44, 28);
    // Bulut gövde
    gfx.fillStyle(0x2d1050, 1);
    gfx.fillEllipse(20, 14, 36, 22);
    gfx.fillEllipse(12, 16, 24, 18);
    gfx.fillEllipse(28, 16, 24, 18);
    // Daha koyu çekirdek
    gfx.fillStyle(0x1a0830, 1);
    gfx.fillEllipse(20, 16, 24, 14);
    // Kızıl gözler
    gfx.fillStyle(0xff2222, 1);
    gfx.fillCircle(15, 14, 2);
    gfx.fillCircle(25, 14, 2);
    // Göz parlaması
    gfx.fillStyle(0xffffff, 0.6);
    gfx.fillRect(14, 13, 1, 1);
    gfx.fillRect(24, 13, 1, 1);
    gfx.generateTexture('nightmare_cloud', 40, 28);
    gfx.destroy();
  }

  // ── KEDI TUVALETI (3 kirllik seviyesi) ─────────────────────────
  _generateLitterBoxSprites() {
    // TEMIZ
    const g1 = this.make.graphics({ x: 0, y: 0, add: false });
    // Kasa (gri)
    g1.fillStyle(0x888888, 1);
    g1.fillRect(0, 6, 28, 14);
    g1.fillStyle(0x999999, 1);
    g1.fillRect(1, 4, 26, 4);
    // Kum (açık bej)
    g1.fillStyle(0xd4c4a0, 1);
    g1.fillRect(2, 8, 24, 10);
    // Kum desen
    g1.fillStyle(0xc4b490, 1);
    g1.fillRect(5, 10, 3, 1); g1.fillRect(12, 12, 4, 1); g1.fillRect(20, 11, 3, 1);
    // Kürek (sağ tarafta)
    g1.fillStyle(0x8b6914, 1);
    g1.fillRect(24, 2, 2, 8);
    g1.fillStyle(0xaaaaaa, 1);
    g1.fillRect(23, 0, 4, 3);
    g1.generateTexture('litter_clean', 28, 20);
    g1.destroy();

    // ORTA KİRLİ
    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0x888888, 1);
    g2.fillRect(0, 6, 28, 14);
    g2.fillStyle(0x999999, 1);
    g2.fillRect(1, 4, 26, 4);
    // Koyu kum
    g2.fillStyle(0xb0a080, 1);
    g2.fillRect(2, 8, 24, 10);
    // Kirli noktalar
    g2.fillStyle(0x8b6914, 1);
    g2.fillRect(6, 10, 3, 2); g2.fillRect(15, 12, 3, 2); g2.fillRect(21, 9, 2, 2);
    // Kürek
    g2.fillStyle(0x8b6914, 1);
    g2.fillRect(24, 2, 2, 8);
    g2.fillStyle(0xaaaaaa, 1);
    g2.fillRect(23, 0, 4, 3);
    g2.generateTexture('litter_dirty', 28, 20);
    g2.destroy();

    // COK KİRLİ
    const g3 = this.make.graphics({ x: 0, y: 0, add: false });
    g3.fillStyle(0x777777, 1);
    g3.fillRect(0, 6, 28, 14);
    g3.fillStyle(0x888888, 1);
    g3.fillRect(1, 4, 26, 4);
    // Çok kirli kum (koyu kahve-yeşil)
    g3.fillStyle(0x8a7a50, 1);
    g3.fillRect(2, 8, 24, 10);
    // Çok kirli noktalar
    g3.fillStyle(0x5c3010, 1);
    g3.fillRect(4, 9, 4, 3); g3.fillRect(10, 11, 4, 3); g3.fillRect(17, 9, 4, 3);
    g3.fillRect(6, 13, 3, 2); g3.fillRect(14, 10, 3, 2); g3.fillRect(21, 12, 3, 2);
    // Duman efekti (yeşilimsi)
    g3.fillStyle(0x6a8a30, 0.4);
    g3.fillCircle(8, 4, 4); g3.fillCircle(18, 3, 3);
    // Kürek
    g3.fillStyle(0x8b6914, 1);
    g3.fillRect(24, 2, 2, 8);
    g3.fillStyle(0xaaaaaa, 1);
    g3.fillRect(23, 0, 4, 3);
    g3.generateTexture('litter_filthy', 28, 20);
    g3.destroy();
  }

  // ── KAKA SPRİTE ────────────────────────────────────────────────
  _generatePoopSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Kaka yığını (spiral şekil)
    gfx.fillStyle(0x8B4513, 1);
    gfx.fillCircle(5, 7, 4);       // alt büyük
    gfx.fillCircle(5, 4, 3);       // orta
    gfx.fillCircle(5, 2, 2);       // üst küçük
    // Gölge
    gfx.fillStyle(0x5C3010, 1);
    gfx.fillRect(2, 8, 6, 2);
    // Parlaklık (ıslak efekt)
    gfx.fillStyle(0xA0684A, 1);
    gfx.fillRect(4, 3, 1, 1);
    gfx.fillRect(6, 6, 1, 1);
    gfx.generateTexture('poop', 10, 10);
    gfx.destroy();
  }

  // ── İLAÇ ────────────────────────────────────────────────────────
  _generateMedicineSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Hap şişesi
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(4, 4, 8, 10);
    gfx.fillStyle(0xdddddd, 1);
    gfx.fillRect(4, 4, 8, 1); gfx.fillRect(4, 13, 8, 1);
    gfx.fillRect(4, 4, 1, 10); gfx.fillRect(11, 4, 1, 10);
    // Kapak
    gfx.fillStyle(0xe63946, 1);
    gfx.fillRect(3, 1, 10, 4);
    gfx.fillStyle(0xc4222a, 1);
    gfx.fillRect(3, 1, 10, 1);
    // Hap içi
    gfx.fillStyle(0xff6b6b, 1);
    gfx.fillCircle(8, 8, 2);
    gfx.fillCircle(8, 12, 1);
    // Artı işareti
    gfx.fillStyle(0xe63946, 1);
    gfx.fillRect(7, 6, 2, 5);
    gfx.fillRect(5, 8, 6, 1);
    gfx.generateTexture('medicine', 16, 16);
    gfx.destroy();
  }

  // ── HAPŞIRMA BALONU ─────────────────────────────────────────────
  _generateSneezeBubbleSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Balonun gövdesi
    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillEllipse(14, 10, 26, 18);
    // Baloncuk kuyruğu
    gfx.fillStyle(0xffffff, 0.9);
    gfx.fillTriangle(6, 16, 2, 22, 10, 18);
    // Kenarlık
    gfx.lineStyle(2, 0xdddddd, 0.8);
    gfx.strokeEllipse(14, 10, 26, 18);
    // "AH" yazısı yerine 🤧 — metin olarak çizeceğiz, sprite sadece baloncuk
    gfx.fillStyle(0x888888, 1);
    gfx.fillRect(8, 7, 2, 6);   // ünlem
    gfx.fillRect(12, 7, 4, 2);  // A
    gfx.fillRect(12, 9, 4, 1);
    gfx.fillRect(12, 10, 4, 2);
    gfx.fillRect(17, 7, 2, 6);  // H
    gfx.fillRect(18, 9, 3, 1);
    gfx.generateTexture('sneeze_bubble', 28, 24);
    gfx.destroy();
  }

  // ── SİNEK ──────────────────────────────────────────────────────
  _generateFlySprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x222222, 1);
    gfx.fillEllipse(5, 5, 6, 4);       // gövde
    gfx.fillStyle(0xcccccc, 0.6);
    gfx.fillEllipse(2, 2, 5, 3);       // sol kanat
    gfx.fillEllipse(8, 2, 5, 3);       // sağ kanat
    gfx.fillStyle(0xff0000, 1);
    gfx.fillRect(4, 3, 1, 1);          // göz
    gfx.fillRect(6, 3, 1, 1);          // göz
    gfx.generateTexture('fly_sprite', 10, 8);
    gfx.destroy();
  }

  // ── ARI ─────────────────────────────────────────────────────────
  _generateBeeSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffd700, 1);
    gfx.fillEllipse(5, 5, 8, 6);       // gövde
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(2, 4, 6, 1);          // çizgi 1
    gfx.fillRect(2, 6, 6, 1);          // çizgi 2
    gfx.fillStyle(0xcccccc, 0.6);
    gfx.fillEllipse(2, 2, 4, 3);       // sol kanat
    gfx.fillEllipse(8, 2, 4, 3);       // sağ kanat
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(3, 3, 1, 1);          // göz
    gfx.fillRect(6, 3, 1, 1);          // göz
    // İğne
    gfx.fillStyle(0x222222, 1);
    gfx.fillRect(8, 5, 2, 1);
    gfx.generateTexture('bee_sprite', 12, 10);
    gfx.destroy();
  }

  // ── SÜT BARDAĞI ────────────────────────────────────────────────
  _generateMilkGlassSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Bardak
    gfx.fillStyle(0x90c8e8, 0.4);
    gfx.fillRect(2, 2, 16, 28);
    gfx.fillStyle(0x70a8d0, 0.5);
    gfx.fillRect(2, 2, 16, 2);         // üst kenar
    gfx.fillRect(2, 2, 2, 28);         // sol kenar
    gfx.fillRect(16, 2, 2, 28);        // sağ kenar
    gfx.fillRect(2, 28, 16, 2);        // alt kenar
    // Yansıma
    gfx.fillStyle(0xffffff, 0.3);
    gfx.fillRect(4, 4, 2, 20);
    gfx.generateTexture('milk_glass', 20, 32);
    gfx.destroy();
  }

  // ── KUTU (LOOT BOX) ────────────────────────────────────────────
  _generateLootBoxSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    // Kutu gövde
    gfx.fillStyle(0xc0c0c0, 1);
    gfx.fillRect(0, 8, 24, 16);
    // Kapak
    gfx.fillStyle(0xd0d0d0, 1);
    gfx.fillRect(0, 4, 24, 6);
    // Kapak kenar
    gfx.fillStyle(0xa0a0a0, 1);
    gfx.fillRect(0, 4, 24, 2);
    // Kilit/kurdele
    gfx.fillStyle(0xffd166, 1);
    gfx.fillRect(10, 2, 4, 8);
    gfx.fillRect(8, 6, 8, 3);
    // Soru işareti
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(10, 14, 4, 2);
    gfx.fillRect(12, 12, 2, 4);
    gfx.fillRect(10, 19, 4, 2);
    gfx.generateTexture('loot_box', 24, 24);
    gfx.destroy();
  }

  // ── BOMBA ───────────────────────────────────────────────────────
  _generateBombSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0x222222, 1);
    gfx.fillCircle(6, 8, 6);           // gövde
    gfx.fillStyle(0x333333, 1);
    gfx.fillCircle(6, 8, 4);
    // Fitil
    gfx.fillStyle(0x8b6914, 1);
    gfx.fillRect(5, 0, 2, 4);
    // Kıvılcım
    gfx.fillStyle(0xff4400, 1);
    gfx.fillCircle(6, 0, 2);
    gfx.fillStyle(0xffd166, 1);
    gfx.fillCircle(6, 0, 1);
    // Parlaklık
    gfx.fillStyle(0x555555, 1);
    gfx.fillRect(4, 6, 2, 2);
    gfx.generateTexture('bomb', 12, 14);
    gfx.destroy();
  }

  // ── KUŞLAR (3 tür) ─────────────────────────────────────────────
  _generateBirdSprites() {
    // Serçe (kahverengi)
    const g1 = this.make.graphics({ x: 0, y: 0, add: false });
    g1.fillStyle(0x8b6914, 1);
    g1.fillEllipse(6, 4, 10, 6);       // gövde
    g1.fillStyle(0xa07830, 1);
    g1.fillCircle(10, 3, 3);           // baş
    g1.fillStyle(0xffd166, 1);
    g1.fillRect(12, 3, 3, 1);          // gaga
    g1.fillStyle(0x111111, 1);
    g1.fillRect(11, 2, 1, 1);          // göz
    // Kanat
    g1.fillStyle(0x6b4c2a, 1);
    g1.fillEllipse(5, 3, 6, 3);
    g1.generateTexture('bird_brown', 14, 8);
    g1.destroy();

    // Mavi kuş
    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    g2.fillStyle(0x457b9d, 1);
    g2.fillEllipse(6, 4, 10, 6);
    g2.fillStyle(0x5a9abf, 1);
    g2.fillCircle(10, 3, 3);
    g2.fillStyle(0xffd166, 1);
    g2.fillRect(12, 3, 3, 1);
    g2.fillStyle(0x111111, 1);
    g2.fillRect(11, 2, 1, 1);
    g2.fillStyle(0x2a6b8f, 1);
    g2.fillEllipse(5, 3, 6, 3);
    g2.generateTexture('bird_blue', 14, 8);
    g2.destroy();

    // Altın kuş
    const g3 = this.make.graphics({ x: 0, y: 0, add: false });
    g3.fillStyle(0xffd166, 1);
    g3.fillEllipse(6, 4, 10, 6);
    g3.fillStyle(0xffea80, 1);
    g3.fillCircle(10, 3, 3);
    g3.fillStyle(0xe63946, 1);
    g3.fillRect(12, 3, 3, 1);
    g3.fillStyle(0x111111, 1);
    g3.fillRect(11, 2, 1, 1);
    g3.fillStyle(0xc4a030, 1);
    g3.fillEllipse(5, 3, 6, 3);
    // Parlama
    g3.fillStyle(0xffffff, 0.5);
    g3.fillRect(8, 1, 2, 2);
    g3.generateTexture('bird_gold', 14, 8);
    g3.destroy();
  }

  // ── TÜY EFEKTİ ─────────────────────────────────────────────────
  _generateFeatherSprite() {
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff, 0.8);
    gfx.fillEllipse(4, 3, 4, 6);
    gfx.fillStyle(0xdddddd, 1);
    gfx.fillRect(3, 0, 1, 6);          // orta çizgi
    gfx.generateTexture('feather', 8, 6);
    gfx.destroy();
  }

  // ── TETRIS BLOK ─────────────────────────────────────────────────
  _generateTetrisBlockSprite() {
    // Eski düz blok (geriye dönük uyumluluk için)
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff, 1);
    gfx.fillRect(0, 0, 8, 8);
    gfx.generateTexture('tetris_block', 8, 8);
    gfx.destroy();

    // 7 renkli kedi yüzlü tetris blokları
    const blockColors = [
      { key: 'tb_red',     base: 0xe63946, light: 0xf47b82, dark: 0xa02030 },
      { key: 'tb_blue',    base: 0x457b9d, light: 0x6fa8c8, dark: 0x2a5070 },
      { key: 'tb_purple',  base: 0x9b59b6, light: 0xc07fd4, dark: 0x6a3a80 },
      { key: 'tb_teal',    base: 0x2a9d8f, light: 0x50c8b8, dark: 0x1a6a60 },
      { key: 'tb_orange',  base: 0xf4a261, light: 0xffc48a, dark: 0xb87040 },
      { key: 'tb_yellow',  base: 0xffd166, light: 0xffe899, dark: 0xc09030 },
      { key: 'tb_darkred', base: 0xc0392b, light: 0xe06050, dark: 0x801820 },
    ];

    blockColors.forEach(({ key, base, light, dark }) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });

      // Ana blok rengi
      g.fillStyle(base, 1);
      g.fillRect(0, 0, 8, 8);

      // Üst-sol parlaklık (3D his)
      g.fillStyle(light, 1);
      g.fillRect(0, 0, 8, 1);
      g.fillRect(0, 0, 1, 8);

      // Alt-sağ gölge
      g.fillStyle(dark, 1);
      g.fillRect(0, 7, 8, 1);
      g.fillRect(7, 0, 1, 8);

      // Kedi yüzü (koyu pikseller — her renkte görünür)
      const eyeColor = 0x1a1a2e;
      const noseColor = 0xff9999;

      // Gözler (2x2 hücrede 1px)
      g.fillStyle(eyeColor, 1);
      g.fillRect(2, 2, 1, 1); // sol göz
      g.fillRect(5, 2, 1, 1); // sağ göz

      // Burun
      g.fillStyle(noseColor, 1);
      g.fillRect(3, 4, 2, 1);

      // Gülümseme
      g.fillStyle(eyeColor, 1);
      g.fillRect(2, 5, 1, 1); // sol köşe
      g.fillRect(5, 5, 1, 1); // sağ köşe
      g.fillRect(3, 6, 2, 1); // orta alt

      g.generateTexture(key, 8, 8);
      g.destroy();
    });
  }

  // ── AKSESUARLAR (9 adet) ───────────────────────────────────────
  _generateAccessorySprites() {
    // 1. Siyah Şapka
    let g = this.make.graphics({ x:0,y:0,add:false });
    g.fillStyle(0x222222,1); g.fillRect(2,4,12,6);
    g.fillStyle(0x333333,1); g.fillRect(0,8,16,3);
    g.fillStyle(0x444444,1); g.fillRect(2,4,12,1);
    g.fillRect(0,8,16,1);
    g.generateTexture('acc_hat',16,12); g.destroy();

    // 2. Pembe Fiyonk
    g = this.make.graphics({ x:0,y:0,add:false });
    g.fillStyle(0xff69b4,1);
    g.fillRect(0,1,4,3); g.fillRect(8,1,4,3);
    g.fillStyle(0xff1493,1);
    g.fillRect(4,0,4,5);
    g.fillStyle(0xff69b4,1);
    g.fillRect(5,1,2,3);
    g.generateTexture('acc_ribbon',12,5); g.destroy();

    // 3. Altın Taç
    g = this.make.graphics({ x:0,y:0,add:false });
    g.fillStyle(0xffd166,1);
    g.fillRect(0,4,14,4);
    g.fillRect(1,2,2,3); g.fillRect(6,0,2,5); g.fillRect(11,2,2,3);
    g.fillStyle(0xe63946,1);
    g.fillRect(2,5,2,2); g.fillRect(6,5,2,2); g.fillRect(10,5,2,2);
    g.generateTexture('acc_crown',14,8); g.destroy();

    // 4. Çiçek Taç
    g = this.make.graphics({ x:0,y:0,add:false });
    g.fillStyle(0x2a9d8f,1);
    g.fillRect(0,5,16,2); // dal
    g.fillStyle(0xe63946,1); g.fillCircle(2,3,2); // çiçek 1
    g.fillStyle(0xffd166,1); g.fillCircle(7,2,2); // çiçek 2
    g.fillStyle(0xff69b4,1); g.fillCircle(12,3,2); // çiçek 3
    g.fillStyle(0xffffff,1);
    g.fillRect(2,3,1,1); g.fillRect(7,2,1,1); g.fillRect(12,3,1,1);
    g.generateTexture('acc_flower',16,8); g.destroy();

    // 5. Papyon
    g = this.make.graphics({ x:0,y:0,add:false });
    g.fillStyle(0xe63946,1);
    g.fillRect(0,1,5,4); g.fillRect(9,1,5,4);
    g.fillStyle(0xc4222a,1);
    g.fillRect(5,0,4,6);
    g.fillStyle(0xe63946,1);
    g.fillRect(6,1,2,4);
    g.generateTexture('acc_bowtie',14,6); g.destroy();

    // 6. Tasma
    g = this.make.graphics({ x:0,y:0,add:false });
    g.fillStyle(0x457b9d,1);
    g.fillRect(0,0,16,3);
    g.fillStyle(0x2a6b8f,1);
    g.fillRect(0,0,16,1);
    // Çan
    g.fillStyle(0xffd166,1);
    g.fillCircle(8,5,2);
    g.fillStyle(0xffb700,1);
    g.fillRect(7,3,2,2);
    g.generateTexture('acc_collar',16,8); g.destroy();

    // 7. Atkı
    g = this.make.graphics({ x:0,y:0,add:false });
    g.fillStyle(0x457b9d,1);
    g.fillRect(0,0,18,4);
    g.fillStyle(0xffffff,1);
    g.fillRect(0,1,18,1); g.fillRect(0,3,18,1);
    // Sarkan uç
    g.fillStyle(0x457b9d,1);
    g.fillRect(12,4,4,5);
    g.fillStyle(0xffffff,1);
    g.fillRect(12,5,4,1); g.fillRect(12,7,4,1);
    g.generateTexture('acc_scarf',18,9); g.destroy();

    // 8. Güneş Gözlüğü
    g = this.make.graphics({ x:0,y:0,add:false });
    g.fillStyle(0x222222,1);
    g.fillRect(0,0,6,5); g.fillRect(8,0,6,5);
    g.fillRect(6,1,2,1); // köprü
    g.fillStyle(0x333355,1);
    g.fillRect(1,1,4,3); g.fillRect(9,1,4,3);
    g.generateTexture('acc_sunglasses',14,5); g.destroy();

    // 9. Gözlük
    g = this.make.graphics({ x:0,y:0,add:false });
    g.fillStyle(0x8b6914,1);
    g.fillRect(0,0,6,5); g.fillRect(8,0,6,5);
    g.fillRect(6,1,2,1);
    g.fillStyle(0x90c8e8,0.5);
    g.fillRect(1,1,4,3); g.fillRect(9,1,4,3);
    g.fillStyle(0x8b6914,1);
    g.fillRect(0,0,6,1); g.fillRect(0,4,6,1); g.fillRect(0,0,1,5); g.fillRect(5,0,1,5);
    g.fillRect(8,0,6,1); g.fillRect(8,4,6,1); g.fillRect(8,0,1,5); g.fillRect(13,0,1,5);
    g.generateTexture('acc_glasses',14,5); g.destroy();
  }
}

// ══════════════════════════════════════════════════════════════════
// STANDALONE: Herhangi bir aktif scene context'iyle kedi sprite üret
// ══════════════════════════════════════════════════════════════════

/**
 * Seçilen renkle kedi sprite sheet üretir.
 * @param {Phaser.Scene} scene — aktif olan herhangi bir scene
 * @param {string} colorKey — renk anahtarı (orange, gray, black, vb.)
 */
export function generateCatSheet(scene, colorKey, ageStage = 'adult') {
  const palette = COLOR_PALETTES[colorKey] || COLOR_PALETTES[DEFAULT_COLOR];

  if (scene.textures.exists('cat_sheet')) {
    scene.textures.remove('cat_sheet');
  }

  const FRAME_W = 32;
  const FRAME_H = 32;
  const FRAMES  = 16;
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false });

  const drawFn = ageStage === 'kitten' ? drawCatFrameKitten :
                 ageStage === 'young'  ? drawCatFrameYoung :
                 drawCatFrame;

  for (let f = 0; f < FRAMES; f++) {
    drawFn(gfx, f * FRAME_W, 0, f, palette);
  }

  gfx.generateTexture('cat_sheet', FRAME_W * FRAMES, FRAME_H);
  gfx.destroy();

  const tex = scene.textures.get('cat_sheet');
  for (let f = 0; f < FRAMES; f++) {
    tex.add(f, 0, f * FRAME_W, 0, FRAME_W, FRAME_H);
  }
}

function drawCatFrame(gfx, ox, oy, frame, palette) {
  const BODY   = palette.body;
  const DARK   = palette.dark;
  const STRIPE = palette.stripe;
  const NOSE   = palette.nose;
  const EYE    = 0x1a1a2e;
  const SHINE  = 0xffffff;
  const MOUTH  = 0x1a1a2e;

  const px = (x, y, c) => {
    gfx.fillStyle(c, 1);
    gfx.fillRect(ox + x, oy + y, 1, 1);
  };
  const rect = (x, y, w, h, c) => {
    gfx.fillStyle(c, 1);
    gfx.fillRect(ox + x, oy + y, w, h);
  };

  // ── YATAN KEDİ (uyku frame 6-7) ──────────────────────────────
  if (frame === 6 || frame === 7) {
    const breathOff = (frame === 7) ? 1 : 0; // nefes efekti

    // Kuyruk (sol taraf, yukarı kıvrık)
    rect(1, 18, 2, 3, BODY);
    rect(2, 16, 2, 3, BODY);
    rect(3, 15, 2, 2, DARK);

    // Gövde (yatay, altta — ana kütle)
    rect(5,  20, 22, 6 + breathOff, BODY);
    rect(4,  21, 24, 4 + breathOff, BODY);
    rect(6,  19, 18, 2, BODY);

    // Sırt çizgileri
    px(10, 19, STRIPE); px(14, 19, STRIPE); px(18, 19, STRIPE);
    px(12, 20, STRIPE); px(16, 20, STRIPE);

    // Karın alt gölge
    rect(5, 26 + breathOff, 22, 1, DARK);

    // Arka bacaklar (sağ taraf, hafif kıvrık)
    rect(24, 23, 4, 3 + breathOff, BODY);
    rect(25, 26 + breathOff, 4, 2, BODY);
    rect(25, 27 + breathOff, 4, 1, DARK);

    // Ön bacaklar (öne uzanmış, sol-orta)
    rect(5, 25 + breathOff, 5, 2, BODY);
    rect(4, 26 + breathOff, 3, 2, BODY);
    rect(4, 27 + breathOff, 3, 1, DARK);

    // Baş (sol tarafta, yere yakın, biraz yukarıda)
    rect(2, 20, 8, 7, BODY);
    rect(1, 21, 10, 5, BODY);
    rect(3, 19, 6, 2, BODY);

    // Kulaklar (yukarı bakıyor)
    rect(2, 17, 3, 3, BODY);
    rect(8, 17, 3, 3, BODY);
    px(3, 17, DARK);
    px(9, 17, DARK);

    // Baş çizgileri
    px(4, 19, STRIPE); px(5, 19, STRIPE); px(6, 19, STRIPE);

    // Kapalı gözler (çizgi)
    rect(3, 22, 3, 1, EYE);
    rect(7, 22, 3, 1, EYE);

    // Burun
    rect(5, 24, 2, 1, NOSE);

    // Ağız (uyuyan gülümseme)
    px(4, 25, MOUTH); px(5, 25, MOUTH); px(6, 25, MOUTH);

    // Bıyıklar
    px(0, 23, DARK); px(1, 23, DARK);
    px(10, 23, DARK); px(11, 23, DARK);
    px(0, 25, DARK); px(1, 25, DARK);
    px(10, 25, DARK); px(11, 25, DARK);

    return;
  }

  // ── DİK KEDİ (diğer tüm frame'ler) ──────────────────────────
  rect(2, 20, 3, 2, BODY);
  rect(1, 22, 2, 2, BODY);
  rect(2, 24, 2, 2, DARK);

  rect(8, 16, 16, 12, BODY);
  rect(7, 17, 18, 10, BODY);
  rect(6, 18, 20, 8, BODY);

  rect(8,  27, 5, 4, BODY);
  rect(19, 27, 5, 4, BODY);
  rect(8,  30, 5, 2, DARK);
  rect(19, 30, 5, 2, DARK);

  rect(10, 28, 4, 3, BODY);
  rect(18, 28, 4, 3, BODY);
  rect(10, 30, 4, 2, DARK);
  rect(18, 30, 4, 2, DARK);

  px(12, 17, STRIPE); px(14, 17, STRIPE); px(16, 17, STRIPE);
  px(12, 19, STRIPE); px(16, 19, STRIPE);

  const headY = (frame === 2 || frame === 3) ? oy + 2 :   // happy — yukarı
                (frame === 4 || frame === 5) ? oy + 4 :   // hungry — aşağı
                (frame === 10 || frame === 11) ? oy + 4 :  // tired — aşağı (yorgun)
                oy + 3;

  rect(10, headY - oy,     12, 12, BODY);
  rect(9,  headY - oy + 1, 14, 10, BODY);
  rect(8,  headY - oy + 2, 16,  8, BODY);

  rect(9,  headY - oy - 2, 3, 3, BODY);
  rect(20, headY - oy - 2, 3, 3, BODY);
  px(10, headY - oy - 2, DARK);
  px(21, headY - oy - 2, DARK);

  px(12, headY - oy, STRIPE);
  px(13, headY - oy, STRIPE);
  px(14, headY - oy, STRIPE);
  px(18, headY - oy, STRIPE);
  px(19, headY - oy, STRIPE);

  if (frame === 9) {
    // Ölü — X gözler
    px(11, headY - oy + 3, DARK); px(14, headY - oy + 3, DARK);
    px(12, headY - oy + 4, DARK); px(13, headY - oy + 4, DARK);
    px(17, headY - oy + 3, DARK); px(20, headY - oy + 3, DARK);
    px(18, headY - oy + 4, DARK); px(19, headY - oy + 4, DARK);
  } else if (frame === 10 || frame === 11) {
    // Yorgun — yarı kapalı gözler (üst yarı kapak, alt yarı göz)
    rect(11, headY - oy + 3, 4, 2, EYE);  // sol göz üst kapak
    rect(17, headY - oy + 3, 4, 2, EYE);  // sağ göz üst kapak
    rect(11, headY - oy + 5, 4, 2, EYE);  // sol göz alt
    rect(17, headY - oy + 5, 4, 2, EYE);  // sağ göz alt
    // Kapak (göz üstü — beden rengiyle kapat)
    rect(11, headY - oy + 3, 4, 2, BODY); // sol kapak
    rect(17, headY - oy + 3, 4, 2, BODY); // sağ kapak
    // Sadece alt kısım görünür (yarı kapalı)
    rect(11, headY - oy + 5, 4, 2, EYE);
    rect(17, headY - oy + 5, 4, 2, EYE);
    px(12, headY - oy + 5, SHINE);
    px(18, headY - oy + 5, SHINE);
  } else if (frame === 12 || frame === 13) {
    // Sıkılmış — gözler yana bakıyor (pupil sağda/solda)
    rect(11, headY - oy + 3, 4, 4, EYE);
    rect(17, headY - oy + 3, 4, 4, EYE);
    // Pupil sola kayık (frame 12) / sağa kayık (frame 13) — yana bakış
    const pupilOff = (frame === 12) ? 0 : 2;
    px(11 + pupilOff, headY - oy + 3, SHINE);
    px(17 + pupilOff, headY - oy + 3, SHINE);
  } else {
    // Normal / mutlu gözler
    rect(11, headY - oy + 3, 4, 4, EYE);
    rect(17, headY - oy + 3, 4, 4, EYE);
    px(12, headY - oy + 3, SHINE);
    px(18, headY - oy + 3, SHINE);
  }

  rect(14, headY - oy + 7, 3, 2, NOSE);

  if (frame === 2 || frame === 3) {
    // Mutlu — geniş gülümseme
    px(13, headY - oy + 9, MOUTH);
    px(14, headY - oy + 10, MOUTH);
    px(15, headY - oy + 10, MOUTH);
    px(16, headY - oy + 9, MOUTH);
  } else if (frame === 4 || frame === 5) {
    // Aç/üzgün — aşağı kıvrık ağız
    px(13, headY - oy + 10, MOUTH);
    px(14, headY - oy + 9, MOUTH);
    px(15, headY - oy + 9, MOUTH);
    px(16, headY - oy + 10, MOUTH);
  } else if (frame === 0 || frame === 1) {
    // Idle — hafif gülümseme
    px(13, headY - oy + 9, MOUTH);
    px(14, headY - oy + 10, MOUTH);
    px(15, headY - oy + 10, MOUTH);
    px(16, headY - oy + 9, MOUTH);
  } else if (frame === 10 || frame === 11) {
    // Yorgun — hafif açık ağız (esniyor)
    rect(13, headY - oy + 9, 5, 3, MOUTH);
    rect(14, headY - oy + 10, 3, 2, NOSE);  // ağız içi (dil rengi)
  } else if (frame === 12 || frame === 13) {
    // Sıkılmış — düz küçük ağız
    rect(14, headY - oy + 9, 3, 1, MOUTH);
  } else {
    // Diğerleri (bathing, dead vb.) — nötr
    rect(13, headY - oy + 9, 5, 1, MOUTH);
  }

  if (frame !== 9) {
    const wy = headY - oy + 8;
    px(6,  wy, DARK); px(7,  wy, DARK); px(8,  wy, DARK);
    px(23, wy, DARK); px(24, wy, DARK); px(25, wy, DARK);
    px(6,  wy + 2, DARK); px(7,  wy + 2, DARK); px(8,  wy + 2, DARK);
    px(23, wy + 2, DARK); px(24, wy + 2, DARK); px(25, wy + 2, DARK);
  }

  if (frame === 8) {
    rect(6,  10, 2, 3, 0x90e0ef);
    rect(24, 8,  2, 3, 0x90e0ef);
    rect(15, 6,  2, 3, 0x90e0ef);
  }

  // Hasta efekti (frame 14-15)
  if (frame === 14 || frame === 15) {
    const tOff = (frame === 15) ? 1 : 0; // titreme efekti
    // Kırmızı burun (ateş)
    rect(13 + tOff, headY - oy + 7, 5, 3, 0xff4444);
    // Sarı-yeşil hasta gözler (normal gözlerin üzerine)
    rect(11 + tOff, headY - oy + 3, 4, 4, 0x8b8b00);
    rect(17 + tOff, headY - oy + 3, 4, 4, 0x8b8b00);
    px(12 + tOff, headY - oy + 3, 0xffff00);
    px(18 + tOff, headY - oy + 3, 0xffff00);
    // Üzgün ağız
    px(13 + tOff, headY - oy + 10, MOUTH);
    px(14 + tOff, headY - oy + 9, MOUTH);
    px(15 + tOff, headY - oy + 9, MOUTH);
    px(16 + tOff, headY - oy + 10, MOUTH);
    // Ter damlası (sağ üst)
    rect(22, headY - oy, 2, 3, 0x90e0ef);
  }
}

// ══════════════════════════════════════════════════════════════════
// YAVRU KEDİ ÇİZİMİ — büyük baş, büyük gözler, tombul, kısa bacak
// ══════════════════════════════════════════════════════════════════
function drawCatFrameKitten(gfx, ox, oy, frame, palette) {
  const BODY = palette.body, DARK = palette.dark, STRIPE = palette.stripe;
  const NOSE = palette.nose, EYE = 0x1a1a2e, SHINE = 0xffffff, MOUTH = 0x1a1a2e;
  const px = (x,y,c) => { gfx.fillStyle(c,1); gfx.fillRect(ox+x,oy+y,1,1); };
  const rect = (x,y,w,h,c) => { gfx.fillStyle(c,1); gfx.fillRect(ox+x,oy+y,w,h); };

  // ── YATAN YAVRU (uyku frame 6-7) ──
  if (frame === 6 || frame === 7) {
    const br = (frame === 7) ? 1 : 0;
    // Kuyruk
    rect(1, 22, 2, 2, BODY); rect(2, 20, 2, 2, DARK);
    // Gövde (tombul, yatay)
    rect(5, 22, 18, 5 + br, BODY); rect(4, 23, 20, 3 + br, BODY);
    // Sırt çizgileri
    px(9, 22, STRIPE); px(13, 22, STRIPE); px(17, 22, STRIPE);
    // Karın gölge
    rect(5, 27 + br, 18, 1, DARK);
    // Bacaklar
    rect(5, 26 + br, 4, 2, BODY); rect(20, 25 + br, 3, 2, BODY);
    rect(5, 27 + br, 4, 1, DARK); rect(20, 26 + br, 3, 1, DARK);
    // Büyük baş (sol)
    rect(2, 21, 10, 8, BODY); rect(1, 22, 12, 6, BODY);
    // Kulaklar
    rect(2, 19, 2, 3, BODY); rect(9, 19, 2, 3, BODY);
    px(3, 19, DARK); px(10, 19, DARK);
    // Kapalı gözler
    rect(3, 24, 3, 1, EYE); rect(8, 24, 3, 1, EYE);
    // Burun
    rect(5, 26, 2, 1, NOSE);
    // Bıyıklar
    px(0, 25, DARK); px(1, 25, DARK); px(11, 25, DARK); px(12, 25, DARK);
    return;
  }

  // ── DİK YAVRU ──
  // Kuyruk (kısa)
  rect(3, 22, 2, 2, BODY); rect(2, 24, 2, 2, DARK);

  // Gövde (tombul, kısa)
  rect(9, 19, 14, 8, BODY); rect(8, 20, 16, 6, BODY);
  rect(7, 21, 18, 4, BODY);

  // Çizgiler
  px(12, 19, STRIPE); px(14, 19, STRIPE); px(16, 19, STRIPE);

  // Bacaklar (çok kısa, kalın)
  rect(9, 26, 5, 3, BODY); rect(18, 26, 5, 3, BODY);
  rect(9, 28, 5, 2, DARK); rect(18, 28, 5, 2, DARK);
  rect(11, 27, 4, 2, BODY); rect(19, 27, 4, 2, BODY);

  // Karın gölge
  rect(8, 26, 16, 1, DARK);

  // Büyük baş
  const headY = (frame === 2 || frame === 3) ? 1 :
                (frame === 4 || frame === 5) ? 3 :
                2;

  rect(9,  headY, 14, 14, BODY);
  rect(8,  headY+1, 16, 12, BODY);
  rect(7,  headY+2, 18, 10, BODY);

  // Kulaklar (küçük, yuvarlak)
  rect(8,  headY-1, 3, 2, BODY); rect(21, headY-1, 3, 2, BODY);
  px(9, headY-1, DARK); px(22, headY-1, DARK);

  // Baş çizgileri
  px(12, headY+1, STRIPE); px(14, headY+1, STRIPE); px(16, headY+1, STRIPE);

  // Gözler (BÜYÜK — 5x5)
  if (frame === 9) {
    px(10, headY+4, EYE); px(13, headY+4, EYE);
    px(11, headY+5, EYE); px(12, headY+5, EYE);
    px(18, headY+4, EYE); px(21, headY+4, EYE);
    px(19, headY+5, EYE); px(20, headY+5, EYE);
  } else if (frame === 10 || frame === 11) {
    // Yorgun — yarı kapalı
    rect(10, headY+5, 5, 3, EYE); rect(17, headY+5, 5, 3, EYE);
    px(11, headY+5, SHINE); px(18, headY+5, SHINE);
  } else if (frame === 12 || frame === 13) {
    // Sıkılmış — yana bakan
    rect(10, headY+3, 5, 5, EYE); rect(17, headY+3, 5, 5, EYE);
    const po = (frame === 12) ? 0 : 3;
    px(10+po, headY+3, SHINE); px(17+po, headY+3, SHINE);
  } else {
    // Normal büyük gözler
    rect(10, headY+3, 5, 5, EYE); rect(17, headY+3, 5, 5, EYE);
    px(11, headY+3, SHINE); px(12, headY+4, SHINE);
    px(18, headY+3, SHINE); px(19, headY+4, SHINE);
  }

  // Burun
  rect(14, headY+9, 3, 2, NOSE);

  // Ağız
  if (frame === 2 || frame === 3) {
    px(13, headY+11, MOUTH); px(14, headY+12, MOUTH);
    px(15, headY+12, MOUTH); px(16, headY+11, MOUTH);
  } else if (frame === 4 || frame === 5) {
    px(13, headY+12, MOUTH); px(14, headY+11, MOUTH);
    px(15, headY+11, MOUTH); px(16, headY+12, MOUTH);
  } else if (frame === 0 || frame === 1) {
    px(13, headY+11, MOUTH); px(14, headY+12, MOUTH);
    px(15, headY+12, MOUTH); px(16, headY+11, MOUTH);
  } else if (frame === 10 || frame === 11) {
    rect(13, headY+11, 5, 2, MOUTH);
    rect(14, headY+12, 3, 1, NOSE);
  } else if (frame === 12 || frame === 13) {
    rect(14, headY+11, 3, 1, MOUTH);
  } else {
    rect(13, headY+11, 5, 1, MOUTH);
  }

  // Bıyıklar (kısa)
  if (frame !== 9) {
    const wy = headY + 10;
    px(5, wy, DARK); px(6, wy, DARK);
    px(24, wy, DARK); px(25, wy, DARK);
    px(5, wy+2, DARK); px(6, wy+2, DARK);
    px(24, wy+2, DARK); px(25, wy+2, DARK);
  }

  if (frame === 8) {
    rect(6, 8, 2, 2, 0x90e0ef); rect(24, 6, 2, 2, 0x90e0ef); rect(15, 4, 2, 2, 0x90e0ef);
  }
}

// ══════════════════════════════════════════════════════════════════
// GENÇ KEDİ ÇİZİMİ — orta boy, biraz büyük baş, normal gözler
// ══════════════════════════════════════════════════════════════════
function drawCatFrameYoung(gfx, ox, oy, frame, palette) {
  const BODY = palette.body, DARK = palette.dark, STRIPE = palette.stripe;
  const NOSE = palette.nose, EYE = 0x1a1a2e, SHINE = 0xffffff, MOUTH = 0x1a1a2e;
  const px = (x,y,c) => { gfx.fillStyle(c,1); gfx.fillRect(ox+x,oy+y,1,1); };
  const rect = (x,y,w,h,c) => { gfx.fillStyle(c,1); gfx.fillRect(ox+x,oy+y,w,h); };

  // ── YATAN GENÇ (uyku frame 6-7) ──
  if (frame === 6 || frame === 7) {
    const br = (frame === 7) ? 1 : 0;
    // Kuyruk
    rect(1, 19, 2, 3, BODY); rect(2, 17, 2, 3, BODY); rect(3, 16, 2, 2, DARK);
    // Gövde
    rect(5, 21, 20, 5 + br, BODY); rect(4, 22, 22, 3 + br, BODY); rect(6, 20, 16, 2, BODY);
    px(10, 20, STRIPE); px(14, 20, STRIPE); px(18, 20, STRIPE);
    rect(5, 26 + br, 20, 1, DARK);
    // Bacaklar
    rect(5, 25 + br, 4, 2, BODY); rect(22, 24 + br, 3, 2, BODY);
    rect(5, 26 + br, 4, 1, DARK); rect(22, 25 + br, 3, 1, DARK);
    // Baş
    rect(2, 21, 9, 7, BODY); rect(1, 22, 11, 5, BODY); rect(3, 20, 6, 2, BODY);
    // Kulaklar
    rect(2, 18, 3, 3, BODY); rect(8, 18, 3, 3, BODY);
    px(3, 18, DARK); px(9, 18, DARK);
    // Kapalı gözler
    rect(3, 23, 3, 1, EYE); rect(7, 23, 3, 1, EYE);
    // Burun
    rect(5, 25, 2, 1, NOSE);
    px(4, 26, MOUTH); px(5, 26, MOUTH); px(6, 26, MOUTH);
    // Bıyıklar
    px(0, 24, DARK); px(1, 24, DARK); px(10, 24, DARK); px(11, 24, DARK);
    return;
  }

  // ── DİK GENÇ ──
  // Kuyruk
  rect(2, 21, 3, 2, BODY); rect(1, 23, 2, 2, BODY); rect(2, 25, 2, 2, DARK);

  // Gövde (orta)
  rect(8, 17, 16, 10, BODY); rect(7, 18, 18, 8, BODY); rect(6, 19, 20, 6, BODY);

  // Çizgiler
  px(12, 18, STRIPE); px(14, 18, STRIPE); px(16, 18, STRIPE);
  px(12, 20, STRIPE); px(16, 20, STRIPE);

  // Bacaklar (orta)
  rect(8, 27, 5, 3, BODY); rect(19, 27, 5, 3, BODY);
  rect(8, 29, 5, 2, DARK); rect(19, 29, 5, 2, DARK);
  rect(10, 28, 4, 2, BODY); rect(19, 28, 4, 2, BODY);

  // Baş (biraz büyük)
  const headY = (frame === 2 || frame === 3) ? 2 :
                (frame === 4 || frame === 5) ? 4 :
                (frame === 10 || frame === 11) ? 4 :
                3;

  rect(10, headY, 12, 12, BODY);
  rect(9,  headY+1, 14, 10, BODY);
  rect(8,  headY+2, 16, 8, BODY);

  // Kulaklar
  rect(9,  headY-2, 3, 3, BODY); rect(20, headY-2, 3, 3, BODY);
  px(10, headY-2, DARK); px(21, headY-2, DARK);

  // Baş çizgileri
  px(12, headY, STRIPE); px(13, headY, STRIPE); px(14, headY, STRIPE);
  px(18, headY, STRIPE); px(19, headY, STRIPE);

  // Gözler (normal 4x4)
  if (frame === 9) {
    px(11, headY+3, EYE); px(14, headY+3, EYE);
    px(12, headY+4, EYE); px(13, headY+4, EYE);
    px(17, headY+3, EYE); px(20, headY+3, EYE);
    px(18, headY+4, EYE); px(19, headY+4, EYE);
  } else if (frame === 10 || frame === 11) {
    rect(11, headY+5, 4, 2, EYE); rect(17, headY+5, 4, 2, EYE);
    px(12, headY+5, SHINE); px(18, headY+5, SHINE);
  } else if (frame === 12 || frame === 13) {
    rect(11, headY+3, 4, 4, EYE); rect(17, headY+3, 4, 4, EYE);
    const po = (frame === 12) ? 0 : 2;
    px(11+po, headY+3, SHINE); px(17+po, headY+3, SHINE);
  } else {
    rect(11, headY+3, 4, 4, EYE); rect(17, headY+3, 4, 4, EYE);
    px(12, headY+3, SHINE); px(18, headY+3, SHINE);
  }

  // Burun
  rect(14, headY+7, 3, 2, NOSE);

  // Ağız
  if (frame === 2 || frame === 3) {
    px(13, headY+9, MOUTH); px(14, headY+10, MOUTH);
    px(15, headY+10, MOUTH); px(16, headY+9, MOUTH);
  } else if (frame === 4 || frame === 5) {
    px(13, headY+10, MOUTH); px(14, headY+9, MOUTH);
    px(15, headY+9, MOUTH); px(16, headY+10, MOUTH);
  } else if (frame === 0 || frame === 1) {
    px(13, headY+9, MOUTH); px(14, headY+10, MOUTH);
    px(15, headY+10, MOUTH); px(16, headY+9, MOUTH);
  } else if (frame === 10 || frame === 11) {
    rect(13, headY+9, 5, 3, MOUTH);
    rect(14, headY+10, 3, 2, NOSE);
  } else if (frame === 12 || frame === 13) {
    rect(14, headY+9, 3, 1, MOUTH);
  } else {
    rect(13, headY+9, 5, 1, MOUTH);
  }

  // Bıyıklar
  if (frame !== 9) {
    const wy = headY + 8;
    px(6, wy, DARK); px(7, wy, DARK); px(8, wy, DARK);
    px(23, wy, DARK); px(24, wy, DARK); px(25, wy, DARK);
    px(6, wy+2, DARK); px(7, wy+2, DARK);
    px(24, wy+2, DARK); px(25, wy+2, DARK);
  }

  if (frame === 8) {
    rect(6, 10, 2, 3, 0x90e0ef); rect(24, 8, 2, 3, 0x90e0ef); rect(15, 6, 2, 3, 0x90e0ef);
  }
}
