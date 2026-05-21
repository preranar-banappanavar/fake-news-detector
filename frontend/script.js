const API_URL = window.location.origin;

// ── Character counter ────────────────────────────────────────
const textarea  = document.getElementById("newsText");
const charCount = document.getElementById("charCount");

textarea.addEventListener("input", () => {
  charCount.textContent = textarea.value.length;
});

// ── Analyze ──────────────────────────────────────────────────
async function analyzeNews() {
  const text = textarea.value.trim();

  if (!text) {
    shakeTextarea();
    return;
  }

  showLoader(true);

  try {
    const res = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();
    renderResult(data);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoader(false);
  }
}

// ── Render result ────────────────────────────────────────────
function renderResult(data) {
  const section    = document.getElementById("resultSection");
  const card       = document.getElementById("verdictCard");
  const icon       = document.getElementById("verdictIcon");
  const label      = document.getElementById("verdictLabel");
  const conf       = document.getElementById("verdictConf");
  const fakeFill   = document.getElementById("fakeFill");
  const realFill   = document.getElementById("realFill");
  const fakeVal    = document.getElementById("fakeVal");
  const realVal    = document.getElementById("realVal");

  const isFake = data.label === "FAKE";

  // Card styling
  card.classList.remove("is-fake", "is-real");
  card.classList.add(isFake ? "is-fake" : "is-real");

  // Icon & label
  icon.textContent  = isFake ? "🚨" : "✅";
  label.textContent = data.label;
  conf.textContent  = `Confidence: ${data.confidence}% (${data.conf_label})`;

  // Bars — reset then animate after a frame
  fakeFill.style.width = "0%";
  realFill.style.width = "0%";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fakeFill.style.width = `${data.fake_prob}%`;
      realFill.style.width = `${data.real_prob}%`;
    });
  });

  fakeVal.textContent = `${data.fake_prob}%`;
  realVal.textContent = `${data.real_prob}%`;

  // Scroll result into view on mobile
  section.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── Clear ────────────────────────────────────────────────────
function clearAll() {
  textarea.value         = "";
  charCount.textContent  = "0";

  const card  = document.getElementById("verdictCard");
  card.classList.remove("is-fake", "is-real");

  document.getElementById("verdictIcon").textContent  = "";
  document.getElementById("verdictLabel").textContent = "—";
  document.getElementById("verdictConf").textContent  = "—";
  document.getElementById("fakeFill").style.width     = "0%";
  document.getElementById("realFill").style.width     = "0%";
  document.getElementById("fakeVal").textContent      = "—";
  document.getElementById("realVal").textContent      = "—";
}

// ── Loader ───────────────────────────────────────────────────
function showLoader(show) {
  document.getElementById("loader").classList.toggle("hidden", !show);
}

// ── Shake textarea on empty submit ───────────────────────────
function shakeTextarea() {
  textarea.style.borderColor = "var(--red)";
  textarea.style.animation   = "none";
  textarea.focus();
  setTimeout(() => { textarea.style.borderColor = ""; }, 800);
}

// ── Show error in verdict card ───────────────────────────────
function showError(msg) {
  const card  = document.getElementById("verdictCard");
  card.classList.remove("is-fake", "is-real");
  card.classList.add("is-fake");

  document.getElementById("verdictIcon").textContent  = "⚠️";
  document.getElementById("verdictLabel").textContent = "ERROR";
  document.getElementById("verdictConf").textContent  =
    `${msg} — Is the backend running on port 8000?`;
}

// ── Allow Ctrl+Enter to submit ───────────────────────────────
textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    analyzeNews();
  }
});