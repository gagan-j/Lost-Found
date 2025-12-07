const LS_KEY = "findly-items";
const LS_THEME = "findly-theme";

const masonry = document.getElementById("masonry");
const searchInput = document.getElementById("searchInput");
const addItemBtn = document.getElementById("addItemBtn");
const drawer = document.getElementById("drawer");
const closeDrawer = document.getElementById("closeDrawer");
const cancelForm = document.getElementById("cancelForm");
const addItemForm = document.getElementById("addItemForm");
const cardTemplate = document.getElementById("cardTemplate");
const themeToggle = document.getElementById("themeToggle");
const toggleIcon = themeToggle.querySelector(".toggle-icon");
const statTotal = document.getElementById("statTotal");
const statOpen = document.getElementById("statOpen");
const statClaimed = document.getElementById("statClaimed");

const confirmModal = document.getElementById("confirmModal");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const confirmCancelBtn = document.getElementById("confirmCancel");

let pendingDeleteId = null;

const tones = ["sticky-yellow", "sticky-blue", "sticky-pink", "sticky-mint"];

/* Seed data */
const seed = [
  {
    id: crypto.randomUUID(),
    title: "Black backpack with enamel pins",
    location: "Library, 2nd floor",
    description: "Silver zipper, laptop inside, bottle pocket.",
    contact: "DM @campus-help",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
    claimed: false,
    tone: tones[0],
  },
  {
    id: crypto.randomUUID(),
    title: "AirPods Pro (engraved initials)",
    location: "Café patio",
    description: "Tiny scratch on case; left near the plants.",
    contact: "Text 555-321-8890",
    image: "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=900&q=80",
    claimed: true,
    tone: tones[1],
  },
  {
    id: crypto.randomUUID(),
    title: "Water bottle (gradient lilac)",
    location: "Gym locker room",
    description: "Screw top, small dent near base.",
    contact: "Front desk - ask for Maya",
    image: "https://images.unsplash.com/photo-1597926575434-3b6a7b6b0a6b?auto=format&fit=crop&w=900&q=80",
    claimed: false,
    tone: tones[2],
  },
];

function loadItems() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return seed;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seed;
  } catch {
    return seed;
  }
}
function saveItems(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

let items = loadItems();

/* Theme */
function setToggleIcon(theme) {
  if (theme === "dark") {
    toggleIcon.innerHTML = `<path d="M21 13.5A8.5 8.5 0 0 1 10.5 3 7 7 0 1 0 21 13.5Z" fill="none" stroke="currentColor" stroke-width="2"/>`;
  } else {
    toggleIcon.innerHTML = `
      <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
      <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="12" y1="2" x2="12" y2="5"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="2" y1="12" x2="5" y2="12"/>
        <line x1="19" y1="12" x2="22" y2="12"/>
        <line x1="4.2" y1="4.2" x2="6.4" y2="6.4"/>
        <line x1="17.6" y1="17.6" x2="19.8" y2="19.8"/>
        <line x1="4.2" y1="19.8" x2="6.4" y2="17.6"/>
        <line x1="17.6" y1="6.4" x2="19.8" y2="4.2"/>
      </g>`;
  }
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(LS_THEME, theme);
  setToggleIcon(theme);
}
function initTheme() {
  const storedTheme = localStorage.getItem(LS_THEME) || "light";
  applyTheme(storedTheme);
}

function nextTone() {
  const idx = items.length % tones.length;
  return tones[idx];
}

/* Confirm modal helpers */
function openConfirm(id) {
  pendingDeleteId = id;
  confirmModal.classList.add("open");
}
function closeConfirm() {
  pendingDeleteId = null;
  confirmModal.classList.remove("open");
}
confirmCancelBtn.addEventListener("click", closeConfirm);
confirmDeleteBtn.addEventListener("click", () => {
  if (!pendingDeleteId) return;
  items = items.filter((i) => i.id !== pendingDeleteId);
  saveItems(items);
  closeConfirm();
  renderList();
});
confirmModal.addEventListener("click", (e) => {
  if (e.target === confirmModal) closeConfirm();
});

/* Card rendering */
function renderCard(item) {
  const node = cardTemplate.content.firstElementChild.cloneNode(true);
  node.classList.add(item.tone || tones[0]);
  node.classList.toggle("is-claimed", item.claimed);
  node.classList.toggle("is-unclaimed", !item.claimed);

  const titleEl = node.querySelector(".card-title");
  const badge = node.querySelector(".badge.status");
  const locationEl = node.querySelector(".location");
  const descriptionEl = node.querySelector(".description");
  const contactEl = node.querySelector(".contact");
  const claimBtn = node.querySelector(".claim-btn");
  const deleteBtn = node.querySelector(".delete-btn");
  const imgEl = node.querySelector(".media-img");
  const fallback = node.querySelector(".media-fallback");

  titleEl.textContent = item.title;
  locationEl.textContent = item.location;
  descriptionEl.textContent = item.description || "No description provided.";
  contactEl.textContent = item.contact || "No contact provided.";
  badge.textContent = item.claimed ? "Claimed" : "Unclaimed";
  badge.classList.toggle("claimed", item.claimed);
  badge.classList.toggle("unclaimed", !item.claimed);

  claimBtn.textContent = item.claimed ? "Unclaim" : "Mark claimed";
  claimBtn.addEventListener("click", () => toggleClaim(item.id));

  deleteBtn.addEventListener("click", () => openConfirm(item.id));

  if (item.image) {
    imgEl.src = item.image;
    imgEl.alt = `${item.title} image`;
    imgEl.onload = () => (fallback.style.display = "none");
    imgEl.onerror = () => {
      imgEl.style.display = "none";
      fallback.textContent = "Image unavailable";
    };
  } else {
    imgEl.style.display = "none";
    fallback.textContent = "No image";
  }

  return node;
}

function renderList() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (!query) return true;
    const haystack = [item.title, item.location, item.description, item.contact]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });

  masonry.innerHTML = "";

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No items match.";
    masonry.appendChild(empty);
  } else {
    filtered.forEach((item) => masonry.appendChild(renderCard(item)));
  }

  const total = items.length;
  const claimed = items.filter((i) => i.claimed).length;
  const open = total - claimed;
  statTotal.textContent = total;
  statOpen.textContent = open;
  statClaimed.textContent = claimed;
}

function toggleClaim(id) {
  items = items.map((item) =>
    item.id === id ? { ...item, claimed: !item.claimed } : item
  );
  saveItems(items);
  renderList();
}

/* Drawer controls */
function openDrawer() {
  drawer.classList.add("open");
}
function closeDrawerUI() {
  drawer.classList.remove("open");
  addItemForm.reset();
}

/* Form submission */
addItemForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(addItemForm);
  const title = formData.get("title")?.trim();
  const location = formData.get("location")?.trim();
  if (!title || !location) return;

  const description = formData.get("description")?.trim();
  const contact = formData.get("contact")?.trim();
  const image = formData.get("image")?.trim();

  const newItem = {
    id: crypto.randomUUID(),
    title,
    location,
    description,
    contact,
    image,
    claimed: false,
    tone: nextTone(),
  };
  items = [newItem, ...items];
  saveItems(items);
  closeDrawerUI();
  renderList();
});

/* Events */
searchInput.addEventListener("input", renderList);
addItemBtn.addEventListener("click", openDrawer);
closeDrawer.addEventListener("click", closeDrawerUI);
cancelForm.addEventListener("click", closeDrawerUI);
drawer.addEventListener("click", (e) => { if (e.target === drawer) closeDrawerUI(); });

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
});

/* Init */
initTheme();
renderList();