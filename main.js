// ==========================================================================
// Boot sequence
// ==========================================================================
const bootLines = [
  "initializing Cyb3r_Ph4nt0ms terminal...",
  "loading kernel modules [ok]",
  "mounting /dev/identity ......... [ok]",
  "decrypting profile ............. [ok]",
  "establishing secure session ..... [ok]",
  "",
  "welcome back, root."
];

function runBoot() {
  const el = document.getElementById("boot-text");
  const boot = document.getElementById("boot");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    boot.remove();
    return;
  }

  let i = 0;
  function nextLine() {
    if (i >= bootLines.length) {
      setTimeout(() => {
        boot.style.transition = "opacity .6s ease";
        boot.style.opacity = "0";
        setTimeout(() => boot.remove(), 650);
      }, 350);
      return;
    }
    el.textContent += (i > 0 ? "\n" : "") + bootLines[i];
    i++;
    setTimeout(nextLine, 220);
  }
  nextLine();
}
runBoot();

// ==========================================================================
// Typed bio
// ==========================================================================
const bioText = "pentester based in the terminal. i find the holes before they do.\nwelcome to the log.";

function typeBio() {
  const el = document.getElementById("typed-bio");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) { el.textContent = bioText; return; }

  let i = 0;
  function step() {
    if (i <= bioText.length) {
      el.textContent = bioText.slice(0, i);
      i++;
      setTimeout(step, 28);
    }
  }
  step();
}
setTimeout(typeBio, 1600);

document.getElementById("year").textContent = new Date().getFullYear();

// ==========================================================================
// Load blog posts from Firestore
// ==========================================================================
function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toISOString().slice(0, 10);
}

async function loadPosts() {
  const list = document.getElementById("posts-list");
  try {
    const snap = await db.collection("posts").orderBy("createdAt", "desc").get();

    if (snap.empty) {
      list.innerHTML = `<div class="empty-state">&gt; no entries yet. check back soon.</div>`;
      return;
    }

    list.innerHTML = "";
    let idx = snap.size;
    snap.forEach((doc) => {
      const p = doc.data();
      const entryId = String(idx).padStart(3, "0");
      idx--;

      const card = document.createElement("a");
      card.href = `post.html?id=${doc.id}`;
      card.className = "log-entry";
      card.style.textDecoration = "none";
      card.style.display = "block";

      card.innerHTML = `
        ${p.imageUrl ? `<img class="thumb" src="${escapeHtml(p.imageUrl)}" alt="">` : ""}
        <div class="meta">
          <span class="id">#${entryId}</span>
          <span>${formatDate(p.createdAt)}</span>
        </div>
        <h3>${escapeHtml(p.title)}</h3>
        <p>${escapeHtml(p.excerpt || "")}</p>
      `;
      list.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = `<div class="empty-state">&gt; error loading log: ${escapeHtml(err.message)}</div>`;
  }
}
loadPosts();
