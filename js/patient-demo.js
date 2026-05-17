const feedImage = document.getElementById("feed-image");
const alertLog = document.getElementById("alert-log");
const bbox1 = document.getElementById("bbox-1");
const bbox2 = document.getElementById("bbox-2");
const detectionBadge = document.getElementById("detection-badge");
const badgeText = document.getElementById("badge-text");
const badgeConfidence = document.getElementById("badge-confidence");
const modelTag = document.getElementById("model-tag");
const fallGallery = document.getElementById("fall-gallery");
const btnNormal = document.getElementById("btn-normal");
const btnFall = document.getElementById("btn-fall");

const SCENES = {
  normal: {
    image: "assets/normal-scene.png",
    model: "YOLOv8 + DeepSORT",
    badge: null,
    subjects: [
      {
        left: "50%",
        top: "36%",
        width: "11%",
        height: "30%",
        label: "ID: P-1042 · Normal",
        alert: false,
      },
      {
        left: "24%",
        top: "40%",
        width: "10%",
        height: "28%",
        label: "ID: P-1087 · Normal",
        alert: false,
      },
    ],
    alertMsg: "All subjects within normal activity thresholds.",
  },
  falls: [
    {
      image: "assets/fall-scene-1.png",
      model: "MobileNetV2 + GRU",
      badge: { text: "FALL DETECTED", confidence: "94%" },
      subjects: [
        {
          left: "36%",
          top: "46%",
          width: "34%",
          height: "30%",
          label: "ID: P-1042 · FALL",
          alert: true,
        },
      ],
      alertMsg:
        "FALL DETECTED — Patient P-1042 · MobileNetV2+GRU confidence 0.94 · SMS sent via Twilio",
    },
    {
      image: "assets/fall-scene-2.png",
      model: "MobileNetV2 + GRU",
      badge: { text: "FALL DETECTED", confidence: "96%" },
      subjects: [
        {
          left: "22%",
          top: "48%",
          width: "28%",
          height: "32%",
          label: "ID: P-1051 · FALL",
          alert: true,
        },
      ],
      alertMsg:
        "FALL DETECTED — Patient P-1051 near walker · confidence 0.96 · SMS alert dispatched",
    },
    {
      image: "assets/fall-scene-3.png",
      model: "MobileNetV2 + GRU",
      badge: { text: "FALL DETECTED", confidence: "97%" },
      subjects: [
        {
          left: "30%",
          top: "44%",
          width: "38%",
          height: "34%",
          label: "ID: P-1038 · FALL",
          alert: true,
        },
      ],
      alertMsg:
        "FALL DETECTED — Patient P-1038 · F1=0.97 model · Caregiver notified via Twilio",
    },
  ],
};

let state = "normal";
let fallIndex = 0;

function timeNow() {
  return new Date().toTimeString().slice(0, 8);
}

function addAlert(msg, critical = false) {
  const item = document.createElement("div");
  item.className = "alert-item" + (critical ? " critical" : "");
  item.innerHTML = `<span class="alert-time">${timeNow()}</span><span class="alert-msg">${msg}</span>`;
  alertLog.prepend(item);
  while (alertLog.children.length > 12) {
    alertLog.removeChild(alertLog.lastChild);
  }
}

function setActive(btn) {
  [btnNormal, btnFall].forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

function setBBox(el, subject, visible) {
  if (!visible) {
    el.style.display = "none";
    return;
  }
  el.style.display = "block";
  el.className = "bbox" + (subject.alert ? " alert" : "");
  el.textContent = subject.label;
  el.style.left = subject.left;
  el.style.top = subject.top;
  el.style.width = subject.width;
  el.style.height = subject.height;
  el.style.transform = "";
}

function applyScene(scene, { silent = false } = {}) {
  feedImage.src = scene.image;
  feedImage.alt = scene.badge
    ? "Fall detected in patient monitoring feed"
    : "Normal patient monitoring feed";
  modelTag.textContent = scene.model;

  if (scene.badge) {
    detectionBadge.classList.remove("hidden");
    badgeText.textContent = scene.badge.text;
    badgeConfidence.textContent = scene.badge.confidence;
  } else {
    detectionBadge.classList.add("hidden");
  }

  const subjects = scene.subjects;
  setBBox(bbox1, subjects[0], !!subjects[0]);
  setBBox(bbox2, subjects[1], !!subjects[1]);

  if (!silent && scene.alertMsg) {
    addAlert(scene.alertMsg, !!scene.badge);
  }
}

function highlightFallThumb(index) {
  document.querySelectorAll(".fall-thumb").forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });
}

function setNormal({ silent = false } = {}) {
  state = "normal";
  fallGallery.classList.remove("visible");
  document.querySelectorAll(".fall-thumb").forEach((b) => b.classList.remove("active"));
  applyScene(SCENES.normal, { silent });
}

function setFall(index = fallIndex, { silent = false } = {}) {
  state = "fall";
  fallIndex = index;
  fallGallery.classList.add("visible");
  highlightFallThumb(fallIndex);
  applyScene(SCENES.falls[fallIndex], { silent });
}

btnNormal.addEventListener("click", () => {
  setActive(btnNormal);
  setNormal();
});

btnFall.addEventListener("click", () => {
  setActive(btnFall);
  setFall();
});

document.querySelectorAll(".fall-thumb").forEach((btn) => {
  btn.addEventListener("click", () => {
    setActive(btnFall);
    const index = Number(btn.dataset.fallIndex);
    setFall(index);
  });
});

setInterval(() => {
  if (state !== "normal") return;
  const j = () => (Math.random() - 0.5) * 2;
  bbox1.style.transform = `translate(${j()}px, ${j()}px)`;
  bbox2.style.transform = `translate(${j()}px, ${j()}px)`;
}, 800);

setNormal({ silent: true });
addAlert("Camera feeds online. YOLOv8 + DeepSORT tracking 2 subjects in Ward 3.");
