document.getElementById("year").textContent = new Date().getFullYear();

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

async function loadPost() {
  const container = document.getElementById("post-content");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    container.innerHTML = `<div class="empty-state">&gt; no entry id given.</div>`;
    return;
  }

  try {
    const doc = await db.collection("posts").doc(id).get();
    if (!doc.exists) {
      container.innerHTML = `<div class="empty-state">&gt; entry not found.</div>`;
      return;
    }
    const p = doc.data();
    document.title = `${p.title} — 0xMousv`;

    container.innerHTML = `
      ${p.imageUrl ? `<img class="post-hero-img" src="${escapeHtml(p.imageUrl)}" alt="">` : ""}
      <p class="post-meta">${formatDate(p.createdAt)} &nbsp;|&nbsp; root@v0lt:~#</p>
      <h1 class="section-title" style="font-size:2.6rem; margin-bottom:1rem;">${escapeHtml(p.title)}</h1>
      <div class="post-body">${escapeHtml(p.content)}</div>
    `;
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="empty-state">&gt; error loading entry: ${escapeHtml(err.message)}</div>`;
  }
}
loadPost();
