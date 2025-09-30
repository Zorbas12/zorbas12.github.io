// Initialize submit GUI
document.getElementById("submit-gui").style.display = "block";
document.getElementById("admin-gui").style.display = "none";
document.getElementById("submissions-gui").style.display = "none";

// Local submissions array
let submissions = [];

// Stores
const stores = {
  NICOSIA: {EN:["Coffee Berry","Makariou Unihalls","Trinity Shop","Nicosia Mall","Kokkinotrimithia","Agios Pavlos","Chatziiosif","Pallouriotissa"], GR:["Coffee Berry","Makariou Unihalls","Trinity Shop","Nicosia Mall","Κοκκινοτριμιθιά","Άγιος Παύλος","Χατζηιωσηφ","Παλλουριώτισσα"]},
  LARNACA: {EN:["Timagia","Makariou","Faneromeni","Oroklini","Aradippou","Kiti"], GR:["Τιμάγια","Μακαρίου","Φανερωμένη","Ορόκλινη","Αραδίππου","Κίτι"]},
  FAMAGUSTA: {EN:["Paralimni","Protaras"], GR:["Παραλίμνι","Πρωταράς"]},
  LIMASSOL: {EN:["Paphou","Akadimias","NAAFI","Omirou"], GR:["Πάφου","Ακαδημίας","NAAFI","Όμηρου"]},
  PAFOS: {EN:["El. Venizelou","Geroskipou","Ellados","Apostolou Pavlou"], GR:["Ελ. Βενιζέλου","Γεροσκήπου","Ελλάδος","Αποστόλου Παύλου"]}
};

let currentLang="EN";
const greekBtn=document.getElementById("greek-btn");
const engBtn=document.getElementById("eng-btn");
const locationSelect=document.getElementById("location");
const storeContainer=document.getElementById("store-container");
const storeSelect=document.getElementById("store");
const submitBtn=document.getElementById("submit-btn");
const messageDiv=document.getElementById("message");

// Language toggle
greekBtn.addEventListener("click",()=>switchLang("GR"));
engBtn.addEventListener("click",()=>switchLang("EN"));

function switchLang(lang){
  currentLang=lang;
  if(lang==="GR"){
    greekBtn.classList.add("active"); engBtn.classList.remove("active");
    document.getElementById("label-name").textContent="Όνομα";
    document.getElementById("name").placeholder="Γράψτε το όνομά σας";
    document.getElementById("label-day").textContent="Ημέρα";
    document.getElementById("day").placeholder="π.χ. 12 - 24";
    document.getElementById("label-shift").textContent="Βάρδια";
    document.getElementById("shift").options[0].text="Επιλέξτε βάρδια";
    document.getElementById("label-month").textContent="Μήνας";
    const monthsGR = ["Ιανουάριος","Φεβρουάριος","Μάρτιος","Απρίλιος","Μάιος","Ιούνιος","Ιούλιος","Αύγουστος","Σεπτέμβριος","Οκτώβριος","Νοέμβριος","Δεκέμβριος"];
    const monthOptions=document.getElementById("month").options;
    for(let i=1;i<monthOptions.length;i++){ monthOptions[i].text=monthsGR[i-1]; }
    document.getElementById("month").options[0].text="Επιλέξτε μήνα";
    document.getElementById("label-location").textContent="Τοποθεσία";
    const locOptions=document.getElementById("location").options;
    locOptions[0].text="Επιλέξτε τοποθεσία";
    locOptions[1].text="Λευκωσία"; locOptions[2].text="Λάρνακα"; locOptions[3].text="Αμμόχωστος"; locOptions[4].text="Λεμεσός"; locOptions[5].text="Πάφος";
    document.getElementById("label-store").textContent="Κατάστημα";
    submitBtn.textContent="Υποβολή";
  } else {
    greekBtn.classList.remove("active"); engBtn.classList.add("active");
    document.getElementById("label-name").textContent="Name";
    document.getElementById("name").placeholder="Fill out your name";
    document.getElementById("label-day").textContent="Day";
    document.getElementById("day").placeholder="fill out your day";
    document.getElementById("label-shift").textContent="Shift";
    document.getElementById("shift").options[0].text="Select shift";
    document.getElementById("label-month").textContent="Month";
    const monthsEN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const monthOptions=document.getElementById("month").options;
    for(let i=1;i<monthOptions.length;i++){ monthOptions[i].text=monthsEN[i-1]; }
    document.getElementById("month").options[0].text="Select month";
    document.getElementById("label-location").textContent="Location";
    const locOptions=document.getElementById("location").options;
    locOptions[0].text="Select location";
    locOptions[1].text="Nicosia"; locOptions[2].text="Larnaca"; locOptions[3].text="Famagusta"; locOptions[4].text="Limassol"; locOptions[5].text="Pafos";
    document.getElementById("label-store").textContent="Stores";
    submitBtn.textContent="Submit";
  }
  if(locationSelect.value) updateStores(locationSelect.value);
}

locationSelect.addEventListener("change",()=>updateStores(locationSelect.value));

function updateStores(location){
  if(stores[location]){
    storeSelect.innerHTML=`<option value="" disabled selected>${currentLang==="GR"?"Επιλέξτε κατάστημα":"Select a store"}</option>`;
    stores[location][currentLang].forEach(store=>{
      const option=document.createElement("option");
      option.value=store; option.textContent=store;
      storeSelect.appendChild(option);
    });
    storeContainer.classList.add("show");
  } else storeContainer.classList.remove("show");
}

function showMessage(text,type){
  messageDiv.textContent=text;
  messageDiv.className=type; // success or error
  messageDiv.style.display="block";
  setTimeout(()=>{messageDiv.style.display="none";},2000);
}

submitBtn.addEventListener("click",()=>{
  const name=document.getElementById("name").value.trim();
  const day=document.getElementById("day").value.trim();
  const shift=document.getElementById("shift").value;
  const month=document.getElementById("month").value;
  const location=document.getElementById("location").value;
  const store=storeContainer.classList.contains("show")?storeSelect.value:"filled";

  if(name && day && shift && month && location && store){
    submissions.push({name, day, shift, month, location, store});
    showMessage(currentLang==="GR"?"Υποβλήθηκε με επιτυχία!":"You successfully submitted!", "success");
    document.getElementById("zorbas-form").reset();
    storeContainer.classList.remove("show");
  } else showMessage(currentLang==="GR"?"Παρακαλώ συμπληρώστε όλα τα πεδία.":"Please fill in all fields.", "error");
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

adminBtnElem.addEventListener("click", ()=>{ adminGuiElem.style.display="flex"; });
adminBackElem.addEventListener("click", ()=>{ adminGuiElem.style.display="none"; });

adminResetSubElem.addEventListener("click", ()=>{ alert(currentLang==="GR"?"Όλες οι υποβολές επαναφέρθηκαν (placeholder)":"All submissions reset (placeholder)"); });
adminSeeUsersElem.addEventListener("click", ()=>{ alert(currentLang==="GR"?"Προβολή όλων των χρηστών (placeholder)":"See all users (placeholder)"); });

// Show submissions with locations panel first
adminSeeSubElem.addEventListener("click", ()=>{
  loadLocationsPanel();
  submissionsGuiElem.style.display="flex";
});

// Location buttons dynamic
const locationButtons = {
  "Λευκωσία": stores.NICOSIA,
  "Λάρνακα": stores.LARNACA,
  "Αμμόχωστος": stores.FAMAGUSTA,
  "Λεμεσός": stores.LIMASSOL,
  "Πάφος": stores.PAFOS
};

function showStores(location){
  submissionsBox.innerHTML = ""; // Clear old
  const storeList = locationButtons[location][currentLang];
  storeList.forEach(store => {
    const storeBtn = document.createElement("button");
    storeBtn.className = "submit-btn";
    storeBtn.textContent = store;
    submissionsBox.appendChild(storeBtn);
  });

  const backBtn = document.createElement("button");
  backBtn.textContent = currentLang==="GR"?"Πίσω":"Back";
  backBtn.style.backgroundColor="#f44336";
  backBtn.style.color="#fff";
  backBtn.style.border="none";
  backBtn.style.padding="12px 20px";
  backBtn.style.borderRadius="6px";
  backBtn.style.fontSize="16px";
  backBtn.style.cursor="pointer";
  backBtn.style.width="90%";
  backBtn.style.marginTop="10px";
  backBtn.addEventListener("click", ()=> loadLocationsPanel());
  submissionsBox.appendChild(backBtn);
}

function loadLocationsPanel(){
  submissionsBox.innerHTML="";
  Object.keys(locationButtons).forEach(loc => {
    const locBtn = document.createElement("button");
    locBtn.className="submit-btn";
    locBtn.textContent=loc;
    locBtn.addEventListener("click", ()=> showStores(loc));
    submissionsBox.appendChild(locBtn);
  });

  // Add back button to close overlay
  const closeBtn = document.createElement("button");
  closeBtn.textContent = currentLang==="GR"?"Πίσω":"Back";
  closeBtn.style.backgroundColor="#f44336";
  closeBtn.style.color="#fff";
  closeBtn.style.border="none";
  closeBtn.style.padding="12px 20px";
  closeBtn.style.borderRadius="6px";
  closeBtn.style.fontSize="16px";
  closeBtn.style.cursor="pointer";
  closeBtn.style.width="90%";
  closeBtn.style.marginTop="10px";
  closeBtn.addEventListener("click", ()=> submissionsGuiElem.style.display="none");
  submissionsBox.appendChild(closeBtn);
}