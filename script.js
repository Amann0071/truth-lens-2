// ===================== SETTINGS =====================
// false = demo mode (simple rules that run in the browser)
// true  = call your Python model through app.py
const USE_API = false;
const API_URL = "http://127.0.0.1:5000/predict";

// ===================== ELEMENTS =====================
const form = document.getElementById("checkForm");
const input = document.getElementById("newsInput");
const counter = document.getElementById("counter");
const checkBtn = document.getElementById("checkBtn");
const btnLabel = document.getElementById("btnLabel");
const clearBtn = document.getElementById("clearBtn");
const resultBox = document.getElementById("result");
const verdict = document.getElementById("verdict");
const modeNote = document.getElementById("modeNote");
const scoreText = document.getElementById("scoreText");
const meterFill = document.getElementById("meterFill");
const reasonsList = document.getElementById("reasons");

const SAMPLES = {
  fake: "SHOCKING!!! You won't believe what doctors HATE about this miracle cure!!! Share before they delete it. They don't want you to know the TRUTH!!!",
  real: "The finance ministry said on Monday that retail inflation eased to 4.8 percent in October, according to data released by the statistics office. Officials reported that food prices fell for the second straight month."
};

// ===================== INPUT HELPERS =====================
function countWords(text) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

// The text box starts as one line (like a search bar) and grows as you type.
function autoGrow() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 220) + "px";
}

input.addEventListener("input", () => {
  counter.textContent = countWords(input.value) + " words";
  autoGrow();
});

// Enter submits, Shift+Enter adds a new line.
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

clearBtn.addEventListener("click", () => {
  input.value = "";
  counter.textContent = "0 words";
  autoGrow();
  resultBox.hidden = true;
  input.focus();
});

document.querySelectorAll("[data-sample]").forEach((btn) => {
  btn.addEventListener("click", () => {
    input.value = SAMPLES[btn.dataset.sample];
    input.dispatchEvent(new Event("input"));
    input.focus();
  });
});

// ===================== DEMO MODE (simple rules) =====================
// This is not real AI. It only counts a few warning signs.
const CLICKBAIT = [
  "you won't believe", "shocking", "doctors hate", "miracle",
  "share before", "they don't want you to know", "100% proof",
  "secret", "exposed", "going viral", "must watch", "breaking news", "unbelievable", "scandal", "outrageous", "exclusive", "hidden truth", "mind-blowing", "controversial", "sensational", "eye-opening", "jaw-dropping"
];
const TRUST_WORDS = ["according to", "said", "reported", "officials", "data", "study", "ministry", "statement", "research", "analysis", "survey", "press release", "government", "source", "journal", "publication"];

function demoAnalyze(text) {
  const lower = text.toLowerCase();
  const letters = text.replace(/[^a-zA-Z]/g, "");
  const capsLetters = text.replace(/[^A-Z]/g, "");
  const capsRatio = letters.length ? capsLetters.length / letters.length : 0;
  const exclaims = (text.match(/!/g) || []).length;

  let score = 40; // 0 = looks real, 100 = looks fake
  const reasons = [];

  if (capsRatio > 0.25) {
    score += 18;
    reasons.push("A large share of the letters are capitals (" + Math.round(capsRatio * 100) + "%). Reliable reports rarely shout.");
  }
  if (exclaims >= 3) {
    score += 14;
    reasons.push("It uses many exclamation marks (" + exclaims + "). News reporting is usually written in a calm tone.");
  }

  const hits = CLICKBAIT.filter((p) => lower.includes(p));
  if (hits.length) {
    score += Math.min(30, hits.length * 12);
    reasons.push("Clickbait phrases found: " + hits.map((h) => '"' + h + '"').join(", ") + ".");
  }

  const trust = TRUST_WORDS.filter((p) => lower.includes(p));
  if (trust.length) {
    score -= Math.min(30, trust.length * 10);
    reasons.push("It points to a source or an official statement (" + trust.slice(0, 3).join(", ") + ").");
  } else {
    score += 8;
    reasons.push("No source is mentioned, such as \"according to\" or \"officials said\".");
  }

  if (/\d/.test(text)) {
    score -= 6;
    reasons.push("It includes specific figures, which are common in real reporting.");
  }

  if (countWords(text) < 15) {
    reasons.push("The text is very short, so this estimate is less reliable.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { fakeScore: score, reasons, mode: "Demo mode: simple rules" };
}

// ===================== API MODE (your Python model) =====================
// Expected response from app.py: { "label": "FAKE" | "REAL" | "UNSURE", "confidence": 0.0 to 1.0 }
async function apiAnalyze(text) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error("Server error " + res.status);
  const data = await res.json();

  let fakeScore = 50;
  if (data.label === "FAKE") fakeScore = Math.round(data.confidence * 100);
  if (data.label === "REAL") fakeScore = Math.round((1 - data.confidence) * 100);

  return {
    fakeScore,
    reasons: ["The model classified this text as " + data.label + " with " + Math.round(data.confidence * 100) + "% confidence."],
    mode: "Model mode: Python API"
  };
}

// ===================== SHOW RESULT =====================
function showResult({ fakeScore, reasons, mode }) {
  let level = "caution";
  let label = "Needs caution";
  if (fakeScore < 35) { level = "real"; label = "Likely real"; }
  else if (fakeScore >= 65) { level = "fake"; label = "Likely fake"; }

  verdict.textContent = label;
  verdict.className = "verdict " + level;
  meterFill.className = "meter-fill " + level;
  meterFill.style.width = fakeScore + "%";
  scoreText.textContent = fakeScore + "%";
  modeNote.textContent = mode;

  reasonsList.innerHTML = "";
  reasons.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r; // textContent keeps user text from being treated as HTML
    reasonsList.appendChild(li);
  });

  resultBox.hidden = false;
  resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  checkBtn.disabled = true;
  btnLabel.textContent = "Analysing...";

  try {
    const out = USE_API ? await apiAnalyze(text) : demoAnalyze(text);
    showResult(out);
  } catch (err) {
    showResult({
      fakeScore: 50,
      reasons: ["Could not reach the server. Is app.py running? (" + err.message + ")"],
      mode: "Error"
    });
  } finally {
    checkBtn.disabled = false;
    btnLabel.textContent = "Analyse";
  }
});

// ===================== NAV: highlight the section you are viewing =====================
const navLinks = document.querySelectorAll(".nav-links a");
const sections = ["home", "about", "how", "contact"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if ("IntersectionObserver" in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => spy.observe(s));
}

// ===================== BACKGROUND: drifting dotted waves =====================
(function waves() {
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d");
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Each band is a group of dotted lines that follow a sine curve.
  const bands = [
    { y: 0.66, amp: 0.07, freq: 1.6, speed: 0.00022, lines: 7, spread: 0.012, hue: "60, 200, 255" },
    { y: 0.80, amp: 0.05, freq: 2.2, speed: -0.00018, lines: 6, spread: 0.010, hue: "120, 170, 255" },
    { y: 0.45, amp: 0.09, freq: 1.1, speed: 0.00015, lines: 5, spread: 0.014, hue: "47, 123, 255", edgesOnly: true }
  ];

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const step = 7; // distance between dots in pixels

    bands.forEach((b) => {
      for (let l = 0; l < b.lines; l++) {
        const offset = (l - b.lines / 2) * b.spread * h;
        for (let x = 0; x <= w; x += step) {
          const nx = x / w;
          // edgesOnly bands fade out in the middle so the headline stays clean
          const edge = b.edgesOnly ? Math.pow(Math.abs(nx - 0.5) * 2, 1.6) : 1;
          const phase = nx * Math.PI * b.freq + t * b.speed * 6 + l * 0.35;
          const y = b.y * h + Math.sin(phase) * b.amp * h + offset;
          const glow = 0.25 + 0.75 * Math.abs(Math.sin(phase * 0.5 + l));
          const alpha = glow * edge * 0.7;
          if (alpha < 0.03) continue;
          ctx.fillStyle = "rgba(" + b.hue + "," + alpha.toFixed(3) + ")";
          ctx.fillRect(x, y, 1.6, 1.6);
        }
      }
    });
  }

  function loop(t) {
    draw(t);
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", () => { resize(); if (still) draw(0); });
  if (still) draw(0);
  else requestAnimationFrame(loop);
})();
