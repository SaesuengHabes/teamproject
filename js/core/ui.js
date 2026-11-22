/* 
   ui.js — ฟังก์ชันช่วยเหลือที่ใช้ร่วมกันทุกหน้า
   - escapeHtml, getTodayDate, copyText
   - toast()          : กล่องแจ้งเตือนเล็ก ๆ แทน alert()
   - withBusy()       : ปุ่มหมุนรอระหว่างส่งข้อมูลไป server
   - ripple           : เอฟเฟกต์คลื่นเมื่อกดปุ่ม
   - reveal           : ค่อย ๆ แสดงองค์ประกอบเมื่อเลื่อนมาถึง
   - page transition  : เฟดออกก่อนเปลี่ยนหน้า
   - navbar shadow    : Navbar มีเงาเมื่อเลื่อนหน้า
    */
const UI = (() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ข้อความ / วันที่ ---------- */
  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getTodayDate() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  /* ---------- คลิปบอร์ด ---------- */
  /** คัดลอกข้อความ — ใช้ Clipboard API ถ้ามี (ต้องเป็น HTTPS) ไม่งั้นใช้วิธีเก่า (ใช้ได้บน HTTP) */

  async function copyText(text) {
    const content = String(text ?? "");

    // วิธีที่ 1: ใช้ Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(content);
        return true;
      } catch (error) {
        console.warn("Clipboard API failed:", error);
      }
    }

    // วิธีที่ 2: Fallback ด้วย textarea
    const area = document.createElement("textarea");
    area.value = content;
    area.setAttribute("readonly", "");

    area.style.position = "fixed";
    area.style.left = "-9999px";
    area.style.top = "0";

    document.body.appendChild(area);

    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);

    let success = false;

    try {
      success = document.execCommand("copy");
    } catch (error) {
      console.error("Fallback copy failed:", error);
    }

    area.remove();

    return success;
  }

  /* ---------- Toast ---------- */
  function getToastStack() {
    let stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    return stack;
  }

  function toast(message, type = "success", duration = 2800) {
    const icons = { success: "✓", error: "!", info: "i" };
    const el = document.createElement("div");
    el.className = `app-toast app-toast--${type}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.innerHTML = `<span class="app-toast__icon">${icons[type] || "i"}</span><span>${escapeHtml(message)}</span>`;
    getToastStack().appendChild(el);

    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 600); // กันกรณีไม่มี transition
    }, duration);
  }

  /* ---------- Ripple ---------- */
  function initRipple() {
    document.addEventListener("pointerdown", event => {
      const button = event.target.closest(".btn, .ripple");
      if (!button || reducedMotion || button.disabled) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const wave = document.createElement("span");
      wave.className = "ripple-wave";
      wave.style.width = wave.style.height = `${size}px`;
      wave.style.left = `${event.clientX - rect.left - size / 2}px`;
      wave.style.top = `${event.clientY - rect.top - size / 2}px`;
      button.appendChild(wave);
      wave.addEventListener("animationend", () => wave.remove());
    });
  }

  /* ---------- Reveal on scroll ---------- */
  let observer = null;

  function reveal(root = document) {
    const targets = root.querySelectorAll("[data-reveal]:not(.is-visible)");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach(el => el.classList.add("is-visible"));
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.1 });
    }
    targets.forEach((el, i) => {
      if (!el.style.getPropertyValue("--reveal-delay")) {
        el.style.setProperty("--reveal-delay", `${Math.min(i, 8) * 70}ms`);
      }
      observer.observe(el);
    });
  }

  /* ---------- Page transition ---------- */
  function initPageTransitions() {
    document.addEventListener("click", event => {
      const link = event.target.closest("a[href]");
      if (!link || reducedMotion) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

      const url = new URL(link.href, location.href);
      const samePage = url.pathname === location.pathname && url.search === location.search;
      if (url.origin !== location.origin || samePage || !/\.(html|php)$/.test(url.pathname)) return;

      event.preventDefault();
      document.body.classList.add("is-leaving");
      setTimeout(() => { location.href = url.href; }, 220);
    });

    // กลับมาด้วยปุ่ม Back แล้วหน้าเว็บยังจาง → แก้ให้กลับมาปกติ
    window.addEventListener("pageshow", () => document.body.classList.remove("is-leaving"));
  }

  /* ---------- Navbar มีเงาเมื่อเลื่อนหน้าลง ---------- */
  function initNavbarShadow() {
    const navbar = document.querySelector(".site-navbar");
    if (!navbar) return;
    const update = () => navbar.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /** ปิดปุ่มระหว่างรอ server แล้วเปิดคืนเมื่อเสร็จ */
  async function withBusy(button, task) {
    const label = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>กำลังบันทึก...`;
    try {
      return await task();
    } finally {
      button.disabled = false;
      button.innerHTML = label;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initNavbarShadow();
    initRipple();
    initPageTransitions();
    reveal();
  });

  return {
    reducedMotion, escapeHtml, getTodayDate, toast, reveal, copyText, withBusy
  };
})();
