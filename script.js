// script.js
// SAFE – E2Ebox Mini App Frontend Logic
// تمام منطق این فایل فقط روی مرورگر اجرا می‌شود و هیچ فایلی را به سرور ارسال نمی‌کند.

/* -------------------------------------------------
 * Helpers
 * ------------------------------------------------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * نمایش پیام ساده برای کاربر.
 * می‌توانی بعداً این را با Toast یا UI بهتر جایگزین کنی.
 */
function showMessage(type, message) {
  // type: "error" | "info" | "success"
  // فعلاً ساده:
  alert(message);
}

/* -------------------------------------------------
 * Theme & Language
 * ------------------------------------------------- */

function initThemeToggle() {
  const root = document.documentElement;
  const toggleBtn = $(".theme-toggle");
  if (!toggleBtn) return;

  const saved = localStorage.getItem("safe-theme");
  if (saved === "dark" || saved === "light") {
    root.dataset.theme = saved;
  }

  toggleBtn.addEventListener("click", () => {
    const current = root.dataset.theme === "light" ? "light" : "dark";
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("safe-theme", next);
  });
}

function initLanguageToggle() {
  const root = document.documentElement;
  const btn = $(".lang-toggle");
  if (!btn) return;

  let current = localStorage.getItem("safe-lang") || root.lang || "fa";

  function applyLang(lang) {
    current = lang;
    root.lang = lang;
    root.dir = lang === "fa" ? "rtl" : "ltr";
    localStorage.setItem("safe-lang", lang);
    btn.textContent = lang === "fa" ? "EN / FA" : "FA / EN";
    // اینجا می‌شود سیستم i18n پیشرفته‌تر نوشت؛ فعلاً فقط ساختار آماده است.
  }

  applyLang(current);

  btn.addEventListener("click", () => {
    applyLang(current === "fa" ? "en" : "fa");
  });
}

/* -------------------------------------------------
 * Mode Switch (Encrypt / Decrypt)
 * ------------------------------------------------- */

function initModeSwitcher() {
  const switcher = $(".mode-switcher");
  const buttons = $$(".mode-switcher__btn", switcher);
  const encryptFlow = $("#encryptFlow");
  const decryptFlow = $("#decryptFlow");

  if (!switcher || !encryptFlow || !decryptFlow) return;

  function setMode(mode) {
    buttons.forEach((btn) => {
      const isActive = btn.dataset.mode === mode;
      btn.classList.toggle("mode-switcher__btn--active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    const isEncrypt = mode === "encrypt";
    encryptFlow.hidden = !isEncrypt;
    decryptFlow.hidden = isEncrypt;
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode === "decrypt" ? "decrypt" : "encrypt";
      setMode(mode);
    });
  });

  // حالت پیش‌فرض
  setMode("encrypt");
}

/* -------------------------------------------------
 * Dropzone (انتخاب فایل)
 * ------------------------------------------------- */

function setupDropzone(options) {
  const {
    root,
    acceptSafeOnly = false,
    onFileSelected,
  } = options;
  const dropzone = $(".dropzone", root);
  const filenameEl = $(".dropzone__filename", root);

  if (!dropzone || !filenameEl) return;

  const input = document.createElement("input");
  input.type = "file";
  input.style.display = "none";
  if (acceptSafeOnly) {
    input.accept = ".safe,.SAFE";
  }

  document.body.appendChild(input);

  function handleFiles(files) {
    if (!files || !files.length) return;
    const file = files[0];

    if (acceptSafeOnly && !/\.safe$/i.test(file.name)) {
      showMessage("error", "لطفاً فقط فایل با پسوند .SAFE انتخاب کنید.");
      return;
    }

    filenameEl.textContent = file.name;
    if (typeof onFileSelected === "function") {
      onFileSelected(file);
    }
  }

  dropzone.addEventListener("click", () => input.click());

  input.addEventListener("change", () => {
    handleFiles(input.files);
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("is-dragover");
  });

  dropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-dragover");
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  });

  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });
}

/* -------------------------------------------------
 * Password Strength & Rules
 * ------------------------------------------------- */

function evaluatePassword(password) {
  const lengthOK = password.length >= 8;
  const digitOK = /\d/.test(password);
  const lowerOK = /[a-z]/.test(password);
  const upperOK = /[A-Z]/.test(password);
  const lowerUpperOK = lowerOK && upperOK;
  const symbolOK = /[^A-Za-z0-9]/.test(password);
  const asciiOK = /^[\x20-\x7E]+$/.test(password); // فقط ASCII

  let score = 0;
  if (lengthOK) score++;
  if (digitOK) score++;
  if (lowerUpperOK) score++;
  if (symbolOK) score++;
  if (asciiOK) score++;
  if (password.length >= 12) score++;

  let level = "weak";
  if (score >= 5) level = "robust";
  else if (score >= 4) level = "strong";
  else if (score >= 3) level = "medium";
  else level = "weak";

  return {
    level,
    rules: {
      lengthOK,
      digitOK,
      lowerUpperOK,
      symbolOK,
      asciiOK,
    },
  };
}

function updatePasswordUI(context, password) {
  const { strengthEl, strengthLabelEl, rulesList } = context;
  if (!strengthEl || !strengthLabelEl || !rulesList) return;

  const { level, rules } = evaluatePassword(password);

  strengthEl.classList.remove(
    "is-weak",
    "is-medium",
    "is-strong",
    "is-robust"
  );
  strengthEl.classList.add(`is-${level}`);

  // متن توضیحی
  let text = "";
  switch (level) {
    case "weak":
      text = "قدرت رمز ضعیف است. لطفاً رمز قوی‌تری انتخاب کنید.";
      break;
    case "medium":
      text = "قدرت رمز متوسط است؛ توصیه می‌شود آن را کمی قوی‌تر کنید.";
      break;
    case "strong":
      text = "قدرت رمز خوب است و قابل قبول است.";
      break;
    case "robust":
      text = "قدرت رمز بسیار عالی و پایدار است.";
      break;
  }
  strengthLabelEl.textContent = text;

  // قوانین
  const ruleItems = $$(".password-rule", rulesList);
  ruleItems.forEach((li) => {
    const keyText = li.dataset.i18n || "";
    let ok = false;
    if (keyText.includes("length")) ok = rules.lengthOK;
    else if (keyText.includes("digit")) ok = rules.digitOK;
    else if (keyText.includes("case")) ok = rules.lowerUpperOK;
    else if (keyText.includes("special")) ok = rules.symbolOK;
    else if (keyText.includes("ascii")) ok = rules.asciiOK;

    li.classList.toggle("password-rule--ok", ok);
  });

  context.lastLevel = level;
}

function generateStrongPassword() {
  const length = 20;
  const digits = "0123456789";
  const lowers = "abcdefghijklmnopqrstuvwxyz";
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const symbols = "!@#$%^&*()-_=+[]{};:,.<>?";

  // حتماً از هر دسته حداقل یکی
  let password = "";
  password += digits[Math.floor(Math.random() * digits.length)];
  password += lowers[Math.floor(Math.random() * lowers.length)];
  password += uppers[Math.floor(Math.random() * uppers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  const all = digits + lowers + uppers + symbols;
  while (password.length < length) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // shuffle
  const chars = password.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

/**
 * آیکون چشم: فقط زمانی که نگه‌داشته شده، رمز را نشان می‌دهد.
 */
function attachPeekBehavior(button, input) {
  if (!button || !input) return;

  const show = () => {
    input.type = "text";
  };
  const hide = () => {
    input.type = "password";
  };

  const startEvents = ["mousedown", "touchstart"];
  const stopEvents = ["mouseup", "mouseleave", "touchend", "touchcancel", "blur"];

  startEvents.forEach((ev) => {
    button.addEventListener(ev, (e) => {
      e.preventDefault();
      show();
    });
  });

  stopEvents.forEach((ev) => {
    button.addEventListener(ev, () => {
      hide();
    });
  });
}

/* -------------------------------------------------
 * Captcha
 * ------------------------------------------------- */

function createCaptchaManager(container) {
  const displayTextEl = $(".captcha-display__text", container);
  const inputEl = $("input[id$='CaptchaInput']", container);
  const refreshBtn = $(".icon-btn--refresh", container);
  const botTrap = $(".bot-trap", container);

  if (!displayTextEl || !inputEl || !refreshBtn) {
    return null;
  }

  let currentValue = "";

  function randomCaptcha(length = 5) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function generate() {
    currentValue = randomCaptcha();
    displayTextEl.textContent = currentValue;
    inputEl.value = "";
  }

  function validate() {
    if (botTrap && botTrap.value.trim() !== "") {
      return { ok: false, reason: "bot" };
    }
    const inputVal = inputEl.value.trim();
    if (!inputVal) {
      return { ok: false, reason: "empty" };
    }
    if (inputVal.toLowerCase() !== currentValue.toLowerCase()) {
      return { ok: false, reason: "mismatch" };
    }
    return { ok: true };
  }

  refreshBtn.addEventListener("click", (e) => {
    e.preventDefault();
    generate();
  });

  // تولید اولیه
  generate();

  return {
    validate,
    regenerate: generate,
  };
}

/* -------------------------------------------------
 * Encryption / Decryption (Web Crypto)
 * ------------------------------------------------- */

async function deriveKeyFromPassword(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 310000, // قوی و معقول
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return key;
}

function writeUint32BE(view, offset, value) {
  view[offset] = (value >>> 24) & 0xff;
  view[offset + 1] = (value >>> 16) & 0xff;
  view[offset + 2] = (value >>> 8) & 0xff;
  view[offset + 3] = value & 0xff;
}

function readUint32BE(view, offset) {
  return (
    (view[offset] << 24) |
    (view[offset + 1] << 16) |
    (view[offset + 2] << 8) |
    view[offset + 3]
  ) >>> 0;
}

function stripExtension(filename) {
  const idx = filename.lastIndexOf(".");
  if (idx <= 0) return filename;
  return filename.slice(0, idx);
}

async function encryptFileToSafe(file, password, onProgress) {
  if (!crypto || !crypto.subtle) {
    throw new Error("مرورگر شما از Web Crypto API پشتیبانی نمی‌کند.");
  }

  const totalSize = file.size;
  const updateProgress = (percent, text) => {
    if (typeof onProgress === "function") {
      onProgress(percent, text);
    }
  };

  updateProgress(5, "در حال خواندن فایل...");
  const plainBuffer = await file.arrayBuffer();

  updateProgress(20, "در حال آماده‌سازی کلید...");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyFromPassword(password, salt);

  updateProgress(35, "در حال ساخت هدر SAFE...");
  const headerIv = crypto.getRandomValues(new Uint8Array(12));
  const dataIv = crypto.getRandomValues(new Uint8Array(12));

  const metadata = {
    v: 1,
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    createdAt: new Date().toISOString(),
  };
  const headerPlain = textEncoder.encode(JSON.stringify(metadata));

  const headerCipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: headerIv },
      key,
      headerPlain
    )
  );

  updateProgress(60, "در حال رمزنگاری محتوای فایل...");
  const dataCipher = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: dataIv },
      key,
      plainBuffer
    )
  );

  updateProgress(85, "در حال ساخت فایل خروجی SAFE...");

  const saltLen = salt.byteLength;
  const headerIvLen = headerIv.byteLength;
  const dataIvLen = dataIv.byteLength;
  const headerCipherLen = headerCipher.byteLength;

  const magic = textEncoder.encode("SAFE");
  const headerLen =
    magic.byteLength +
    1 + // نسخه
    1 + // flags
    1 + // saltLen
    1 + // headerIvLen
    1 + // dataIvLen
    4 + // headerCipherLen
    saltLen +
    headerIvLen +
    dataIvLen +
    headerCipherLen;

  const totalLen = headerLen + dataCipher.byteLength;
  const out = new Uint8Array(totalLen);

  let offset = 0;
  out.set(magic, offset);
  offset += magic.byteLength;

  out[offset++] = 1; // نسخه
  out[offset++] = 0; // flags رزرو شده

  out[offset++] = saltLen;
  out[offset++] = headerIvLen;
  out[offset++] = dataIvLen;

  writeUint32BE(out, offset, headerCipherLen);
  offset += 4;

  out.set(salt, offset);
  offset += saltLen;

  out.set(headerIv, offset);
  offset += headerIvLen;

  out.set(dataIv, offset);
  offset += dataIvLen;

  out.set(headerCipher, offset);
  offset += headerCipherLen;

  out.set(dataCipher, offset);

  updateProgress(100, "رمزنگاری با موفقیت انجام شد.");

  return {
    buffer: out.buffer,
    metadata,
  };
}

async function decryptSafeFile(file, password, onProgress) {
  if (!crypto || !crypto.subtle) {
    throw new Error("مرورگر شما از Web Crypto API پشتیبانی نمی‌کند.");
  }

  const updateProgress = (percent, text) => {
    if (typeof onProgress === "function") {
      onProgress(percent, text);
    }
  };

  updateProgress(5, "در حال خواندن فایل SAFE...");
  const buf = new Uint8Array(await file.arrayBuffer());
  let offset = 0;

  const magic = textDecoder.decode(buf.subarray(0, 4));
  if (magic !== "SAFE") {
    throw new Error("این فایل با فرمت SAFE سازگار نیست.");
  }
  offset += 4;

  const version = buf[offset++];
  const flags = buf[offset++];

  if (version !== 1) {
    throw new Error("نسخه فایل SAFE پشتیبانی نمی‌شود.");
  }

  const saltLen = buf[offset++];
  const headerIvLen = buf[offset++];
  const dataIvLen = buf[offset++];

  const headerCipherLen = readUint32BE(buf, offset);
  offset += 4;

  const salt = buf.subarray(offset, offset + saltLen);
  offset += saltLen;

  const headerIv = buf.subarray(offset, offset + headerIvLen);
  offset += headerIvLen;

  const dataIv = buf.subarray(offset, offset + dataIvLen);
  offset += dataIvLen;

  const headerCipher = buf.subarray(offset, offset + headerCipherLen);
  offset += headerCipherLen;

  const dataCipher = buf.subarray(offset);

  updateProgress(25, "در حال مشتق‌سازی کلید از رمز عبور...");
  const key = await deriveKeyFromPassword(password, salt);

  updateProgress(45, "در حال رمزگشایی اطلاعات هدر...");
  let metadata;
  try {
    const headerPlain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: headerIv },
      key,
      headerCipher
    );
    const jsonText = textDecoder.decode(new Uint8Array(headerPlain));
    metadata = JSON.parse(jsonText);
  } catch (e) {
    throw new Error("رمز عبور نادرست است یا هدر فایل آسیب دیده است.");
  }

  updateProgress(75, "در حال رمزگشایی محتوای فایل...");
  let plainBuffer;
  try {
    plainBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: dataIv },
      key,
      dataCipher
    );
  } catch (e) {
    throw new Error("رمزگشایی محتوا با مشکل مواجه شد. احتمالاً فایل یا رمز اشتباه است.");
  }

  updateProgress(100, "رمزگشایی با موفقیت انجام شد.");

  return {
    buffer: plainBuffer,
    metadata,
  };
}

/* -------------------------------------------------
 * Encrypt Flow UI Logic
 * ------------------------------------------------- */

function initEncryptFlow() {
  const flowRoot = $("#encryptFlow");
  if (!flowRoot) return;

  let selectedFile = null;
  const dropzoneRoot = flowRoot.querySelector(".card--file");
  setupDropzone({
    root: dropzoneRoot,
    acceptSafeOnly: false,
    onFileSelected(file) {
      selectedFile = file;
    },
  });

  const passwordInput = $("#encryptPassword");
  const passwordConfirmWrapper = $(".confirm-password", flowRoot);
  const passwordConfirmInput = $("#encryptPasswordConfirm");
  const confirmToggleBtn = $(".form--encrypt .btn--ghost", flowRoot);

  const eyeMain = $(".form--encrypt .icon-btn--eye", flowRoot);
  const generateBtn = $(".icon-btn--generate", flowRoot);
  const eyeConfirm = $(".confirm-password .icon-btn--eye", flowRoot);

  const strengthEl = $(".password-strength", flowRoot);
  const strengthLabelEl = $(".password-strength__label", flowRoot);
  const rulesList = $(".password-rules", flowRoot);

  const captchaGroup = $(".form--encrypt .field-group--captcha", flowRoot);
  const captchaManager = createCaptchaManager(captchaGroup);

  const startBtn = $(".flow-actions .btn--primary", flowRoot);
  const statusCard = $(".status-card", flowRoot);
  const progressEl = $(".progress", statusCard);
  const progressFill = $(".progress__fill", statusCard);
  const statusText = $(".status-card__text", statusCard);
  const statusBadge = $(".status-card__badge", statusCard);

  const state = {
    lastStrengthLevel: "weak",
  };

  attachPeekBehavior(eyeMain, passwordInput);
  attachPeekBehavior(eyeConfirm, passwordConfirmInput);

  // تولید رمز قوی
  if (generateBtn) {
    generateBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const pwd = generateStrongPassword();
      passwordInput.value = pwd;
      updatePasswordUI(
        { strengthEl, strengthLabelEl, rulesList, lastLevel: state.lastStrengthLevel },
        pwd
      );
    });
  }

  // آپدیت قدرت رمز
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      updatePasswordUI(
        { strengthEl, strengthLabelEl, rulesList, lastLevel: state.lastStrengthLevel },
        passwordInput.value
      );
      state.lastStrengthLevel = evaluatePassword(passwordInput.value).level;
    });

    // Enter برای رفتن به مرحله بعد
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (confirmToggleBtn) confirmToggleBtn.click();
      }
    });
  }

  // نمایش / پنهان کردن فیلد تأیید رمز
  if (confirmToggleBtn && passwordConfirmWrapper) {
    confirmToggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const visible = passwordConfirmWrapper.classList.toggle("is-visible");
      if (visible && passwordConfirmInput) {
        passwordConfirmInput.focus();
      }
    });
  }

  // بررسی یکی بودن رمزها
  if (passwordConfirmInput) {
    passwordConfirmInput.addEventListener("input", () => {
      const ok =
        passwordInput.value.length > 0 &&
        passwordInput.value === passwordConfirmInput.value;
      passwordConfirmInput.dataset.match = ok ? "true" : "false";
    });
  }

  function setProgress(percent, text) {
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    if (progressEl) {
      progressEl.setAttribute("aria-valuenow", String(percent));
    }
    if (statusText && text) {
      statusText.textContent = text;
    }
    if (statusBadge) {
      statusBadge.textContent = percent >= 100 ? "انجام شد" : "در حال پردازش";
    }
  }

  async function handleStartEncrypt() {
    if (!selectedFile) {
      showMessage("error", "لطفاً ابتدا یک فایل برای رمزنگاری انتخاب کنید.");
      return;
    }

    const password = passwordInput.value.trim();
    if (!password) {
      showMessage("error", "رمز عبور نباید خالی باشد.");
      return;
    }

    const strengthInfo = evaluatePassword(password);
    if (strengthInfo.level === "weak" || strengthInfo.level === "medium") {
      showMessage("error", "قدرت رمز عبور باید حداقل «قوی» باشد.");
      return;
    }

    if (!passwordConfirmWrapper.classList.contains("is-visible")) {
      showMessage("error", "ابتدا رمز عبور را در مرحله بعد تأیید کنید.");
      return;
    }

    if (passwordConfirmInput.value !== password) {
      showMessage("error", "رمز عبور و تکرار آن یکسان نیست.");
      return;
    }

    if (captchaManager) {
      const capt = captchaManager.validate();
      if (!capt.ok) {
        if (capt.reason === "bot") {
          showMessage("error", "درخواست مشکوک به فعالیت رباتی است.");
        } else if (capt.reason === "empty") {
          showMessage("error", "لطفاً متن کپچا را وارد کنید.");
        } else {
          showMessage("error", "کپچا اشتباه است. لطفاً دوباره تلاش کنید.");
          captchaManager.regenerate();
        }
        return;
      }
    }

    try {
      startBtn.disabled = true;
      setProgress(0, "در صف رمزنگاری...");

      const { buffer, metadata } = await encryptFileToSafe(
        selectedFile,
        password,
        (p, text) => setProgress(p, text)
      );

      // ساخت Blob و دانلود
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      const baseName = stripExtension(metadata.name || selectedFile.name || "file");
      const safeName = `${baseName}.SAFE`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      showMessage("success", "فایل با موفقیت رمزنگاری و برای دانلود آماده شد.");
    } catch (err) {
      console.error(err);
      showMessage("error", err.message || "خطایی در فرآیند رمزنگاری رخ داد.");
    } finally {
      startBtn.disabled = false;
    }
  }

  if (startBtn) {
    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleStartEncrypt();
    });
  }
}

/* -------------------------------------------------
 * Decrypt Flow UI Logic
 * ------------------------------------------------- */

function initDecryptFlow() {
  const flowRoot = $("#decryptFlow");
  if (!flowRoot) return;

  let selectedFile = null;
  const dropzoneRoot = flowRoot.querySelector(".card--file");
  setupDropzone({
    root: dropzoneRoot,
    acceptSafeOnly: true,
    onFileSelected(file) {
      selectedFile = file;
    },
  });

  const passwordInput = $("#decryptPassword", flowRoot);
  const eyeBtn = $(".form--decrypt .icon-btn--eye", flowRoot);

  attachPeekBehavior(eyeBtn, passwordInput);

  const captchaGroup = $(".form--decrypt .field-group--captcha", flowRoot);
  const captchaManager = createCaptchaManager(captchaGroup);

  const startBtn = $(".flow-actions .btn--primary", flowRoot);
  const statusCard = $(".status-card", flowRoot);
  const progressEl = $(".progress", statusCard);
  const progressFill = $(".progress__fill", statusCard);
  const statusText = $(".status-card__text", statusCard);
  const statusBadge = $(".status-card__badge", statusCard);

  function setProgress(percent, text) {
    if (progressFill) {
      progressFill.style.width = `${percent}%`;
    }
    if (progressEl) {
      progressEl.setAttribute("aria-valuenow", String(percent));
    }
    if (statusText && text) {
      statusText.textContent = text;
    }
    if (statusBadge) {
      statusBadge.textContent = percent >= 100 ? "انجام شد" : "در حال پردازش";
    }
  }

  async function handleStartDecrypt() {
    if (!selectedFile) {
      showMessage("error", "لطفاً ابتدا فایل SAFE را انتخاب کنید.");
      return;
    }

    const password = passwordInput.value.trim();
    if (!password) {
      showMessage("error", "لطفاً رمز عبور را وارد کنید.");
      return;
    }

    if (captchaManager) {
      const capt = captchaManager.validate();
      if (!capt.ok) {
        if (capt.reason === "bot") {
          showMessage("error", "درخواست مشکوک به فعالیت رباتی است.");
        } else if (capt.reason === "empty") {
          showMessage("error", "لطفاً متن کپچا را وارد کنید.");
        } else {
          showMessage("error", "کپچا اشتباه است. لطفاً دوباره تلاش کنید.");
          captchaManager.regenerate();
        }
        return;
      }
    }

    try {
      startBtn.disabled = true;
      setProgress(0, "در صف رمزگشایی...");

      const { buffer, metadata } = await decryptSafeFile(
        selectedFile,
        password,
        (p, text) => setProgress(p, text)
      );

      const blob = new Blob([buffer], {
        type: (metadata && metadata.type) || "application/octet-stream",
      });
      const filename =
        (metadata && metadata.name) || stripExtension(selectedFile.name) || "file";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      showMessage("success", "فایل با موفقیت رمزگشایی و برای دانلود آماده شد.");
    } catch (err) {
      console.error(err);
      showMessage(
        "error",
        err.message || "خطایی در فرآیند رمزگشایی رخ داد. لطفاً رمز یا فایل را بررسی کنید."
      );
    } finally {
      startBtn.disabled = false;
    }
  }

  if (startBtn) {
    startBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleStartDecrypt();
    });
  }
}

/* -------------------------------------------------
 * Init
 * ------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initLanguageToggle();
  initModeSwitcher();
  initEncryptFlow();
  initDecryptFlow();
});
