const GITHUB_USER = "MLAlchemy-cmd";

async function loadProjects() {
  const res = await fetch("data/projects.json");
  return res.json();
}

function repoUrl(repo) {
  return `https://github.com/${GITHUB_USER}/${repo}`;
}

function renderTags(tags) {
  return tags.map((t) => `<span class="tag">${t}</span>`).join("");
}

function featuredPreview(p) {
  if (p.id === "vision-monitoring") {
    return {
      className: "patient",
      inner: `<div class="monitor-preview">
        <div class="monitor-row"><span><span class="status-dot ok"></span>Patient A</span><span>Normal</span></div>
        <div class="monitor-row"><span><span class="status-dot warn"></span>Patient B</span><span>Tracking</span></div>
      </div>`,
    };
  }
  if (p.id === "voice-translation") {
    return {
      className: "voice",
      inner: `<div class="vt-preview">
        <div class="vt-preview-line"><span>EN → ES</span><span>Live</span></div>
        <div class="vt-preview-line"><span>FastAPI</span><span>●</span></div>
        <div class="vt-preview-line"><span>Supabase</span><span>sync</span></div>
      </div>`,
    };
  }
  return {
    className: "reco",
    inner: `<div class="reco-preview-items">
      <span class="reco-chip">Serum</span><span class="reco-chip">Lipstick</span><span class="reco-chip">Moisturizer</span>
    </div>`,
  };
}

function renderFeatured(projects) {
  const featured = projects.filter((p) => p.featured && p.hasDemo);
  const grid = document.getElementById("featured-grid");
  if (!grid) return;

  grid.innerHTML = featured
    .map((p) => {
      const { className, inner } = featuredPreview(p);
      const githubLink = `<a href="${repoUrl(p.repo)}" target="_blank" rel="noopener" class="btn btn-ghost">GitHub</a>`;

      return `
        <article class="featured-card">
          <div class="featured-preview ${className}">
            <div class="preview-content">${inner}</div>
          </div>
          <div class="featured-body">
            <h3>${p.name}</h3>
            <p>${p.description}</p>
            <div class="tags">${renderTags(p.tags)}</div>
            <div class="featured-actions">
              <a href="${p.demoPath}" class="btn btn-primary">Open demo</a>
              ${githubLink}
            </div>
          </div>
        </article>`;
    })
    .join("");
}

function renderProjects(projects) {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  grid.innerHTML = projects
    .map((p) => {
      const repoLink = p.repo
        ? `<a href="${repoUrl(p.repo)}" target="_blank" rel="noopener">Repository</a>`
        : "";
      const demoLink = p.hasDemo ? `<a href="${p.demoPath}">Live demo</a>` : "";

      return `
      <article class="project-card">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="tags">${renderTags(p.tags.slice(0, 3))}</div>
        <div class="project-meta">
          <span>${p.language || "—"}</span>
        </div>
        <div class="project-links">
          ${repoLink}
          ${demoLink}
        </div>
      </article>`;
    })
    .join("");
}

loadProjects()
  .then((projects) => {
    renderFeatured(projects);
    renderProjects(projects);
  })
  .catch((err) => {
    console.error("Failed to load projects:", err);
  });
