/* ============================================================
   games/count.js — Count Objects + 同色配对消除
   先数物品得到目标数字，再点 2 个同色目标数字消除一对。
   本关需消除 answer 次（目标是 2 → 消 2 对 → 至少点 4 次）才过关。
   用 _locked 防止过关后连点重复加星 / 多个开局定时器。
   ============================================================ */
const CountGame = {
  answer: 0,
  need: 0,
  cleared: 0,
  first: null,
  stars: 0,
  colors: ["#ff85b3", "#66b8ff", "#6fd98a", "#ffb45e", "#b58cff"],
  _inited: false,
  _locked: false,

  init() {
    if (this._inited) return;
    this._inited = true;
    this.stars = parseInt(SafeStore.get("kids_count_stars") || "0", 10);
    this.updateStars();
  },

  updateStars() {
    document.getElementById("count-stars").textContent = "⭐ " + this.stars;
  },

  updateProgress() {
    const el = document.getElementById("count-progress");
    if (el) el.textContent = `${this.cleared} / ${this.need}`;
  },

  newRound() {
    this._locked = false;
    this.first = null;
    this.cleared = 0;
    /* 3-year-olds: count 1–5；配额 = 目标数字 */
    this.answer = randInt(1, 5);
    this.need = this.answer;
    const emoji = COUNT_EMOJIS[randInt(0, COUNT_EMOJIS.length - 1)];
    document.getElementById("count-objects").textContent = emoji.repeat(this.answer);
    this.updateProgress();

    const tiles = [];
    for (let i = 0; i < this.need; i++) {
      const color = this.colors[i % this.colors.length];
      tiles.push({ value: this.answer, color });
      tiles.push({ value: this.answer, color });
    }
    const fillTo = Math.max(9, this.need * 2 + 3);
    while (tiles.length < fillTo) {
      const n = randInt(1, 6);
      if (n === this.answer) continue;
      tiles.push({ value: n, color: this.colors[randInt(0, this.colors.length - 1)] });
    }

    const box = document.getElementById("count-choices");
    box.innerHTML = "";
    shuffle(tiles).forEach(tile => {
      const btn = document.createElement("button");
      btn.className = "choice num";
      btn.textContent = tile.value;
      btn.style.background = tile.color;
      btn.dataset.color = tile.color;
      btn.addEventListener("click", () => this.pick(btn, tile));
      box.appendChild(btn);
    });
  },

  pick(btn, tile) {
    if (this._locked) return;
    if (btn.classList.contains("gone")) return;

    if (!this.first) {
      if (tile.value !== this.answer) {
        btn.classList.add("wrong");
        Sound.speak("Try again");
        setTimeout(() => btn.classList.remove("wrong"), 500);
        return;
      }
      this.first = { btn, tile };
      btn.classList.add("selected");
      return;
    }

    if (this.first.btn === btn) {
      btn.classList.remove("selected");
      this.first = null;
      return;
    }

    const a = this.first;
    const match = tile.value === this.answer && a.tile.color === tile.color;
    if (match) {
      a.btn.classList.remove("selected");
      a.btn.classList.add("gone", "correct");
      btn.classList.add("gone", "correct");
      this.first = null;
      this.cleared++;
      this.updateProgress();
      if (this.cleared >= this.need) {
        this._locked = true;
        this.stars++;
        SafeStore.set("kids_count_stars", String(this.stars));
        this.updateStars();
        celebrate(`Great job! ${NUMBERS[this.answer - 1] ? NUMBERS[this.answer - 1].name : this.answer}`);
        setTimeout(() => this.newRound(), 1400);
      }
    } else {
      btn.classList.add("wrong");
      a.btn.classList.remove("selected");
      a.btn.classList.add("wrong");
      Sound.speak("Try again");
      const firstBtn = a.btn;
      this.first = null;
      setTimeout(() => {
        btn.classList.remove("wrong");
        firstBtn.classList.remove("wrong");
      }, 500);
    }
  }
};
