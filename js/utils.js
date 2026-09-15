/* ============================================================
   utils.js — 通用工具（共享小函数 + 庆祝动画）
   不依赖任何游戏逻辑；SafeStore 可为 Sound / 各游戏复用。
   ============================================================ */

/* ---- 安全的 localStorage（隐身模式 / 受限环境可能抛异常） ---- */
const SafeStore = {
  get(key) {
    try { return localStorage.getItem(key); }
    catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); }
    catch (e) { /* 存储不可用也不应中断游戏 */ }
  }
};

/* ---- 数组 / 随机工具 ---- */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

/* ---- 庆祝动画（答对时播放） ---- */
const CONFETTI = ["🎉", "⭐", "🎈", "🌟", "💖", "🥳"];
let _celebrateTimer = null;

function celebrate(text = "Great job!") {
  const el = document.getElementById("celebrate");
  el.innerHTML = "";
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("i");
    s.textContent = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
    s.style.left = Math.random() * 90 + "%";
    s.style.top = Math.random() * 60 + 20 + "%";
    s.style.animationDelay = Math.random() * 0.4 + "s";
    el.appendChild(s);
  }
  el.classList.remove("hidden");
  /* 清理上一次的隐藏定时器，避免较早的定时器提前隐藏较晚的庆祝 */
  if (_celebrateTimer) clearTimeout(_celebrateTimer);
  _celebrateTimer = setTimeout(() => el.classList.add("hidden"), 1600);
  if (typeof Sound !== "undefined") Sound.speak(text);
}