const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "hi", name: "Hindi" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "pt", name: "Portuguese" },
];

const SCENARIOS = [
  {
    id: "en-es-sync",
    title: "Engineering standup",
    pair: "English → Spanish",
    room: "room-alpha",
    latencyMs: [340, 410, 380],
    segments: [
      {
        partial: "Good morning everyone, let's…",
        final: "Good morning everyone, let's review the deployment timeline for the translation service.",
        translation:
          "Buenos días a todos, revisemos el cronograma de despliegue del servicio de traducción.",
      },
      {
        partial: "The FastAPI service is…",
        final: "The FastAPI service is handling about two hundred concurrent LiveKit rooms.",
        translation:
          "El servicio FastAPI está manejando unas doscientas salas LiveKit concurrentes.",
      },
      {
        partial: "We should ship the…",
        final: "We should ship the NLLB latency fix before Friday's pilot.",
        translation:
          "Deberíamos lanzar la corrección de latencia NLLB antes del piloto del viernes.",
      },
    ],
    insights: {
      topics: ["Service deployment", "LiveKit scale", "NLLB latency"],
      speakers: 4,
      duration: "12 min",
      actions: [
        "Ship NLLB latency fix by Friday",
        "Share FastAPI load-test results with infra",
        "Enable TTS on Spanish output for pilot users",
      ],
      summary:
        "Team aligned on Friday pilot. Backend stable at ~200 concurrent rooms; translation pipeline is the main optimization target.",
    },
  },
  {
    id: "hi-en-support",
    title: "Customer support call",
    pair: "Hindi → English",
    room: "room-beta",
    latencyMs: [290, 360, 320],
    segments: [
      {
        partial: "नमस्ते, मैं आपकी…",
        final: "नमस्ते, मैं आपकी सदस्यता के बारे में बात करना चाहता हूँ।",
        translation: "Hello, I would like to talk about my subscription.",
      },
      {
        partial: "मेरा ऑडियो…",
        final: "मेरा ऑडियो लाइव ट्रांसलेशन काम नहीं कर रहा है।",
        translation: "My live audio translation is not working.",
      },
      {
        partial: "क्या आप…",
        final: "क्या आप कृपया रूम सेटिंग्स चेक कर सकते हैं?",
        translation: "Could you please check the room settings?",
      },
    ],
    insights: {
      topics: ["Subscription", "Live translation outage", "Room configuration"],
      speakers: 2,
      duration: "6 min",
      actions: [
        "Verify LiveKit room token for user session",
        "Re-test STT language code (hi)",
        "Follow up if translation resumes after room reconnect",
      ],
      summary:
        "Caller reports live translation failure on Hindi input. Support to validate WebRTC room and STT language settings.",
    },
  },
  {
    id: "fr-en-standup",
    title: "Product review",
    pair: "French → English",
    room: "room-gamma",
    latencyMs: [310, 395, 350],
    segments: [
      {
        partial: "Bonjour à tous…",
        final: "Bonjour à tous, nous allons présenter le tableau de bord de traduction.",
        translation: "Hello everyone, we are going to present the translation dashboard.",
      },
      {
        partial: "Les utilisateurs…",
        final: "Les utilisateurs peuvent voir la transcription en temps réel et les alertes.",
        translation: "Users can see real-time transcription and alerts.",
      },
      {
        partial: "La synthèse…",
        final: "La synthèse de réunion sans LLM est prête pour les tests internes.",
        translation: "Non-LLM meeting synthesis is ready for internal testing.",
      },
    ],
    insights: {
      topics: ["Translation dashboard", "Real-time monitoring", "Meeting synthesis"],
      speakers: 3,
      duration: "9 min",
      actions: [
        "Internal QA on insight cards this week",
        "Add feedback widget to dashboard",
        "Document Edge Function deploy steps",
      ],
      summary:
        "Dashboard demo covers live transcript monitoring and extractive meeting insights. Internal QA scheduled before wider rollout.",
    },
  },
];

const $ = (id) => document.getElementById(id);

let playing = false;
let abort = false;
let lastInsights = null;
let segmentCount = 0;

function initTabs() {
  document.querySelectorAll(".demo-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".demo-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById("tab-" + tab.dataset.tab);
      if (panel) panel.classList.add("active");
    });
  });
}

function renderLangChips() {
  $("lang-chips").innerHTML = LANGUAGES.map(
    (l) => `<span class="lang-chip">${l.name}</span>`
  ).join("");
}

function fillScenarioSelect() {
  const sel = $("scenario-select");
  sel.innerHTML = SCENARIOS.map(
    (s, i) => `<option value="${i}">${s.title} · ${s.pair}</option>`
  ).join("");
  updateLangPair();
}

function getScenario() {
  return SCENARIOS[Number($("scenario-select").value) || 0];
}

function updateLangPair() {
  $("lang-pair").innerHTML = `<option>${getScenario().pair}</option>`;
}

function setStatus(el, state, text) {
  el.textContent = text;
  el.className = "status-pill " + state;
}

function resetTranscript() {
  $("partial-text").textContent = "";
  $("final-text").textContent = "";
  $("translation-body").textContent = "";
  $("translation-draft").textContent = "";
  $("translation-placeholder").hidden = false;
  setStatus($("status-livekit"), "idle", "disconnected");
  setStatus($("status-stt"), "idle", "idle");
  setStatus($("status-nllb"), "idle", "idle");
  $("status-latency").textContent = "—";
  segmentCount = 0;
  $("dash-segments").textContent = "0";
}

function renderInsights(scenario) {
  const ins = scenario.insights;
  lastInsights = ins;
  $("insights-panel").innerHTML = `
    <p class="insight-summary">${ins.summary}</p>
    <div class="insight-meta">
      <span>${ins.speakers} speakers</span>
      <span>${ins.duration}</span>
    </div>
    <h4>Topics</h4>
    <ul>${ins.topics.map((t) => `<li>${t}</li>`).join("")}</ul>
    <h4>Action items</h4>
    <ul class="action-list">${ins.actions.map((a) => `<li>${a}</li>`).join("")}</ul>
  `;
}

function updateDashboard(scenario, latMs) {
  $("dash-rooms").textContent = String(10 + Math.floor(Math.random() * 5));
  $("dash-segments").textContent = String(segmentCount * 4 + 12);
  $("dash-latency").textContent = latMs + " ms";
  $("dash-errors").textContent = "0";

  const tbody = $("dash-sessions");
  if (!tbody) return;
  tbody.innerHTML = SCENARIOS.map((s) => {
    const live = s.id === scenario.id;
    return `<tr>
      <td>${s.room}</td>
      <td>${s.pair}</td>
      <td><span class="status-pill ${live ? "live" : "idle"}">${live ? "live" : "idle"}</span></td>
      <td>${live ? latMs + " ms" : "—"}</td>
    </tr>`;
  }).join("");

  const fb = $("dash-feedback");
  if (fb) {
    fb.innerHTML = `
      <li class="feedback-item good">${scenario.pair} segment stored in Supabase</li>
      <li class="feedback-item">Dashboard latency updated · ${latMs} ms</li>
    `;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeText(el, text, speed = 28) {
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    if (abort) return;
    el.textContent += text[i];
    await sleep(speed);
  }
}

async function runScenario() {
  if (playing) return;
  playing = true;
  abort = false;
  $("btn-play").disabled = true;

  const scenario = getScenario();
  resetTranscript();
  lastInsights = null;

  let finalAccum = "";
  let translationAccum = "";

  setStatus($("status-livekit"), "live", "connected");
  setStatus($("status-stt"), "live", "listening");
  await sleep(400);

  for (let i = 0; i < scenario.segments.length; i++) {
    if (abort) break;
    const seg = scenario.segments[i];
    const lat = scenario.latencyMs[i] || 350;
    segmentCount++;

    setStatus($("status-stt"), "live", "transcribing…");
    await typeText($("partial-text"), seg.partial, 22);
    await sleep(300);

    finalAccum += (finalAccum ? " " : "") + seg.final;
    $("partial-text").textContent = "";
    $("final-text").textContent = finalAccum;

    setStatus($("status-nllb"), "live", "translating…");
    await typeText($("translation-draft"), seg.translation, 18);
    $("status-latency").textContent = lat + " ms";
    await sleep(lat * 0.35);

    translationAccum += (translationAccum ? "\n\n" : "") + seg.translation;
    $("translation-body").textContent = translationAccum;
    $("translation-draft").textContent = "";
    $("translation-placeholder").hidden = true;

    setStatus($("status-nllb"), "live", "done");
    updateDashboard(scenario, lat);
    await sleep(500);
  }

  renderInsights(scenario);
  setStatus($("status-stt"), "idle", "idle");
  setStatus($("status-nllb"), "idle", "idle");
  $("btn-play").disabled = false;
  playing = false;
}

function onReset() {
  abort = true;
  playing = false;
  $("btn-play").disabled = false;
  resetTranscript();
  lastInsights = null;
  $("insights-panel").innerHTML =
    '<p class="insights-empty">Run a scenario in the Translation console, then generate a summary here.</p>';
}

function onSummarize() {
  if (lastInsights) {
    renderInsights(getScenario());
    document.querySelector('[data-tab="summary"]')?.click();
    return;
  }
  alert("Run a simulation in the Translation console first.");
}

$("scenario-select").addEventListener("change", () => {
  updateLangPair();
  onReset();
});
$("btn-play").addEventListener("click", () => runScenario().catch(console.error));
$("btn-reset").addEventListener("click", onReset);
$("btn-summarize").addEventListener("click", onSummarize);

initTabs();
renderLangChips();
fillScenarioSelect();
