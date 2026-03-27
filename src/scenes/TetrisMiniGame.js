import { soundManager } from '../audio/SoundManager.js';

/**
 * TetrisMiniGame — Kedi Tetris
 * 8x14 grid, kedi temalı bloklar düşer.
 * Satır tamamla = puan. Üste ulaşırsa oyun biter.
 */
const COLS = 8, ROWS = 14, CELL = 22;
const SHAPES = [
  { cells: [[0,0],[1,0],[0,1],[1,1]], textureKey: 'tb_red' },     // kare
  { cells: [[0,0],[1,0],[2,0],[3,0]], textureKey: 'tb_blue' },    // I
  { cells: [[0,0],[1,0],[2,0],[1,1]], textureKey: 'tb_purple' },  // T
  { cells: [[0,0],[1,0],[1,1],[2,1]], textureKey: 'tb_teal' },    // S
  { cells: [[1,0],[2,0],[0,1],[1,1]], textureKey: 'tb_orange' },  // Z
  { cells: [[0,0],[0,1],[1,1],[2,1]], textureKey: 'tb_yellow' },  // L
  { cells: [[2,0],[0,1],[1,1],[2,1]], textureKey: 'tb_darkred' }, // J
];

export default class TetrisMiniGame extends Phaser.Scene {
  constructor() { super({ key: 'TetrisMiniGame' }); }

  init(data) {
    this._onComplete = data.onComplete || (() => {});
    this._score = 0;
    this._gameOver = false;
    this._grid = [];
    this._gridTextures = [];
    this._current = null;
    this._curX = 0;
    this._curY = 0;
    this._dropTimer = 0;
    this._dropInterval = 600;
    this._blockGfx = [];
  }

  create() {
    const W = 480, H = 360;
    this.add.rectangle(0, 0, W, H, 0x0f0f1e).setOrigin(0, 0);

    this.add.text(W / 2, 14, 'KEDI TETRIS!', {
      fontFamily: '"Press Start 2P"', fontSize: '10px', fill: '#ffd166',
    }).setOrigin(0.5);

    this.add.text(14, 14, '[X]', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#e63946',
      backgroundColor: 'rgba(0,0,0,0.5)', padding: { x: 4, y: 3 },
    }).setInteractive({ useHandCursor: true }).setDepth(200)
      .on('pointerover', function() { this.setStyle({ fill: '#ff6666' }); })
      .on('pointerout',  function() { this.setStyle({ fill: '#e63946' }); })
      .on('pointerdown', () => { this._onComplete(0); this.scene.stop('TetrisMiniGame'); });
    this._scoreTxt = this.add.text(50, 14, 'PUAN: 0', {
      fontFamily: '"Press Start 2P"', fontSize: '8px', fill: '#2a9d8f',
    });

    // Grid başlangıcı
    this._gridX = (W - COLS * CELL) / 2;
    this._gridY = 30;

    // Grid arkaplan
    const gridGfx = this.add.graphics();
    gridGfx.fillStyle(0x1a1a3e, 1);
    gridGfx.fillRect(this._gridX, this._gridY, COLS * CELL, ROWS * CELL);
    gridGfx.lineStyle(1, 0x2a2a5e, 0.4);
    for (let c = 0; c <= COLS; c++) {
      gridGfx.lineBetween(this._gridX + c * CELL, this._gridY, this._gridX + c * CELL, this._gridY + ROWS * CELL);
    }
    for (let r = 0; r <= ROWS; r++) {
      gridGfx.lineBetween(this._gridX, this._gridY + r * CELL, this._gridX + COLS * CELL, this._gridY + r * CELL);
    }

    // Grid veri yapısı
    for (let r = 0; r < ROWS; r++) {
      this._grid[r] = new Array(COLS).fill(0);
      this._gridTextures[r] = new Array(COLS).fill('');
    }

    // İlk blok
    this._spawnBlock();

    // Klavye
    this.input.keyboard.on('keydown-LEFT',  () => this._moveBlock(-1, 0));
    this.input.keyboard.on('keydown-RIGHT', () => this._moveBlock(1, 0));
    this.input.keyboard.on('keydown-DOWN',  () => this._moveBlock(0, 1));
    this.input.keyboard.on('keydown-UP',    () => this._rotateBlock());

    // Dokunma kontrol — sol/sağ yarım ekran
    this.input.on('pointerdown', (ptr) => {
      if (this._gameOver) return;
      const midX = W / 2;
      if (ptr.y > H - 60) {
        this._moveBlock(0, 1); // alt kısma tıkla = hızlı düşür
      } else if (ptr.x < midX - 40) {
        this._moveBlock(-1, 0);
      } else if (ptr.x > midX + 40) {
        this._moveBlock(1, 0);
      } else {
        this._rotateBlock();
      }
    });

    // Sıradaki blok gösterimi
    this._nextShape = null;
    this._nextTxt = this.add.text(this._gridX + COLS * CELL + 16, 50, 'SIRADAKI:', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#888',
    });

    this.add.text(W / 2, H - 10, 'SOL/SAG: HAREKET  YUKARI: DONDUR  ASAGI: DUSUR', {
      fontFamily: '"Press Start 2P"', fontSize: '4px', fill: '#555',
    }).setOrigin(0.5);

    // İlk blok + sıradaki hemen hazır olsun
    this._spawnBlock();
  }

  update(time, delta) {
    if (this._gameOver) return;

    this._dropTimer += delta;
    if (this._dropTimer >= this._dropInterval) {
      this._dropTimer = 0;
      if (!this._moveBlock(0, 1)) {
        this._placeBlock();
      }
    }

    this._drawBlocks();
  }

  _spawnBlock() {
    if (!this._nextShape) {
      this._nextShape = SHAPES[Phaser.Math.Between(0, SHAPES.length - 1)];
    }
    this._current = this._nextShape;
    this._nextShape = SHAPES[Phaser.Math.Between(0, SHAPES.length - 1)];
    this._curX = Math.floor(COLS / 2) - 1;
    this._curY = 0;

    if (!this._canPlace(this._current.cells, this._curX, this._curY)) {
      this._endGame();
    }
  }

  _moveBlock(dx, dy) {
    if (this._gameOver || !this._current) return false;
    const nx = this._curX + dx;
    const ny = this._curY + dy;
    if (this._canPlace(this._current.cells, nx, ny)) {
      this._curX = nx;
      this._curY = ny;
      return true;
    }
    return false;
  }

  _rotateBlock() {
    if (this._gameOver || !this._current) return;
    const rotated = this._current.cells.map(([x, y]) => [-y, x]);
    const minX = Math.min(...rotated.map(c => c[0]));
    const minY = Math.min(...rotated.map(c => c[1]));
    const normalized = rotated.map(([x, y]) => [x - minX, y - minY]);
    if (this._canPlace(normalized, this._curX, this._curY)) {
      this._current = { cells: normalized, textureKey: this._current.textureKey };
    }
  }

  _canPlace(cells, ox, oy) {
    for (const [cx, cy] of cells) {
      const gx = ox + cx;
      const gy = oy + cy;
      if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
      if (gy >= 0 && this._grid[gy][gx]) return false;
    }
    return true;
  }

  _placeBlock() {
    for (const [cx, cy] of this._current.cells) {
      const gx = this._curX + cx;
      const gy = this._curY + cy;
      if (gy >= 0 && gy < ROWS) {
        this._grid[gy][gx] = 1;
        this._gridTextures[gy][gx] = this._current.textureKey;
      }
    }
    this._clearLines();
    this._spawnBlock();
  }

  _clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this._grid[r].every(c => c === 1)) {
        this._grid.splice(r, 1);
        this._gridTextures.splice(r, 1);
        this._grid.unshift(new Array(COLS).fill(0));
        this._gridTextures.unshift(new Array(COLS).fill(''));
        cleared++;
        r++; // tekrar kontrol
      }
    }
    if (cleared > 0) {
      this._score += cleared * cleared; // combo bonus
      this._scoreTxt.setText('PUAN: ' + this._score);
      soundManager.playScore();
      // Hız artışı
      this._dropInterval = Math.max(150, this._dropInterval - cleared * 20);
    }
  }

  _drawBlocks() {
    // Eski blokları temizle
    this._blockGfx.forEach(g => g.destroy());
    this._blockGfx = [];

    // Yerleşik bloklar
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this._grid[r][c]) {
          const bx = this._gridX + c * CELL;
          const by = this._gridY + r * CELL;
          const texKey = this._gridTextures[r][c] || 'tb_red';
          const block = this.add.image(bx + CELL / 2, by + CELL / 2, texKey)
            .setDisplaySize(CELL - 1, CELL - 1);
          this._blockGfx.push(block);
        }
      }
    }

    // Mevcut düşen blok
    if (this._current) {
      for (const [cx, cy] of this._current.cells) {
        const gx = this._curX + cx;
        const gy = this._curY + cy;
        if (gy >= 0) {
          const bx = this._gridX + gx * CELL;
          const by = this._gridY + gy * CELL;
          const block = this.add.image(bx + CELL / 2, by + CELL / 2, this._current.textureKey)
            .setDisplaySize(CELL - 1, CELL - 1);
          this._blockGfx.push(block);
        }
      }
    }

    // Sıradaki blok önizleme
    if (this._nextShape) {
      const previewX = this._gridX + COLS * CELL + 24;
      const previewY = 70;
      for (const [cx, cy] of this._nextShape.cells) {
        const block = this.add.image(
          previewX + cx * CELL,
          previewY + cy * CELL,
          this._nextShape.textureKey
        ).setDisplaySize(CELL - 1, CELL - 1);
        this._blockGfx.push(block);
      }
    }
  }

  _endGame() {
    this._gameOver = true;
    soundManager.playGameOver();

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
      this.scene.stop('TetrisMiniGame');
    });
  }
}
