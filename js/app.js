/* ============================================================
   app.js — 入口：屏幕切换 + 模块初始化
   新增一个屏幕：
   1) index.html 加 <section class="screen" id="screen-xxx">
   2) 这里 SCREENS 注册 { id:"xxx", init: fn }
   3) 首页加一个 <button data-nav="xxx">
   ============================================================ */
const SCREENS = {
  letters: () => ABCGame,
  numbers: () => NumbersGame,
  find: () => FindGame,
  count: () => CountGame
};

const inited = {};

function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById("screen-" + name);
  if (!target) return;
  target.classList.add("active");

  /* init 只做一次性的事件注册 / 数据加载（游戏内部不再 show/newRound），
     因此下面每次进入都会恰好展示/开局一次，不会双重触发或双重发音。 */
  if (!inited[name] && SCREENS[name]) {
    SCREENS[name]().init();
    inited[name] = true;
  }
  if (inited[name]) {
    if (name === "letters") ABCGame.show(false);
    else if (name === "numbers") NumbersGame.show(false);
    else if (name === "find") FindGame.newRound();
    else if (name === "count") CountGame.newRound();
  }
  window.scrollTo(0, 0);
}

/* floating decorative bubbles on home */
function makeBubbles() {
  const box = document.querySelector(".home-bubbles");
  const items = ["🍎","⭐","🎈","🌈","🐟","🌸"];
  for (let i = 0; i < 10; i++) {
    const b = document.createElement("i");
    b.textContent = items[i % items.length];
    b.style.left = Math.random() * 92 + "%";
    b.style.animationDelay = (Math.random() * 12) + "s";
    b.style.animationDuration = (10 + Math.random() * 8) + "s";
    box.appendChild(b);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  Sound.init();
  makeBubbles();

  /* all navigation buttons (home menu + 🏠 buttons) */
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.dataset.nav));
  });

  /* sound toggles (one per screen) */
  document.querySelectorAll(".sound-btn").forEach(btn => {
    btn.addEventListener("click", () => Sound.toggle());
  });

  showScreen("home");
});
