// script.js
// نسخه‌ی اولیه Mini App SAFE – فقط عملیات محلی روی دستگاه کاربر

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
  // المان‌های DOM
  // ========================
  const root = document.documentElement;
  const themeToggleBtn = document.getElementById("themeToggle");

  const modeEncryptBtn = document.getElementById("modeEncryptBtn");
  const modeDecryptBtn = document.getElementById("modeDecryptBtn");
  const currentModeText = document.getElementById("currentModeText");

  const fileInput = document.getElementById("fileInput");
  const dropzone = document.getElementById("dropzone");
  const selectedFileName = document.getElementById("selectedFileName");

  const passwordInput = document.getElementById("passwordInput");
  const passwordConfirmInput = document.getElementById(
    "passwordConfirmInput"
  );
  const passwordStrengthFill = document.getElementById(
    "passwordStrengthFill"
  );
  const passwordStrengthText = document.getElementById(
    "passwordStrengthText"
  );

  const startBtn = document.getElementById("startBtn");

  const progressContainer = document.getElementById("progressContainer");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");

  const statusList = document.getElementById("statusList");

  // ========================
  // State
  // ========================
  let currentMode = "encrypt"; // "encrypt" یا "decrypt"
  let selectedFile = null;

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
          // برای هماهنگی، input را هم آپدیت می‌کنیم
          fileInput.files = e.dataTransfer.files;
        }
        setSelectedFile(file);
      }
    });
  }

  // ========================
  // ارزیابی قدرت رمز عبور
  // ========================
  function evaluatePasswordStrength(password) {
    let score = 0;
    if (!password) return { score: 0, label: "نامشخص" };

    if (password.length >= 10) score += 1;
    if (password.length >= 14) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = "ضعیف";
    if (score >= 5) label = "قوی";
    else if (score >= 3) label = "متوسط";

    const percent = Math.min(100, (score / 6) * 100);
    return { score, label, percent };
  }

  function updatePasswordStrength() {
    const pwd = passwordInput ? passwordInput.value : "";
    const { label, percent } = evaluatePasswordStrength(pwd);
    if (passwordStrengthFill) {
      passwordStrengthFill.style.width = `${percent}%`;
    }
    if (passwordStrengthText) {
      passwordStrengthText.textContent = `قدرت رمز عبور: ${label}`;
    }
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", updatePasswordStrength);
  }

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
  // ساخت فرمت SAFE
  // === ساختار:
  // [0..3]   -> "SAFE" (ASCII)
  // [4]      -> version (1 byte)
  // [5]      -> flags (1 byte) – فعلاً 0
  // [6..7]   -> header length (uint16 big-endian)
  // [8..8+N] -> header JSON (UTF-8)
  // باقی     -> ciphertext (AES-GCM)
  // ========================
  function buildSafeFile(headerObj, ciphertext) {
    const magic = SAFE_CONFIG.fileMagic;
    const headerJson = JSON.stringify(headerObj);
    const headerBytes = textEncoder.encode(headerJson);

    if (headerBytes.length > 65535) {
      throw new Error("هدر SAFE خیلی بزرگ است.");
    }

    const totalLength = 4 + 1 + 1 + 2 + headerBytes.length + ciphertext.byteLength;
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

    // Header length (uint16 BE)
    const headerLen = headerBytes.length;
    out[offset++] = (headerLen >> 8) & 0xff;
    out[offset++] = headerLen & 0xff;

    // Header bytes
    out.set(headerBytes, offset);
    offset += headerBytes.length;

    // Ciphertext
    out.set(new Uint8Array(ciphertext), offset);

    return out.buffer;
  }

  function parseSafeFile(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 8) {
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
    const headerLen = (bytes[6] << 8) | bytes[7];

    if (version !== SAFE_CONFIG.fileVersion) {
      // برای آینده: می‌توان نسخه‌های دیگر را نیز پشتیبانی کرد
      throw new Error("نسخه فایل SAFE پشتیبانی نمی‌شود.");
    }

    if (bytes.length < 8 + headerLen) {
      throw new Error("طول هدر SAFE نامعتبر است.");
    }

    const headerBytes = bytes.slice(8, 8 + headerLen);
    const headerJson = textDecoder.decode(headerBytes);
    let headerObj;
    try {
      headerObj = JSON.parse(headerJson);
    } catch (e) {
      throw new Error("هدر SAFE قابل خواندن نیست (JSON نامعتبر).");
    }

    const ciphertext = bytes.slice(8 + headerLen);

    return {
      header: headerObj,
      flags,
      ciphertext: ciphertext.buffer
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
    const iv = getRandomBytes(SAFE_CONFIG.aesGcm.ivBytes);

    const key = await deriveKeyFromPassword(
      password,
      salt,
      SAFE_CONFIG.pbkdf2.iterations
    );

    setProgress(55, "در حال رمزنگاری با AES-256-GCM...");

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: SAFE_CONFIG.aesGcm.name,
        iv
      },
      key,
      fileBuffer
    );

    setProgress(80, "در حال ساخت فایل SAFE...");

    const header = {
      alg: "AES-256-GCM",
      kdf: "PBKDF2-SHA256",
      kdf_iterations: SAFE_CONFIG.pbkdf2.iterations,
      kdf_salt_b64: uint8ArrayToBase64(salt),
      iv_b64: uint8ArrayToBase64(iv),
      key_bits: SAFE_CONFIG.aesGcm.keyLength,
      file_name: file.name || "file",
      file_size: file.size,
      mime_type: file.type || "application/octet-stream",
      created_at: new Date().toISOString(),
      safe_version: SAFE_CONFIG.fileVersion
    };

    const safeBuffer = buildSafeFile(header, ciphertext);
    setProgress(95, "فایل SAFE آماده شد. در حال آماده‌سازی دانلود...");

    const safeBlob = new Blob([safeBuffer], {
      type: "application/octet-stream"
    });

    const safeName = file.name ? `${file.name}.SAFE` : "encrypted_file.SAFE";
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

    setProgress(25, "در حال تحلیل هدر SAFE...");

    const { header, ciphertext } = parseSafeFile(buffer);

    if (
      header.alg !== "AES-256-GCM" ||
      header.kdf !== "PBKDF2-SHA256" ||
      !header.kdf_salt_b64 ||
      !header.iv_b64
    ) {
      throw new Error(
        "این فایل SAFE با الگوریتم/فرمت پشتیبانی‌شده ساخته نشده است."
      );
    }

    const salt = base64ToUint8Array(header.kdf_salt_b64);
    const iv = base64ToUint8Array(header.iv_b64);
    const iterations =
      typeof header.kdf_iterations === "number"
        ? header.kdf_iterations
        : SAFE_CONFIG.pbkdf2.iterations;

    setProgress(45, "در حال مشتق‌سازی کلید از رمز عبور...");

    const key = await deriveKeyFromPassword(password, salt, iterations);

    setProgress(70, "در حال رمزگشایی با AES-256-GCM...");

    let plaintext;
    try {
      plaintext = await window.crypto.subtle.decrypt(
        {
          name: SAFE_CONFIG.aesGcm.name,
          iv
        },
        key,
        ciphertext
      );
    } catch (e) {
      // احتمالاً رمز اشتباه است
      throw new Error("رمز عبور نادرست است یا فایل SAFE آسیب دیده است.");
    }

    setProgress(90, "در حال ساخت فایل اصلی برای دانلود...");

    const mimeType =
      typeof header.mime_type === "string"
        ? header.mime_type
        : "application/octet-stream";
    const originalName =
      typeof header.file_name === "string" && header.file_name
        ? header.file_name
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

    if (!pwd || !pwdConfirm) {
      throw new Error("لطفاً رمز عبور و تکرار آن را وارد کنید.");
    }

    if (pwd !== pwdConfirm) {
      throw new Error("رمز عبور و تکرار آن یکسان نیستند.");
    }

    const { score } = evaluatePasswordStrength(pwd);
    if (score < 3) {
      throw new Error(
        "رمز عبور بسیار ضعیف است. لطفاً یک رمز قوی‌تر انتخاب کنید."
      );
    }

    if (currentMode === "decrypt") {
      // برای decrypt، فقط مطمئن شویم پسوند SAFE باشد (به‌طور نرم)
      if (!/\.SAFE$/i.test(selectedFile.name)) {
        logStatus(
          "هشدار: فایل انتخاب‌شده پسوند .SAFE ندارد. اگر مطمئن هستید، ادامه دهید.",
          "warn"
        );
      }
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
      alert(message);
    }
  }

  if (startBtn) {
    startBtn.addEventListener("click", function () {
      void handleStart();
    });
  }

  // ========================
  // TODO (برای فاز بعدی)
  // ========================
  // - اتصال به Telegram WebApp:
  //   دریافت initData، ارسال آن به Worker برای ساخت session امن.
  // - گرفتن file_url از Telegram CDN از طریق Worker.
  // - ثبت متادیتای encrypt/decrypt در Worker.
  // - اعمال محدودیت حجم ماهانه و Anti-bot.
})();
