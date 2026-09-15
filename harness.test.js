/* Temporary headless harness — verifies Bug1 & Bug2 fixes without a browser. */
const fs = require("fs");
const path = require("path");

const classes = new Map();          // id -> Set of classes
const els = new Map();              // id -> element stub
const listeners = new Map();        // id#"click" -> fn
const children = new Map();         // box id -> child stubs

function el(id, cls = "") {
  if (!els.has(id)) {
    classes.set(id, new Set(cls.split(" ").filter(Boolean)));
    els.set(id, {
      id, textContent: "", style: {}, className: "", offsetWidth: 1,
      get classList() {
        const c = classes.get(id);
        return {
          add: v => c.add(v), remove: v => c.delete(v),
          contains: v => c.has(v), toggle: (v, on) => { on ? c.add(v) : c.delete(v); }
        };
      },
      addEventListener: (ev, fn) => listeners.set(id + "#" + ev, fn),
      click: () => { const f = listeners.get(id + "#click"); if (f) f(); },
      appendChild: n => { children.get(id).push(n); return n; },
      set innerHTML(v) { children.set(id, []); },
      get innerHTML() { return ""; }
    });
  }
  if (!children.has(id)) children.set(id, []);
  return els.get(id);
}
const ids = cls => [...els.keys()].filter(k => classes.get(k).has(cls));

["screen-home", "screen-letters", "screen-numbers", "screen-find", "screen-findnum", "screen-count"].forEach(id => el(id, "screen"));
["letter-upper", "letter-lower", "letter-emoji", "letter-word", "letter-prev", "letter-next", "letter-speak", "letter-card",
 "number-big", "number-name", "number-objects", "number-prev", "number-next", "number-speak", "number-card",
 "find-target", "find-choices", "find-stars",
 "findnum-target", "findnum-name", "findnum-choices", "findnum-progress", "findnum-stars",
 "count-objects", "count-choices", "count-progress", "count-stars", "celebrate"].forEach(id => el(id));

function freshNode() {
  const c = new Set();
  const n = {
    textContent: "", style: {}, className: "", offsetWidth: 1, dataset: {},
    classList: {
      add: v => c.add(v), remove: v => c.delete(v), contains: v => c.has(v),
      toggle: (v, on) => { on ? c.add(v) : c.delete(v); }
    },
    addEventListener(ev, fn) { n["#" + ev] = fn; },
    click() { const f = n["#click"]; if (f) f(); },
    set innerHTML(v) { n._kids = []; },
    get innerHTML() { return ""; },
    appendChild(k) { (n._kids = n._kids || []).push(k); }
  };
  return n;
}
const document = {
  getElementById: id => els.get(id),
  createElement: () => freshNode(),
  querySelectorAll: sel => (sel === ".screen") ? ids("screen").map(k => els.get(k)) : [],
  addEventListener() {}
};
const localStorage2 = new Map();
const localStorage = {
  getItem: k => (localStorage2.has(k) ? localStorage2.get(k) : null),
  setItem: (k, v) => { localStorage2.set(k, v); },
  clear: () => { localStorage2.clear(); }
};
let speakCalls = 0;
const speechSynthesis = { cancel() {}, getVoices: () => [], speak() { speakCalls++; } };
const SpeechSynthesisUtterance = function () {};
const window = { scrollTo() {}, speechSynthesis };

const files = [
  "js/data/letters.js", "js/data/numbers.js", "js/utils.js", "js/sound.js",
  "js/games/abc.js", "js/games/number.js", "js/games/find.js", "js/games/findnum.js", "js/games/count.js", "js/app.js"
];
let src = files.map(f => fs.readFileSync(path.join(__dirname, f), "utf8")).join("\n");

/* ————— test body (runs in same scope as the game globals) ————— */
src += "\n;(function(){\n";
src += "var R = []; var ok = (n,c)=>R.push((c?'PASS ':'FAIL ')+n);\n";
src += "var active = ()=>H.ids('screen').filter(k=>H.classes.get(k).has('active')).map(k=>k.split('-').pop());\n";
src += "var boxBtn=(box,m)=>H.children.get(box).find(m);\n";
src += "var speak = () => H.getSpeak(); var speakReset = () => H.resetSpeak();\n";

// wrap rounds counters
src += "FindGame.rounds=0;(function(o){FindGame.newRound=function(){FindGame.rounds++;return o.call(FindGame);};})(FindGame.newRound);\n";
src += "FindNumGame.rounds=0;(function(o){FindNumGame.newRound=function(){FindNumGame.rounds++;return o.call(FindNumGame);};})(FindNumGame.newRound);\n";
src += "CountGame.rounds=0;(function(o){CountGame.newRound=function(){CountGame.rounds++;return o.call(CountGame);};})(CountGame.newRound);\n";

src += "\nSound.init();\n";
src += "ok('SB Sound.speak direct works', (speakReset(), (Sound.speak('dbg'), speak()===1)));\n";
src += "speakReset(); showScreen('letters'); ok('Bug1 letters speaks once on first entry', speak()===1);\n";
src += "var stored0 = localStorage.getItem('kids_sound_enabled'); ok('SB sound key untouched', stored0===null);\n";
src += "speakReset(); showScreen('find'); ok('Bug1 find starts exactly 1 round on first entry', FindGame.rounds===1);\n";
src += "ok('Bug1 find speaks on first entry', speak()>0);\n";
src += "showScreen('home'); ok('Bug1 home active after leaving find', active()[0]==='home');\n";
src += "var r1=FindGame.rounds; showScreen('find'); ok('Bug1 find re-entry starts fresh round', FindGame.rounds===r1+1);\n";

src += "// Bug2: locked prevents double star & double round on rapid click\n";
src += "var bs=FindGame.stars; var b1=FindGame.rounds;\n";
src += "var t=H.els.get('find-target').textContent; var btn=boxBtn('find-choices',b=>b.textContent===t);\n";
src += "btn.click();btn.click();btn.click();\n";
src += "ok('Bug2 find stars +1 exactly (locked)', FindGame.stars===bs+1);\n";
src += "ok('Bug2 find no instant re-round', FindGame.rounds===b1);\n";

src += "showScreen('count');\n";
src += "var kids=H.children.get('count-choices');\n";
src += "ok('count board has at least 9 tiles', kids.length>=9);\n";
src += "var s0=CountGame.stars; var ans=CountGame.answer;\n";
src += "var one=kids.find(b=>parseInt(b.textContent,10)===ans);\n";
src += "one.click();\n";
src += "ok('count one click no star', CountGame.stars===s0 && CountGame._locked===false && CountGame.cleared===0);\n";
src += "one.click();\n";
src += "function matchAllCountPairs(){\n";
src += "  var n=CountGame.need;\n";
src += "  for(var p=0;p<n;p++){\n";
src += "    var live=H.children.get('count-choices').filter(function(b){return parseInt(b.textContent,10)===CountGame.answer && !b.classList.contains('gone');});\n";
src += "    var by={};\n";
src += "    live.forEach(function(b){ var c=b.style.background; (by[c]=by[c]||[]).push(b); });\n";
src += "    var pair=Object.keys(by).map(function(k){return by[k];}).find(function(a){return a.length>=2;});\n";
src += "    pair[0].click(); pair[1].click();\n";
src += "  }\n";
src += "}\n";
src += "matchAllCountPairs();\n";
src += "H.children.get('count-choices').forEach(function(b){b.click();});\n";
src += "ok('Bug2 count stars +1 after all pairs (locked)', CountGame.stars===s0+1 && CountGame.cleared===CountGame.need && CountGame._locked===true);\n";

src += "speakReset(); showScreen('findnum');\n";
src += "ok('findnum starts exactly 1 round on first entry', FindNumGame.rounds===1);\n";
src += "ok('findnum speaks on first entry', speak()>0);\n";
src += "var fnKids=H.children.get('findnum-choices');\n";
src += "ok('findnum board has at least 9 tiles', fnKids.length>=9);\n";
src += "ok('findnum target matches answer', parseInt(H.els.get('findnum-target').textContent,10)===FindNumGame.answer);\n";
src += "var fns0=FindNumGame.stars; var fnAns=FindNumGame.answer;\n";
src += "var fnOne=fnKids.find(b=>parseInt(b.textContent,10)===fnAns);\n";
src += "fnOne.click();\n";
src += "ok('findnum one click no star', FindNumGame.stars===fns0 && FindNumGame._locked===false && FindNumGame.cleared===0);\n";
src += "fnOne.click();\n";
src += "function matchAllFindNumPairs(){\n";
src += "  var n=FindNumGame.need;\n";
src += "  for(var p=0;p<n;p++){\n";
src += "    var live=H.children.get('findnum-choices').filter(function(b){return parseInt(b.textContent,10)===FindNumGame.answer && !b.classList.contains('gone');});\n";
src += "    var by={};\n";
src += "    live.forEach(function(b){ var c=b.style.background; (by[c]=by[c]||[]).push(b); });\n";
src += "    var pair=Object.keys(by).map(function(k){return by[k];}).find(function(a){return a.length>=2;});\n";
src += "    pair[0].click(); pair[1].click();\n";
src += "  }\n";
src += "}\n";
src += "matchAllFindNumPairs();\n";
src += "H.children.get('findnum-choices').forEach(function(b){b.click();});\n";
src += "ok('findnum stars +1 after all pairs (locked)', FindNumGame.stars===fns0+1 && FindNumGame.cleared===FindNumGame.need && FindNumGame._locked===true);\n";

src += "showScreen('find');\n";
src += "var t2=H.els.get('find-target').textContent; var wbtn=boxBtn('find-choices',b=>b.textContent!==t2);\n";
src += "var sb=FindGame.stars; if(wbtn){wbtn.click();wbtn.click();}\n";
src += "ok('Bug2 find wrong click adds no star', FindGame.stars===sb);\n";

src += "globalThis.__out={results:R};\n";
src += "})();\n";

const H = { els, classes, children, ids, getSpeak: () => speakCalls, resetSpeak: () => { speakCalls = 0; } };
try {
  new Function("document", "localStorage", "window", "speechSynthesis", "SpeechSynthesisUtterance", "H", src)(
    document, localStorage, window, speechSynthesis, SpeechSynthesisUtterance, H
  );
} catch (e) {
  console.error("HARNESS CRASH:", e.message);
  process.exit(1);
}

const out = globalThis.__out || { results: ["NO RESULT"] };
console.log(out.results.join("\n"));
const failed = out.results.filter(r => r.startsWith("FAIL"));
console.log(failed.length ? "RESULT: FAILED" : "RESULT: ALLPASSED");
process.exit(failed.length ? 1 : 0);