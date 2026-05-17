const PRODUCTS = {
  cold: [
    { name: "Vitamin C Brightening Serum", icon: "🧴", score: 0.82 },
    { name: "Hyaluronic Acid Moisturizer", icon: "💧", score: 0.79 },
    { name: "Retinol Night Cream", icon: "🌙", score: 0.76 },
    { name: "SPF 50 Face Sunscreen", icon: "☀️", score: 0.74 },
    { name: "Niacinamide Toner", icon: "✨", score: 0.71 },
    { name: "Clay Purifying Mask", icon: "🫧", score: 0.68 },
  ],
  few: [
    { name: "Matte Liquid Lipstick", icon: "💄", score: 0.88 },
    { name: "Waterproof Mascara", icon: "👁️", score: 0.85 },
    { name: "Brow Defining Pencil", icon: "✏️", score: 0.83 },
    { name: "Setting Spray", icon: "💨", score: 0.8 },
    { name: "Color Corrector Palette", icon: "🎨", score: 0.77 },
    { name: "Lip Gloss Set", icon: "💋", score: 0.75 },
  ],
  warm: [
    { name: "Your usual: Gentle Cleanser", icon: "🧼", score: 0.95 },
    { name: "Your usual: Daily Moisturizer", icon: "🧴", score: 0.93 },
    { name: "Coconut Hair Oil", icon: "🥥", score: 0.89 },
    { name: "Argan Shampoo", icon: "🌿", score: 0.87 },
    { name: "Heat Protectant Spray", icon: "🔥", score: 0.84 },
    { name: "Dry Shampoo", icon: "💨", score: 0.81 },
  ],
};

const HISTORY = {
  u1: ["Gentle Cleanser", "Hyaluronic Serum", "Night Cream", "SPF Moisturizer"],
  u2: ["Foundation", "Mascara", "Lipstick", "Setting Powder"],
  u3: ["(new user — minimal history)"],
};

const ABLATION = {
  cold: { id: 0.42, text: 0.58, image: 0.51, full: 0.72 },
  few: { id: 0.55, text: 0.68, image: 0.62, full: 0.81 },
  warm: { id: 0.78, text: 0.72, image: 0.7, full: 0.85 },
};

let currentTier = "cold";
let currentUser = "u1";

const grid = document.getElementById("product-grid");
const historyList = document.getElementById("history-list");
const chartBars = document.getElementById("chart-bars");
const userSelect = document.getElementById("user-select");

function renderProducts() {
  const items = PRODUCTS[currentTier];
  const boost = currentUser === "u3" && currentTier === "cold" ? 0.05 : 0;

  grid.innerHTML = items
    .map(
      (p, i) => `
    <article class="product-card">
      <div class="rank">#${i + 1} ranked</div>
      <div class="product-icon">${p.icon}</div>
      <h4>${p.name}</h4>
      <div class="score">Score: ${(p.score + boost).toFixed(2)} · MultiModal-TiSASRec</div>
    </article>`
    )
    .join("");
}

function renderHistory() {
  historyList.innerHTML = HISTORY[currentUser]
    .map((h) => `<li>${h}</li>`)
    .join("");
}

function renderChart() {
  const data = ABLATION[currentTier];
  const labels = [
    ["ID only", data.id],
    ["Text+ID", data.text],
    ["Image+ID", data.image],
    ["Full fusion", data.full],
  ];
  const max = Math.max(...labels.map((l) => l[1]));

  chartBars.innerHTML = labels
    .map(
      ([label, val]) => `
    <div class="chart-bar-group">
      <span class="chart-value">${val.toFixed(2)}</span>
      <div class="chart-bar" style="height:${(val / max) * 120}px"></div>
      <span class="chart-label">${label}</span>
    </div>`
    )
    .join("");
}

document.querySelectorAll(".tier-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tier-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentTier = tab.dataset.tier;
    renderProducts();
    renderChart();
  });
});

userSelect.addEventListener("change", () => {
  currentUser = userSelect.value;
  renderHistory();
  renderProducts();
});

renderProducts();
renderHistory();
renderChart();
