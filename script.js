let portfolios = [];
let selectedId = null;
let nextId = 1;

const listEl = document.getElementById("portfolioList");
const badgeEl = document.getElementById("countBadge");
const contentEl = document.getElementById("detailContent");
const emptyEl = document.getElementById("emptyState");

const titleEl = document.getElementById("detailTitle");
const enjoyEl = document.getElementById("detailEnjoy");
const triedEl = document.getElementById("detailTried");
const curiousEl = document.getElementById("detailCurious");
const itemsContainer = document.getElementById("itemsContainer");
const itemCountEl = document.getElementById("itemCount");
const deleteBtn = document.getElementById("deleteBtn");

const portfolioForm = document.getElementById("portfolioForm");
const portfolioFields = portfolioForm.querySelectorAll(".field");
const itemForm = document.getElementById("item-form");

function renderList() {
    badgeEl.textContent = portfolios.length;
    listEl.innerHTML = "";

    portfolios.forEach(portfolio => {
        const li = document.createElement("li");
        const button = document.createElement("button");

        button.type = "button";
        button.className =
            "portfolio-item" +
            (portfolio.id === selectedId ? " active" : "");

        const name = document.createElement("span");
        name.className = "name";
        name.textContent = portfolio.name;

        const count = document.createElement("span");
        count.className = "count";
        count.textContent = `${portfolio.items.length} รายการ`;

        button.append(name, count);
        button.addEventListener("click", () => selectPortfolio(portfolio.id));

        li.appendChild(button);
        listEl.appendChild(li);
    });
}

function renderItems(portfolio) {
    itemsContainer.innerHTML = "";

    // อัปเดตจำนวน Portfolio Items
    itemCountEl.textContent = portfolio.items.length;

    if (portfolio.items.length === 0) {
        itemsContainer.textContent = "ยังไม่มี Portfolio Item";
        return;
    }

    portfolio.items.forEach((item, index) => {
        const article = document.createElement("article");
        article.className = "portfolio-item-card";

        const title = document.createElement("h3");
        title.className = "item-title";
        title.textContent = item.title;

        const details = document.createElement("p");
        details.className = "item-meta";
        details.textContent = `${item.type} · ${item.date} · ${item.role}`;

        const description = document.createElement("p");
        description.className = "item-description";
        description.textContent = item.description;

        const skills = document.createElement("div");
        skills.className = "item-skills";

        item.skills.forEach(skill => {
            const tag = document.createElement("span");
            tag.textContent = skill;
            skills.appendChild(tag);
        });

        const reflection = document.createElement("div");
        reflection.className = "item-reflection";

        [
            ["What I did", item.whatIDid],
            ["What I learned", item.whatILearned],
            ["Challenge", item.challenge],
            ["Next step", item.nextStep]
        ].forEach(([label, value]) => {
            const heading = document.createElement("h4");
            heading.textContent = label;

            const text = document.createElement("p");
            text.textContent = value;

            reflection.append(heading, text);
        });

        const evidence = document.createElement("div");
        evidence.className = "item-evidence";

        const evidenceTitle = document.createElement("p");
        evidenceTitle.textContent = "Evidence";
        evidence.appendChild(evidenceTitle);

        const evidenceList = document.createElement("ul");

        item.evidence.forEach(url => {
            const listItem = document.createElement("li");
            const link = document.createElement("a");

            link.href = url;
            link.textContent = url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            listItem.appendChild(link);
            evidenceList.appendChild(listItem);
        });

        evidence.appendChild(evidenceList);

        const deleteItemBtn = document.createElement("button");
        deleteItemBtn.type = "button";
        deleteItemBtn.className = "delete-item-btn";
        deleteItemBtn.textContent = "ลบ Item";

        deleteItemBtn.addEventListener("click", () => {
            if (!confirm(`ลบ "${item.title}" ใช่หรือไม่?`)) return;

            portfolio.items.splice(index, 1);
            renderList();
            renderItems(portfolio);
        });

        article.append(
            title,
            details,
            description,
            skills,
            reflection,
            evidence,
            deleteItemBtn
        );

        itemsContainer.appendChild(article);
    });
}

function renderDetail() {
    const portfolio = portfolios.find(p => p.id === selectedId);

    contentEl.hidden = !portfolio;
    emptyEl.hidden = Boolean(portfolio);

    if (!portfolio) {
        itemCountEl.textContent = 0;
        return;
    }

    titleEl.textContent = portfolio.name;
    enjoyEl.textContent = portfolio.enjoy;
    triedEl.textContent = portfolio.tried;
    curiousEl.textContent = portfolio.curious;

    renderItems(portfolio);
}

function selectPortfolio(id) {
    selectedId = id;
    renderList();
    renderDetail();
}

deleteBtn.addEventListener("click", () => {
    const portfolio = portfolios.find(p => p.id === selectedId);

    if (!portfolio || !confirm(`ลบ "${portfolio.name}" ใช่หรือไม่?`)) {
        return;
    }

    portfolios = portfolios.filter(p => p.id !== selectedId);
    selectedId = portfolios.length ? portfolios[0].id : null;

    renderList();
    renderDetail();
});

function validatePortfolioField(field) {
    const input = field.querySelector("input, textarea");
    field.classList.toggle("invalid", input.value.trim() === "");
}

portfolioFields.forEach(field => {
    const input = field.querySelector("input, textarea");
    input.addEventListener("input", () => validatePortfolioField(field));
});

portfolioForm.addEventListener("submit", event => {
    event.preventDefault();

    portfolioFields.forEach(validatePortfolioField);
    if (portfolioForm.querySelector(".invalid")) return;

    const portfolio = {
        id: nextId++,
        name: document.getElementById("displayName").value.trim(),
        enjoy: document.getElementById("enjoy").value.trim(),
        tried: document.getElementById("tried").value.trim(),
        curious: document.getElementById("curious").value.trim(),
        items: []
    };

    portfolios.push(portfolio);
    selectedId = portfolio.id;

    portfolioForm.reset();
    portfolioFields.forEach(validatePortfolioField);

    renderList();
    renderDetail();
});

// เพิ่ม Portfolio Item ให้ Portfolio ที่เลือกอยู่
itemForm.addEventListener("submit", event => {
    event.preventDefault();

    if (selectedId === null) {
        alert("กรุณาสร้างหรือเลือก Portfolio ก่อน");
        return;
    }

    if (!itemForm.checkValidity()) {
        itemForm.reportValidity();
        return;
    }

    const portfolio = portfolios.find(p => p.id === selectedId);

    const evidence = document.getElementById("evidence").value
        .split("\n")
        .map(url => url.trim())
        .filter(url => url !== "");

    const invalidEvidence = evidence.some(url =>
        !/^https?:\/\/.+/i.test(url)
    );

    if (evidence.length === 0 || invalidEvidence) {
        alert("Evidence ต้องมีอย่างน้อย 1 ลิงก์ และขึ้นต้นด้วย http:// หรือ https://");
        return;
    }

    const item = {
        title: document.getElementById("title").value.trim(),
        type: document.getElementById("type").value,
        date: document.getElementById("date").value,
        role: document.getElementById("role").value.trim(),
        description: document.getElementById("description").value.trim(),
        skills: document.getElementById("skills").value
            .split(",")
            .map(skill => skill.trim())
            .filter(skill => skill !== ""),
        whatIDid: document.getElementById("whatIDid").value.trim(),
        whatILearned: document.getElementById("whatILearned").value.trim(),
        challenge: document.getElementById("challenge").value.trim(),
        nextStep: document.getElementById("nextStep").value.trim(),
        evidence
    };

    portfolio.items.push(item);

    itemForm.reset();
    renderList();
    renderItems(portfolio);
});

renderList();
renderDetail();