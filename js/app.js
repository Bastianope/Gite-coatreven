/* ═══════════════════════════════════════════════════════
   GÎTE DE COATRÉVEN — app.js
   ═══════════════════════════════════════════════════════ */

// ── CONFIG ──
const CONFIG = {
  ADMIN_PWD: "Kermest",
  SUPABASE_URL: "https://ikiuywbosyvcvaaifxfo.supabase.co",
  SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlraXV5d2Jvc3l2Y3ZhYWlmeGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0ODUxMTMsImV4cCI6MjA5NzA2MTExM30.CWp26i_5xM9U0NZIcKkj9sf8iILId6v5v5xswUe_bOg",
EMAILJS_SERVICE: "service_7h8pr49",
EMAILJS_TEMPLATE: "template_zz0n9ib",
EMAILJS_PUBLIC_KEY: "Gp27H9TU7vwkSXeEz",
  OWNER_EMAIL: "herve.peillet@orange.fr",
};

// ── DONNÉES PAR DÉFAUT ──
const DEFAULT_PRICES = [
  { id: "basse",    label: "Basse saison",     detail: "Oct – Avr",          amount: 60, unit: "nuit" },
  { id: "moyenne",  label: "Moyenne saison",   detail: "Mai – Juin & Sept",  amount: 75, unit: "nuit" },
  { id: "haute",    label: "Haute saison",     detail: "Juil – Août",        amount: 95, unit: "nuit" },
  { id: "semaine",  label: "Semaine complète", detail: "7 nuits consécutives", amount: 490, unit: "semaine" },
];

const DEFAULT_BOOKINGS = [
  { id: 1, start: "2025-07-14", end: "2025-07-28", note: "" },
  { id: 2, start: "2025-08-05", end: "2025-08-19", note: "" },
];

// ── ÉTAT GLOBAL ──
let state = {
  prices: [],
  bookings: [],
  contacts: [],
};

let supabaseClient = null;
let calBase = new Date();
calBase.setDate(1);

// ══════════════════════════════════════════════
// SUPABASE
// ══════════════════════════════════════════════
async function initSupabase() {
  if (typeof window.supabase === "undefined") return;
  supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
  await loadFromSupabase();
}

async function loadFromSupabase() {
  if (!supabaseClient) { loadFromLocal(); return; }
  try {
    const [{ data: prices }, { data: bookings }, { data: contacts }] = await Promise.all([
      supabaseClient.from("prices").select("*").order("id"),
      supabaseClient.from("bookings").select("*").order("start"),
      supabaseClient.from("contacts").select("*").order("created_at", { ascending: false }),
    ]);
    state.prices   = prices?.length   ? prices   : DEFAULT_PRICES;
    state.bookings = bookings || [];
    state.contacts = contacts || [];
  } catch (e) {
    console.warn("Supabase non connecté, mode local.", e);
    loadFromLocal();
  }
  render();
}

function loadFromLocal() {
  state.prices   = JSON.parse(localStorage.getItem("gite_prices")   || JSON.stringify(DEFAULT_PRICES));
  state.bookings = JSON.parse(localStorage.getItem("gite_bookings") || JSON.stringify(DEFAULT_BOOKINGS));
  state.contacts = JSON.parse(localStorage.getItem("gite_contacts") || "[]");
  render();
}

async function saveToSupabase() {
  if (!supabaseClient) { saveToLocal(); return; }
  try {
    await supabaseClient.from("prices").upsert(state.prices);
    const cleanBookings = state.bookings.map(({ id, ...rest }) =>
      id && typeof id === "number" && id < 1e9 ? { id, ...rest } : rest
    );
    await supabaseClient.from("bookings").upsert(cleanBookings);
    saveToLocal();
  } catch (e) {
    console.error("Erreur sauvegarde Supabase", e);
    saveToLocal();
  }
}

function saveToLocal() {
  localStorage.setItem("gite_prices",   JSON.stringify(state.prices));
  localStorage.setItem("gite_bookings", JSON.stringify(state.bookings));
  localStorage.setItem("gite_contacts", JSON.stringify(state.contacts));
}

// ══════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════
function render() {
  renderPrices();
  renderCalendar();
}

// ══════════════════════════════════════════════
// CALENDRIER
// ══════════════════════════════════════════════
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin",
                   "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

function isBooked(date) {
  const d = date.toISOString().slice(0, 10);
  return state.bookings.some(b => d >= b.start && d <= b.end);
}

function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const days  = new Date(year, month + 1, 0).getDate();
  let dow = first.getDay(); if (dow === 0) dow = 7; dow--;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let html = `<div class="cal-month"><h3>${MONTHS_FR[month]} ${year}</h3>
    <div class="cal-days-grid">`;
  DAYS_FR.forEach(d => html += `<div class="cal-day-hdr">${d}</div>`);
  for (let e = 0; e < dow; e++) html += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= days; d++) {
    const dt = new Date(year, month, d);
    let cls = "cal-day";
    if (dt < today)       cls += " past";
    else if (isBooked(dt)) cls += " booked";
    else                   cls += " available";
    if (dt.toDateString() === today.toDateString()) cls += " today";
    html += `<div class="${cls}">${d}</div>`;
  }
  html += `</div></div>`;
  return html;
}

function renderCalendar() {
  const y = calBase.getFullYear(), m = calBase.getMonth();
  const ny = m === 11 ? y + 1 : y, nm = (m + 1) % 12;
  document.getElementById("calTitle").textContent =
    `${MONTHS_FR[m]} ${y}  –  ${MONTHS_FR[nm]} ${ny}`;
  document.getElementById("calMonths").innerHTML = buildMonth(y, m) + buildMonth(ny, nm);
}

function prevMonth() { calBase.setMonth(calBase.getMonth() - 1); renderCalendar(); }
function nextMonth() { calBase.setMonth(calBase.getMonth() + 1); renderCalendar(); }

// ══════════════════════════════════════════════
// TARIFS
// ══════════════════════════════════════════════
function renderPrices() {
  document.getElementById("priceRows").innerHTML = state.prices.map(p => `
    <div class="price-row">
      <div class="price-label">${p.label}<small>${p.detail}</small></div>
      <div class="price-amount">${p.amount}€ <span>/ ${p.unit}</span></div>
    </div>
  `).join("");
}

// ══════════════════════════════════════════════
// LIGHTBOX
// ══════════════════════════════════════════════
const PHOTOS = [
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/ae/a8/80/aea8804d6ba7e8e9c314a1c50174798f318c23b0.jpg?rule=ad-large",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/2b/83/ae/2b83ae8b60dff71fbf25d4c2f74bbe298ad45a12.jpg?rule=ad-large",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/18/36/5a/18365a9d398ba4c112e63419b4f6154942ddc05f.jpg?rule=ad-large",
 "https://raw.githubusercontent.com/Bastianope/Gite-coatreven/main/barbecue.png",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/d0/74/d4/d074d42607d49432dc4c58aa08f9eb188b8a39e1.jpg?rule=ad-large",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/51/66/e7/5166e7f3d7917eb6640f18e0d45b01f70f91654f.jpg?rule=ad-large",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/09/69/17/0969178a9b5a6301ea3e154574000fc622ae4e71.jpg?rule=ad-large",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/f8/89/4c/f8894c538262bb1e4b8305b600feebe94f8802de.jpg?rule=ad-large",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/12/32/f8/1232f8fbf834df6d8d0d30ebf00b47b2af2192f6.jpg?rule=ad-large",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/84/df/6d/84df6d9c5293e288ba5f4c419cf646c55491d7a9.jpg?rule=ad-large",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/ac/48/51/ac48513ff6995d5020801c28acbd6834bcb33e38.jpg?rule=ad-large",
  "https://img.leboncoin.fr/api/v1/lbcpb1/images/7b/8f/50/7b8f50773f82690581a81ecfc980fe150c7b5496.jpg?rule=ad-large",
];
let lbIdx = 0;

function openLightbox(i) {
  lbIdx = i;
  document.getElementById("lbImg").src = PHOTOS[i];
  document.getElementById("lbCounter").textContent = `${i + 1} / ${PHOTOS.length}`;
  document.getElementById("lightbox").classList.add("open");
}
function closeLightbox() { document.getElementById("lightbox").classList.remove("open"); }
function lbNav(d) {
  lbIdx = (lbIdx + d + PHOTOS.length) % PHOTOS.length;
  document.getElementById("lbImg").src = PHOTOS[lbIdx];
  document.getElementById("lbCounter").textContent = `${lbIdx + 1} / ${PHOTOS.length}`;
}
document.addEventListener("keydown", e => {
  if (!document.getElementById("lightbox").classList.contains("open")) return;
  if (e.key === "ArrowRight") lbNav(1);
  if (e.key === "ArrowLeft")  lbNav(-1);
  if (e.key === "Escape")     closeLightbox();
});

// ══════════════════════════════════════════════
// CARTE LEAFLET
// ══════════════════════════════════════════════
function initMap() {
  if (typeof L === "undefined") return;

  const map = L.map("map").setView([48.755, -3.32], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(map);

  // Icône personnalisée gîte
  const giteIcon = L.divIcon({
    className: "",
    html: `<div style="background:#085041;color:white;border-radius:50% 50% 50% 0;
      width:36px;height:36px;display:flex;align-items:center;justify-content:center;
      font-size:18px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      transform:rotate(-45deg)"><span style="transform:rotate(45deg)">🏡</span></div>`,
    iconSize: [36, 36], iconAnchor: [18, 36],
  });

  const poiIcon = (emoji) => L.divIcon({
    className: "",
    html: `<div style="background:white;border-radius:50%;width:32px;height:32px;
      display:flex;align-items:center;justify-content:center;font-size:16px;
      border:2px solid #1D9E75;box-shadow:0 1px 6px rgba(0,0,0,0.2)">${emoji}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16],
  });

  // Gîte
  L.marker([48.755, -3.32], { icon: giteIcon })
    .addTo(map)
    .bindPopup(`<strong>Gîte du Trégor</strong><br>Coatréven, 22450<br>Spa & Sauna privatifs`)
    .openPopup();

  // Points d'intérêt
  const pois = [
    { lat: 48.818, lng: -3.447, emoji: "🏖", name: "Perros-Guirec", desc: "Port & plages" },
    { lat: 48.845, lng: -3.465, emoji: "🪨", name: "Ploumanach", desc: "Côte de Granit Rose" },
    { lat: 48.838, lng: -3.434, emoji: "🏖", name: "Plage de Trestraou", desc: "Grande plage de sable fin" },
    { lat: 48.891, lng: -3.435, emoji: "🐦", name: "Sept-Îles", desc: "Réserve ornithologique" },
    { lat: 48.763, lng: -3.231, emoji: "⛵", name: "Tréguier", desc: "Cathédrale & vieille ville" },
    { lat: 48.765, lng: -3.454, emoji: "🏰", name: "Château de La Roche-Jagu", desc: "Château médiéval XVe s." },
    { lat: 48.731, lng: -3.458, emoji: "🌲", name: "Forêt de Beffou", desc: "Randonnées & VTT" },
    { lat: 48.763, lng: -3.457, emoji: "🛶", name: "Lannion", desc: "Ville & commerces (20 km)" },
  ];

  pois.forEach(p => {
    L.marker([p.lat, p.lng], { icon: poiIcon(p.emoji) })
      .addTo(map)
      .bindPopup(`<strong>${p.name}</strong><br><small>${p.desc}</small>`);
  });
}

// ══════════════════════════════════════════════
// FORMULAIRE + EMAILJS
// ══════════════════════════════════════════════
async function submitForm() {
  const get = id => document.getElementById(id)?.value?.trim() || "";
  const prenom   = get("f_prenom");
  const nom      = get("f_nom");
  const email    = get("f_email");
  const tel      = get("f_tel");
  const arrivee  = get("f_arrivee");
  const depart   = get("f_depart");
  const personnes = get("f_personnes");
  const animaux  = get("f_animaux");
  const message  = get("f_message");

  if (!prenom || !nom || !email || !arrivee || !depart) {
    alert("Merci de remplir les champs obligatoires (*).");
    return;
  }

  const btn = document.getElementById("submitBtn");
  const status = document.getElementById("formStatus");
  btn.disabled = true;
  btn.textContent = "Envoi en cours…";
  status.textContent = "";

  const contact = {
    id: Date.now(),
    prenom, nom, email, tel, arrivee, depart,
    personnes, animaux, message,
    created_at: new Date().toISOString(),
  };

  // Sauvegarde Supabase
  if (supabaseClient) {
    try {
      await supabaseClient.from("contacts").insert([contact]);
    } catch (e) { console.warn("Supabase contact:", e); }
  }
  state.contacts.unshift(contact);
  saveToLocal();

  // EmailJS
  if (typeof emailjs !== "undefined" && CONFIG.EMAILJS_SERVICE !== "VOTRE_SERVICE_ID") {
    try {
      await emailjs.send(CONFIG.EMAILJS_SERVICE, CONFIG.EMAILJS_TEMPLATE, {
        to_email:  CONFIG.OWNER_EMAIL,
        from_name: `${prenom} ${nom}`,
        from_email: email,
        phone: tel || "Non renseigné",
        arrivee, depart, personnes, animaux,
        message: message || "—",
      }, CONFIG.EMAILJS_PUBLIC_KEY);
    } catch (e) { console.warn("EmailJS:", e); }
  }

  document.getElementById("contactForm").style.display = "none";
  document.getElementById("formSuccess").style.display  = "block";
}

// ══════════════════════════════════════════════
// AUTH / ADMIN
// ══════════════════════════════════════════════
function openLogin() {
  document.getElementById("loginPwd").value = "";
  document.getElementById("loginError").style.display = "none";
  document.getElementById("loginOverlay").classList.add("open");
  setTimeout(() => document.getElementById("loginPwd").focus(), 100);
}

function doLogin() {
  if (document.getElementById("loginPwd").value === CONFIG.ADMIN_PWD) {
    document.getElementById("loginOverlay").classList.remove("open");
    openAdmin();
  } else {
    document.getElementById("loginError").style.display = "block";
  }
}

function openAdmin() {
  renderAdminBookings();
  renderAdminPrices();
  renderAdminContacts();
  document.getElementById("adminOverlay").classList.add("open");
}
function closeAdmin() { document.getElementById("adminOverlay").classList.remove("open"); }

function renderAdminBookings() {
  const el = document.getElementById("adminBookingList");
  el.innerHTML = state.bookings.length
    ? state.bookings.map((b, i) => `
        <div class="booking-item">
          <span>📅 <strong>${b.start}</strong> → <strong>${b.end}</strong>${b.note ? "  –  " + b.note : ""}</span>
          <button class="del" onclick="deleteBooking(${i})">✕</button>
        </div>`).join("")
    : `<p style="font-family:sans-serif;font-size:0.83rem;color:#888;padding:0.25rem 0">Aucune réservation enregistrée.</p>`;
}

function deleteBooking(i) {
  state.bookings.splice(i, 1);
  renderAdminBookings();
  renderCalendar();
}

function addBooking() {
  const s = document.getElementById("newStart").value;
  const e = document.getElementById("newEnd").value;
  const n = document.getElementById("newNote").value.trim();
  if (!s || !e) { alert("Saisissez les deux dates."); return; }
  if (s >= e)   { alert("La date de fin doit être après la date de début."); return; }
  state.bookings.push({ id: Date.now(), start: s, end: e, note: n });
  state.bookings.sort((a, b) => a.start.localeCompare(b.start));
  document.getElementById("newStart").value = "";
  document.getElementById("newEnd").value   = "";
  document.getElementById("newNote").value  = "";
  renderAdminBookings();
  renderCalendar();
}

function renderAdminPrices() {
  document.getElementById("adminPriceRows").innerHTML = state.prices.map((p, i) => `
    <div class="price-admin-row">
      <label>${p.label} <small>(${p.detail})</small></label>
      <input type="number" id="ap_${i}" value="${p.amount}" min="0" step="5">
      <span>€ / ${p.unit}</span>
    </div>
  `).join("");
}

function renderAdminContacts() {
  const el = document.getElementById("adminContacts");
  el.innerHTML = state.contacts.length
    ? state.contacts.slice(0, 10).map(c => `
        <div class="contact-item">
          <strong>${c.prenom} ${c.nom}</strong>
          <div class="meta">${c.email}  ${c.tel ? "· " + c.tel : ""}  · Envoyé le ${new Date(c.created_at).toLocaleDateString("fr-FR")}</div>
          📅 ${c.arrivee} → ${c.depart}  ·  ${c.personnes} pers.  ·  Animaux : ${c.animaux}
          ${c.message ? `<br><em style="color:#5F5E5A;font-size:0.8rem">"${c.message}"</em>` : ""}
        </div>`).join("")
    : `<p style="font-family:sans-serif;font-size:0.83rem;color:#888">Aucune demande reçue.</p>`;
}

async function saveAdmin() {
  state.prices.forEach((p, i) => {
    const v = parseInt(document.getElementById(`ap_${i}`)?.value);
    if (!isNaN(v) && v > 0) p.amount = v;
  });
  await saveToSupabase();
  renderPrices();
  renderCalendar();
  closeAdmin();
  alert("✓ Modifications enregistrées !");
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  initSupabase();
  initMap();

  // Fermer overlays au clic sur le fond
  ["loginOverlay", "adminOverlay", "lightbox"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", function (e) {
      if (e.target === this) {
        if (id === "lightbox") closeLightbox();
        else this.classList.remove("open");
      }
    });
  });

  // Login : touche Entrée
  document.getElementById("loginPwd")?.addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  });
});
