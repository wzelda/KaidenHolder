/* ============================================================
   sound.js — 语音（TTS）
   优先使用浏览器内置 Speech Synthesis API；
   设备不支持时优雅降级（静默跳过），绝不中断游戏。

   扩展提示：
   若想接入第三方 TTS（云端 API 等），只需在 speak() 里
   增加一个 provider 分支即可，外部调用方式保持不变。
   ============================================================ */
const Sound = {
  enabled: true,
  enabledKey: "kids_sound_enabled",

  init() {
    const saved = SafeStore.get(this.enabledKey);
    if (saved !== null) this.enabled = saved === "1";
    this.updateButtons();
  },

  toggle() {
    this.enabled = !this.enabled;
    SafeStore.set(this.enabledKey, this.enabled ? "1" : "0");
    if (!this.enabled) this.cancel();
    this.updateButtons();
    if (this.enabled) this.speak("Sound on");
  },

  updateButtons() {
    document.querySelectorAll(".sound-btn").forEach(btn => {
      btn.textContent = this.enabled ? "🔊" : "🔇";
      btn.classList.toggle("muted", !this.enabled);
    });
  },

  /* 可用的 TTS 单例，或 null（设备不支持内置语音） */
  synth() {
    if ("speechSynthesis" in window) return window.speechSynthesis;
    return null;
  },

  cancel() {
    const synth = this.synth();
    if (synth && typeof synth.cancel === "function") {
      try { synth.cancel(); } catch (e) { /* ignore */ }
    }
  },

  hasSupport() {
    return this.synth() !== null && typeof SpeechSynthesisUtterance !== "undefined";
  },

  speak(text, rate = 0.85) {
    if (!this.enabled) return;
    const synth = this.synth();
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;

    try {
      this.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = rate;
      u.pitch = 1.2;
      let voice = null;
      try {
        const voices = synth.getVoices();
        if (voices && voices.find) {
          voice = voices.find(v => v.lang && String(v.lang).startsWith("en"));
        }
      } catch (e) { /* 某些实现 getVoices 不可用，忽略 */ }
      if (voice) u.voice = voice;
      synth.speak(u);
    } catch (e) {
      /* 语音失败不应影响游戏流程 */
    }
  }
};