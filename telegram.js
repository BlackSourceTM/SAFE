// telegram.js
(function () {
  function safeQuery(selector) {
    return document.querySelector(selector);
  }

  function getTelegramUser() {
    if (!window.Telegram || !window.Telegram.WebApp) {
      return null;
    }
    const wa = window.Telegram.WebApp;
    if (!wa.initDataUnsafe || !wa.initDataUnsafe.user) {
      return null;
    }
    return wa.initDataUnsafe.user;
  }

  function buildUserModel() {
    const tgUser = getTelegramUser();
    if (!tgUser) {
      // حالت دمو وقتی خارج از تلگرام هستیم
      return {
        username: "demo_user",
        userId: 22130261,
        firstName: "SAFE",
        lastName: "Demo",
      };
    }

    const username =
      (tgUser.username && String(tgUser.username)) ||
      (tgUser.first_name ? tgUser.first_name : "user");
    const userId = tgUser.id || 0;

    return {
      username,
      userId,
      firstName: tgUser.first_name || "",
      lastName: tgUser.last_name || "",
    };
  }

  function updateHeader(user) {
    const headerNameEl = safeQuery(".user-pill__name");
    const headerHintEl = safeQuery(".user-pill__hint");
    const avatarEl = safeQuery(".user-pill__avatar");

    if (headerNameEl) {
      headerNameEl.textContent =
        user.username.startsWith("@")
          ? user.username
          : "@" + user.username;
    }

    if (headerHintEl) {
      // نمایش User ID عددی زیر نام
      const idStr =
        typeof user.userId === "number"
          ? String(user.userId)
          : String(user.userId || "00000000");
      headerHintEl.textContent = idStr;
    }

    if (avatarEl) {
      // اولین حرف نام یا یوزرنیم به‌عنوان آواتار
      const base =
        user.firstName ||
        user.username ||
        "S";
      const ch = base.trim().charAt(0) || "S";
      avatarEl.textContent = ch.toUpperCase();
    }
  }

  function updateProfileSection(user) {
    // پنل My profile: اولین ردیف «Telegram user ID» است
    const profileSection = safeQuery("#section-profile");
    if (!profileSection) return;

    const rows = profileSection.querySelectorAll(".data-list__row");
    if (!rows.length) return;

    // ردیف اول: Telegram user ID
    const idRow = rows[0];
    const idDd = idRow.querySelector("dd");
    if (idDd) {
      const idStr =
        typeof user.userId === "number"
          ? String(user.userId)
          : String(user.userId || "00000000");
      idDd.textContent = idStr;
    }

    // می‌توانی بعداً اینجا چیزهای بیشتر مثل total operations و... را
    // وقتی بک‌اند آماده شد، به‌روزرسانی کنی.
  }

  function initTelegramUI() {
    const user = buildUserModel();
    updateHeader(user);
    updateProfileSection(user);

    // اگر در تلگرام هستیم، WebApp را آماده کن
    if (window.Telegram && window.Telegram.WebApp) {
      try {
        const wa = window.Telegram.WebApp;
        wa.ready();
      } catch (e) {
        // در حالت دمو ممکن است خطا بدهد؛ نادیده می‌گیریم
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTelegramUI);
  } else {
    initTelegramUI();
  }
})();
