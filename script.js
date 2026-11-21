let portfolios = [];   // เก็บ Portfolio ทั้งหมด
let selectedId = null; // id ของ Portfolio ที่กำลังเลือกอยู่
let editingItemIndex = null; //ส่วนแก้ไข

const exampleFiles = ["portfolio-example-1.json", "portfolio-example-2.json"];

const listEls = [
  document.getElementById("portfolioList"),
  document.getElementById("createPortfolioList")
].filter(Boolean);
const countBadge = document.getElementById("countBadge");
const portfolioCountBadge = document.getElementById("portfolioCountBadge");
const emptyState = document.getElementById("emptyState");
const detailContent = document.getElementById("detailContent");

const detailTitle = document.getElementById("detailTitle");
const detailEnjoy = document.getElementById("detailEnjoy");
const detailTried = document.getElementById("detailTried");
const detailCurious = document.getElementById("detailCurious");

const itemsContainer = document.getElementById("itemsContainer");
const itemCount = document.getElementById("itemCount");
const deleteBtn = document.getElementById("deleteBtn");
const pageTabs = document.querySelectorAll(".page-tab");
const themeToggle = document.getElementById("themeToggle");
const homePage = document.getElementById("homePage");
const createPage = document.getElementById("createPage");
const createContent = document.querySelector(".create-content");
const portfolioPage = document.getElementById("portfolioPage");
const portfolioContent = document.querySelector(".portfolio-content");

const portfolioForm = document.getElementById("portfolioForm");
const portfolioFields = portfolioForm.querySelectorAll(".field");
const itemForm = document.getElementById("item-form");
const typeSelect = document.getElementById("type");
const otherTypeField = document.getElementById("otherTypeField");
const otherTypeInput = document.getElementById("otherType");
const dateInput = document.getElementById("date");

function setTheme(theme) {
  const isDark = theme === "dark";
  document.body.dataset.theme = isDark ? "dark" : "light";
  document.documentElement.dataset.bsTheme = isDark ? "dark" : "light"; // โหมดมืดของ Bootstrap ทั้งหน้า
  themeToggle.setAttribute("aria-checked", String(isDark));
  themeToggle.title = isDark ? "เปิดโหมดสว่าง" : "เปิดโหมดมืด";
}

setTheme(localStorage.getItem("portfolioTheme") === "dark" ? "dark" : "light");
themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("portfolioTheme", nextTheme);
  setTheme(nextTheme);
});

function getTodayDate() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

dateInput.max = getTodayDate();

function updateOtherTypeField() {
  const isOther = typeSelect.value === "Other";
  otherTypeField.hidden = !isOther;
  otherTypeInput.required = isOther;
  if (!isOther) otherTypeInput.value = "";
}

typeSelect.addEventListener("change", updateOtherTypeField);
itemForm.addEventListener("reset", () => setTimeout(updateOtherTypeField));
itemForm.addEventListener("reset", () => setTimeout(() => {
  updateOtherTypeField();
  itemForm.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
}));

// ---------- ตรวจฟอร์ม Item แบบกรอบสีแดง (แทน popup ของเบราว์เซอร์) ----------
const evidenceInput = document.getElementById("evidence");

function getEvidenceLinks() {
  return evidenceInput.value
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "");
}

// ตั้งเงื่อนไขพิเศษ: ห้ามมีแต่ช่องว่าง และ Evidence ต้องเป็นลิงก์ http(s)
function setCustomRules() {
  itemForm.querySelectorAll("input, textarea").forEach(el => el.setCustomValidity(""));
  itemForm.querySelectorAll("input[required], textarea[required]").forEach(el => {
    el.setCustomValidity(el.value.trim() === "" ? "empty" : "");
  });
  const links = getEvidenceLinks();
  const linksOk = links.length > 0 && links.every(url => /^https?:\/\/.+/i.test(url));
  evidenceInput.setCustomValidity(linksOk ? "" : "invalid");
}

function markInvalidFields() {
  setCustomRules();
  itemForm.querySelectorAll("input, select, textarea").forEach(el => {
    el.classList.toggle("is-invalid", !el.checkValidity());
  });
}

// แก้ช่องที่เป็นสีแดงแล้ว ให้กรอบแดงหายทันที
["input", "change"].forEach(type => {
  itemForm.addEventListener(type, event => {
    const el = event.target;
    if (!el.classList.contains("is-invalid")) return;
    setCustomRules();
    el.classList.toggle("is-invalid", !el.checkValidity());
  });
});


function saveData() {
  localStorage.setItem("portfolios", JSON.stringify(portfolios));
  localStorage.setItem("selectedId", JSON.stringify(selectedId));
}

// แปลงโครงสร้างไฟล์ JSON ตัวอย่าง ให้เป็นรูปแบบที่เว็บใช้
function convertExample(example) {
  return {
    id: String(example.portfolioId),
    name: example.name,
    enjoy: example.whatIEnjoy,
    tried: example.whatIveTried,
    curious: example.whatImCuriousAbout,
    items: (example.items || []).map(item => ({
      ...item,
      whatIDid: item.reflection?.whatIDid || "",
      whatILearned: item.reflection?.whatILearned || "",
      challenge: item.reflection?.challenge || "",
      nextStep: item.reflection?.nextStep || ""
    }))
  };
}

async function loadExamples() {
  const results = await Promise.all(exampleFiles.map(async file => {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`โหลด ${file} ไม่สำเร็จ`);
      return convertExample(await response.json());
    } catch (error) {
      console.error(error);
      return null; // ไฟล์ไหนพัง ข้ามไป ไม่ล้มทั้งหมด
    }
  }));
  return results.filter(Boolean);
}

async function loadData() {
  // 1) โหลดข้อมูลที่บันทึกไว้ใน localStorage
  try {
    portfolios = JSON.parse(localStorage.getItem("portfolios")) || [];
    selectedId = JSON.parse(localStorage.getItem("selectedId"));
  } catch (error) {
    console.error("อ่านข้อมูลใน localStorage ไม่ได้:", error);
    portfolios = [];
    selectedId = null;
  }

  // ทำให้ id เป็น string ทั้งหมด (ข้อมูลเก่าที่ใช้ Date.now() เป็นตัวเลข)
  portfolios.forEach(p => { p.id = String(p.id); });
  if (selectedId !== null) selectedId = String(selectedId);

  // 2) โหลดตัวอย่างจากไฟล์ แล้วเติมเฉพาะอันที่ยังไม่มี
  const examples = await loadExamples();
  const existingIds = new Set(portfolios.map(p => p.id));
  const missing = examples.filter(e => !existingIds.has(e.id));
  portfolios = [...missing, ...portfolios]; // ตัวอย่างอยู่บนสุด

  // 3) ตรวจว่า selectedId ยังมีอยู่
  if (!portfolios.some(p => p.id === selectedId)) {
    selectedId = portfolios.length > 0 ? portfolios[0].id : null;
  }

  saveData();
}


function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSelectedPortfolio() {
  return portfolios.find(p => p.id === selectedId);
}


function renderList() {

    if (countBadge) countBadge.textContent = portfolios.length;
    portfolioCountBadge.textContent = portfolios.length;

  if (portfolios.length === 0) {
    listEls.forEach(list => {
      list.innerHTML = '<li class="list-empty">ยังไม่มี Portfolio ที่บันทึก</li>';
    });
    return;
  }

  const portfolioListMarkup = portfolios
    .map(p => `
      <li>
        <button type="button"
                class="portfolio-item ${p.id === selectedId ? "active" : ""}"
                data-id="${escapeHtml(p.id)}">
          <span class="name">${escapeHtml(p.name)}</span>
          <span class="count">${p.items.length} รายการ</span>
        </button>
      </li>
    `)
    .join("");

  listEls.forEach(list => {
    list.innerHTML = portfolioListMarkup;
  });

}


function renderDetail() {

  const portfolio = getSelectedPortfolio();


  if (!portfolio) {
    emptyState.hidden = false;
    detailContent.hidden = true;
    itemCount.textContent = 0;
    itemsContainer.innerHTML = "";
    return;
  }

  emptyState.hidden = true;
  detailContent.hidden = false;

  detailTitle.textContent = portfolio.name;
  detailEnjoy.textContent = portfolio.enjoy;
  detailTried.textContent = portfolio.tried;
  detailCurious.textContent = portfolio.curious;

  renderItems(portfolio);
}


function renderItems(portfolio) {
  itemCount.textContent = portfolio.items.length;

  if (portfolio.items.length === 0) {
    itemsContainer.textContent = "ยังไม่มี Portfolio Item";
    return;
  }

  itemsContainer.innerHTML = portfolio.items
    .map((item, index) => {
      const skillsHtml = (item.skills || [])
        .map(skill => `<span>${escapeHtml(skill)}</span>`)
        .join("");

      const evidenceHtml = (item.evidence || [])
        .map(url => `
          <li>
            <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(url)}
            </a>
          </li>
        `)
        .join("");

      return `
        <article class="portfolio-item-card">
          <h3 class="item-title">${escapeHtml(item.title)}</h3>
          <p class="item-meta">
            ${escapeHtml(item.type === "Other" && item.typeDetails ? `Other: ${item.typeDetails}` : item.type)} · ${escapeHtml(item.date)} · ${escapeHtml(item.role)}
          </p>
          <p class="item-description">${escapeHtml(item.description)}</p>

          <div class="item-skills">${skillsHtml}</div>

          <div class="item-reflection">
            <h4>What I did</h4>
            <p>${escapeHtml(item.whatIDid)}</p>
            <h4>What I learned</h4>
            <p>${escapeHtml(item.whatILearned)}</p>
            <h4>Challenge</h4>
            <p>${escapeHtml(item.challenge)}</p>
            <h4>Next step</h4>
            <p>${escapeHtml(item.nextStep)}</p>
          </div>

          <div class="item-evidence">
            <p>Evidence</p>
            <ul>${evidenceHtml}</ul>
          </div>

           <button type="button" class="edit-item-btn" data-index="${index}">
          แก้ไข Item
          </button>

          <button type="button" class="delete-item-btn" data-index="${index}">
            ลบ Item
          </button>
        </article>
      `;
    })
    .join("");
}


function renderAll() {
  renderList();
  renderDetail();
}

function editItem(index) {
  const portfolio = getSelectedPortfolio();

  if (!portfolio || !portfolio.items[index]) {
    return;
  }

  const item = portfolio.items[index];

  
  editingItemIndex = index;


  document.getElementById("title").value =
    item.title || "";

  document.getElementById("type").value =
    item.type || "";

  document.getElementById("otherType").value =
    item.typeDetails || "";

  document.getElementById("date").value =
   item.date || "";

  document.getElementById("role").value =
    item.role || "";

  document.getElementById("skills").value =
    (item.skills || []).join(", ");

  document.getElementById("description").value =
    item.description || "";

  document.getElementById("whatIDid").value =
    item.whatIDid || "";

  document.getElementById("whatILearned").value =
    item.whatILearned || "";

  document.getElementById("challenge").value =
    item.challenge || "";

  document.getElementById("nextStep").value =
  item.nextStep || "";

  document.getElementById("evidence").value =
    (item.evidence || []).join("\n");

  updateOtherTypeField();

  showPage("createPage");
}

// จัดการการเปลี่ยนหน้าเว็บไซต์
function showPage(pageId) {

    // ซ่อนทุกหน้าก่อน
    homePage.hidden = true;
    createPage.hidden = true;
    createContent.hidden = true;
    portfolioPage.hidden = true;
    portfolioContent.hidden = true;

    // แสดงหน้าที่เลือก
    if (pageId === "homePage") {
        homePage.hidden = false;
    } 
    else if (pageId === "createPage") {
        createPage.hidden = false;
        createContent.hidden = false;
    } 
    else if (pageId === "portfolioPage") {
        portfolioPage.hidden = false;
        portfolioContent.hidden = false;
    }

    // ซ่อนปุ่ม Hamburger เฉพาะหน้า Home
    const topNav = document.getElementById("topNav");
    topNav.hidden = pageId === "homePage";

    // อัปเดตสถานะเมนู
    pageTabs.forEach(tab => {
        const isActive = tab.dataset.page === pageId;
        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-pressed", String(isActive));
    });
}

// จัดการการคลิกปุ่มเปลี่ยนหน้า
document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

function validateField(field) {
  const input = field.querySelector("input, textarea");
  const isEmpty = input.value.trim() === "";
  field.classList.toggle("invalid", isEmpty);
}

portfolioForm.addEventListener("input", event => {
  const field = event.target.closest(".field");
  if (field) validateField(field);
});

document.querySelectorAll("[data-page]").forEach(button => {

    button.addEventListener("click", () => {

        showPage(button.dataset.page);

    });

});

function handlePortfolioSelection(event) {
  const button = event.target.closest(".portfolio-item");
  if (!button) return;

  selectedId = button.dataset.id;
  saveData();
  renderAll();
  showPage("portfolioPage");
}

listEls.forEach(list => {
  list.addEventListener("click", handlePortfolioSelection);
});


portfolioForm.addEventListener("submit", event => {
  event.preventDefault();

  portfolioFields.forEach(validateField);
  if (portfolioForm.querySelector(".invalid")) return; // มีช่องว่าง -> หยุด

  const newPortfolio = {
    id: String(Date.now()),
    name: document.getElementById("displayName").value.trim(),
    enjoy: document.getElementById("enjoy").value.trim(),
    tried: document.getElementById("tried").value.trim(),
    curious: document.getElementById("curious").value.trim(),
    items: []
  };

  portfolios.push(newPortfolio);
  selectedId = newPortfolio.id;

  saveData();
  portfolioForm.reset();
  portfolioFields.forEach(field => field.classList.remove("invalid")); // ล้างแจ้งเตือนสีแดง
  renderAll();
});


deleteBtn.addEventListener("click", () => {
  const portfolio = getSelectedPortfolio();
  if (!portfolio) return;

  if (!confirm(`ลบ "${portfolio.name}" ใช่หรือไม่?`)) return;

  portfolios = portfolios.filter(p => p.id !== selectedId);
  selectedId = portfolios.length > 0 ? portfolios[0].id : null;

  saveData();
  renderAll();
});



itemForm.addEventListener("submit", event => {
  event.preventDefault();

  const portfolio = getSelectedPortfolio();

  if (!portfolio) {
    alert("กรุณาสร้างหรือเลือก Portfolio ก่อน");
    return;
  }

  // ตรวจสอบความถูกต้องของฟอร์ม
  markInvalidFields();

  if (!itemForm.checkValidity()) {
    itemForm.reportValidity();

    const firstInvalid = itemForm.querySelector(".is-invalid");

    if (firstInvalid) {
      firstInvalid.focus();
    }

    return;
  }

  // ตรวจสอบวันที่
  if (dateInput.value > getTodayDate()) {
    alert("เลือกวันที่ไม่ถูกต้อง: วันที่ทำงานต้องไม่เป็นวันในอนาคต");
    dateInput.focus();
    return;
  }

 // แยก Evidence ทีละบรรทัด
  
  // แยก Evidence ทีละบรรทัด
  const evidence = document.getElementById("evidence").value
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "");

  // ตรวจสอบ Evidence
  const allLinksOk = evidence.length > 0 &&
    evidence.every(url => /^https?:\/\/.+/i.test(url));

  if (!allLinksOk) {
    alert("Evidence ต้องมีอย่างน้อย 1 ลิงก์ และขึ้นต้นด้วย http:// หรือ https://");
    return;
  }

  // อ่าน Skills
  const skills = document.getElementById("skills").value
    .split(",")
    .map(s => s.trim())
    .filter(s => s !== "");

  // สร้าง Item ใหม่
  const newItem = {
    title: document.getElementById("title").value.trim(),
    type: document.getElementById("type").value,
    typeDetails: typeSelect.value === "Other" ? otherTypeInput.value.trim() : "",
    date: document.getElementById("date").value,
    role: document.getElementById("role").value.trim(),
    description: document.getElementById("description").value.trim(),
    skills: skills,
    whatIDid: document.getElementById("whatIDid").value.trim(),
    whatILearned: document.getElementById("whatILearned").value.trim(),
    challenge: document.getElementById("challenge").value.trim(),
    nextStep: document.getElementById("nextStep").value.trim(),
    evidence: evidence
  };

  // เพิ่ม Item ใหม่ หรือแก้ไข Item เดิม
  if (editingItemIndex === null) {
    portfolio.items.push(newItem);
  } else {
    portfolio.items[editingItemIndex] = newItem;
    editingItemIndex = null;
  }

  saveData();
  itemForm.reset();
  renderAll();
});



itemsContainer.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  const portfolio = getSelectedPortfolio();
  if (!portfolio) return;

  const index = Number(button.dataset.index);
  const item = portfolio.items[index];
  if (!item) return;

  // ปุ่ม Edit
  if (button.classList.contains("edit-item-btn")) {
    editItem(index);
    return;
  }

  // ปุ่ม Delete
  if (button.classList.contains("delete-item-btn")) {
    if (!confirm(`ลบ "${item.title}" ใช่หรือไม่?`)) return;

    portfolio.items.splice(index, 1);
    saveData();
    renderAll();
  }
});

loadData().then(() => {

    renderAll();

    // เข้าสู่เว็บไซต์แล้วแสดงหน้า Home ก่อน
    showPage("homePage");

});
// loadData().then(renderAll);

// ===== Import Portfolio =====

const importFile = document.getElementById("importFile");
const importJson = document.getElementById("importJson");
const importError = document.getElementById("importError");
const validateImportBtn = document.getElementById("validateImportBtn");

let importedItem = null; // เก็บ Item ที่ตรวจผ่านแล้ว

// เลือกไฟล์ .json แล้วเอาข้อความไปใส่ในช่อง Textarea
importFile.addEventListener("change", () => {
  const file = importFile.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    importJson.value = reader.result;
  };
  reader.readAsText(file);
});

// กดปุ่มตรวจสอบ JSON
validateImportBtn.addEventListener("click", () => {
  importError.hidden = true;
  importedItem = null;

  // 1) ช่องว่าง
  if (importJson.value.trim() === "") {
    importError.textContent = "โปรดเลือกไฟล์หรือวาง JSON ก่อน";
    importError.hidden = false;
    return;
  }

  // 2) รูปแบบ JSON
  let data;
  try {
    data = JSON.parse(importJson.value);
  } catch (error) {
    importError.textContent = "รูปแบบ JSON ไม่ถูกต้อง";
    importError.hidden = false;
    return;
  }

  // 3) ถ้าเป็นไฟล์ทั้ง Portfolio ให้ดึง Item ออกมา
  if (data !== null && Array.isArray(data.items)) {
    if (data.items.length !== 1) {
      importError.textContent = "ไฟล์นี้มี " + data.items.length + " Item โปรดใช้ไฟล์ที่มี Item เดียว";
      importError.hidden = false;
      return;
    }
    data = data.items[0];
  }

  // ต้องเป็น Item 1 รายการ ไม่ใช่รายการหลายตัว
  if (data === null || Array.isArray(data)) {
    importError.textContent = "JSON ต้องเป็น Portfolio Item 1 รายการ";
    importError.hidden = false;
    return;
  }

  // 4) เช็กว่ามีข้อมูลครบไหม
  const fields = ["title", "type", "date", "role", "description", "skills", "reflection", "evidence"];
  const missing = [];
  fields.forEach(field => {
    if (!data[field]) missing.push(field);
  });

  if (missing.length > 0) {
    importError.textContent = "ข้อมูลไม่ครบ: " + missing.join(", ");
    importError.hidden = false;
    return;
  }

  // 5) reflection ต้องมีครบ 4 ช่อง
  const r = data.reflection;
  if (!r.whatIDid || !r.whatILearned || !r.challenge || !r.nextStep) {
    importError.textContent = "reflection ต้องมี whatIDid, whatILearned, challenge, nextStep";
    importError.hidden = false;
    return;
  }

  // 6) skills และ evidence ต้องเป็นรายการ อย่างน้อย 1 อย่าง
  if (!Array.isArray(data.skills) || data.skills.length === 0) {
    importError.textContent = "skills ต้องมีอย่างน้อย 1 รายการ";
    importError.hidden = false;
    return;
  }
  if (!Array.isArray(data.evidence) || data.evidence.length === 0) {
    importError.textContent = "evidence ต้องมีอย่างน้อย 1 ลิงก์";
    importError.hidden = false;
    return;
  }

  // 7) evidence ต้องขึ้นต้นด้วย http:// หรือ https://
  const linksOk = data.evidence.every(url => /^https?:\/\/.+/i.test(url));
  if (!linksOk) {
    importError.textContent = "evidence ต้องขึ้นต้นด้วย http:// หรือ https://";
    importError.hidden = false;
    return;
  }

  importedItem = data;
  alert("JSON ถูกต้อง พร้อม Import");
});