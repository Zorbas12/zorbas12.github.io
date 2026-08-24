import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set, get, update } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyB08KDzXF6rgvqPJGaaD1SYPycAecaH8Vg",
  authDomain: "zorbas1.firebaseapp.com",
  databaseURL: "https://zorbas1-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "zorbas1",
  storageBucket: "zorbas1.firebasestorage.app",
  messagingSenderId: "26818695331",
  appId: "1:26818695331:web:afafafe4454bacf5d3af16",
  measurementId: "G-WHH6ZTZNP0"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, push, onValue, remove, set, get, update };

/* ──────────────────────────────────────────────────────────────
   Device identification (v2)
   ------------------------------------------------------------
   One single source of truth: `describeDevice()` returns everything
   the app stores about a device. No browser detection at all — the
   same physical machine must resolve to the same entry whether it
   is opened in Chrome, Safari, Firefox or the installed PWA.
   ────────────────────────────────────────────────────────────── */

const uaData = typeof navigator !== "undefined" ? navigator.userAgentData : undefined;

let hintsPromise = null;
function highEntropy() {
  if (hintsPromise) return hintsPromise;
  hintsPromise = (async () => {
    if (!uaData?.getHighEntropyValues) return {};
    try {
      return (await uaData.getHighEntropyValues([
        "model", "platform", "platformVersion", "architecture", "bitness"
      ])) || {};
    } catch { return {}; }
  })();
  return hintsPromise;
}

export function getDeviceType() {
  const ua = navigator.userAgent;
  if (uaData && typeof uaData.mobile === "boolean" && uaData.mobile) {
    return Math.min(screen.width, screen.height) >= 600 ? "Tablet" : "Phone";
  }
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "Tablet";
  if (/Tablet|Nexus 7|SM-T|Kindle|Silk/i.test(ua)) return "Tablet";
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua)) return "Phone";
  if (/Android/i.test(ua)) return "Tablet";
  return "PC";
}

// Human readable OS, with a version whenever one can be trusted.
export async function getOSInfo() {
  const ua = navigator.userAgent;
  const hints = await highEntropy();
  const platform = hints.platform || uaData?.platform || "";
  const version = String(hints.platformVersion || "");
  const major = parseInt(version.split(".")[0], 10);

  if (platform === "Windows" || /Windows/i.test(ua)) {
    if (Number.isFinite(major) && major > 0) return major >= 13 ? "Windows 11" : "Windows 10";
    return /Windows NT 10/i.test(ua) ? "Windows 10/11" : "Windows";
  }
  if (platform === "Android" || /Android/i.test(ua)) {
    if (Number.isFinite(major) && major > 0) return `Android ${major}`;
    const m = ua.match(/Android\s(\d+)/i);
    return m ? `Android ${m[1]}` : "Android";
  }
  if (/iPhone|iPod/.test(ua)) {
    const m = ua.match(/OS (\d+)[._]/);
    return m ? `iOS ${m[1]}` : "iOS";
  }
  if (/iPad/.test(ua)) {
    const m = ua.match(/OS (\d+)[._]/);
    return m ? `iPadOS ${m[1]}` : "iPadOS";
  }
  if (/Macintosh|Mac OS X/.test(ua)) {
    if (navigator.maxTouchPoints > 1) return "iPadOS";
    const m = ua.match(/Mac OS X (\d+)[._](\d+)/);
    return m ? `macOS ${m[1] === "10" ? `10.${m[2]}` : m[1]}` : "macOS";
  }
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown OS";
}

// ── Samsung model code → marketing name ──
// STRICT: only exact, verified code matches. Unknown codes are shown raw
// instead of inventing a device that doesn't exist.
const SAMSUNG_MODELS = {
  "A025":"Galaxy A02s","A035":"Galaxy A03","A045":"Galaxy A04","A055":"Galaxy A05","A065":"Galaxy A06",
  "A135":"Galaxy A13","A136":"Galaxy A13 5G","A145":"Galaxy A14","A146":"Galaxy A14 5G",
  "A155":"Galaxy A15","A156":"Galaxy A15 5G","A166":"Galaxy A16 5G",
  "A235":"Galaxy A23","A236":"Galaxy A23 5G","A245":"Galaxy A24","A256":"Galaxy A25 5G",
  "A325":"Galaxy A32","A326":"Galaxy A32 5G","A336":"Galaxy A33 5G","A346":"Galaxy A34 5G",
  "A356":"Galaxy A35 5G","A366":"Galaxy A36 5G",
  "A426":"Galaxy A42 5G","A515":"Galaxy A51","A516":"Galaxy A51 5G",
  "A525":"Galaxy A52","A526":"Galaxy A52 5G","A528":"Galaxy A52s 5G",
  "A536":"Galaxy A53 5G","A546":"Galaxy A54 5G","A556":"Galaxy A55 5G","A566":"Galaxy A56 5G",
  "A715":"Galaxy A71","A725":"Galaxy A72","A736":"Galaxy A73 5G",
  "S901":"Galaxy S22","S906":"Galaxy S22+","S908":"Galaxy S22 Ultra",
  "S911":"Galaxy S23","S916":"Galaxy S23+","S918":"Galaxy S23 Ultra","S711":"Galaxy S23 FE",
  "S921":"Galaxy S24","S926":"Galaxy S24+","S928":"Galaxy S24 Ultra","S721":"Galaxy S24 FE",
  "S931":"Galaxy S25","S936":"Galaxy S25+","S938":"Galaxy S25 Ultra",
  "F711":"Galaxy Z Flip3","F721":"Galaxy Z Flip4","F731":"Galaxy Z Flip5","F741":"Galaxy Z Flip6",
  "F926":"Galaxy Z Fold3","F936":"Galaxy Z Fold4","F946":"Galaxy Z Fold5","F956":"Galaxy Z Fold6",
  "N975":"Galaxy Note10+","N980":"Galaxy Note20","N986":"Galaxy Note20 Ultra",
  "X200":"Galaxy Tab A8","X205":"Galaxy Tab A8","X210":"Galaxy Tab A9",
  "X700":"Galaxy Tab S8","X706":"Galaxy Tab S8 5G","X800":"Galaxy Tab S8+",
  "X510":"Galaxy Tab S9 FE","X610":"Galaxy Tab S9+","X710":"Galaxy Tab S9","X810":"Galaxy Tab S9 Ultra"
};
function samsungFriendlyName(code) {
  const c = String(code).toUpperCase().replace(/^SM-/, "");
  for (const candidate of [c, c.replace(/[A-Z]+$/, "")]) {
    if (SAMSUNG_MODELS[candidate]) return `Samsung ${SAMSUNG_MODELS[candidate]}`;
  }
  return null;
}

function prettyAndroidModel(raw) {
  const model = String(raw).trim();
  if (!model) return "";
  if (/^SM-/i.test(model)) return samsungFriendlyName(model) || `Samsung ${model.toUpperCase()}`;
  if (/^pixel/i.test(model)) return "Google " + model.replace(/^pixel/i, "Pixel");
  if (/^moto|^motorola/i.test(model)) return model.replace(/^motorola\s*/i, "Motorola ");
  if (/^(mi|redmi|poco)\b/i.test(model)) return "Xiaomi " + model;
  if (/^(cph|pjd)/i.test(model)) return "OPPO " + model.toUpperCase();
  return model;
}

// The exact hardware, when the platform is willing to tell us. Never guesses.
export async function getDeviceModel() {
  const ua = navigator.userAgent;
  const hints = await highEntropy();
  const reported = prettyAndroidModel(hints.model || "");
  if (reported) return reported;

  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iPad";
  if (/Macintosh/.test(ua)) return hints.architecture === "arm" ? "Mac (Apple Silicon)" : "Mac";
  if (/CrOS/.test(ua)) return "Chromebook";

  const sm = ua.match(/SM-([A-Z0-9]+)/i);
  if (sm) return samsungFriendlyName(sm[1]) || `Samsung SM-${sm[1].toUpperCase()}`;
  const px = ua.match(/Pixel\s?(\d+[a-zA-Z]*)/i);
  if (px) return `Google Pixel ${px[1]}`;

  // Legacy Android UA carries the real model before "Build/":
  //   "... (Linux; Android 13; SM-A336B Build/TP1A...)"
  const token = ua.match(/Android[^;)]*;\s*([^;)]+?)(?:\s+Build\/[^;)]*)?\)/);
  if (token) {
    const t = token[1].trim();
    if (t && !/^(K|wv|Mobile|Tablet)$/i.test(t)) return prettyAndroidModel(t);
  }

  if (/Huawei/i.test(ua)) return "Huawei device";
  if (/Xiaomi|Redmi|POCO/i.test(ua)) return "Xiaomi device";
  if (/OnePlus/i.test(ua)) return "OnePlus device";
  if (/Windows/i.test(ua)) return `${await getOSInfo()} PC`;
  if (/Linux/i.test(ua)) return "Linux PC";
  return "";
}

// Screen signature — the cheapest reliable way to tell two identical
// models apart, and a useful label for PCs that report no model at all.
export function getScreenInfo() {
  const w = Math.round(Math.max(screen.width, screen.height));
  const h = Math.round(Math.min(screen.width, screen.height));
  const dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;
  return `${w}x${h}@${dpr}x`;
}

// Friendly auto name: "Windows 11 PC", "Samsung Galaxy A54 5G", "iPhone".
const DEVICE_NAME_KEY = 'zorbas_device_name';
export async function getDeviceName() {
  const model = await getDeviceModel();
  const os = await getOSInfo();
  const type = getDeviceType();

  let out;
  if (model && !/^(Windows|Linux)/.test(model)) out = model;
  else if (type === "PC") out = `${os} PC`;
  else out = `${os} ${type.toLowerCase()}`;

  try { localStorage.setItem(DEVICE_NAME_KEY, out); } catch {}
  return out;
}

// ── Device ID & registration ──
export let deviceId = localStorage.getItem('zorbas_device_id');
if (!deviceId) {
  deviceId = window.crypto?.randomUUID?.() || 'xxxx-xxxx-xxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16));
  localStorage.setItem('zorbas_device_id', deviceId);
}
export const deviceRef = ref(db, `devices/${deviceId}`);

// Stable per-device fingerprint. Browser is deliberately excluded so the
// same machine in a different browser (or the installed app) is one device.
function deviceFingerprint(model, type, os) {
  const parts = [
    model || "", type, os,
    getScreenInfo(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0,
    (navigator.language || "").split("-")[0]
  ].join('|');
  let h = 5381;
  for (let i = 0; i < parts.length; i++) h = ((h * 33) ^ parts.charCodeAt(i)) >>> 0;
  return 'fp' + h.toString(16);
}

// Everything the app knows about this device, in one object.
export async function describeDevice() {
  const [model, os] = await Promise.all([getDeviceModel(), getOSInfo()]);
  const type = getDeviceType();
  const name = await getDeviceName();
  const screenInfo = getScreenInfo();
  return { name, model, os, type, screen: screenInfo, fp: deviceFingerprint(model, type, os) };
}

let registerPromise = null;
export function registerDevice() {
  // Guard against multiple callers on the same page doing duplicate writes.
  registerPromise = registerPromise || registerDeviceOnce();
  return registerPromise;
}

async function registerDeviceOnce() {
  const info = await describeDevice();
  const now = Date.now();

  // Claim the fingerprint — use get+set instead of transaction to avoid permission warnings
  try {
    const idxRef = ref(db, `deviceIndex/${info.fp}`);
    const existing = await get(idxRef);
    const ownerId = existing.val();
    if (ownerId && ownerId !== deviceId) {
      const ownerSnap = await get(ref(db, `devices/${ownerId}`));
      if (ownerSnap.exists()) {
        localStorage.setItem('zorbas_device_id', ownerId);
        location.reload();
        return;
      }
      await set(idxRef, deviceId);
    } else if (!ownerId) {
      await set(idxRef, deviceId);
    }
  } catch {}

  let ip = "";
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
    clearTimeout(timer);
    ip = (await r.json()).ip || "";
  } catch {}

  try {
    const snap = await get(deviceRef);
    const base = {
      type: info.type,
      fp: info.fp,
      lastActive: now
    };

    if (!snap.exists()) {
      // New device — no nickname yet; user will set it via the name popup
      await set(deviceRef, { ...base, role: "user", timestamp: now });
    } else {
      const existing = snap.val();
      // Drop legacy fields that are no longer stored
      const cleanup = {};
      ["name","model","os","screen","ip","browser"].forEach(f => {
        if (existing[f] !== undefined) cleanup[f] = null;
      });
      await update(deviceRef, { ...base, ...cleanup });
    }
  } catch {}
}

// Role helpers — a single place that decides what "staff" means.
export function normaliseRole(device) {
  const raw = device?.role || "user";
  return typeof raw === "string" && raw.startsWith("store:") ? "user" : raw;
}
export function isStaff(device) {
  const role = normaliseRole(device);
  return role === "admin" || role === "owner";
}

// ── Fit the page to the screen (never scrolls) ──
export function fitToScreen() {
  let wrap = document.getElementById('fit-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'fit-wrap';
    const kids = [...document.body.children].filter(
      el => !['SCRIPT', 'LINK', 'STYLE'].includes(el.tagName) &&
            getComputedStyle(el).position !== 'fixed'
    );
    kids.forEach(k => wrap.appendChild(k));
    document.body.insertBefore(wrap, document.body.firstChild);
  }
  const apply = () => {
    wrap.style.transform = 'none';
    wrap.style.marginBottom = '0px';
    const h = wrap.scrollHeight;
    const w = wrap.scrollWidth;
    if (!h || !w) return;
    const top = wrap.getBoundingClientRect().top;
    const scale = Math.min(1, (window.innerHeight - top - 10) / h, (window.innerWidth - 10) / w);
    wrap.style.transform = `scale(${scale})`;
    wrap.style.marginBottom = `${-Math.round(h * (1 - scale))}px`;
  };
  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', () => setTimeout(apply, 150));
  if (window.ResizeObserver) new ResizeObserver(apply).observe(wrap);
  return apply;
}

// ── Translations ──
export const months = {
  EN: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  GR: ["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"]
};

export const translations = {
  EN: {
    name:"Name", month:"Month", day:"Day", shift:"Shift", location:"Location", store:"Store",
    submit:"Submit", adminGui:"Admin GUI", scheduleGui:"Schedule GUI", myHistory:"My History",
    namePlaceholder:"Fill out your name", dayPlaceholder:"Fill out your day",
    selectMonth:"Select month", selectShift:"Select shift", selectLocation:"Select location", selectStore:"Select a store",
    seeSubmissions:"See all submissions", resetSubmissions:"Reset all submissions", seeUsers:"See all users",
    back:"Back", locations:"Select Location", schedule:"Schedule",
    loc_NICOSIA:"Nicosia", loc_LARNACA:"Larnaca", loc_FAMAGUSTA:"Ammochostos", loc_LIMASSOL:"Limassol", loc_PAFOS:"Pafos",
    acceptSubmission:"Accept", declineSubmission:"Decline", noSubmissions:"No pending submissions",
    editSchedule:"Edit Schedule", saveSchedule:"Save Schedule", printSchedule:"Print Schedule",
    devices:"Devices", device:"Device", screen:"Screen", os:"OS", ip:"IP",
    lastActive:"Last active", user:"User", admin:"Admin", owner:"Owner", noDevices:"No devices found",
    addRole:"Add Role", assignRole:"Assign Role", removeRole:"Remove Role",
    confirmMakeOwner:"Make this device an Owner?", switchedToOwner:"Switched to Owner",
    confirmRemoveStoreRole:"Remove this device's store role?", storeRoleRemoved:"Store role removed",
    noHistory:"No submission history", pending:"Pending", accepted:"Accepted", declined:"Declined",
    submitSuccess:"You successfully submitted!", fillAllFields:"Please fill in all fields.",
    acceptedSuccess:"Submission accepted!", declinedSuccess:"Submission declined!",
    resetSuccess:"All submissions have been reset!", scheduleSaved:"Schedule saved!", clearedSuccess:"Submission cleared!",
    selectCellFirst:"Select a cell first",
    alignedLeft:"Aligned left", alignedCenter:"Aligned center", alignedRight:"Aligned right",
    cellColorChanged:"Cell color changed", textColorChanged:"Text color changed",
    searchPlaceholder:"Search",
    off:"off", shift62:"6-2", shift210:"2-10",
    nameLabel:"Name:", monthLabel:"Month:", dayLabel:"Day:", shiftLabel:"Shift:",
    locationLabel:"Location:", storeLabel:"Store:", submittedLabel:"Submitted:", clearBtn:"Clear",
    rowAdded:"Row added", rowRemoved:"Row removed", colAdded:"Column added", colRemoved:"Column removed",
    cannotRemoveLastRow:"Cannot remove last row", cannotRemoveLastCol:"Cannot remove last column",
    cellCleared:"Cell cleared",
    invalidDay:"Please enter a valid day for the selected month.",
    cooldownMsg:"Please wait {timer} minutes before submitting again",
    goHome:"Go Home", noPermission:"You don't have permission to access this page.",
    cancel:"Cancel",
    model:"Model", unknown:"Unknown", nickname:"Name", editNickname:"Edit name", nicknamePlaceholder:"e.g. Raphael's Phone",
    confirmMakeAdmin:"Make this device an Admin?", confirmMakeUser:"Make this device a User?",
    confirmDeleteDevice:"Delete this device?",
    switchedToAdmin:"Switched to Admin", switchedToUser:"Switched to User",
    deviceDeleted:"Device deleted",
    resetAllSubmissions:"Reset all submissions?", delete:"Delete", resetBtn:"Reset", confirm:"Confirm",
    bold:"Bold", italic:"Italic", underline:"Underline",
    alignLeft:"Align Left", alignCenter:"Align Center", alignRight:"Align Right",
    addRow:"Add Row", removeRow:"Remove Row", addColumn:"Add Column", removeColumn:"Remove Column",
    fillColor:"Fill Color", textColor:"Text Color", clearCell:"Clear Cell",
    textStyle:"Text Style", alignment:"Alignment", rowsCols:"Rows & Columns", cell:"Cell", format:"Format"
  },
  GR: {
    name:"Όνομα", month:"Μήνας", day:"Ημέρα", shift:"Βάρδια", location:"Τοποθεσία", store:"Κατάστημα",
    submit:"Υποβολή", adminGui:"Διαχειριστής", scheduleGui:"Πρόγραμμα", myHistory:"Ιστορικό μου",
    namePlaceholder:"Συμπληρώστε το όνομά σας", dayPlaceholder:"Συμπληρώστε τη μέρα σας",
    selectMonth:"Επιλέξτε μήνα", selectShift:"Επιλέξτε βάρδια", selectLocation:"Επιλέξτε τοποθεσία", selectStore:"Επιλέξτε κατάστημα",
    seeSubmissions:"Δείτε όλες τις υποβολές", resetSubmissions:"Επαναφορά όλων των υποβολών", seeUsers:"Δείτε όλους τους χρήστες",
    back:"Πίσω", locations:"Επιλέξτε Τοποθεσία", schedule:"Πρόγραμμα",
    loc_NICOSIA:"Λευκωσία", loc_LARNACA:"Λάρνακα", loc_FAMAGUSTA:"Αμμόχωστος", loc_LIMASSOL:"Λεμεσός", loc_PAFOS:"Πάφος",
    acceptSubmission:"Αποδοχή", declineSubmission:"Απόρριψη", noSubmissions:"Δεν υπάρχουν εκκρεμείς υποβολές",
    editSchedule:"Επεξεργασία Προγράμματος", saveSchedule:"Αποθήκευση Προγράμματος", printSchedule:"Εκτύπωση Προγράμματος",
    devices:"Συσκευές", device:"Συσκευή", screen:"Οθόνη", os:"Λειτουργικό", ip:"IP",
    lastActive:"Τελευταία δραστ.", user:"Χρήστης", admin:"Διαχειριστής", owner:"Ιδιοκτήτης", noDevices:"Δεν βρέθηκαν συσκευές",
    addRole:"Προσθήκη Ρόλου", assignRole:"Ανάθεση Ρόλου", removeRole:"Αφαίρεση Ρόλου",
    confirmMakeOwner:"Να γίνει Ιδιοκτήτης;", switchedToOwner:"Έγινε Ιδιοκτήτης",
    confirmRemoveStoreRole:"Αφαίρεση ρόλου καταστήματος;", storeRoleRemoved:"Ρόλος καταστήματος αφαιρέθηκε",
    noHistory:"Δεν υπάρχει ιστορικό", pending:"Εκκρεμεί", accepted:"Αποδεκτή", declined:"Απορρίφθηκε",
    submitSuccess:"Υποβλήθηκε με επιτυχία!", fillAllFields:"Παρακαλώ συμπληρώστε όλα τα πεδία.",
    acceptedSuccess:"Η υποβολή έγινε αποδεκτή!", declinedSuccess:"Η υποβολή απορρίφθηκε!",
    resetSuccess:"Όλες οι υποβολές διαγράφηκαν!", scheduleSaved:"Το πρόγραμμα αποθηκεύτηκε!", clearedSuccess:"Η υποβολή διαγράφηκε!",
    selectCellFirst:"Επιλέξτε ένα κελί πρώτα",
    alignedLeft:"Στοίχιση αριστερά", alignedCenter:"Στοίχιση στο κέντρο", alignedRight:"Στοίχιση δεξιά",
    cellColorChanged:"Χρώμα κελιού άλλαξε", textColorChanged:"Χρώμα κειμένου άλλαξε",
    searchPlaceholder:"Αναζήτηση",
    off:"off", shift62:"6-2", shift210:"2-10",
    nameLabel:"Όνομα:", monthLabel:"Μήνας:", dayLabel:"Ημέρα:", shiftLabel:"Βάρδια:",
    locationLabel:"Τοποθεσία:", storeLabel:"Κατάστημα:", submittedLabel:"Υποβλήθηκε:", clearBtn:"Διαγραφή",
    rowAdded:"Γραμμή προστέθηκε", rowRemoved:"Γραμμή αφαιρέθηκε", colAdded:"Στήλη προστέθηκε", colRemoved:"Στήλη αφαιρέθηκε",
    model:"Μοντέλο", unknown:"Άγνωστο", nickname:"Όνομα", editNickname:"Επεξεργασία ονόματος", nicknamePlaceholder:"π.χ. Τηλέφωνο Ραφαήλ",
    cannotRemoveLastRow:"Δεν μπορεί να αφαιρεθεί η τελευταία γραμμή", cannotRemoveLastCol:"Δεν μπορεί να αφαιρεθεί η τελευταία στήλη",
    cellCleared:"Κελί καθαρίστηκε",
    invalidDay:"Παρακαλώ εισάγετε έγκυρη μέρα για τον επιλεγμένο μήνα.",
    cooldownMsg:"Παρακαλώ περιμένετε {timer} λεπτά πριν υποβάλετε ξανά",
    goHome:"Αρχική", noPermission:"Δεν έχετε άδεια πρόσβασης σε αυτή τη σελίδα.",
    cancel:"Ακύρωση",
    model:"Μοντέλο", unknown:"Άγνωστο",
    confirmMakeAdmin:"Να γίνει Διαχειριστής;", confirmMakeUser:"Να γίνει Χρήστης;",
    confirmDeleteDevice:"Διαγραφή αυτής της συσκευής;",
    switchedToAdmin:"Έγινε Διαχειριστής", switchedToUser:"Έγινε Χρήστης",
    deviceDeleted:"Η συσκευή διαγράφηκε",
    resetAllSubmissions:"Επαναφορά όλων των υποβολών;", delete:"Διαγραφή", resetBtn:"Επαναφορά", confirm:"Επιβεβαίωση",
    bold:"Έντονα", italic:"Πλάγια", underline:"Υπογράμμιση",
    alignLeft:"Στοίχιση Αριστερά", alignCenter:"Στοίχιση Κέντρο", alignRight:"Στοίχιση Δεξιά",
    addRow:"Προσθήκη Γραμμής", removeRow:"Αφαίρεση Γραμμής", addColumn:"Προσθήκη Στήλης", removeColumn:"Αφαίρεση Στήλης",
    fillColor:"Χρώμα Κελιού", textColor:"Χρώμα Κειμένου", clearCell:"Καθαρισμός Κελιού",
    textStyle:"Στυλ Κειμένου", alignment:"Στοίχιση", rowsCols:"Γραμμές & Στήλες", cell:"Κελί", format:"Μορφοποίηση"
  }
};

export let currentLang = localStorage.getItem('zorbas_lang') || "EN";
export function t(key) { return translations[currentLang][key] || key; }
export function setLang(lang) { currentLang = lang; localStorage.setItem('zorbas_lang', lang); }

export const stores = {
  NICOSIA: {
    EN: ["Coffee Berry","Makariou Unihalls","Trinity Shop","Nicosia Mall","Kokkinotrimithia","Agios Pavlos","Chatziiosif","Pallouriotissa","Aglantzia","Perikleous","Agios Antonios","Lakatamia","Tseriou 2","Makedonitissa 2","Parissinos - Dias","Platy","Agios Dometios","Tseri","Latsia 2","Anthoupoli No2","Ifigeneias 2","Athalassis","Lykavitou"],
    GR: ["Coffee Berry","Makariou Unihalls","Trinity Shop","Nicosia Mall","Κοκκινοτριμιθιά","Άγιος Παύλος","Χατζηιωσηφ","Παλλουριώτισσα","Αγλαντζιά","Περικλέους","Άγιος Αντώνιος","Λακατάμια","Τσερίου 2","Μακεδονίτισσα 2","Παρισσινός - Δίας","Πλατύ","Άγιος Δομέτιος","Τσέρι","Λατσιά 2","Ανθούπολη Νο2","Ιφιγενείας 2","Αθαλάσσης","Λυκαβητού"]
  },
  LARNACA: { EN: ["Timagia","Makariou","Faneromeni","Oroklini","Aradippou","Kiti"], GR: ["Τιμάγια","Μακαρίου","Φανερωμένη","Ορόκλινη","Αραδίππου","Κίτι"] },
  FAMAGUSTA: { EN: ["Paralimni","Protaras"], GR: ["Παραλίμνι","Πρωταράς"] },
  LIMASSOL: {
    EN: ["Paphou","Akadimias","NAAFI","Omirou","Agias Fylaxeos No1","Ypsonas","Leontiou","Polemidia","Agias Fylaxeos No2 (Demstar)","Zakaki"],
    GR: ["Πάφου","Ακαδημίας","NAAFI","Όμηρου","Αγίας Φυλάξεως Νο1","Ύψωνας","Λεοντίου","Πολεμίδια","Αγίας Φυλάξεως Νο2 (Demstar)","Ζακάκι"]
  },
  PAFOS: { EN: ["El. Venizelou","Geroskipou","Ellados","Apostolou Pavlou"], GR: ["Ελ. Βενιζέλου","Γεροσκήπου","Ελλάδος","Αποστόλου Παύλου"] }
};

// ── Popup notification ──
export function showPopup(text, type) {
  const popup = document.createElement("div");
  popup.className = `popup-notification popup-${type}`;
  popup.textContent = text;
  document.body.appendChild(popup);
  setTimeout(() => popup.classList.add("show"), 50);
  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => popup.remove(), 500);
  }, 2500);
}

// ── Confirm modal ──
const confirmModal = document.createElement("div");
confirmModal.style.cssText = `display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.35);align-items:center;justify-content:center;`;
const confirmBox = document.createElement("div");
confirmBox.style.cssText = `background:#fff;border-radius:14px;padding:28px 30px 24px;max-width:300px;width:88%;box-shadow:0 8px 24px rgba(0,0,0,0.15);text-align:center;animation:fadeIn 0.2s ease;`;
const confirmMsgEl = document.createElement("div");
confirmMsgEl.style.cssText = `font-size:16px;font-weight:700;color:#111;margin-bottom:20px;line-height:1.4;`;
confirmBox.appendChild(confirmMsgEl);
const confirmBtnRow = document.createElement("div");
confirmBtnRow.style.cssText = `display:flex;gap:10px;justify-content:center;`;
const confirmNoBtn = document.createElement("button");
confirmNoBtn.textContent = translations[currentLang]["cancel"] || "Cancel";
confirmNoBtn.style.cssText = `flex:1;padding:11px 0;border:none;background:#eee;color:#555;font-size:14px;font-weight:600;border-radius:10px;cursor:pointer;transition:background 0.15s;`;
confirmNoBtn.addEventListener("mouseover", () => confirmNoBtn.style.background = "#e0e0e0");
confirmNoBtn.addEventListener("mouseout", () => confirmNoBtn.style.background = "#eee");
confirmNoBtn.addEventListener("click", () => { confirmModal.style.display = "none"; });
// Keep cancel button text in sync with language switches
let currentConfirmMode = "default";
export function updateConfirmLang() {
  confirmNoBtn.textContent = translations[currentLang]["cancel"] || "Cancel";
  if (confirmModal.style.display === "flex") {
    if (currentConfirmMode === "delete") confirmYesBtn.textContent = translations[currentLang]["delete"] || "Delete";
    else if (currentConfirmMode === "reset") confirmYesBtn.textContent = translations[currentLang]["resetBtn"] || "Reset";
    else confirmYesBtn.textContent = translations[currentLang]["confirm"] || "Confirm";
  }
}
let confirmYesBtn = document.createElement("button");
confirmYesBtn.style.cssText = `flex:1;padding:11px 0;border:none;font-size:14px;font-weight:700;border-radius:10px;cursor:pointer;`;
confirmBtnRow.appendChild(confirmNoBtn);
confirmBtnRow.appendChild(confirmYesBtn);
confirmBox.appendChild(confirmBtnRow);
confirmModal.appendChild(confirmBox);
confirmModal.addEventListener("click", (e) => { if(e.target === confirmModal) confirmModal.style.display = "none"; });

export function initConfirmModal() {
  document.body.appendChild(confirmModal);
}

export function showConfirm(msg, onYes, mode = "default") {
  currentConfirmMode = mode;
  confirmMsgEl.textContent = msg;
  const newYes = document.createElement("button");
  newYes.style.cssText = `flex:1;padding:11px 0;border:none;font-size:14px;font-weight:700;border-radius:10px;cursor:pointer;transition:background 0.15s;`;
  if(mode === "delete") {
    newYes.textContent = translations[currentLang]["delete"] || "Delete"; newYes.style.background = "#ff4c4c"; newYes.style.color = "#fff";
    newYes.addEventListener("mouseover", () => newYes.style.background = "#e03b3b");
    newYes.addEventListener("mouseout", () => newYes.style.background = "#ff4c4c");
  } else if(mode === "reset") {
    newYes.textContent = translations[currentLang]["resetBtn"] || "Reset"; newYes.style.background = "#ff4c4c"; newYes.style.color = "#fff";
    newYes.addEventListener("mouseover", () => newYes.style.background = "#e03b3b");
    newYes.addEventListener("mouseout", () => newYes.style.background = "#ff4c4c");
  } else {
    newYes.textContent = translations[currentLang]["confirm"] || "Confirm"; newYes.style.background = "#E8DA89"; newYes.style.color = "#111";
    newYes.addEventListener("mouseover", () => newYes.style.background = "#d4c15e");
    newYes.addEventListener("mouseout", () => newYes.style.background = "#E8DA89");
  }
  newYes.addEventListener("click", () => { confirmModal.style.display = "none"; onYes(); });
  confirmYesBtn.replaceWith(newYes);
  confirmYesBtn = newYes;
  confirmModal.style.display = "flex";
}

// ── Lang switcher UI wiring (call after DOM ready) ──
export function initLangButtons(onSwitch) {
  const greekBtn = document.getElementById("greek-btn");
  const engBtn = document.getElementById("eng-btn");
  if(greekBtn) greekBtn.addEventListener("click", () => onSwitch("GR"));
  if(engBtn) engBtn.addEventListener("click", () => onSwitch("EN"));
}

// ── Helper: build a full-screen error page ──
function buildErrorPage(id, titleText, subtitleText, navigateToHome) {
  const page = document.createElement("div");
  page.id = id;
  page.style.cssText = `display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:#E8E6E3;z-index:99999;flex-direction:column;align-items:center;justify-content:center;isolation:isolate;`;
  const bg = document.createElement("div");
  bg.style.cssText = `position:absolute;top:0;left:0;width:0;height:0;border-style:solid;border-width:100vh 100vw 0 0;border-color:#DAD9D7 transparent transparent transparent;z-index:0;pointer-events:none;`;
  page.appendChild(bg);
  const content = document.createElement("div");
  content.style.cssText = `position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;text-align:center;padding:20px;`;
  const title = document.createElement("div");
  title.style.cssText = `font-family:'Playfair Display',serif;font-size:56px;font-weight:900;color:#fff;text-shadow:-1px -1px 0 #111,1px -1px 0 #111,-1px 1px 0 #111,1px 1px 0 #111,3px 4px 0 #555;margin-bottom:12px;`;
  title.textContent = titleText;
  content.appendChild(title);
  if(subtitleText) {
    const sub = document.createElement("div");
    sub.style.cssText = `font-size:18px;font-weight:600;color:#444;margin-bottom:24px;`;
    sub.textContent = subtitleText;
    content.appendChild(sub);
  }
  const btn = document.createElement("button");
  btn.textContent = t("goHome");
  btn.style.cssText = `background:#E8DA89;border:none;padding:12px 20px;border-radius:6px;font-size:16px;font-weight:bold;cursor:pointer;transition:background-color 0.2s ease,box-shadow 0.2s ease;`;
  btn.addEventListener("mouseover", () => { btn.style.backgroundColor = "#d4c15e"; btn.style.boxShadow = "0 3px 8px rgba(0,0,0,0.15)"; });
  btn.addEventListener("mouseout", () => { btn.style.backgroundColor = "#E8DA89"; btn.style.boxShadow = "none"; });
  btn.addEventListener("click", navigateToHome);
  content.appendChild(btn);
  page.appendChild(content);
  document.body.appendChild(page);
  // updateLang: call from each page's switchLang to keep button text in sync
  page.updateLang = () => { btn.textContent = t("goHome"); };
  return page;
}

// ── No-permission page ──
export function buildNoPermissionPage(navigateToHome) {
  const page = buildErrorPage("no-permission-page", t("noPermission"), null, navigateToHome);
  // Keep title in sync when language changes (updateLang is already set up for the button;
  // extend it to also refresh the title element)
  const titleEl = page.querySelector("div[style*='Playfair Display']");
  const _origUpdateLang = page.updateLang.bind(page);
  page.updateLang = () => { _origUpdateLang(); if(titleEl) titleEl.textContent = t("noPermission"); };
  return page;
}

// ── Not-found (404) page ──
export function buildNotFoundPage(navigateToHome) {
  return buildErrorPage("not-found-page", "404", "Page not found", navigateToHome);
}

export async function checkAdminStatus() {
  const snap = await get(deviceRef);
  const d = snap.val();
  if (!d) return false;
  const base = d.role || "user";
  if (base === "admin" || base === "owner") return true;
  // New multi-store: storeRoles array
  if (Array.isArray(d.storeRoles) && d.storeRoles.length > 0) return true;
  // Legacy single store: role = "store:X"
  if (typeof base === "string" && base.startsWith("store:")) return true;
  return false;
}

// Returns { role: "user"|"admin"|"owner", storeRoles: string[] }
// Handles legacy single-store (role="store:X") by migrating to storeRoles on the fly
export async function getDeviceRole() {
  const snap = await get(deviceRef);
  const d = snap.val();
  if (!d) return { role: "user", storeRoles: [] };
  let base = d.role || "user";
  let storeRoles = Array.isArray(d.storeRoles) ? [...d.storeRoles] : [];
  // Migrate legacy "store:X" role to new format
  if (typeof base === "string" && base.startsWith("store:")) {
    const legacyStore = base.replace("store:", "");
    if (!storeRoles.includes(legacyStore)) storeRoles = [legacyStore, ...storeRoles];
    base = "user";
  }
  return { role: base, storeRoles };
}

// Returns all store role keys mapped from store names
// e.g. "Coffee Berry" -> "store:Coffee Berry"
export function storeRoleKey(storeName) {
  return "store:" + storeName;
}

export function getAllStoreNames() {
  const result = [];
  Object.values(stores).forEach(loc => loc.EN.forEach(s => result.push(s)));
  return result;
}


// ── Device helpers ──
export function deviceIcon(type) {
  if(type==="Phone") return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>`;
  if(type==="Tablet") return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>`;
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
}

export function isOnline(lastActive) {
  if(!lastActive) return false;
  const ts = typeof lastActive === "number" ? lastActive : Date.parse(lastActive);
  if(isNaN(ts)) return false;
  return (Date.now() - ts) < 5 * 60 * 1000;
}

export function formatLastActive(lastActive) {
  if(!lastActive) return "—";
  const ts = typeof lastActive === "number" ? lastActive : Date.parse(lastActive);
  if(isNaN(ts)) return String(lastActive);
  return new Date(ts).toLocaleString();
}

// ── Notifications ──
// Pure-frontend approach: no VAPID/server needed.
// 1. Register the SW so showNotification() works (required by browsers for notifications).
// 2. Request permission once.
// 3. In index.html, onValue watches notifications/{deviceId} and fires showNotification.
// 4. In sw.js, notificationclick brings the app to focus.

export async function setupPushNotifications() {
  if ("serviceWorker" in navigator) {
    try { await navigator.serviceWorker.register("/sw.js"); } catch(e) {}
  }
}

// Write a notification record to Firebase under notifications/{targetDeviceId}
// index.html listens to this path and fires the notification on the target device
const ONESIGNAL_APP_ID = '078eeaff-76ec-478a-95f9-1553e1e54a27';

export function triggerNotification(targetDeviceId, title, body, targetUrl = "/") {

  const cleanTitle = 'Zorbas';
  const cleanBody = /accept/i.test(body)
    ? 'Your submission was accepted ✅'
    : /declin|deny|denied/i.test(body)
    ? 'Your submission was denied ❌'
    : body;

  // Channel 1: Firebase in-app (for PC Electron app + website when open)
  push(ref(db, `notifications/${targetDeviceId}`), {
    title: cleanTitle, body: cleanBody, timestamp: Date.now(), delivered: false, targetUrl
  });

  // Channel 2: OneSignal push (for Android app, even when closed)
  get(ref(db, `devices/${targetDeviceId}`)).then(snap => {
    const oneSignalId = snap.val()?.oneSignalId || null;
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oneSignalId,
        externalId: targetDeviceId,
        title: cleanTitle,
        body: cleanBody
      })
    }).catch(() => {});
  }).catch(() => {});
}


/* ---- Balanced store button columns ----
   Keeps the store list short enough to see without endless scrolling:
   items flow top-to-bottom in columns, and the column count is chosen so
   every column holds the same number of stores when possible. */
(function () {
  function maxColsForWidth() {
    const w = window.innerWidth;
    if (w >= 1000) return 4;
    if (w >= 760) return 3;
    if (w >= 520) return 2;
    return 2;
  }
  function balance(container) {
    if (!container) return;
    const n = container.children.length;
    if (!n) return;
    const maxCols = maxColsForWidth();
    let cols = n > 4 ? Math.min(2, maxCols) : 1;
    if (n > 6) {
      cols = maxCols;
      for (let c = maxCols; c >= 2; c--) {
        if (n % c === 0) { cols = c; break; }
      }
      cols = Math.min(cols, Math.ceil(n / 2));
    }
    container.style.columnCount = String(cols);
    // Keep the container exactly as wide as its columns so every button
    // stays the same 260px size no matter how many stores a city has.
    if (window.innerWidth <= 520) {
      container.style.width = "100%";
    } else {
      const gap = 24;
      container.style.width = (cols * 260 + (cols - 1) * gap) + "px";
    }
  }
  function balanceAll() {
    ["store-buttons-container", "store-buttons-container-schedule"].forEach(id => {
      balance(document.getElementById(id));
    });
  }
  function init() {
    ["store-buttons-container", "store-buttons-container-schedule"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      new MutationObserver(() => balance(el)).observe(el, { childList: true });
      balance(el);
    });
    window.addEventListener("resize", balanceAll);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

// ── OneSignal ID auto-capture ──
// Runs immediately when shared.js loads — no explicit call needed.
// Exposes window.__saveOneSignalId for the pre-module Median bridge callback.
(function() {
  function saveId(id) {
    if (!id) return;
    update(ref(db, `devices/${deviceId}`), { oneSignalId: id }).catch(() => {});
  }

  // Expose globally so the pre-module script (median_onesignal_info) can call it
  window.__saveOneSignalId = saveId;

  // If Median called the callback before this module finished loading, pick it up now
  if (window.__pendingOneSignalId) {
    saveId(window.__pendingOneSignalId);
    return;
  }

  // Try Median's Promise API directly
  if (window.median?.onesignal?.onesignalInfo) {
    window.median.onesignal.onesignalInfo()
      .then(info => saveId(info?.oneSignalUserId || info?.userId))
      .catch(() => {});
    return;
  }

  // Poll — Median SDK initializes asynchronously (usually 1-3 seconds)
  let attempts = 0;
  const poll = setInterval(() => {
    if (window.__pendingOneSignalId) {
      clearInterval(poll);
      saveId(window.__pendingOneSignalId);
      return;
    }
    if (window.median?.onesignal?.onesignalInfo) {
      clearInterval(poll);
      window.median.onesignal.onesignalInfo()
        .then(info => saveId(info?.oneSignalUserId || info?.userId))
        .catch(() => {});
    }
    if (++attempts > 40) clearInterval(poll);
  }, 500);
})();
