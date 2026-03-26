import { soundManager } from '../audio/SoundManager.js';

/**
 * WardrobeScene — Kedi Dolabı (Aksesuar Seçme)
 * Overlay scene olarak açılır.
 * 3 slot: head, eyes, neck — her slota 1 aksesuar takılabilir.
 */

const ACCESSORIES = [
  { key: 'hat',        slot: 'head', label: 'Siyah Sapka',    icon: '🎩', texture: 'acc_hat' },
  { key: 'ribbon',     slot: 'head', label: 'Pembe Fiyonk',   icon: '🎀', texture: 'acc_ribbon' },
  { key: 'crown',      slot: 'head', label: 'Altin Tac',      icon: '👑', texture: 'acc_crown' },
  { key: 'flower',     slot: 'head', label: 'Cicek Tac',      icon: '🌸', texture: 'acc_flower' },
  { key: 'bowtie',     slot: 'neck', label: 'Papyon',         icon: '🎀', texture: 'acc_bowtie' },
  { key: 'collar',     slot: 'neck', label: 'Tasma',          icon: '📿', texture: 'acc_collar' },
  { key: 'scarf',      slot: 'neck', label: 'Atki',           icon: '🧣', texture: 'acc_scarf' },
  { key: 'sunglasses', slot: 'eyes', label: 'Gunes Gozlugu', icon: '🕶️', texture: 'acc_sunglasses' },
  { key: 'glasses',    slot: 'eyes', label: 'Gozluk',         icon: '🤓', texture: 'acc_glasses' },
];

export default class WardrobeScene extends Phaser.Scene {
  constructor() { super({ key: 'WardrobeScene' }); }

  init(data) {
    this._catSprite = data.catSprite;     // CatSprite referansı
    this._currentSlots = data.currentSlots || { head: null, neck: null, eyes: null };
    this._ageStage = data.ageStage || 'adult';
    this._onClose = data.onClose || (() => {});
  }

  create() {
    const W = 480, H = 360;
    const CX = W / 2, CY = H / 2;

    // Koyu overlay
    const overlay = this.add.rectangle(CX, CY, W, H, 0x000000, 0.75)
      .setInteractive();
    overlay.on('pointerdown', () => this._close());

    // Kart arkaplanı
    this.add.rectangle(CX, CY, 400, 300, 0x0f0f1e)
      .setStrokeStyle(3, 0xf4a261);

    // Başlık
    this.add.text(CX, CY - 130, '👗 DOLAP', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#f4a261',
    }).setOrigin(0.5);

    // Ayırıcı
    this.add.rectangle(CX, CY - 115, 360, 1, 0x457b9d);

    // Kedi önizleme (sol tarafta)
    this.add.rectangle(CX - 120, CY - 20, 90, 110, 0x1e1e3a)
      .setStrokeStyle(2, 0x457b9d);

    const previewScaleMap = { kitten: 2.0, young: 2.2, adult: 2.5 };
    const previewScale = previewScaleMap[this._ageStage] || 2.5;
    const preview = this.add.sprite(CX - 120, CY + 15, 'cat_sheet', 0)
      .setScale(previewScale).setOrigin(0.5, 1);

    if (!this.anims.exists('wardrobe_idle')) {
      this.anims.create({
        key: 'wardrobe_idle',
        frames: [{ key: 'cat_sheet', frame: 0 }, { key: 'cat_sheet', frame: 1 }],
        frameRate: 2, repeat: -1,
      });
    }
    preview.play('wardrobe_idle');

    // Önizleme aksesuarları
    this._previewAccessories = { head: null, neck: null, eyes: null };
    this._previewSprite = preview;

    // Slot başlıkları ve butonlar (sağ tarafta)
    const slotConfig = [
      { slot: 'head', label: 'BAS', y: CY - 90 },
      { slot: 'eyes', label: 'GOZ', y: CY - 20 },
      { slot: 'neck', label: 'BOYUN', y: CY + 50 },
    ];

    const btnStartX = CX - 15;

    slotConfig.forEach(cfg => {
      // Slot başlığı
      this.add.text(btnStartX, cfg.y, cfg.label + ':', {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#888',
      });

      // O slot'a ait aksesuarları filtrele
      const items = ACCESSORIES.filter(a => a.slot === cfg.slot);
      items.forEach((acc, i) => {
        const bx = btnStartX + 55 + i * 44;
        const by = cfg.y + 2;

        const isActive = this._currentSlots[cfg.slot] === acc.key;

        // Buton arkaplanı
        const bg = this.add.rectangle(bx, by, 38, 28, isActive ? 0x2a9d8f : 0x1e1e3a)
          .setStrokeStyle(2, isActive ? 0xffd166 : 0x457b9d)
          .setInteractive({ useHandCursor: true });

        // İkon
        const icon = this.add.text(bx, by, acc.icon, {
          fontSize: '14px',
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
          if (this._currentSlots[cfg.slot] !== acc.key) {
            bg.setFillStyle(0x2d2d55);
            bg.setStrokeStyle(2, 0xf4a261);
          }
        });
        bg.on('pointerout', () => {
          if (this._currentSlots[cfg.slot] !== acc.key) {
            bg.setFillStyle(0x1e1e3a);
            bg.setStrokeStyle(2, 0x457b9d);
          }
        });
        bg.on('pointerdown', () => {
          soundManager.playClick();
          if (this._currentSlots[cfg.slot] === acc.key) {
            // Çıkar
            this._currentSlots[cfg.slot] = null;
            this._catSprite.removeAccessory(cfg.slot);
            bg.setFillStyle(0x1e1e3a);
            bg.setStrokeStyle(2, 0x457b9d);
          } else {
            // Tak — önce aynı slottaki eski seçimi temizle
            this._deselectSlot(cfg.slot);
            this._currentSlots[cfg.slot] = acc.key;
            this._catSprite.setAccessory(cfg.slot, acc.key, acc.texture);
            bg.setFillStyle(0x2a9d8f);
            bg.setStrokeStyle(2, 0xffd166);
          }
          this._updatePreview();
        });

        // Aktif referans kaydet (deselect için)
        if (!this._slotButtons) this._slotButtons = {};
        if (!this._slotButtons[cfg.slot]) this._slotButtons[cfg.slot] = [];
        this._slotButtons[cfg.slot].push({ bg, acc });
      });
    });

    // Mevcut aksesuarları önizlemeye uygula
    this._updatePreview();

    // Tümünü Çıkar butonu
    const clearBtn = this.add.text(CX - 40, CY + 115, '[ CIKAR ]', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#e63946',
      backgroundColor: '#1e1e3a', padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    clearBtn.on('pointerover', () => clearBtn.setStyle({ fill: '#ff6666' }));
    clearBtn.on('pointerout',  () => clearBtn.setStyle({ fill: '#e63946' }));
    clearBtn.on('pointerdown', () => {
      soundManager.playClick();
      this._clearAll();
    });

    // Kapat butonu
    const closeBtn = this.add.text(CX + 60, CY + 115, '[ KAPAT ]', {
      fontFamily: '"Press Start 2P"', fontSize: '7px', fill: '#ffffff',
      backgroundColor: '#457b9d', padding: { x: 8, y: 5 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ffd166' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ fill: '#ffffff' }));
    closeBtn.on('pointerdown', () => this._close());

    soundManager.playClick();
  }

  _deselectSlot(slot) {
    if (!this._slotButtons || !this._slotButtons[slot]) return;
    this._slotButtons[slot].forEach(item => {
      item.bg.setFillStyle(0x1e1e3a);
      item.bg.setStrokeStyle(2, 0x457b9d);
    });
  }

  _updatePreview() {
    // Önizleme aksesuarlarını güncelle
    for (const slot of ['head', 'eyes', 'neck']) {
      if (this._previewAccessories[slot]) {
        this._previewAccessories[slot].destroy();
        this._previewAccessories[slot] = null;
      }

      const accKey = this._currentSlots[slot];
      if (accKey) {
        const accDef = ACCESSORIES.find(a => a.key === accKey);
        if (accDef) {
          const allOffsets = {
            kitten: { head: { x:0, y:-62 }, eyes: { x:0, y:-50 }, neck: { x:0, y:-28 } },
            young:  { head: { x:0, y:-76 }, eyes: { x:0, y:-64 }, neck: { x:0, y:-42 } },
            adult:  { head: { x:0, y:-90 }, eyes: { x:0, y:-76 }, neck: { x:0, y:-50 } },
          };
          const offsets = allOffsets[this._ageStage] || allOffsets.adult;
          const off = offsets[slot];
          const previewScale = { kitten: 2.0, young: 2.2, adult: 2.5 }[this._ageStage] || 2.5;
          const accScale = previewScale * 0.8;
          const spr = this.add.image(
            this._previewSprite.x + off.x,
            this._previewSprite.y + off.y,
            accDef.texture
          ).setScale(accScale);
          this._previewAccessories[slot] = spr;
        }
      }
    }
  }

  _clearAll() {
    for (const slot of ['head', 'eyes', 'neck']) {
      this._currentSlots[slot] = null;
      this._catSprite.removeAccessory(slot);
      this._deselectSlot(slot);
    }
    this._updatePreview();
  }

  _close() {
    soundManager.playClick();
    this._onClose(this._currentSlots);
    this.scene.stop('WardrobeScene');
  }
}
