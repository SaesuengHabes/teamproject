
let portfolios = [];   // เก็บ Portfolio ทั้งหมด
let selectedId = null; // id ของ Portfolio ที่กำลังเลือกอยู่

const listEls = [
  document.getElementById("portfolioList"),
  document.getElementById("createPortfolioList")
];
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


function saveData() {
  localStorage.setItem("portfolios", JSON.stringify(portfolios));
  localStorage.setItem("selectedId", JSON.stringify(selectedId));
}

async function loadData() {
  const savedPortfolios = localStorage.getItem("portfolios");

  try {
    if (savedPortfolios !== null) {
      portfolios = JSON.parse(savedPortfolios) || [];
      selectedId = JSON.parse(localStorage.getItem("selectedId"));
    }

    const hasLegacyExample = portfolios.length === 1 && portfolios[0].name === "Portfolio ตัวอย่าง";
    if (savedPortfolios === null || hasLegacyExample) {
      const exampleFiles = ["portfolio-example.json", "portfolio-example-2.json"];
      const examples = await Promise.all(exampleFiles.map(async file => {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`โหลด ${file} ไม่สำเร็จ`);
        return response.json();
      }));

      portfolios = examples.map(example => ({
        id: example.portfolioId,
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
      }));
      selectedId = portfolios.length > 0 ? portfolios[0].id : null;
      saveData();
    }
  } catch (error) {
    console.error("ไม่สามารถโหลดข้อมูล Portfolio ได้:", error);
    portfolios = [];
    selectedId = null;
  }

  const found = portfolios.find(p => p.id === selectedId);
  if (!found) {
    selectedId = portfolios.length > 0 ? portfolios[0].id : null;
  }
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

  countBadge.textContent = portfolios.length;
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
                data-id="${p.id}">
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
      const skillsHtml = item.skills
        .map(skill => `<span>${escapeHtml(skill)}</span>`)
        .join("");

      const evidenceHtml = item.evidence
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

function showPage(pageId) {
  const isCreatePage = pageId === "createPage";
  createPage.hidden = !isCreatePage;
  createContent.hidden = !isCreatePage;
  portfolioPage.hidden = isCreatePage;
  portfolioContent.hidden = isCreatePage;

  pageTabs.forEach(tab => {
    const isActive = tab.dataset.page === pageId;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });
}


function validateField(field) {
  const input = field.querySelector("input, textarea");
  const isEmpty = input.value.trim() === "";
  field.classList.toggle("invalid", isEmpty);
}

portfolioForm.addEventListener("input", event => {
  const field = event.target.closest(".field");
  if (field) validateField(field);
});

pageTabs.forEach(tab => {
  tab.addEventListener("click", () => showPage(tab.dataset.page));
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
    id: Date.now(), 
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

 
  if (!itemForm.checkValidity()) {
    itemForm.reportValidity();
    return;
  }

  if (dateInput.value > getTodayDate()) {
    alert("เลือกวันที่ไม่ถูกต้อง: วันที่ทำงานต้องไม่เป็นวันในอนาคต");
    dateInput.focus();
    return;
  }

  // แยก Evidence ทีละบรรทัด

  const evidence = document.getElementById("evidence").value
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "");

  const allLinksOk = evidence.every(url => /^https?:\/\/.+/i.test(url));

  if (evidence.length === 0 || !allLinksOk) {
    alert("Evidence ต้องมีอย่างน้อย 1 ลิงก์ และขึ้นต้นด้วย http:// หรือ https://");
    return;
  }

  
  const skills = document.getElementById("skills").value
    .split(",")
    .map(s => s.trim())
    .filter(s => s !== "");

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

  portfolio.items.push(newItem);
  
  saveData();
  itemForm.reset();
  renderAll();
});


itemsContainer.addEventListener("click", event => {
  if (!event.target.classList.contains("delete-item-btn")) return;

  const portfolio = getSelectedPortfolio();
  const index = Number(event.target.dataset.index);
  const item = portfolio.items[index];

  if (!confirm(`ลบ "${item.title}" ใช่หรือไม่?`)) return;

  portfolio.items.splice(index, 1);

  saveData();
  renderAll();

});

loadData().then(renderAll);
 