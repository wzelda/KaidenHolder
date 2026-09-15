/* ============================================================
   games/abc.js — ABC 字母浏览屏
   init() 只做一次性事件注册；show() 由 app.showScreen() 每次调用，
   避免首次进入屏幕时被触发两次。
   ============================================================ */
const ABCGame = {
  index: 0,
  _inited: false,

  init() {
    if (this._inited) return;
    this._inited = true;

    document.getElementById("letter-prev").addEventListener("click", () => {
      this.index = (this.index - 1 + LETTERS.length) % LETTERS.length;
      this.show(true);
    });
    document.getElementById("letter-next").addEventListener("click", () => {
      this.index = (this.index + 1) % LETTERS.length;
      this.show(true);
    });
    document.getElementById("letter-card").addEventListener("click", () => this.speakLetter());
    document.getElementById("letter-speak").addEventListener("click", () => this.speakLetter());
  },

  show(animate) {
    const L = LETTERS[this.index];
    document.getElementById("letter-upper").textContent = L.upper;
    document.getElementById("letter-lower").textContent = L.lower;
    document.getElementById("letter-emoji").textContent = L.emoji;
    document.getElementById("letter-word").textContent = L.word;
    if (animate) {
      const big = document.getElementById("letter-upper");
      big.classList.remove("bounce");
      void big.offsetWidth; /* restart animation */
      big.classList.add("bounce");
    }
    this.speakLetter();
  },

  speakLetter() {
    const L = LETTERS[this.index];
    Sound.speak(`${L.upper}, ${L.word}`);
  }
};