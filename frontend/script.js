const API_URL = window.location.origin;

// ── Character counter ────────────────────────────────────────
const textarea  = document.getElementById("newsText");
const charCount = document.getElementById("charCount");

textarea.addEventListener("input", () => {
  charCount.textContent = textarea.value.length;
});

// ── Analyze ──────────────────────────────────────────────────
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
    
    // Transition to results page view
    document.getElementById("homeView").classList.add("hidden");
    document.getElementById("resultView").classList.remove("hidden");
  } catch (err) {
    showError(err.message);
    document.getElementById("homeView").classList.add("hidden");
    document.getElementById("resultView").classList.remove("hidden");
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
  const isUnrecognized = data.label === "UNRECOGNIZED";

  // Card styling
  card.classList.remove("is-fake", "is-real", "is-unrecognized");
  if (isUnrecognized) {
    card.classList.add("is-unrecognized");
  } else {
    card.classList.add(isFake ? "is-fake" : "is-real");
  }

  // Icon & label
  if (isUnrecognized) {
    icon.textContent  = "❓";
    label.textContent = "UNKNOWN";
    conf.textContent  = "No recognizable English vocabulary detected.";
  } else {
    icon.textContent  = isFake ? "🚨" : "✅";
    label.textContent = data.label;
    conf.textContent  = `Confidence: ${data.confidence}% (${data.conf_label})`;
  }

  // Bars — reset then animate after a frame
  fakeFill.style.width = "0%";
  realFill.style.width = "0%";

  if (isUnrecognized) {
    fakeVal.textContent = "—";
    realVal.textContent = "—";
  } else {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fakeFill.style.width = `${data.fake_prob}%`;
        realFill.style.width = `${data.real_prob}%`;
      });
    });
    fakeVal.textContent = `${data.fake_prob}%`;
    realVal.textContent = `${data.real_prob}%`;
  }

  // Dynamic Full Coverage Search Link
  const coverageSection = document.getElementById("coverageSection");
  const coverageInfo    = document.getElementById("coverageInfo");
  const coverageLink    = document.getElementById("coverageLink");

  if (coverageSection && coverageInfo && coverageLink) {
    if (isUnrecognized) {
      coverageSection.classList.add("hidden");
    } else {
      const textQuery = textarea.value.trim();
      // Use first sentence or up to 10 words
      let query = textQuery.split(/[.!?]/)[0].trim();
      if (query.split(/\s+/).length > 10) {
        query = query.split(/\s+/).slice(0, 10).join(" ");
      }
      const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}`;
      coverageLink.href = searchUrl;

      if (isFake) {
        coverageInfo.innerHTML = `This statement matches patterns of misinformation. Search for verified reports and debunking coverage on Google News.`;
        coverageLink.textContent = "SEARCH RELATED COVERAGE →";
      } else {
        coverageInfo.innerHTML = `This story shows credible structures. Read the complete articles and press coverage on Google News.`;
        coverageLink.textContent = "READ COMPLETE NEWS →";
      }
      coverageSection.classList.remove("hidden");
    }
  }

  // Scroll result into view on mobile
  section.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ── Clear ────────────────────────────────────────────────────
function clearAll() {
  textarea.value         = "";
  charCount.textContent  = "0";

  const card  = document.getElementById("verdictCard");
  card.classList.remove("is-fake", "is-real", "is-unrecognized");

  document.getElementById("verdictIcon").textContent  = "";
  document.getElementById("verdictLabel").textContent = "—";
  document.getElementById("verdictConf").textContent  = "—";
  document.getElementById("fakeFill").style.width     = "0%";
  document.getElementById("realFill").style.width     = "0%";
  document.getElementById("fakeVal").textContent      = "—";
  document.getElementById("realVal").textContent      = "—";

  const coverageSection = document.getElementById("coverageSection");
  if (coverageSection) {
    coverageSection.classList.add("hidden");
  }
}

// ── Tab Management ───────────────────────────────────────────
const MOCK_NEWS = [
  {
    category: "technology",
    title: "Scientists develop new solid-state battery technology with 10x energy density of current lithium batteries",
    content: "Researchers at the joint energy labs have developed a silicon-based solid-state battery that stores up to 10 times the charge of current lithium-ion cells while maintaining safe operating temperatures."
  },
  {
    category: "world",
    title: "NASA intercepts radio signals originating from nearby Star System Proxima Centauri",
    content: "Reports claim NASA telescopes detected a rhythmic, non-natural frequency signal coming from the habitable zone of Proxima Centauri, sparking debates about possible signs of extraterrestrial civilization."
  },
  {
    category: "finance",
    title: "Global Central Banks coordinate massive policy shift to stabilize cross-border digital assets",
    content: "In an emergency summit, central bank governors announced a unified regulatory framework to manage cross-border digital currencies, aiming to combat inflation and maintain fiat system stability."
  },
  {
    category: "science",
    title: "Genetic breakthrough allows plants to glow in the dark and replace city streetlights",
    content: "A biotechnology startup successfully cross-bred bioluminescent marine algae genes into common maple and oak trees, creating glowing leaves bright enough to illuminate pedestrian pathways."
  },
  {
    category: "space",
    title: "Private space firm successfully launches first manned commercial orbital habitat station",
    content: "A commercial aerospace corporation successfully deployed its manned module in low Earth orbit, accommodating four private researchers in a self-sustaining environment."
  },
  {
    category: "environment",
    title: "Deep ocean kelp forests found absorbing 50 times more carbon dioxide than Amazon rainforest",
    content: "Marine biologists mapping the southern ocean discovered massive underwater kelp forests that sequestrate carbon at a rate far exceeding any known terrestrial ecosystem."
  }
];

function switchTab(tabId) {
  // Hide all views
  document.querySelectorAll(".tab-view").forEach(view => {
    view.classList.add("hidden");
  });
  
  // Deactivate all tab links
  document.querySelectorAll(".tab-link").forEach(link => {
    link.classList.remove("active");
  });
  
  // Show target view
  const targetView = document.getElementById(`${tabId}View`);
  if (targetView) targetView.classList.remove("hidden");
  
  // Activate clicked tab link
  const activeLink = document.querySelector(`.tab-link[onclick="switchTab('${tabId}')"]`);
  if (activeLink) activeLink.classList.add("active");
  
  // Populate Latest News if active
  if (tabId === "news") {
    populateLatestNews();
  }
}

function populateLatestNews() {
  const grid = document.getElementById("newsGrid");
  if (!grid) return;
  
  grid.innerHTML = "";
  MOCK_NEWS.forEach(item => {
    const card = document.createElement("div");
    card.className = "news-card";
    card.onclick = () => sendToScanner(item.title + "\n\n" + item.content);
    
    card.innerHTML = `
      <div>
        <div class="news-card-tag">// ${item.category}</div>
        <h3 class="news-card-title">${item.title}</h3>
      </div>
      <div class="news-card-action">SEND TO SCANNER →</div>
    `;
    grid.appendChild(card);
  });
}

function sendToScanner(text) {
  textarea.value = text;
  charCount.textContent = text.length;
  switchTab("home");
  analyzeNews();
}

function backToHome() {
  document.getElementById("resultView").classList.add("hidden");
  document.getElementById("homeView").classList.remove("hidden");
  clearAll();
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