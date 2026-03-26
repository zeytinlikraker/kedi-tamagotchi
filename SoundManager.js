/**
 * SoundManager — Web Audio API ile 8-bit retro ses motoru
 * Tüm sesler programatik üretilir, harici dosya gerekmez.
 */
export default class SoundManager {
  constructor() {
    this._ctx = null;
    this._masterGain = null;
    this._bgmGain = null;
    this._sfxGain = null;
    this._bgmMuted = localStorage.getItem('kedi_bgm_muted') === 'true';
    this._sfxMuted = localStorage.getItem('kedi_sfx_muted') === 'true';
    this._bgmPlaying = false;
    this._bgmNodes = [];
    this._bgmTimeout = null;
    this._gameBgmPlaying = false;
    this._gameBgmTimeout = null;
    this._lofiBgmGain = null;
    this._gameBgmGain = null;
  }

  /** AudioContext'i kullanıcı etkileşimi sonrası başlat */
  init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain — her zaman 1
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = 1;
    this._masterGain.connect(this._ctx.destination);

    // BGM gain — müzik kanalı (mute butonu bunu kontrol eder)
    this._bgmGain = this._ctx.createGain();
    this._bgmGain.gain.value = this._bgmMuted ? 0 : 1;
    this._bgmGain.connect(this._masterGain);

    // Lofi BGM sub-gain (ana ekran müziği)
    this._lofiBgmGain = this._ctx.createGain();
    this._lofiBgmGain.gain.value = 1;
    this._lofiBgmGain.connect(this._bgmGain);

    // Game BGM sub-gain (mini oyun müziği)
    this._gameBgmGain = this._ctx.createGain();
    this._gameBgmGain.gain.value = 0;
    this._gameBgmGain.connect(this._bgmGain);

    // SFX gain — efekt kanalı
    this._sfxGain = this._ctx.createGain();
    this._sfxGain.gain.value = this._sfxMuted ? 0 : 1;
    this._sfxGain.connect(this._masterGain);
  }

  /** Resume context (autoplay policy) */
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  // ── MUTE KONTROLÜ ───────────────────────────────────────────────
  get bgmMuted() { return this._bgmMuted; }
  get sfxMuted() { return this._sfxMuted; }

  toggleBGM() {
    this._bgmMuted = !this._bgmMuted;
    localStorage.setItem('kedi_bgm_muted', this._bgmMuted);
    if (this._bgmGain) {
      this._bgmGain.gain.setValueAtTime(
        this._bgmMuted ? 0 : 1,
        this._ctx.currentTime
      );
    }
    return this._bgmMuted;
  }

  toggleSFX() {
    this._sfxMuted = !this._sfxMuted;
    localStorage.setItem('kedi_sfx_muted', this._sfxMuted);
    if (this._sfxGain) {
      this._sfxGain.gain.setValueAtTime(
        this._sfxMuted ? 0 : 1,
        this._ctx.currentTime
      );
    }
    return this._sfxMuted;
  }

  // ── YARDIMCI: OSCİLATÖR ÇAL ────────────────────────────────────
  _playTone(freq, duration, type = 'square', volume = 0.15, detune = 0) {
    if (!this._ctx) return;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(volume, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start();
    osc.stop(this._ctx.currentTime + duration);
  }

  _playNoise(duration, volume = 0.08) {
    if (!this._ctx) return;
    const bufferSize = this._ctx.sampleRate * duration;
    const buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this._ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this._ctx.createGain();
    gain.gain.setValueAtTime(volume, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    // Bandpass filter — su efekti için
    const filter = this._ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.8;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this._sfxGain);
    source.start();
    source.stop(this._ctx.currentTime + duration);
  }

  // ── ARKAPLAN MÜZİĞİ ────────────────────────────────────────────
  // Pentatonik 8-bit melodi döngüsü
  startBGM() {
    if (this._bgmPlaying) return;
    this._bgmPlaying = true;
    if (this._lofiBgmGain && this._ctx) {
      this._lofiBgmGain.gain.setValueAtTime(1, this._ctx.currentTime);
    }
    this._playBGMLoop();
  }

  stopBGM() {
    this._bgmPlaying = false;
    if (this._bgmTimeout) {
      clearTimeout(this._bgmTimeout);
      this._bgmTimeout = null;
    }
    if (this._lofiBgmGain && this._ctx) {
      this._lofiBgmGain.gain.setValueAtTime(0, this._ctx.currentTime);
    }
  }

  // ── MİNİ OYUN MÜZİĞİ (upbeat 8-bit) ───────────────────────────
  startGameBGM() {
    if (this._gameBgmPlaying) return;
    this._gameBgmPlaying = true;
    if (this._gameBgmGain && this._ctx) {
      this._gameBgmGain.gain.setValueAtTime(1, this._ctx.currentTime);
    }
    this._playGameBGMLoop();
  }

  stopGameBGM() {
    this._gameBgmPlaying = false;
    if (this._gameBgmTimeout) {
      clearTimeout(this._gameBgmTimeout);
      this._gameBgmTimeout = null;
    }
    if (this._gameBgmGain && this._ctx) {
      this._gameBgmGain.gain.setValueAtTime(0, this._ctx.currentTime);
    }
  }

  _playGameBGMLoop() {
    if (!this._gameBgmPlaying || !this._ctx) return;

    const BPM = 140;
    const beatSec = 60 / BPM;
    const now = this._ctx.currentTime;

    const N = {
      C3: 131, D3: 147, E3: 165, F3: 175, G3: 196, A3: 220, B3: 247,
      C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494,
      C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880,
      C6: 1047,
      REST: 0,
    };

    // ── MELODİ (32 nota — neşeli, zıpzıp) ──
    const melody = [
      // Bölüm A — yükselen enerji
      N.C5, N.E5, N.G5, N.C6,
      N.G5, N.E5, N.C5, N.REST,
      N.A4, N.C5, N.E5, N.A5,
      N.G5, N.F5, N.E5, N.D5,
      // Bölüm B — dans eden motif
      N.C5, N.D5, N.E5, N.G5,
      N.A5, N.G5, N.E5, N.REST,
      N.D5, N.E5, N.G5, N.A5,
      N.G5, N.E5, N.D5, N.C5,
    ];

    // ── BAS (her 4 beat'te) ──
    const bass = [
      N.C3, N.G3, N.A3, N.G3,
      N.C3, N.A3, N.D3, N.G3,
    ];

    // ── ARPEJ AKORLARI (her 4 beat'te 3'lü hızlı notalar) ──
    const arpeggios = [
      [N.C4, N.E4, N.G4],
      [N.G3, N.B3, N.D4],
      [N.A3, N.C4, N.E4],
      [N.G3, N.B3, N.D4],
      [N.C4, N.E4, N.G4],
      [N.A3, N.C4, N.E4],
      [N.D4, N.F4, N.A4],
      [N.G3, N.B3, N.D4],
    ];

    const totalBeats = melody.length;
    const totalTime = totalBeats * beatSec;

    // ── KATMAN 1: MELODİ (square — 8-bit parlak ses) ──
    melody.forEach((freq, i) => {
      if (freq === 0) return;
      const time = now + i * beatSec;
      const dur = beatSec * 0.7;

      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.06, time + 0.02);
      gain.gain.setValueAtTime(0.06, time + dur * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(this._gameBgmGain);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    });

    // ── KATMAN 2: BAS (triangle — ritmik, her 4 beat) ──
    bass.forEach((freq, bi) => {
      const time = now + bi * 4 * beatSec;
      const dur = 4 * beatSec * 0.7;

      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.045, time + 0.03);
      gain.gain.setValueAtTime(0.045, time + dur * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(this._gameBgmGain);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    });

    // ── KATMAN 3: ARPEJ (square — hızlı 3'lü notalar, her 4 beat) ──
    arpeggios.forEach((chord, ci) => {
      const baseTime = now + ci * 4 * beatSec;

      chord.forEach((freq, ni) => {
        const time = baseTime + ni * beatSec * 0.33;
        const dur = beatSec * 0.25;

        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.03, time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.connect(gain);
        gain.connect(this._gameBgmGain);
        osc.start(time);
        osc.stop(time + dur + 0.02);
      });
    });

    // ── DÖNGÜ TEKRARI ──
    this._gameBgmTimeout = setTimeout(() => {
      this._playGameBGMLoop();
    }, totalTime * 1000);
  }

  _playBGMLoop() {
    if (!this._bgmPlaying || !this._ctx) return;

    // ── TEMPO ──
    const BPM = 85;
    const beatSec = 60 / BPM;          // ~0.706s per beat
    const now = this._ctx.currentTime;

    // ── NOTA FREKANSLARI ──
    const N = {
      C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494,
      C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, B5: 988,
      REST: 0, // sessiz nota
    };

    // ── MELODİ (32 nota — 2 bölüm) ──
    // Bölüm A: sakin açılış
    // Bölüm B: yumuşak kapanış
    const melody = [
      // Bölüm A (16 nota)
      N.C5, N.REST, N.E5, N.G5,
      N.REST, N.A5, N.G5, N.REST,
      N.E5, N.D5, N.REST, N.C5,
      N.REST, N.D5, N.E5, N.G5,
      // Bölüm B (16 nota)
      N.A5, N.REST, N.G5, N.E5,
      N.REST, N.D5, N.C5, N.REST,
      N.E5, N.G5, N.REST, N.A4,
      N.REST, N.G4, N.E4, N.C5,
    ];

    // ── AKORLAR (her 4 beat'te bir değişir → 8 akor) ──
    // [kök, 3., 5.] — üçlü akorlar
    const chords = [
      [N.C4, N.E4, N.G4],   // C maj
      [N.F4, N.A4, N.C5],   // F maj
      [N.A4, N.C5, N.E5],   // A min
      [N.G4, N.B4, N.D5],   // G maj
      [N.C4, N.E4, N.G4],   // C maj
      [N.E4, N.G4, N.B4],   // E min
      [N.F4, N.A4, N.C5],   // F maj
      [N.G4, N.B4, N.D5],   // G maj
    ];

    // ── BAS NOTALARI (her 4 beat'te bir) ──
    const bassNotes = [
      N.C4 / 2,  // C3
      N.F4 / 2,  // F3
      N.A4 / 2,  // A3
      N.G4 / 2,  // G3
      N.C4 / 2,  // C3
      N.E4 / 2,  // E3
      N.F4 / 2,  // F3
      N.G4 / 2,  // G3
    ];

    const totalBeats = melody.length;
    const totalTime = totalBeats * beatSec;

    // ── KATMAN 1: MELODİ (triangle) ──
    melody.forEach((freq, i) => {
      if (freq === 0) return; // REST — sessiz
      const time = now + i * beatSec;
      const dur = beatSec * 0.85; // legato — notalar arası küçük boşluk

      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      // Yumuşak attack + decay — lofi hissi
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.05, time + 0.04);   // soft attack
      gain.gain.setValueAtTime(0.05, time + dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur); // fade out

      osc.connect(gain);
      gain.connect(this._lofiBgmGain);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    });

    // ── KATMAN 2: PAD / AKORLAR (sine x2, hafif detune — chorus efekti) ──
    chords.forEach((chord, ci) => {
      const time = now + ci * 4 * beatSec;
      const dur = 4 * beatSec * 0.95; // akor 4 beat sürer

      chord.forEach((freq) => {
        // 2 osc, hafif detune — sıcak chorus
        [-6, 6].forEach((det) => {
          const osc = this._ctx.createOscillator();
          const gain = this._ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq * 0.5; // bir oktav aşağı — daha sıcak
          osc.detune.value = det;

          // Çok yumuşak envelope — arka planda süzülür
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.022, time + 0.3);  // slow attack
          gain.gain.setValueAtTime(0.022, time + dur * 0.6);
          gain.gain.linearRampToValueAtTime(0.001, time + dur);   // slow release

          osc.connect(gain);
          gain.connect(this._lofiBgmGain);
          osc.start(time);
          osc.stop(time + dur + 0.1);
        });
      });
    });

    // ── KATMAN 3: BAS (sine — derin, yumuşak) ──
    bassNotes.forEach((freq, bi) => {
      const time = now + bi * 4 * beatSec;
      const dur = 4 * beatSec * 0.8;

      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.035, time + 0.08);
      gain.gain.setValueAtTime(0.035, time + dur * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(this._lofiBgmGain);
      osc.start(time);
      osc.stop(time + dur + 0.05);
    });

    // ── DÖNGÜ TEKRARI ──
    this._bgmTimeout = setTimeout(() => {
      this._playBGMLoop();
    }, totalTime * 1000);
  }

  // ── BESLEME SESİ ────────────────────────────────────────────────
  // Çıtır çıtır yükselen notalar
  playFeed() {
    if (!this._ctx) return;
    const freqs = [400, 500, 600, 700, 800];
    freqs.forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.08, 'square', 0.12), i * 70);
    });
  }

  // ── SEVME / MIRILDANMA SESİ ─────────────────────────────────────
  // Düşük frekanslı yumuşak titreşim (purr)
  playPurr() {
    if (!this._ctx) return;
    const now = this._ctx.currentTime;

    // Başlangıç chirp — "M" sesi (kısa, yüksekten düşen)
    const chirp = this._ctx.createOscillator();
    const chirpGain = this._ctx.createGain();
    chirp.type = 'sine';
    chirp.frequency.setValueAtTime(700, now);
    chirp.frequency.exponentialRampToValueAtTime(350, now + 0.06);
    chirpGain.gain.setValueAtTime(0.08, now);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    chirp.connect(chirpGain);
    chirpGain.connect(this._sfxGain);
    chirp.start(now);
    chirp.stop(now + 0.07);

    // Tatlı yükselen 3 nota: "mrrr~"
    const notes = [350, 450, 550];
    const noteDur = 0.15;

    notes.forEach((freq, i) => {
      const time = now + i * noteDur;
      const dur = (i === notes.length - 1) ? 0.25 : noteDur;

      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();

      // Yumuşak triangle dalga
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq - 20, time);
      osc.frequency.linearRampToValueAtTime(freq, time + 0.03);

      // Hafif vibrato (mırlama hissi)
      const lfo = this._ctx.createOscillator();
      const lfoGain = this._ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 8;
      lfoGain.gain.value = 5;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Yumuşak envelope
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
      gain.gain.setValueAtTime(0.12, time + dur * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(time);
      lfo.start(time);
      osc.stop(time + dur + 0.02);
      lfo.stop(time + dur + 0.02);
    });
  }

  // ── UYKU SESİ ──────────────────────────────────────────────────
  // Yavaş sinüs — hafif nefes hissi
  playSleep() {
    if (!this._ctx) return;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 120;
    osc.frequency.linearRampToValueAtTime(80, this._ctx.currentTime + 1.0);
    gain.gain.setValueAtTime(0.05, this._ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, this._ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start();
    osc.stop(this._ctx.currentTime + 1.2);
  }

  // ── BANYO SESİ ─────────────────────────────────────────────────
  // Su şıpırtısı — filtered noise bursts
  playBath() {
    if (!this._ctx) return;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this._playNoise(0.12, 0.1), i * 100);
    }
  }

  // ── MİNİ OYUN: PUAN KAZANMA ────────────────────────────────────
  // Yükselen arpej — neşeli bip
  playScore() {
    if (!this._ctx) return;
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.1, 'square', 0.1), i * 60);
    });
  }

  // ── MİNİ OYUN: TOP SEKME ───────────────────────────────────────
  // Kısa bouncy boing
  playBounce() {
    if (!this._ctx) return;
    const osc = this._ctx.createOscillator();
    const gain = this._ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this._ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this._ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, this._ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start();
    osc.stop(this._ctx.currentTime + 0.15);
  }

  // ── UYARI SESİ ─────────────────────────────────────────────────
  // Hızlı tekrarlı alarm bip
  playWarning() {
    if (!this._ctx) return;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this._playTone(880, 0.1, 'square', 0.12), i * 150);
    }
  }

  // ── BUTON TIKLAMA SESİ ─────────────────────────────────────────
  playClick() {
    if (!this._ctx) return;
    this._playTone(660, 0.05, 'square', 0.08);
  }

  // ── OYUN BİTTİ SESİ ────────────────────────────────────────────
  playGameOver() {
    if (!this._ctx) return;
    const freqs = [523, 440, 349, 262];
    freqs.forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.25, 'triangle', 0.1), i * 200);
    });
  }

  // ── UYANMA SESİ ────────────────────────────────────────────────
  playWake() {
    if (!this._ctx) return;
    const freqs = [262, 330, 392, 523];
    freqs.forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.12, 'triangle', 0.1), i * 80);
    });
  }

  // ── BÜYÜME SESİ ────────────────────────────────────────────────
  // Uzun yükselen arpej — kutlama hissi
  playGrowth() {
    if (!this._ctx) return;
    const freqs = [262, 330, 392, 523, 659, 784, 1047];
    freqs.forEach((f, i) => {
      setTimeout(() => this._playTone(f, 0.2, 'triangle', 0.1), i * 100);
    });
    // Ek parlama sesi
    setTimeout(() => this._playTone(1047, 0.5, 'sine', 0.06), 700);
  }
}

// Singleton — tüm sahneler aynı instance'ı kullanır
export const soundManager = new SoundManager();
