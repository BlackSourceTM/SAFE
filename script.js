// script.js
// نسخه اولیه – فقط منطق ساده UI و آماده‌سازی برای مراحل بعدی

(function () {
  const root = document.documentElement;
  const themeToggleBtn = document.getElementById("themeToggle");
  const encryptBtn = document.getElementById("encryptBtn");
  const decryptBtn = document.getElementById("decryptBtn");
  const statusList = document.getElementById("statusList");

  // ========== مدیریت تم تیره / روشن ==========

  function getStoredTheme() {
    try {
      return localStorage.getItem("safe_theme");
    } catch {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem("safe_theme", theme);
    } catch {
      // نادیده بگیر
    }
  }

  function applyTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
  }

  function toggleTheme() {
    const current = root.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    storeTheme(next);
  }

  // مقدار اولیه تم
  (function initTheme() {
    const stored = getStoredTheme();
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (stored === "light") {
      applyTheme("light");
    } else if (stored === "dark") {
      applyTheme("dark");
    } else if (prefersDark) {
      applyTheme("dark");
    } else {
      applyTheme("light");
    }
  })();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  // ========== مدیریت وضعیت ساده (دمو) ==========

  function addStatusItem(message, type) {
    if (!statusList) return;

    const li = document.createElement("li");
    li.textContent = message;

    if (type === "info") {
      li.textContent = `🔵 ${message}`;
    } else if (type === "success") {
      li.textContent = `🟢 ${message}`;
    } else if (type === "warn") {
      li.textContent = `🟡 ${message}`;
    } else if (type === "error") {
      li.textContent = `🔴 ${message}`;
    }

    statusList.appendChild(li);
  }

  function showComingSoon(featureName) {
    const text = `بخش «${featureName}» هنوز در حال توسعه است و در نسخه‌های بعدی فعال می‌شود.`;
    addStatusItem(text, "info");
    alert(text);
  }

  if (encryptBtn) {
    encryptBtn.addEventListener("click", function () {
      showComingSoon("Encrypt فایل");
    });
  }

  if (decryptBtn) {
    decryptBtn.addEventListener("click", function () {
      showComingSoon("Decrypt فایل SAFE");
    });
  }

  // ========== TODOهای آینده (یادداشت برای خودمان) ==========

  // 1) اضافه کردن Telegram WebApp init:
  //    - خواندن داده‌های initData (user_id، chat_id، ...).
  //    - اعتبارسنجی initData در Worker.
  //
  // 2) پیاده‌سازی ماژول Crypto:
  //    - استفاده از Web Crypto API برای AES-256-GCM + PBKDF2.
  //    - ساخت و تحلیل فرمت فایل .SAFE.
  //
  // 3) ارتباط با Cloudflare Worker:
  //    - endpoint برای دریافت file_url از Telegram (getFile).
  //    - endpoint برای ثبت لاگ متادیتا encrypt/decrypt.
  //
  // 4) پیاده‌سازی Drag & Drop واقعی برای dropzone:
  //    - خواندن فایل‌ها با File API.
  //    - نمایش progress bar و state ماشین پروسه.
})();
