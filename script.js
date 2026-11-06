
// 1) ตัวแปรเก็บข้อมูล

let portfolios = [];   // เก็บ Portfolio ทั้งหมด
let selectedId = null; // id ของ Portfolio ที่กำลังเลือกอยู่


// 2) ดึง element จากหน้าเว็บมาเก็บไว้ใช้

const listEl = document.getElementById("portfolioList");
const countBadge = document.getElementById("countBadge");
const emptyState = document.getElementById("emptyState");
const detailContent = document.getElementById("detailContent");

const detailTitle = document.getElementById("detailTitle");
const detailEnjoy = document.getElementById("detailEnjoy");
const detailTried = document.getElementById("detailTried");
const detailCurious = document.getElementById("detailCurious");

const itemsContainer = document.getElementById("itemsContainer");
const itemCount = document.getElementById("itemCount");
const deleteBtn = document.getElementById("deleteBtn");

const portfolioForm = document.getElementById("portfolioForm");
const portfolioFields = portfolioForm.querySelectorAll(".field");
const itemForm = document.getElementById("item-form");
const typeSelect = document.getElementById("type");
const otherTypeField = document.getElementById("otherTypeField");
const otherTypeInput = document.getElementById("otherType");
const dateInput = document.getElementById("date");

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


// 3) บันทึก / โหลดข้อมูล (localStorage)
 //แปลง JSON

function saveData() {
  localStorage.setItem("portfolios", JSON.stringify(portfolios));
  localStorage.setItem("selectedId", JSON.stringify(selectedId));
}

function loadData() {
  try {
    portfolios = JSON.parse(localStorage.getItem("portfolios")) || [];
    selectedId = JSON.parse(localStorage.getItem("selectedId"));
  } catch (error) {
    // ถ้าข้อมูลเสีย ให้เริ่มใหม่
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

  listEl.innerHTML = portfolios
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


// 6) ตรวจฟอร์ม Portfolio 

function validateField(field) {
  const input = field.querySelector("input, textarea");
  const isEmpty = input.value.trim() === "";
  field.classList.toggle("invalid", isEmpty);
}

portfolioFields.forEach(field => {
  const input = field.querySelector("input, textarea");
  input.addEventListener("input", () => validateField(field));
});


// 7) เหตุการณ์ต่าง ๆ (กดปุ่ม / ส่งฟอร์ม)



listEl.addEventListener("click", event => {
  const button = event.target.closest(".portfolio-item");
  if (!button) return;

  selectedId = Number(button.dataset.id);
  saveData();
  renderAll();
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


loadData();
renderAll();
 