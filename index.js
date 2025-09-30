// Wait for Firebase to load
setTimeout(initApp, 100);

function initApp() {
  const db = window.firebaseDatabase;
  const ref = window.firebaseRef;
  const set = window.firebaseSet;
  const get = window.firebaseGet;
  const push = window.firebasePush;
  const remove = window.firebaseRemove;
  const onValue = window.firebaseOnValue;

  // Generate or get device ID
  function getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  // Detect device type
  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "Tablet";
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return "Phone";
    }
    return "PC";
  }

  // Get device name
  function getDeviceName() {
    const ua = navigator.userAgent;
    let deviceName = "Unknown Device";
    
    if (ua.includes("Windows")) deviceName = "Windows PC";
    else if (ua.includes("Mac")) deviceName = "Mac";
    else if (ua.includes("Linux")) deviceName = "Linux PC";
    else if (ua.includes("Android")) deviceName = "Android Device";
    else if (ua.includes("iPhone")) deviceName = "iPhone";
    else if (ua.includes("iPad")) deviceName = "iPad";
    
    return deviceName;
  }

  // Register device on first visit
  async function registerDevice() {
    const deviceId = getDeviceId();
    const deviceRef = ref(db, 'users/' + deviceId);
    
    const snapshot = await get(deviceRef);
    if (!snapshot.exists()) {
      await set(deviceRef, {
        deviceId: deviceId,
        deviceName: getDeviceName(),
        deviceType: getDeviceType(),
        role: 'user',
        firstVisit: Date.now()
      });
    }
  }

  registerDevice();

  // Initialize GUI
  document.getElementById("submit-gui").style.display = "block";
  document.getElementById("admin-gui").style.display = "none";
  document.getElementById("submissions-gui").style.display = "none";
  document.getElementById("manage-users-gui").style.display = "none";
  document.getElementById("store-submissions-gui").style.display = "none";

  // Stores
  const stores = {
    NICOSIA: {EN:["Coffee Berry","Makariou Unihalls","Trinity Shop","Nicosia Mall","Kokkinotrimithia","Agios Pavlos","Chatziiosif","Pallouriotissa"], GR:["Coffee Berry","Makariou Unihalls","Trinity Shop","Nicosia Mall","Κοκκινοτριμιθιά","Άγιος Παύλος","Χατζηιωσηφ","Παλλουριώτισσα"]},
    LARNACA: {EN:["Timagia","Makariou","Faneromeni","Oroklini","Aradippou","Kiti"], GR:["Τιμάγια","Μακαρίου","Φανερωμένη","Ορόκλινη","Αραδίππου","Κίτι"]},
    FAMAGUSTA: {EN:["Paralimni","Protaras"], GR:["Παραλίμνι","Πρωταράς"]},
    LIMASSOL: {EN:["Paphou","Akadimias","NAAFI","Omirou"], GR:["Πάφου","Ακαδημίας","NAAFI","Όμηρου"]},
    PAFOS: {EN:["El. Venizelou","Geroskipou","Ellados","Apostolou Pavlou"], GR:["Ελ. Βενιζέλου","Γεροσκήπου","Ελλάδος","Αποστόλου Παύλου"]}
  };

  let currentLang = "EN";
  const greekBtn = document.getElementById("greek-btn");
  const engBtn = document.getElementById("eng-btn");
  const locationSelect = document.getElementById("location");
  const storeContainer = document.getElementById("store-container");
  const storeSelect = document.getElementById("store");
  const submitBtn = document.getElementById("submit-btn");
  const messageDiv = document.getElementById("message");

  // Language toggle
  greekBtn.addEventListener("click", () => switchLang("GR"));
  engBtn.addEventListener("click", () => switchLang("EN"));

  function switchLang(lang) {
    currentLang = lang;
    if (lang === "GR") {
      greekBtn.classList.add("active"); engBtn.classList.remove("active");
      document.getElementById("label-name").textContent = "Όνομα";
      document.getElementById("name").placeholder = "Γράψτε το όνομά σας";
      document.getElementById("label-day").textContent = "Ημέρα";
      document.getElementById("day").placeholder = "π.χ. 12 - 24";
      document.getElementById("label-shift").textContent = "Βάρδια";
      document.getElementById("shift").options[0].text = "Επιλέξτε βάρδια";
      document.getElementById("label-month").textContent = "Μήνας";
      const monthsGR = ["Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος", "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"];
      const monthOptions = document.getElementById("month").options;
      for (let i = 1; i < monthOptions.length; i++) { monthOptions[i].text = monthsGR[i - 1]; }
      document.getElementById("month").options[0].text = "Επιλέξτε μήνα";
      document.getElementById("label-location").textContent = "Τοποθεσία";
      const locOptions = document.getElementById("location").options;
      locOptions[0].text = "Επιλέξτε τοποθεσία";
      locOptions[1].text = "Λευκωσία"; locOptions[2].text = "Λάρνακα"; locOptions[3].text = "Αμμόχωστος"; locOptions[4].text = "Λεμεσός"; locOptions[5].text = "Πάφος";
      document.getElementById("label-store").textContent = "Κατάστημα";
      submitBtn.textContent = "Υποβολή";
    } else {
      greekBtn.classList.remove("active"); engBtn.classList.add("active");
      document.getElementById("label-name").textContent = "Name";
      document.getElementById("name").placeholder = "Fill out your name";
      document.getElementById("label-day").textContent = "Day";
      document.getElementById("day").placeholder = "e.g. 12 - 24";
      document.getElementById("label-shift").textContent = "Shift";
      document.getElementById("shift").options[0].text = "Select shift";
      document.getElementById("label-month").textContent = "Month";
      const monthsEN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthOptions = document.getElementById("month").options;
      for (let i = 1; i < monthOptions.length; i++) { monthOptions[i].text = monthsEN[i - 1]; }
      document.getElementById("month").options[0].text = "Select month";
      document.getElementById("label-location").textContent = "Location";
      const locOptions = document.getElementById("location").options;
      locOptions[0].text = "Select location";
      locOptions[1].text = "Nicosia"; locOptions[2].text = "Larnaca"; locOptions[3].text = "Famagusta"; locOptions[4].text = "Limassol"; locOptions[5].text = "Pafos";
      document.getElementById("label-store").textContent = "Store";
      submitBtn.textContent = "Submit";
    }
    if (locationSelect.value) updateStores(locationSelect.value);
  }

  locationSelect.addEventListener("change", () => updateStores(locationSelect.value));

  function updateStores(location) {
    if (stores[location]) {
      storeSelect.innerHTML = `<option value="" disabled selected>${currentLang === "GR" ? "Επιλέξτε κατάστημα" : "Select a store"}</option>`;
      stores[location][currentLang].forEach(store => {
        const option = document.createElement("option");
        option.value = store; option.textContent = store;
        storeSelect.appendChild(option);
      });
      storeContainer.classList.add("show");
    } else storeContainer.classList.remove("show");
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.style.display = "block";
    setTimeout(() => { messageDiv.style.display = "none"; }, 2000);
  }

  // Submit form to Firebase
  submitBtn.addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const day = document.getElementById("day").value.trim();
    const shift = document.getElementById("shift").value;
    const month = document.getElementById("month").value;
    const location = document.getElementById("location").value;
    const store = storeContainer.classList.contains("show") ? storeSelect.value : "filled";

    if (name && day && shift && month && location && store) {
      const submissionData = {
        name,
        day,
        shift,
        month,
        location,
        store,
        timestamp: Date.now(),
        status: 'pending'
      };

      const submissionsRef = ref(db, 'submissions/' + location + '/' + store);
      await push(submissionsRef, submissionData);

      showMessage(currentLang === "GR" ? "Υποβλήθηκε με επιτυχία!" : "You successfully submitted!", "success");
      document.getElementById("zorbas-form").reset();
      storeContainer.classList.remove("show");
    } else {
      showMessage(currentLang === "GR" ? "Παρακαλώ συμπληρώστε όλα τα πεδία." : "Please fill in all fields.", "error");
    }
  });

  // Admin GUI
  const adminBtnElem = document.getElementById("admin-btn");
  const adminGuiElem = document.getElementById("admin-gui");
  const adminBackElem = document.getElementById("admin-back");
  const adminSeeSubElem = document.getElementById("admin-see-submissions");
  const adminResetSubElem = document.getElementById("admin-reset-submissions");
  const adminSeeUsersElem = document.getElementById("admin-see-users");
  const submissionsGuiElem = document.getElementById("submissions-gui");
  const submissionsBox = document.getElementById("submissions-box");
  const manageUsersGuiElem = document.getElementById("manage-users-gui");
  const manageUsersBox = document.getElementById("manage-users-box");
  const storeSubmissionsGuiElem = document.getElementById("store-submissions-gui");
  const storeSubmissionsBox = document.getElementById("store-submissions-box");

  adminBtnElem.addEventListener("click", () => { adminGuiElem.style.display = "flex"; });
  adminBackElem.addEventListener("click", () => { adminGuiElem.style.display = "none"; });

  adminResetSubElem.addEventListener("click", async () => {
    if (confirm(currentLang === "GR" ? "Είστε σίγουροι ότι θέλετε να διαγράψετε όλες τις υποβολές;" : "Are you sure you want to delete all submissions?")) {
      await set(ref(db, 'submissions'), null);
      alert(currentLang === "GR" ? "Όλες οι υποβολές διαγράφηκαν" : "All submissions deleted");
    }
  });

  // Manage Users GUI
  adminSeeUsersElem.addEventListener("click", async () => {
    manageUsersBox.innerHTML = '<h2>Manage Users</h2>';
    
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      Object.keys(users).forEach(userId => {
        const user = users[userId];
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        userCard.innerHTML = `
          <p><strong>Device:</strong> ${user.deviceName}</p>
          <p><strong>Type:</strong> ${user.deviceType}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <div class="role-buttons">
            <button class="user-btn ${user.role === 'user' ? 'active' : ''}" data-user="${userId}" data-role="user">User</button>
            <button class="admin-btn ${user.role === 'admin' ? 'active' : ''}" data-user="${userId}" data-role="admin">Admin</button>
          </div>
        `;
        
        manageUsersBox.appendChild(userCard);
      });

      // Add event listeners for role buttons
      document.querySelectorAll('.role-buttons button').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const userId = e.target.dataset.user;
          const role = e.target.dataset.role;
          await set(ref(db, 'users/' + userId + '/role'), role);
          adminSeeUsersElem.click(); // Refresh
        });
      });
    } else {
      manageUsersBox.innerHTML += '<p>No users found</p>';
    }

    const backBtn = document.createElement("button");
    backBtn.textContent = currentLang === "GR" ? "Πίσω" : "Back";
    backBtn.className = "submit-btn";
    backBtn.style.backgroundColor = "#f44336";
    backBtn.style.color = "#fff";
    backBtn.style.marginTop = "20px";
    backBtn.addEventListener("click", () => manageUsersGuiElem.style.display = "none");
    manageUsersBox.appendChild(backBtn);

    manageUsersGuiElem.style.display = "flex";
  });

  // Location buttons
  const locationButtons = {
    "Λευκωσία": { key: "NICOSIA", stores: stores.NICOSIA },
    "Λάρνακα": { key: "LARNACA", stores: stores.LARNACA },
    "Αμμόχωστος": { key: "FAMAGUSTA", stores: stores.FAMAGUSTA },
    "Λεμεσός": { key: "LIMASSOL", stores: stores.LIMASSOL },
    "Πάφος": { key: "PAFOS", stores: stores.PAFOS }
  };

  // Show store submissions
  async function showStoreSubmissions(location, store) {
    storeSubmissionsBox.innerHTML = `<h2>Submissions - ${store}</h2>`;
    
    const submissionsRef = ref(db, 'submissions/' + location + '/' + store);
    const snapshot = await get(submissionsRef);
    
    if (snapshot.exists()) {
      const submissions = snapshot.val();
      Object.keys(submissions).forEach(subId => {
        const sub = submissions[subId];
        if (sub.status === 'pending') {
          const card = document.createElement('div');
          card.className = 'submission-card';
          
          card.innerHTML = `
            <p><strong>Name:</strong> ${sub.name}</p>
            <p><strong>Month:</strong> ${sub.month}</p>
            <p><strong>Day:</strong> ${sub.day}</p>
            <p><strong>Shift:</strong> ${sub.shift}</p>
            <div class="action-buttons">
              <button class="accept-btn" data-id="${subId}" data-location="${location}" data-store="${store}">Accept</button>
              <button class="decline-btn" data-id="${subId}" data-location="${location}" data-store="${store}">Decline</button>
            </div>
          `;
          
          storeSubmissionsBox.appendChild(card);
        }
      });

      // Add event listeners
      document.querySelectorAll('.accept-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const subId = e.target.dataset.id;
          const loc = e.target.dataset.location;
          const str = e.target.dataset.store;
          await set(ref(db, `submissions/${loc}/${str}/${subId}/status`), 'accepted');
          showStoreSubmissions(loc, str);
        });
      });

      document.querySelectorAll('.decline-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const subId = e.target.dataset.id;
          const loc = e.target.dataset.location;
          const str = e.target.dataset.store;
          await remove(ref(db, `submissions/${loc}/${str}/${subId}`));
          showStoreSubmissions(loc, str);
        });
      });
    } else {
      storeSubmissionsBox.innerHTML += '<p>No submissions found</p>';
    }

    const backBtn = document.createElement("button");
    backBtn.textContent = currentLang === "GR" ? "Πίσω" : "Back";
    backBtn.className = "submit-btn";
    backBtn.style.backgroundColor = "#f44336";
    backBtn.style.color = "#fff";
    backBtn.style.marginTop = "20px";
    backBtn.addEventListener("click", () => {
      storeSubmissionsGuiElem.style.display = "none";
      submissionsGuiElem.style.display = "flex";
    });
    storeSubmissionsBox.appendChild(backBtn);

    storeSubmissionsGuiElem.style.display = "flex";
  }

  // Show stores for a location
  function showStores(locationName, locationData) {
    submissionsBox.innerHTML = "";
    const storeList = locationData.stores[currentLang];
    
    storeList.forEach(store => {
      const storeBtn = document.createElement("button");
      storeBtn.className = "submit-btn";
      storeBtn.textContent = store;
      storeBtn.addEventListener("click", () => {
        submissionsGuiElem.style.display = "none";
        showStoreSubmissions(locationData.key, store);
      });
      submissionsBox.appendChild(storeBtn);
    });

    const backBtn = document.createElement("button");
    backBtn.textContent = currentLang === "GR" ? "Πίσω" : "Back";
    backBtn.style.backgroundColor = "#f44336";
    backBtn.style.color = "#fff";
    backBtn.style.border = "none";
    backBtn.style.padding = "12px 20px";
    backBtn.style.borderRadius = "6px";
    backBtn.style.fontSize = "16px";
    backBtn.style.cursor = "pointer";
    backBtn.style.width = "90%";
    backBtn.style.marginTop = "10px";
    backBtn.addEventListener("click", () => loadLocationsPanel());
    submissionsBox.appendChild(backBtn);
  }

  // Load locations panel
  function loadLocationsPanel() {
    submissionsBox.innerHTML = "";
    Object.keys(locationButtons).forEach(loc => {
      const locBtn = document.createElement("button");
      locBtn.className = "submit-btn";
      locBtn.textContent = loc;
      locBtn.addEventListener("click", () => showStores(loc, locationButtons[loc]));
      submissionsBox.appendChild(locBtn);
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = currentLang === "GR" ? "Πίσω" : "Back";
    closeBtn.style.backgroundColor = "#f44336";
    closeBtn.style.color = "#fff";
    closeBtn.style.border = "none";
    closeBtn.style.padding = "12px 20px";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.fontSize = "16px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.width = "90%";
    closeBtn.style.marginTop = "10px";
    closeBtn.addEventListener("click", () => submissionsGuiElem.style.display = "none");
    submissionsBox.appendChild(closeBtn);
  }

  // See all submissions button
  adminSeeSubElem.addEventListener("click", () => {
    loadLocationsPanel();
    submissionsGuiElem.style.display = "flex";
  });
}