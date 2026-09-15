/* ============================================================
   games/find.js — Find the Letter 问答游戏
   用 _locked 防止答对后 1.4s 内的连点导致重复加星 / 多个开局定时器。
   ============================================================ */
const FindGame = {
  target: null,
  stars: 0,
  colors: ["#ff85b3", "#66b8ff", "#6fd98a", "#ffb45e", "#b58cff"],
  _inited: false,
  _locked: false,

  init() {
    if (this._inited) return;
    this._inited = true;
    this.stars = parseInt(SafeStore.get("kids_find_stars") || "0", 10);
    this.updateStars();
  },

  updateStars() {
    document.getElementById("find-stars").textContent = "⭐ " + this.stars;
  },

  newRound() {
    this._locked = false;
    /* pick target + 2 distractors */
    const idx = randInt(0, LETTERS.length - 1);
    this.target = LETTERS[idx];
    const pool = shuffle(LETTERS.filter(l => l.upper !== this.target.upper)).slice(0, 2);
    const choices = shuffle([this.target, ...pool]);

    document.getElementById("find-target").textContent = this.target.upper;

    const box = document.getElementById("find-choices");
    box.innerHTML = "";
    choices.forEach((L, i) => {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.textContent = L.upper;
      btn.style.background = this.colors[i % this.colors.length];
      btn.addEventListener("click", () => this.pick(btn, L));
      box.appendChild(btn);
    });

    Sound.speak(`Find ${this.target.upper}`);
  },

  pick(btn, L) {
    if (this._locked) return; /* 已答对，等待下一题期间忽略点击 */
    if (L.upper === this.target.upper) {
      this._locked = true;
      btn.classList.add("correct");
      this.stars++;
      SafeStore.set("kids_find_stars", String(this.stars));
      this.updateStars();
      celebrate("Great job! You found " + L.upper);
      setTimeout(() => this.newRound(), 1400);
    } else {
      /* no punishment — just a gentle hint */
      btn.classList.add("wrong");
      Sound.speak("Try again");
      setTimeout(() => btn.classList.remove("wrong"), 500);
    }
  }
};