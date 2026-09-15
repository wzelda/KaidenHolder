/* ============================================================
   games/number.js — 123 数字浏览屏
   init() 只做一次性事件注册；show() 由 app.showScreen() 每次调用。
   ============================================================ */
const NumbersGame = {
  index: 0,
  _inited: false,

  init() {
    if (this._inited) return;
    this._inited = true;

    document.getElementById("number-prev").addEventListener("click", () => {
      this.index = (this.index - 1 + NUMBERS.length) % NUMBERS.length;
      this.show(true);
    });
    document.getElementById("number-next").addEventListener("click", () => {
      this.index = (this.index + 1) % NUMBERS.length;
      this.show(true);
    });
    document.getElementById("number-card").addEventListener("click", () => this.speakNumber());
    document.getElementById("number-speak").addEventListener("click", () => this.speakNumber());
  },

  show(animate) {
    const N = NUMBERS[this.index];
    document.getElementById("number-big").textContent = N.value;
    document.getElementById("number-name").textContent = N.name;
    document.getElementById("number-objects").textContent = N.emoji.repeat(N.value);
    if (animate) {
      const big = document.getElementById("number-big");
      big.classList.remove("bounce");
      void big.offsetWidth;
      big.classList.add("bounce");
    }
    this.speakNumber();
  },

  speakNumber() {
    const N = NUMBERS[this.index];
    Sound.speak(`${N.name}`);
  }
};