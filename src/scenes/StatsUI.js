/**
 * StatsUI — HTML overlay stat barlarını günceller
 */
export default class StatsUI {
  constructor() {
    this._bars = {
      hunger:      document.getElementById('bar-hunger'),
      happiness:   document.getElementById('bar-happiness'),
      energy:      document.getElementById('bar-energy'),
      cleanliness: document.getElementById('bar-cleanliness'),
      fun:         document.getElementById('bar-fun'),
    };
    this._labels = {
      hunger:      document.getElementById('lbl-hunger'),
      happiness:   document.getElementById('lbl-happiness'),
      energy:      document.getElementById('lbl-energy'),
      cleanliness: document.getElementById('lbl-cleanliness'),
      fun:         document.getElementById('lbl-fun'),
    };
    this._msgEl  = document.getElementById('status-message');
    this._msgTimer = null;
  }

  /**
   * Tüm stat barlarını güncelle
   * @param {{ hunger, happiness, energy, cleanliness }} stats 0-100 arası
   */
  update(stats) {
    for (const key of Object.keys(this._bars)) {
      const val = Math.max(0, Math.min(100, stats[key]));
      this._bars[key].style.width = val + '%';
      this._labels[key].textContent = Math.round(val);

      // Düşük stat uyarısı rengi
      if (val < 25) {
        this._bars[key].style.filter = 'brightness(1.4)';
        this._bars[key].style.animation = 'pulse 0.6s infinite alternate';
      } else {
        this._bars[key].style.filter = '';
        this._bars[key].style.animation = '';
      }
    }
  }

  /**
   * Geçici durum mesajı göster
   * @param {string} msg
   * @param {number} duration ms
   */
  showMessage(msg, duration = 2000) {
    this._msgEl.textContent = msg;
    this._msgEl.classList.add('show');
    if (this._msgTimer) clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => {
      this._msgEl.classList.remove('show');
    }, duration);
  }

  /**
   * Buton aktif/deaktif kontrolü
   * @param {string} btnId
   * @param {boolean} enabled
   */
  setButtonEnabled(btnId, enabled) {
    const el = document.getElementById(btnId);
    if (el) el.disabled = !enabled;
  }

  /**
   * Uyku/uyandır buton görünürlüğü
   * @param {boolean} sleeping
   */
  updateSleepButtons(sleeping) {
    this.setButtonEnabled('btn-sleep', !sleeping);
    this.setButtonEnabled('btn-wake',   sleeping);
    this.setButtonEnabled('btn-feed',   !sleeping);
    this.setButtonEnabled('btn-pet',    !sleeping);
    this.setButtonEnabled('btn-play',   !sleeping);
    this.setButtonEnabled('btn-bath',   !sleeping);
  }
}
