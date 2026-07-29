const loginScreen = document.getElementById("login-screen");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const postForm = document.getElementById("post-form");
const postStatus = document.getElementById("post-status");
const logoutBtn = document.getElementById("logout-btn");

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

// ---------------- auth state ----------------
auth.onAuthStateChanged((user) => {
  if (user) {
    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadAdminPosts();
  } else {
    loginScreen.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginStatus.textContent = "authenticating...";
  loginStatus.className = "status-msg pending";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginStatus.textContent = "";
  } catch (err) {
    console.error(err);
    loginStatus.textContent = "access denied: " + err.message;
    loginStatus.className = "status-msg err";
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

// ---------------- sidebar nav switching ----------------
const navButtons = document.querySelectorAll(".nav-btn");
const panels = { "panel-compose": document.getElementById("panel-compose"), "panel-entries": document.getElementById("panel-entries") };
navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    Object.entries(panels).forEach(([key, el]) => {
      el.classList.toggle("hidden", key !== btn.dataset.target);
    });
  });
});

// ---------------- dropzone + image preview ----------------
const dropzone = document.getElementById("dropzone");
const imageInput = document.getElementById("image");
const imagePreviewWrap = document.getElementById("image-preview-wrap");
const imagePreview = document.getElementById("image-preview");
const removeImgBtn = document.getElementById("remove-img");

function showImagePreview(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreviewWrap.classList.remove("hidden");
    dropzone.classList.add("hidden");
    updateLivePreviewImage(e.target.result);
  };
  reader.readAsDataURL(file);
}

imageInput.addEventListener("change", () => showImagePreview(imageInput.files[0]));

["dragover", "dragenter"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add("dragover"); })
);
["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove("dragover"); })
);
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) {
    imageInput.files = e.dataTransfer.files;
    showImagePreview(file);
  }
});

removeImgBtn.addEventListener("click", () => {
  imageInput.value = "";
  imagePreviewWrap.classList.add("hidden");
  dropzone.classList.remove("hidden");
  updateLivePreviewImage(null);
});

// ---------------- live preview card ----------------
const titleInput = document.getElementById("title");
const excerptInput = document.getElementById("excerpt");
const previewTitle = document.getElementById("preview-title");
const previewExcerpt = document.getElementById("preview-excerpt");
const previewDate = document.getElementById("preview-date");
const previewThumb = document.getElementById("preview-thumb");
const previewThumbEmpty = document.getElementById("preview-thumb-empty");

titleInput.addEventListener("input", () => { previewTitle.textContent = titleInput.value; });
excerptInput.addEventListener("input", () => { previewExcerpt.textContent = excerptInput.value; });
previewDate.textContent = new Date().toISOString().slice(0, 10);

function updateLivePreviewImage(src) {
  if (src) {
    previewThumb.src = src;
    previewThumb.classList.remove("hidden");
    previewThumbEmpty.classList.add("hidden");
  } else {
    previewThumb.classList.add("hidden");
    previewThumbEmpty.classList.remove("hidden");
  }
}

// ---------------- create post ----------------
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const excerpt = excerptInput.value.trim();
  const content = document.getElementById("content").value.trim();
  const imageFile = imageInput.files[0];

  postStatus.textContent = "publishing...";
  postStatus.className = "status-msg pending";

  try {
    let imageUrl = "";
    if (imageFile) {
      postStatus.textContent = "uploading image...";
      imageUrl = await uploadImageToCloudinary(imageFile);
    }

    await db.collection("posts").add({
      title,
      excerpt,
      content,
      imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    postStatus.textContent = "entry published.";
    postStatus.className = "status-msg ok";
    postForm.reset();
    imagePreviewWrap.classList.add("hidden");
    dropzone.classList.remove("hidden");
    previewTitle.textContent = "";
    previewExcerpt.textContent = "";
    updateLivePreviewImage(null);
    loadAdminPosts();
  } catch (err) {
    console.error(err);
    postStatus.textContent = "error: " + err.message;
    postStatus.className = "status-msg err";
  }
});

// ---------------- list + delete posts ----------------
async function loadAdminPosts() {
  const list = document.getElementById("posts-admin-list");
  try {
    const snap = await db.collection("posts").orderBy("createdAt", "desc").get();

    document.getElementById("stat-total").textContent = snap.size;
    document.getElementById("stat-latest").textContent = snap.empty ? "—" : formatDate(snap.docs[0].data().createdAt);

    if (snap.empty) {
      list.innerHTML = `<p class="status-msg">no entries yet.</p>`;
      return;
    }
    list.innerHTML = "";
    snap.forEach((doc) => {
      const p = doc.data();
      const card = document.createElement("div");
      card.className = "entry-card-admin";
      card.innerHTML = `
        ${p.imageUrl
          ? `<img class="thumb" src="${escapeHtml(p.imageUrl)}" alt="">`
          : `<div class="thumb-empty">&gt;_</div>`}
        <div class="body">
          <strong>${escapeHtml(p.title)}</strong>
          <span>${formatDate(p.createdAt)}</span>
        </div>
        <footer>
          <button data-id="${doc.id}">delete</button>
        </footer>
      `;
      card.querySelector("button").addEventListener("click", () => deletePost(doc.id));
      list.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    list.innerHTML = `<p class="status-msg err">error: ${escapeHtml(err.message)}</p>`;
  }
}

async function deletePost(id) {
  if (!confirm("delete this entry permanently?")) return;
  try {
    await db.collection("posts").doc(id).delete();
    loadAdminPosts();
  } catch (err) {
    alert("error deleting: " + err.message);
  }
}
