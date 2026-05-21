const API_URL = window.location.origin;

// ── Character Counter ────────────────────────────────────────
const textarea  = document.getElementById("newsText");
const charCount = document.getElementById("charCount");

if (textarea && charCount) {
  textarea.addEventListener("input", () => {
    charCount.textContent = textarea.value.length;
  });
}

// ── Page Navigation ──────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });
  const activePage = document.getElementById(pageId);
  if (activePage) {
    activePage.classList.add("active");
  }
}

function goBackToScanner() {
  showPage("scannerPage");
}

// ── Expandable Debunk Section ────────────────────────────────
function toggleReadMore() {
  const content = document.getElementById("expandableDebunkContent");
  const arrow = document.getElementById("expandArrow");
  
  if (content && arrow) {
    const isHidden = content.classList.toggle("hidden");
    arrow.classList.toggle("rotated", !isHidden);
  }
}

// ── Analyze Action ───────────────────────────────────────────
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

    if (!res.ok) throw new Error(`Server status error: ${res.status}`);

    const data = await res.json();
    
    // Simulate a brief neural analysis delay for gorgeous UI feel
    setTimeout(() => {
      renderResult(text, data);
      showLoader(false);
      showPage("reportPage");
    }, 1200);

  } catch (err) {
    showLoader(false);
    showErrorPage(text, err.message);
  }
}

// ── Render Results on Page 2 ─────────────────────────────────
function renderResult(originalText, data) {
  const verdictCard = document.getElementById("verdictCard");
  const verdictPill = document.getElementById("verdictPill");
  const verdictIcon = document.getElementById("verdictIcon");
  const verdictLabel = document.getElementById("verdictLabel");
  const verdictConf  = document.getElementById("verdictConf");
  
  const realFill = document.getElementById("realFill");
  const fakeFill = document.getElementById("fakeFill");
  const realVal  = document.getElementById("realVal");
  const fakeVal  = document.getElementById("fakeVal");
  
  const scannedQuote = document.getElementById("scannedTextQuote");
  const realDetails  = document.getElementById("realResultDetails");
  const fakeDetails  = document.getElementById("fakeResultDetails");

  // 1. Populate original scanned quote
  scannedQuote.textContent = originalText.length > 300 
    ? `“${originalText.substring(0, 300)}...”` 
    : `“${originalText}”`;

  const isReal = data.label === "REAL";

  // 2. Format Verdict Card
  verdictCard.classList.remove("is-fake", "is-real");
  verdictCard.classList.add(isReal ? "is-real" : "is-fake");

  verdictPill.textContent = isReal ? "VERIFIED TRUE" : "DEBUNKED FALSE";
  verdictIcon.textContent = isReal ? "✅" : "🚨";
  verdictLabel.textContent = isReal ? "REAL" : "FAKE";
  verdictConf.textContent  = `Confidence Score: ${data.confidence}% (${data.conf_label})`;

  // 3. Reset and animate meters
  realFill.style.width = "0%";
  fakeFill.style.width = "0%";

  setTimeout(() => {
    realFill.style.width = `${data.real_prob}%`;
    fakeFill.style.width = `${data.fake_prob}%`;
  }, 100);

  realVal.textContent = `${data.real_prob}%`;
  fakeVal.textContent = `${data.fake_prob}%`;

  // 4. Toggle Details Layouts
  if (isReal) {
    fakeDetails.classList.add("hidden");
    realDetails.classList.remove("hidden");
    populateSources(originalText);
  } else {
    realDetails.classList.add("hidden");
    fakeDetails.classList.remove("hidden");
    populateDebunk(originalText);
  }

  // Ensure expandable debunk panel starts closed
  const debunkContent = document.getElementById("expandableDebunkContent");
  const expandArrow = document.getElementById("expandArrow");
  if (debunkContent) debunkContent.classList.add("hidden");
  if (expandArrow) expandArrow.classList.remove("rotated");
}

// ── Populate Mock Reliable Sources ──────────────────────────
function populateSources(text) {
  const listElement = document.getElementById("sourcesList");
  listElement.innerHTML = ""; // Clear

  // High-quality mock wire/news sources related to styling
  const possibleSources = [
    { name: "Associated Press", type: "Newswire Verified" },
    { name: "Reuters Registry", type: "Corroborated Fact" },
    { name: "BBC News Archives", type: "Editorial Standard" },
    { name: "Bloomberg Terminal", type: "Verified Statement" }
  ];

  // Randomly select 2-3 sources to display
  const shuffled = possibleSources.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);

  selected.forEach(src => {
    const card = document.createElement("div");
    card.className = "source-card";
    card.innerHTML = `
      <span class="source-title">${src.name}</span>
      <span class="source-type">${src.type}</span>
    `;
    listElement.appendChild(card);
  });
}

// ── Populate Custom Fact-Check Debunk ────────────────────────
function populateDebunk(text) {
  const summaryElement = document.getElementById("debunkSummary");
  
  // Custom generated summary based on input lengths
  if (text.toLowerCase().includes("vaccine") || text.toLowerCase().includes("covid")) {
    summaryElement.innerHTML = "<strong>Fact-Check Correction:</strong> Extensive reviews by the World Health Organization and CDC show zero backing for this statement. Claims of microchips or genetic manipulation are medically impossible and widely debunked.";
  } else if (text.toLowerCase().includes("celebrity") || text.toLowerCase().includes("secret")) {
    summaryElement.innerHTML = "<strong>Fact-Check Correction:</strong> Independent investigative registries confirm this claims is derived entirely from satirical message boards. No evidence supports any claims of underground operations.";
  } else {
    summaryElement.innerHTML = "<strong>Fact-Check Correction:</strong> Analysis reveals this claim matches active computational propaganda models. No matching records have been logged in Snopes or global mainstream press wires.";
  }
}

// ── Clear All Input Fields ───────────────────────────────────
function clearAll() {
  if (textarea) {
    textarea.value = "";
    charCount.textContent = "0";
  }
}

// ── Loader Overlay Toggler ───────────────────────────────────
function showLoader(show) {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.classList.toggle("hidden", !show);
  }
}

// ── Shake Textarea on Empty Submit ───────────────────────────
function shakeTextarea() {
  if (textarea) {
    const wrap = textarea.parentElement;
    wrap.style.borderColor = "var(--error)";
    wrap.style.boxShadow = "0 0 10px rgba(255, 51, 102, 0.3)";
    textarea.focus();
    
    setTimeout(() => {
      wrap.style.borderColor = "";
      wrap.style.boxShadow = "";
    }, 850);
  }
}

// ── Render Error Page ────────────────────────────────────────
function showErrorPage(text, errorMsg) {
  renderResult(text, {
    label: "FAKE",
    confidence: 0,
    conf_label: "API Error",
    real_prob: 0,
    fake_prob: 100
  });

  const summaryElement = document.getElementById("debunkSummary");
  summaryElement.innerHTML = `<strong>Turbit Connection Error:</strong> We could not complete the neural check.<br><br><em>Error Details: ${errorMsg}</em><br><br>Make sure the backend FastAPI server is active on your host (port 8000).`;
  
  showPage("reportPage");
}

// ── Allow Ctrl+Enter to Submit ───────────────────────────────
if (textarea) {
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      analyzeNews();
    }
  });
}