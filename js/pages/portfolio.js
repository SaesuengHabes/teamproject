/* 
   portfolio.js — หน้าดู Portfolio (pages/portfolio.html)
   1. โหลด Portfolio ทั้งหมดจาก server (GET backend/portfolios.php) แล้วแสดง
   2. ส่งออก: my-portfolio.json / Portfolio Item JSON (Copy หรือ Download)
   3. ลบ Portfolio / ลบ Item (POST + action=delete) แล้วโหลดใหม่
    */
(async function () {
  const $ = id => document.getElementById(id);
  const esc = UI.escapeHtml;

  const listEl = $("portfolioList");
  const itemsContainer = $("itemsContainer");
  const AVATAR_COLORS = ["#2a4d88", "#1f8a70", "#c0632f", "#7b4fb5", "#b8445e", "#2d7fa8"];
  const MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  /* ---------- ตัวช่วย ---------- */
  const initial = name => (Array.from(String(name).trim())[0] || "?").toUpperCase();

  function avatarColor(name) {
    let hash = 0;
    for (const ch of String(name)) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }

  function formatDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${Number(m[1]) + 543}` : value || "";
  }

  /* =====================================================
     1. แสดงผล
     ===================================================== */
  function renderList() {
    const portfolios = PortfolioData.getAll();
    const selectedId = PortfolioData.getSelectedId();
    $("portfolioCount").textContent = portfolios.length;

    if (portfolios.length === 0) {
      listEl.innerHTML = '<li class="list-empty">ยังไม่มี Portfolio ที่บันทึก</li>';
      return;
    }

    listEl.innerHTML = portfolios.map(p => `
      <li>
        <button type="button" class="portfolio-item ${p.id === selectedId ? "active" : ""}"
                data-id="${esc(p.id)}" aria-pressed="${p.id === selectedId}">
          <span class="avatar" style="--avatar-color:${avatarColor(p.displayName)}" aria-hidden="true">${esc(initial(p.displayName))}</span>
          <span class="min-w-0">
            <span class="name">${esc(p.displayName)}</span>
            <span class="count">${p.items.length} รายการ</span>
          </span>
        </button>
      </li>
    `).join("");
  }

  listEl.addEventListener("click", event => {
    const button = event.target.closest(".portfolio-item");
    if (!button) return;
    PortfolioData.select(button.dataset.id);
    renderAll();
    if (window.innerWidth < 992) $("detailArea").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function renderDetail() {
    const portfolio = PortfolioData.getSelected();
    $("emptyState").hidden = Boolean(portfolio);
    $("detailContent").hidden = !portfolio;
    $("itemsSection").hidden = !portfolio;
    if (!portfolio) return;

    const avatar = $("detailAvatar");
    avatar.textContent = initial(portfolio.displayName);
    avatar.style.setProperty("--avatar-color", avatarColor(portfolio.displayName));

    $("detailTitle").textContent = portfolio.displayName;
    $("detailEnjoy").textContent = portfolio.whatIEnjoy || "-";
    $("detailTried").textContent = portfolio.whatIveTried || "-";
    $("detailCurious").textContent = portfolio.whatImCuriousAbout || "-";
    $("addItemLink").href = "create.html";

    renderItems(portfolio);
  }

  function itemCard(item, portfolioId) {
    const r = item.reflection || {};
    const skills = (item.skills || []).map(s => `<span>${esc(s)}</span>`).join("");
    const evidence = (item.evidence || [])
      .filter(url => /^https?:\/\//i.test(url))
      .map(url => `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a></li>`)
      .join("");
    const reflection = [
      ["What I did", r.whatIDid],
      ["What I learned", r.whatILearned],
      ["Challenge", r.challenge],
      ["Next step", r.nextStep]
    ].map(([label, value]) => `<div><h4>${label}</h4><p>${esc(value || "-")}</p></div>`).join("");
    const editUrl = `create.html?portfolio=${encodeURIComponent(portfolioId)}&edit=${encodeURIComponent(item.id)}`;

    return `
      <article class="portfolio-item-card" data-reveal>
        <h3 class="item-title">${esc(item.title)}</h3>
        <div class="item-meta">
          ${item.type ? `<span class="meta-chip meta-chip--type">${esc(item.type)}</span>` : ""}
          ${item.date ? `<span class="meta-chip">📅 ${esc(formatDate(item.date))}</span>` : ""}
          ${item.role ? `<span class="meta-chip">👤 ${esc(item.role)}</span>` : ""}
        </div>

        <p class="mb-0">${esc(item.description)}</p>
        ${skills ? `<div class="item-skills">${skills}</div>` : ""}

        <div class="item-reflection">${reflection}</div>

        ${evidence ? `
          <div class="item-evidence">
            <h4 class="small fw-bold text-body-secondary mb-1">Evidence</h4>
            <ul>${evidence}</ul>
          </div>` : ""}

        <div class="item-actions">
          <button type="button" class="btn btn-sm btn-outline-primary" data-action="export" data-item-id="${esc(item.id)}">📤 ส่งออก JSON</button>
          <a href="${esc(editUrl)}" class="btn btn-sm btn-edit">✏️ แก้ไข</a>
          <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-item-id="${esc(item.id)}">🗑 ลบ</button>
        </div>
      </article>
    `;
  }

  function renderItems(portfolio) {
    $("itemCount").textContent = portfolio.items.length;
    itemsContainer.innerHTML = portfolio.items.length
      ? portfolio.items.map(item => itemCard(item, portfolio.id)).join("")
      : '<p class="text-body-secondary mb-0">ยังไม่มี Portfolio Item</p>';
    UI.reveal(itemsContainer);
  }

  function renderAll() {
    renderList();
    renderDetail();
  }

  /* =====================================================
     2. ส่งออก JSON (สร้างไฟล์ใน browser จากข้อมูลที่โหลดมา)
     ===================================================== */
  const jsonModal = new bootstrap.Modal($("jsonModal"));
  let current = null;

  function toFilename(title) {
    const slug = String(title || "item").trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 60);
    return `portfolio-item-${slug || "item"}.json`;
  }

  function openJsonModal({ title, hint, data, filename }) {
    current = { data, filename };
    $("jsonModalTitle").textContent = title;
    $("jsonModalHint").textContent = hint;
    $("jsonModalText").value = JSON.stringify(data, null, 2);
    $("jsonModalFile").textContent = `ไฟล์: ${filename}`;
    jsonModal.show();
  }

  $("exportBtn").addEventListener("click", () => {
  const portfolio = PortfolioData.getSelected();
  if (!portfolio) return;
  openJsonModal({
    title: "Export My Portfolio",
    hint: "ไฟล์ Portfolio ทั้งหมดของคุณ (my-portfolio.json) สำหรับส่งงาน",
    data: portfolio,
    filename: "my-portfolio.json"
    });
  });

    $("jsonCopyBtn").addEventListener("click", async () => {
    const button = $("jsonCopyBtn");
    const originalText = button.textContent;

    // ป้องกันการกดซ้ำระหว่างกำลังคัดลอก
    button.disabled = true;

    try {
      const ok = await UI.copyText($("jsonModalText").value);

      if (ok) {
        button.textContent = "Copied!";

        UI.toast(
          "คัดลอก JSON สำเร็จแล้ว",
          "success"
        );

        // คืนข้อความปุ่มหลัง 2 วินาที
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 2000);

      } else {
        UI.toast(
          "คัดลอกไม่สำเร็จ กรุณาใช้ปุ่ม Download แทน",
          "error"
        );

        button.disabled = false;
      }

    } catch (error) {
      console.error("Copy JSON error:", error);

      UI.toast(
        "เกิดข้อผิดพลาดในการคัดลอก JSON",
        "error"
      );

      button.disabled = false;
    }
  });

  $("jsonDownloadBtn").addEventListener("click", () => {
    if (!current) return;
    const blob = new Blob([JSON.stringify(current.data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = current.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    UI.toast(`ดาวน์โหลด ${current.filename} แล้ว`);
  });

  /* =====================================================
     3. ลบ
     ===================================================== */
  $("deleteBtn").addEventListener("click", async () => {
    const portfolio = PortfolioData.getSelected();
    if (!portfolio || !confirm(`ลบ "${portfolio.displayName}" ใช่หรือไม่?`)) return;

    try {
      await UI.withBusy($("deleteBtn"), () => PortfolioData.deletePortfolio(portfolio.id));
      renderAll();
      UI.toast(`ลบ "${portfolio.displayName}" แล้ว`, "info");
    } catch (error) {
      UI.toast(error.message, "error", 5000);
    }
  });

  itemsContainer.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const portfolio = PortfolioData.getSelected();
    const item = portfolio?.items.find(i => i.id === button.dataset.itemId);
    if (!item) return;

    if (button.dataset.action === "export") {
      openJsonModal({
        title: "Portfolio Item JSON",
        hint: `"${item.title}" — ให้เพื่อนกด Copy หรือ Download แล้วนำไป Import ในหน้า "สร้าง Portfolio"`,
        data: item,
        filename: toFilename(item.title)
      });
      return;
    }

    if (button.dataset.action === "delete") {
      if (!confirm(`ลบ "${item.title}" ใช่หรือไม่?`)) return;
      try {
        await UI.withBusy(button, () => PortfolioData.deleteItem(portfolio.id, item.id));
        renderAll();
        UI.toast(`ลบ "${item.title}" แล้ว`, "info");
      } catch (error) {
        UI.toast(error.message, "error", 5000);
      }
    }
  });

  /* ---------- เริ่มต้น: โหลดจาก server ---------- */
  try {
    await PortfolioData.loadPortfolios();
  } catch (error) {
    UI.toast(error.message, "error", 8000);
  }
  renderAll();
})();
