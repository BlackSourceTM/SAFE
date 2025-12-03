// script.js
// Mini App SAFE – نسخه‌ی به‌روز با:
// - رمزنگاری هدر SAFE
// - کنترل قوی رمز عبور + کپچا
// - تم و ترجمه
// - مودال مرکزی برای پاپ‌آپ‌ها

(function () {
  "use strict";

  // ========================
  // تنظیمات کلی
  // ========================
  const SAFE_CONFIG = {
    maxFileSizeBytes: 500 * 1024 * 1024, // 500MB پیشنهادی
    pbkdf2: {
      iterations: 200000,
      hash: "SHA-256",
      saltBytes: 16
    },
    aesGcm: {
      name: "AES-GCM",
      ivBytes: 12,
      keyLength: 256
    },
    fileMagic: "SAFE",
    fileVersion: 1
  };

  // ========================
  // i18n ساده
  // ========================
  let currentLang = "fa";

  const i18nDict = {
    fa: {
      title: "SAFE – E2Ebox",
      subtitle: "رمزنگاری سرتاسری فایل‌ها فقط روی دستگاه شما",
      hero_title: "نسخه‌ی اولیه Mini App SAFE",
      hero_text:
        "در این نسخه می‌توانید فایل‌های خود را به صورت محلی (بدون ارسال به سرور) با استفاده از Web Crypto API رمزنگاری و رمزگشایی کنید. فرمت خروجی .SAFE است.",
      hero_hint:
        "⚠️ این نسخه هنوز به ربات تلگرام و Cloudflare Worker متصل نشده است. همه چیز فقط روی دستگاه شما انجام می‌شود.",
      mode_encrypt: "🔐 رمزنگاری (Encrypt)",
      mode_decrypt: "🔓 رمزگشایی (Decrypt)",
      step1_title: "۱. انتخاب فایل",
      step1_text:
        "می‌توانید فایل را از حافظه دستگاه انتخاب کنید یا روی باکس زیر دراپ کنید.",
      choose_file: "انتخاب فایل",
      drop_here: "فایل خود را اینجا بکشید و رها کنید",
      no_file: "فایلی انتخاب نشده است.",
      size_hint:
        "محدودیت پیشنهادی فعلی: حداکثر ۵۰۰ مگابایت. برای فایل‌های خیلی بزرگ، در نسخه‌های بعدی از استریم و چانک استفاده می‌کنیم.",
      step2_title: "۲. تنظیم رمز عبور و کپچا",
      step2_text:
        "یک رمز عبور قوی انتخاب کنید. این رمز روی سرور ذخیره نمی‌شود و فقط برای مشتق‌سازی کلید در دستگاه شما استفاده می‌شود.",
      password_label: "رمز عبور",
      password_next: "مرحله بعد (تایید رمز)",
      rule_length: "حداقل ۸ کاراکتر",
      rule_digit: "حداقل یک عدد",
      rule_mixedcase: "ترکیب حروف کوچک و بزرگ انگلیسی",
      rule_special: "حداقل یک کاراکتر خاص (!@#$...)",
      rule_english: "فقط حروف/اعداد انگلیسی (بدون حروف فارسی و ...)",
      password_confirm_label: "تکرار رمز عبور",
      captcha_label: "کپچا (برای تایید انسان بودن)",
      start_btn: "شروع عملیات",
      status_title: "وضعیت و لاگ",
      footer_main:
        "SAFE – E2Ebox | این نسخه فقط روی دستگاه شما کار می‌کند و فایل خام را به سرور ارسال نمی‌کند.",
      footer_secondary:
        "در نسخه‌های بعدی، اتصال امن به ربات تلگرام، Cloudflare Worker و مدیریت سهمیه ماهانه اضافه می‌شود."
    },
    en: {
      title: "SAFE – E2Ebox",
      subtitle: "End-to-end file encryption on your device only",
      hero_title: "SAFE Mini App – Early Version",
      hero_text:
        "In this version, you can encrypt and decrypt your files locally (without sending them to a server) using the Web Crypto API. Output format is .SAFE.",
      hero_hint:
        "⚠️ This build is not yet connected to the Telegram bot or Cloudflare Worker. Everything runs only on your device.",
      mode_encrypt: "🔐 Encrypt",
      mode_decrypt: "🔓 Decrypt",
      step1_title: "1. Choose a file",
      step1_text:
        "You can pick a file from your device or drag & drop it into the box below.",
      choose_file: "Choose file",
      drop_here: "Drag & drop your file here",
      no_file: "No file selected.",
      size_hint:
        "Current recommended limit: up to 500 MB. For very large files we will use streaming/chunking in future versions.",
      step2_title: "2. Set password & captcha",
      step2_text:
        "Choose a strong password. It is never sent to a server and is only used locally to derive the encryption key.",
      password_label: "Password",
      password_next: "Next step (confirm password)",
      rule_length: "At least 8 characters",
      rule_digit: "At least one digit",
      rule_mixedcase: "Mix of upper & lower case letters",
      rule_special: "At least one special character (!@#$...)",
      rule_english: "English letters/digits only (no non-Latin chars)",
      password_confirm_label: "Repeat password",
      captcha_label: "Captcha (prove you are human)",
      start_btn: "Start",
      status_title: "Status & log",
      footer_main:
        "SAFE – E2Ebox | This version runs entirely on your device and never uploads raw files.",
      footer_secondary:
        "Future versions will add a secure connection to the Telegram bot, Cloudflare Worker and monthly quota management."
    }
  };

  function applyLang(lang) {
    currentLang = lang;
    const dict = i18nDict[lang];
    if (!dict) return;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    const html = document.documentElement;
    if (lang === "fa") {
      html.setAttribute("lang", "fa");
      html.setAttribute("dir", "rtl");
    } else {
      html.setAttribute("lang", "en");
      html.setAttribute("dir", "ltr");
    }

    const langToggleLabel = document.getElementById("langToggleLabel");
    if (langToggleLabel) {
      langToggleLabel.textContent = lang === "fa" ? "FA" : "EN";
    }
  }

  // ========================
  // المان‌های DOM
  // ========================
  const root = document.documentElement;
  const themeToggleBtn = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const langToggleBtn = document.getElementById("langToggle");

  const modeEncryptBtn = document.getElementById("modeEncryptBtn");
  const modeDecryptBtn = document.getElementById("modeDecryptBtn");
  const currentModeText = document.getElementById("currentModeText");

  const fileInput = document.getElementById("fileInput");
  const dropzone = document.getElementById("dropzone");
  const selectedFileName = document.getElementById("selectedFileName");

  const passwordInput = document.getElementById("passwordInput");
  const passwordConfirmInput = document.getElementById("passwordConfirmInput");
  const passwordToggleBtn = document.getElementById("passwordToggleBtn");
  const passwordConfirmToggleBtn = document.getElementById(
    "passwordConfirmToggleBtn"
  );
  const passwordNextBtn = document.getElementById("passwordNextBtn");
  const passwordStrengthFill = document.getElementById(
    "passwordStrengthFill"
  );
  const passwordStrengthText = document.getElementById(
    "passwordStrengthText"
  );
  const ruleLengthEl = document.getElementById("rule-length");
  const ruleDigitEl = document.getElementById("rule-digit");
  const ruleMixedCaseEl = document.getElementById("rule-mixedcase");
  const ruleSpecialEl = document.getElementById("rule-special");
  const ruleEnglishEl = document.getElementById("rule-english");
  const confirmFieldContainer = document.getElementById(
    "confirmFieldContainer"
  );
  const passwordMatchHint = document.getElementById("passwordMatchHint");

  const captchaTextEl = document.getElementById("captchaText");
  const captchaInput = document.getElementById("captchaInput");
  const captchaRefreshBtn = document.getElementById("captchaRefreshBtn");
  const botTrapInput = document.getElementById("botTrap");

  const startBtn = document.getElementById("startBtn");

  const progressContainer = document.getElementById("progressContainer");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  const statusList = document.getElementById("statusList");

  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  // ========================
  // State
  // ========================
  let currentMode = "encrypt"; // "encrypt" یا "decrypt"
  let selectedFile = null;
  let basePassword = "";
  let humanDelayPassed = false;
  let currentCaptchaCode = "";

  // ========================
  // ابزارهای UI
  // ========================
  function logStatus(message, type) {
    if (!statusList) return;
    const li = document.createElement("li");

    let icon = "🔵";
    if (type === "success") icon = "🟢";
    else if (type === "warn") icon = "🟡";
    else if (type === "error") icon = "🔴";

    li.textContent = `${icon} ${message}`;
    statusList.appendChild(li);
  }

  function setProgress(percent, text) {
    if (!progressContainer || !progressFill || !progressText) return;
    progressContainer.hidden = false;
    const safePercent = Math.max(0, Math.min(100, percent));
    progressFill.style.width = `${safePercent}%`;
    if (text) progressText.textContent = text;
  }

  function resetProgress() {
    if (!progressContainer || !progressFill || !progressText) return;
    progressFill.style.width = "0%";
    progressText.textContent = "منتظر شروع عملیات...";
    progressContainer.hidden = true;
  }

  function humanFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(2)} ${units[i]}`;
  }

  // مودال
  function showModal(title, message) {
    if (!modalBackdrop || !modalTitle || !modalMessage) return;
    modalTitle.textContent = title || "پیام سیستم";
    modalMessage.textContent = message || "";
    modalBackdrop.hidden = false;
  }

  function hideModal() {
    if (!modalBackdrop) return;
    modalBackdrop.hidden = true;
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", hideModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) hideModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModal();
  });

  // ========================
  // تم تیره / روشن
  // ========================
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
      // ignore
    }
  }

  function applyTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
      if (themeIcon) themeIcon.textContent = "☀️";
    } else {
      root.removeAttribute("data-theme");
      if (themeIcon) themeIcon.textContent = "🌙";
    }
  }

  function toggleTheme() {
    const current = root.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    storeTheme(next);
  }

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

  // ========================
  // ترجمه
  // ========================
  (function initLang() {
    applyLang("fa");
  })();

  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      const next = currentLang === "fa" ? "en" : "fa";
      applyLang(next);
    });
  }

  // ========================
  // انتخاب حالت Encrypt / Decrypt
  // ========================
  function updateModeUI() {
    if (!currentModeText) return;
    if (currentMode === "encrypt") {
      currentModeText.textContent = "حالت فعلی: رمزنگاری (Encrypt)";
      modeEncryptBtn.classList.add("mode-switcher__btn--active");
      modeDecryptBtn.classList.remove("mode-switcher__btn--active");
    } else {
      currentModeText.textContent = "حالت فعلی: رمزگشایی (Decrypt)";
      modeDecryptBtn.classList.add("mode-switcher__btn--active");
      modeEncryptBtn.classList.remove("mode-switcher__btn--active");
    }
  }

  if (modeEncryptBtn) {
    modeEncryptBtn.addEventListener("click", function () {
      currentMode = "encrypt";
      updateModeUI();
    });
  }

  if (modeDecryptBtn) {
    modeDecryptBtn.addEventListener("click", function () {
      currentMode = "decrypt";
      updateModeUI();
    });
  }

  updateModeUI();

  // ========================
  // انتخاب فایل
  // ========================
  function setSelectedFile(file) {
    selectedFile = file || null;
    if (selectedFileName) {
      if (file) {
        selectedFileName.textContent = `${file.name} (${humanFileSize(
          file.size
        )})`;
      } else {
        selectedFileName.textContent = "فایلی انتخاب نشده است.";
      }
    }
  }

  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        setSelectedFile(file);
      } else {
        setSelectedFile(null);
      }
    });
  }

  if (dropzone) {
    dropzone.addEventListener("click", function () {
      if (fileInput) {
        fileInput.click();
      }
    });

    dropzone.addEventListener("dragover", function (e) {
      e.preventDefault();
      dropzone.classList.add("dropzone--dragover");
    });

    dropzone.addEventListener("dragleave", function (e) {
      e.preventDefault();
      dropzone.classList.remove("dropzone--dragover");
    });

    dropzone.addEventListener("drop", function (e) {
      e.preventDefault();
      dropzone.classList.remove("dropzone--dragover");
      const file = e.dataTransfer && e.dataTransfer.files[0];
      if (file) {
        if (fileInput) {
          fileInput.files = e.dataTransfer.files;
        }
        setSelectedFile(file);
      }
    });
  }

  // ========================
  // ارزیابی قدرت رمز عبور
  // سطوح: weak / medium / strong / robust
  // ========================
  function hasNonLatinChars(password) {
    // هر چیزی خارج از ASCII پرینتیبل
    return /[^\x20-\x7e]/.test(password);
  }

  function evaluatePasswordStrength(password) {
    if (!password) {
      return {
        score: 0,
        label: "نامشخص",
        level: "none",
        percent: 0,
        rules: {
          length: false,
          digit: false,
          mixedCase: false,
          special: false,
          englishOnly: false
        }
      };
    }

    const rules = {
      length: password.length >= 8,
      digit: /\d/.test(password),
      mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      englishOnly: !hasNonLatinChars(password)
    };

    let score = 0;
    if (rules.length) score += 1;
    if (rules.digit) score += 1;
    if (rules.mixedCase) score += 1;
    if (rules.special) score += 1;
    if (rules.englishOnly) score += 1;

    let level = "weak";
    let label = "ضعیف";

    if (score >= 4) {
      level = "robust";
      label = "پایدار";
    } else if (score === 3) {
      level = "strong";
      label = "قوی";
    } else if (score === 2) {
      level = "medium";
      label = "متوسط";
    }

    const percent = (score / 5) * 100;

    return {
      score,
      label,
      level,
      percent,
      rules
    };
  }

  function updateRuleItem(el, ok) {
    if (!el) return;
    if (ok) {
      el.classList.add("password-rule--ok");
    } else {
      el.classList.remove("password-rule--ok");
    }
  }

  function updatePasswordStrength() {
    const pwd = passwordInput ? passwordInput.value : "";
    const result = evaluatePasswordStrength(pwd);

    // نوار
    if (passwordStrengthFill) {
      passwordStrengthFill.style.width = `${result.percent}%`;
      passwordStrengthFill.classList.remove(
        "password-strength__fill--weak",
        "password-strength__fill--medium",
        "password-strength__fill--strong",
        "password-strength__fill--robust"
      );

      if (result.level === "weak") {
        passwordStrengthFill.classList.add("password-strength__fill--weak");
      } else if (result.level === "medium") {
        passwordStrengthFill.classList.add(
          "password-strength__fill--medium"
        );
      } else if (result.level === "strong") {
        passwordStrengthFill.classList.add(
          "password-strength__fill--strong"
        );
      } else if (result.level === "robust") {
        passwordStrengthFill.classList.add(
          "password-strength__fill--robust"
        );
      }
    }

    // متن
    if (passwordStrengthText) {
      if (!pwd) {
        passwordStrengthText.textContent = "قدرت رمز عبور: نامشخص";
      } else {
        passwordStrengthText.textContent = `قدرت رمز عبور: ${result.label}`;
      }
    }

    // قوانین
    updateRuleItem(ruleLengthEl, result.rules.length);
    updateRuleItem(ruleDigitEl, result.rules.digit);
    updateRuleItem(ruleMixedCaseEl, result.rules.mixedCase);
    updateRuleItem(ruleSpecialEl, result.rules.special);
    updateRuleItem(ruleEnglishEl, result.rules.englishOnly);

    // اگر رمز پاک شده، مرحله تایید را ریست کن
    if (!pwd) {
      basePassword = "";
      if (confirmFieldContainer) {
        confirmFieldContainer.hidden = true;
      }
      if (passwordConfirmInput) {
        passwordConfirmInput.value = "";
        passwordConfirmInput.classList.remove(
          "field__input--error",
          "field__input--ok"
        );
      }
      if (passwordMatchHint) {
        passwordMatchHint.textContent = "";
      }
    }

    return result;
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", updatePasswordStrength);
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        goToPasswordConfirm();
      }
    });
  }

  // ========================
  // نمایش موقت رمز (چشم)
  // ========================
  function attachHoldToReveal(button, input) {
    if (!button || !input) return;

    function show() {
      input.type = "text";
    }
    function hide() {
      input.type = "password";
    }

    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      show();
    });
    button.addEventListener("mouseup", hide);
    button.addEventListener("mouseleave", hide);

    button.addEventListener("touchstart", (e) => {
      e.preventDefault();
      show();
    });
    button.addEventListener("touchend", hide);
    button.addEventListener("touchcancel", hide);
  }

  attachHoldToReveal(passwordToggleBtn, passwordInput);
  attachHoldToReveal(passwordConfirmToggleBtn, passwordConfirmInput);

  // ========================
  // مرحله بعد → تایید رمز
  // ========================
  function goToPasswordConfirm() {
    if (!passwordInput) return;
    const pwd = passwordInput.value || "";
    const result = evaluatePasswordStrength(pwd);

    if (!pwd) {
      showModal("خطا", "لطفاً ابتدا رمز عبور را وارد کنید.");
      return;
    }

    // شرط: حداقل سطح "قوی" (strong یا robust)
    if (!(result.level === "strong" || result.level === "robust")) {
      showModal(
        "خطا",
        "رمز عبور هنوز به حد کافی قوی نیست. سعی کنید طول را بیشتر و ترکیب حروف، اعداد و نمادها را متنوع کنید."
      );
      return;
    }

    basePassword = pwd;

    if (confirmFieldContainer) {
      confirmFieldContainer.hidden = false;
    }
    if (passwordConfirmInput) {
      passwordConfirmInput.value = "";
      passwordConfirmInput.classList.remove(
        "field__input--error",
        "field__input--ok"
      );
      passwordConfirmInput.focus();
    }
    if (passwordMatchHint) {
      passwordMatchHint.textContent = "";
    }
  }

  if (passwordNextBtn) {
    passwordNextBtn.addEventListener("click", goToPasswordConfirm);
  }

  if (passwordConfirmInput) {
    passwordConfirmInput.addEventListener("input", () => {
      const confirmPwd = passwordConfirmInput.value || "";
      if (!basePassword) {
        passwordConfirmInput.classList.remove(
          "field__input--error",
          "field__input--ok"
        );
        if (passwordMatchHint) {
          passwordMatchHint.textContent =
            "ابتدا رمز اصلی را در مرحله قبل تایید کنید.";
        }
        return;
      }
      if (!confirmPwd) {
        passwordConfirmInput.classList.remove(
          "field__input--error",
          "field__input--ok"
        );
        if (passwordMatchHint) passwordMatchHint.textContent = "";
        return;
      }
      if (confirmPwd === basePassword) {
        passwordConfirmInput.classList.add("field__input--ok");
        passwordConfirmInput.classList.remove("field__input--error");
        if (passwordMatchHint)
          passwordMatchHint.textContent = "رمزها یکسان هستند ✔️";
      } else {
        passwordConfirmInput.classList.add("field__input--error");
        passwordConfirmInput.classList.remove("field__input--ok");
        if (passwordMatchHint)
          passwordMatchHint.textContent =
            "رمز تکراری با رمز اصلی یکسان نیست.";
      }
    });
  }

  // اگر رمز اصلی بعداً عوض شد، مرحله تایید را ریست کن
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      // اگر کاربر بعد از باز شدن مرحله تایید، رمز اصلی را تغییر دهد
      if (confirmFieldContainer && !confirmFieldContainer.hidden) {
        basePassword = passwordInput.value || "";
        if (passwordConfirmInput) {
          passwordConfirmInput.value = "";
          passwordConfirmInput.classList.remove(
            "field__input--error",
            "field__input--ok"
          );
        }
        if (passwordMatchHint) {
          passwordMatchHint.textContent = "";
        }
      }
    });
  }

  // ========================
  // کپچا
  // ========================
  function generateCaptchaCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 5; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      code += chars[idx];
    }
    return code;
  }

  function refreshCaptcha() {
    currentCaptchaCode = generateCaptchaCode();
    if (captchaTextEl) {
      captchaTextEl.textContent = currentCaptchaCode;
    }
    if (captchaInput) {
      captchaInput.value = "";
    }
  }

  if (captchaRefreshBtn) {
    captchaRefreshBtn.addEventListener("click", refreshCaptcha);
  }

  refreshCaptcha();

  // کپچای مخفی – تاخیر زمانی
  setTimeout(() => {
    humanDelayPassed = true;
  }, 1500);

  // ========================
  // Helper: دانلود فایل
  // ========================
  function triggerDownload(blob, suggestedName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ========================
  // Helper: Web Crypto
  // ========================
  const textEncoder = new TextEncoder();
  const textDecoder = new TextDecoder();

  function getRandomBytes(len) {
    const arr = new Uint8Array(len);
    window.crypto.getRandomValues(arr);
    return arr;
  }

  async function deriveKeyFromPassword(password, salt, iterations) {
    const encPassword = textEncoder.encode(password);
    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      encPassword,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: SAFE_CONFIG.pbkdf2.hash
      },
      baseKey,
      { name: SAFE_CONFIG.aesGcm.name, length: SAFE_CONFIG.aesGcm.keyLength },
      false,
      ["encrypt", "decrypt"]
    );

    return key;
  }

  function uint8ArrayToBase64(u8) {
    let binary = "";
    for (let i = 0; i < u8.length; i++) {
      binary += String.fromCharCode(u8[i]);
    }
    return btoa(binary);
  }

  function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8[i] = binary.charCodeAt(i);
    }
    return u8;
  }

  // ========================
  // ساخت فرمت SAFE با هدر رمز شده
  //
  // ساختار:
  // [0..3]  -> "SAFE" (ASCII)
  // [4]     -> version (1 byte)
  // [5]     -> flags (1 byte) – فعلاً 0
  // [6..9]  -> iterations (uint32 BE)
  // [10..25] -> salt (16 bytes)
  // [26..37] -> dataIv (12 bytes)
  // [38..49] -> headerIv (12 bytes)
  // [50..53] -> headerCipherLen (uint32 BE)
  // [54..]   -> headerCipherBytes
  // باقی     -> dataCipherBytes
  // ========================
  function buildSafeFile(
    iterations,
    salt,
    dataIv,
    headerIv,
    headerCipher,
    dataCipher
  ) {
    const magic = SAFE_CONFIG.fileMagic;
    const headerCipherBytes = new Uint8Array(headerCipher);
    const dataCipherBytes = new Uint8Array(dataCipher);

    const totalLength =
      4 + // magic
      1 + // version
      1 + // flags
      4 + // iterations
      SAFE_CONFIG.pbkdf2.saltBytes +
      SAFE_CONFIG.aesGcm.ivBytes +
      SAFE_CONFIG.aesGcm.ivBytes + // headerIv
      4 + // headerCipherLen
      headerCipherBytes.length +
      dataCipherBytes.length;

    const out = new Uint8Array(totalLength);
    let offset = 0;

    // Magic
    for (let i = 0; i < 4; i++) {
      out[offset++] = magic.charCodeAt(i);
    }

    // Version
    out[offset++] = SAFE_CONFIG.fileVersion & 0xff;

    // Flags
    out[offset++] = 0;

    // iterations (uint32 BE)
    out[offset++] = (iterations >>> 24) & 0xff;
    out[offset++] = (iterations >>> 16) & 0xff;
    out[offset++] = (iterations >>> 8) & 0xff;
    out[offset++] = iterations & 0xff;

    // salt
    out.set(salt, offset);
    offset += salt.length;

    // dataIv
    out.set(dataIv, offset);
    offset += dataIv.length;

    // headerIv
    out.set(headerIv, offset);
    offset += headerIv.length;

    // headerCipherLen
    const headerLen = headerCipherBytes.length;
    out[offset++] = (headerLen >>> 24) & 0xff;
    out[offset++] = (headerLen >>> 16) & 0xff;
    out[offset++] = (headerLen >>> 8) & 0xff;
    out[offset++] = headerLen & 0xff;

    // headerCipherBytes
    out.set(headerCipherBytes, offset);
    offset += headerCipherBytes.length;

    // dataCipherBytes
    out.set(dataCipherBytes, offset);

    return out.buffer;
  }

  function parseSafeFile(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 54) {
      throw new Error("فایل SAFE نامعتبر است (بسیار کوچک).");
    }

    const magicChars = String.fromCharCode(
      bytes[0],
      bytes[1],
      bytes[2],
      bytes[3]
    );
    if (magicChars !== SAFE_CONFIG.fileMagic) {
      throw new Error("هدر SAFE نامعتبر است (magic اشتباه).");
    }

    const version = bytes[4];
    const flags = bytes[5];

    if (version !== SAFE_CONFIG.fileVersion) {
      throw new Error("نسخه فایل SAFE پشتیبانی نمی‌شود.");
    }

    // iterations
    let offset = 6;
    const iterations =
      (bytes[offset++] << 24) |
      (bytes[offset++] << 16) |
      (bytes[offset++] << 8) |
      bytes[offset++];

    // salt
    const salt = bytes.slice(offset, offset + SAFE_CONFIG.pbkdf2.saltBytes);
    offset += SAFE_CONFIG.pbkdf2.saltBytes;

    // dataIv
    const dataIv = bytes.slice(offset, offset + SAFE_CONFIG.aesGcm.ivBytes);
    offset += SAFE_CONFIG.aesGcm.ivBytes;

    // headerIv
    const headerIv = bytes.slice(
      offset,
      offset + SAFE_CONFIG.aesGcm.ivBytes
    );
    offset += SAFE_CONFIG.aesGcm.ivBytes;

    // headerCipherLen
    const headerLen =
      (bytes[offset++] << 24) |
      (bytes[offset++] << 16) |
      (bytes[offset++] << 8) |
      bytes[offset++];

    if (bytes.length < offset + headerLen) {
      throw new Error("طول هدر SAFE نامعتبر است.");
    }

    const headerCipherBytes = bytes.slice(offset, offset + headerLen);
    offset += headerLen;

    const dataCipherBytes = bytes.slice(offset);

    return {
      flags,
      iterations,
      salt,
      dataIv,
      headerIv,
      headerCipher: headerCipherBytes.buffer,
      dataCipher: dataCipherBytes.buffer
    };
  }

  // ========================
  // Encrypt
  // ========================
  async function encryptFile(file, password) {
    logStatus("شروع رمزنگاری فایل...", "info");
    setProgress(5, "در حال خواندن فایل...");

    if (file.size > SAFE_CONFIG.maxFileSizeBytes) {
      throw new Error(
        `حجم فایل از حد مجاز (${humanFileSize(
          SAFE_CONFIG.maxFileSizeBytes
        )}) بیشتر است.`
      );
    }

    const fileBuffer = await file.arrayBuffer();
    setProgress(30, "در حال مشتق‌سازی کلید از رمز عبور...");

    const salt = getRandomBytes(SAFE_CONFIG.pbkdf2.saltBytes);
    const dataIv = getRandomBytes(SAFE_CONFIG.aesGcm.ivBytes);
    const headerIv = getRandomBytes(SAFE_CONFIG.aesGcm.ivBytes);
    const iterations = SAFE_CONFIG.pbkdf2.iterations;

    const key = await deriveKeyFromPassword(password, salt, iterations);

    // هدر متادیتا (که رمز می‌شود)
    const headerPlain = {
      file_name: file.name || "file",
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      created_at: new Date().toISOString(),
      safe_version: SAFE_CONFIG.fileVersion
    };

    const headerPlainJson = JSON.stringify(headerPlain);
    const headerPlainBytes = textEncoder.encode(headerPlainJson);

    setProgress(45, "در حال رمزنگاری هدر SAFE...");

    const headerCipher = await window.crypto.subtle.encrypt(
      {
        name: SAFE_CONFIG.aesGcm.name,
        iv: headerIv
      },
      key,
      headerPlainBytes
    );

    setProgress(65, "در حال رمزنگاری محتوای فایل...");

    const dataCipher = await window.crypto.subtle.encrypt(
      {
        name: SAFE_CONFIG.aesGcm.name,
        iv: dataIv
      },
      key,
      fileBuffer
    );

    setProgress(85, "در حال ساخت فایل SAFE...");

    const safeBuffer = buildSafeFile(
      iterations,
      salt,
      dataIv,
      headerIv,
      headerCipher,
      dataCipher
    );

    const safeBlob = new Blob([safeBuffer], {
      type: "application/octet-stream"
    });

    // حذف پسوند اصلی از نام فایل
    const originalName = file.name || "encrypted";
    const baseName = originalName.replace(/\.[^./\\]+$/, "");
    const safeName = `${baseName || "encrypted"}.SAFE`;

    setProgress(95, "فایل SAFE آماده شد. در حال آماده‌سازی دانلود...");

    triggerDownload(safeBlob, safeName);

    setProgress(100, "رمزنگاری کامل شد.");
    logStatus(`رمزنگاری فایل با موفقیت انجام شد: ${safeName}`, "success");
  }

  // ========================
  // Decrypt
  // ========================
  async function decryptFile(file, password) {
    logStatus("شروع رمزگشایی فایل SAFE...", "info");
    setProgress(5, "در حال خواندن فایل SAFE...");

    if (file.size > SAFE_CONFIG.maxFileSizeBytes) {
      throw new Error(
        `حجم فایل از حد مجاز (${humanFileSize(
          SAFE_CONFIG.maxFileSizeBytes
        )}) بیشتر است.`
      );
    }

    const buffer = await file.arrayBuffer();

    setProgress(25, "در حال تحلیل ساختار SAFE...");

    const {
      iterations,
      salt,
      dataIv,
      headerIv,
      headerCipher,
      dataCipher
    } = parseSafeFile(buffer);

    setProgress(45, "در حال مشتق‌سازی کلید از رمز عبور...");

    const key = await deriveKeyFromPassword(password, salt, iterations);

    setProgress(60, "در حال رمزگشایی هدر SAFE...");

    let headerPlain;
    try {
      const headerPlainBytes = await window.crypto.subtle.decrypt(
        {
          name: SAFE_CONFIG.aesGcm.name,
          iv: headerIv
        },
        key,
        headerCipher
      );
      const headerJson = textDecoder.decode(headerPlainBytes);
      headerPlain = JSON.parse(headerJson);
    } catch (e) {
      throw new Error(
        "رمز عبور نادرست است یا هدر SAFE آسیب دیده/دستکاری شده است."
      );
    }

    setProgress(80, "در حال رمزگشایی محتوای فایل...");

    let plaintext;
    try {
      plaintext = await window.crypto.subtle.decrypt(
        {
          name: SAFE_CONFIG.aesGcm.name,
          iv: dataIv
        },
        key,
        dataCipher
      );
    } catch (e) {
      throw new Error(
        "رمز عبور نادرست است یا محتوای فایل SAFE آسیب دیده است."
      );
    }

    setProgress(90, "در حال ساخت فایل اصلی برای دانلود...");

    const mimeType =
      typeof headerPlain.mime_type === "string"
        ? headerPlain.mime_type
        : "application/octet-stream";
    const originalName =
      typeof headerPlain.file_name === "string" && headerPlain.file_name
        ? headerPlain.file_name
        : file.name.replace(/\.SAFE$/i, "") || "decrypted_file";

    const blob = new Blob([plaintext], { type: mimeType });
    triggerDownload(blob, originalName);

    setProgress(100, "رمزگشایی کامل شد.");
    logStatus(
      `رمزگشایی فایل SAFE با موفقیت انجام شد: ${originalName}`,
      "success"
    );
  }

  // ========================
  // اعتبارسنجی ورودی‌ها
  // ========================
  function validateInputs() {
    if (!selectedFile) {
      throw new Error("لطفاً ابتدا یک فایل انتخاب کنید.");
    }

    const pwd = passwordInput ? passwordInput.value : "";
    const pwdConfirm = passwordConfirmInput
      ? passwordConfirmInput.value
      : "";

    if (!pwd) {
      throw new Error("لطفاً رمز عبور را وارد کنید.");
    }

    const strength = evaluatePasswordStrength(pwd);
    if (!(strength.level === "strong" || strength.level === "robust")) {
      throw new Error(
        "رمز عبور هنوز به حد «قوی» نرسیده است. از حروف بزرگ/کوچک، عدد و کاراکتر خاص استفاده کنید."
      );
    }

    if (!basePassword) {
      throw new Error(
        "لطفاً دکمه «مرحله بعد (تایید رمز)» را بزنید و سپس رمز را تکرار کنید."
      );
    }

    if (!pwdConfirm) {
      throw new Error("لطفاً رمز عبور را در کادر دوم نیز تکرار کنید.");
    }

    if (pwdConfirm !== basePassword) {
      throw new Error("رمز تکراری با رمز اصلی یکسان نیست.");
    }

    if (currentMode === "decrypt") {
      if (!/\.SAFE$/i.test(selectedFile.name)) {
        logStatus(
          "هشدار: فایل انتخاب‌شده پسوند .SAFE ندارد. اگر مطمئن هستید، ادامه دهید.",
          "warn"
        );
      }
    }

    // کپچا – کاربر باید کد را درست بنویسد
    if (!captchaInput || !captchaTextEl) {
      throw new Error("کپچا به‌درستی بارگذاری نشده است.");
    }
    const enteredCaptcha = (captchaInput.value || "").trim().toUpperCase();
    if (!enteredCaptcha) {
      throw new Error("لطفاً کد کپچا را وارد کنید.");
    }
    if (enteredCaptcha !== currentCaptchaCode) {
      refreshCaptcha();
      throw new Error("کد کپچا اشتباه است. لطفاً دوباره تلاش کنید.");
    }

    // کپچای مخفی – بات‌Trap
    if (botTrapInput && botTrapInput.value) {
      throw new Error(
        "رفتار این درخواست شبیه ربات است (فیلد مخفی پر شده). عملیات متوقف شد."
      );
    }
    if (!humanDelayPassed) {
      throw new Error(
        "درخواست بسیار سریع بود. برای جلوگیری از ربات‌ها، چند ثانیه صبر کنید و دوباره تلاش کنید."
      );
    }

    return { file: selectedFile, password: pwd };
  }

  // ========================
  // شروع عملیات Encrypt/Decrypt
  // ========================
  async function handleStart() {
    resetProgress();
    try {
      const { file, password } = validateInputs();
      if (currentMode === "encrypt") {
        await encryptFile(file, password);
      } else {
        await decryptFile(file, password);
      }
    } catch (err) {
      console.error(err);
      const message =
        err && typeof err.message === "string"
          ? err.message
          : "خطای ناشناخته‌ای رخ داد.";
      logStatus(message, "error");
      setProgress(0, "عملیات با خطا متوقف شد.");
      showModal("خطا", message);
    }
  }

  if (startBtn) {
    startBtn.addEventListener("click", function () {
      void handleStart();
    });
  }
})();
