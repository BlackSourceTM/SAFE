// ui_panel.js
// Clean, scrollable plan details modals for Bronze / Silver / Gold

(function (global) {
  "use strict";

  // ----------------- Helpers -----------------

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(selector)
    );
  }

  function normalizeName(text) {
    return (text || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  // ----------------- Plan config -----------------
  // Compact, user-facing description for each plan.
  // Free is included for comparison & future use.

  var PLAN_CONFIG = {
    free: {
      id: "free",
      name: "Free plan",
      badge: "Default",
      tagline: "Start using SAFE with basic limits.",
      bestFor: "Trying SAFE with small files and core features.",
      sizeLimit: "Up to 5 MB per file",
      formats:
        "Common formats such as PNG, JPG, TXT, ZIP and DOCX (basic use cases).",
      reports:
        "Account reports are not available on the Free plan (you can upgrade for reporting).",
      adsRemoved: false,
      speedLabel: "Standard speed",
      speed:
        "Files are processed in the normal queue. Good enough for casual, non-urgent use.",
      priority: "Standard queue priority.",
      multiKey: false,
      folderEncryption: false,
      backupEncryptedFile: false,
      userIdLock: false,
      coinsUsage:
        "Encrypting a file costs SAFE coins depending on its size. Decryption is always free.",
      accessNote:
        "Files created on the Free plan cannot be locked to a specific Telegram account. Any user who has the correct password can decrypt the file."
    },
    bronze: {
      id: "bronze",
      name: "Bronze plan",
      badge: "Entry level",
      tagline: "Basic paid tier with fair limits.",
      bestFor: "Casual users who need more formats and larger files.",
      sizeLimit: "Up to 40 MB per file",
      formats:
        "Everything from Free plus GIF, PDF, RAR, 7Z, MP3, MP4, XLSX and other common formats.",
      reports:
        "Account reports are not included in Bronze. Upgrade to Silver or Gold for exports.",
      adsRemoved: true,
      speedLabel: "Standard speed",
      speed:
        "Same base speed as Free users, but with more relaxed limits and fewer restrictions.",
      priority: "Standard queue priority.",
      multiKey: false,
      folderEncryption: false,
      backupEncryptedFile: false,
      userIdLock: true,
      coinsUsage:
        "Coins are charged based on encrypted file size (for example, around 1 SAFE coin per 10 MB, up to the plan limit). Decryption is always free.",
      accessNote:
        "When encrypting a file you can choose between:\n" +
        "• Only this Telegram account can decrypt it (SAFE locks the file header to your Telegram user ID), or\n" +
        "• Any Telegram account with the correct password can decrypt it (no user ID lock)."
    },
    silver: {
      id: "silver",
      name: "Silver plan",
      badge: "Most popular",
      tagline: "Better performance, reports and key flexibility.",
      bestFor:
        "Regular users who want faster processing, more formats and reporting.",
      sizeLimit: "Up to 50 MB per file",
      formats:
        "All Bronze formats plus extra ones used in office, media and app workflows (e.g. CSV, JSON, XML, MOV, MKV, WEBP, PPTX and more).",
      reports:
        "Account activity report export as XLSX with coins, operations and basic stats.",
      adsRemoved: true,
      speedLabel: "Faster speed",
      speed:
        "Files are processed faster than Free and Bronze users in a higher-priority queue.",
      priority: "Priority queue over Free and Bronze.",
      multiKey: true,
      folderEncryption: false,
      backupEncryptedFile: false,
      userIdLock: true,
      coinsUsage:
        "Coins are charged based on encrypted file size (for example, around 1 SAFE coin per 10 MB, up to 50 MB). Decryption is always free.",
      accessNote:
        "For each encrypted file you can decide:\n" +
        "• Lock decryption to your Telegram user ID only, or\n" +
        "• Let any Telegram account that knows the password decrypt it."
    },
    gold: {
      id: "gold",
      name: "Gold plan",
      badge: "Pro users",
      tagline: "Maximum performance, formats and priority.",
      bestFor:
        "Heavy users, creators and professionals dealing with a wide range of formats.",
      sizeLimit: "Up to 50 MB per file",
      formats:
        "All Silver formats plus extended formats such as RAW, DNG, CR2, NEF, ARW, PSD, AI, SVG, EPS, WAV, FLAC, SQL, DB, BAK, TAR, GZ, M4V and more.",
      reports:
        "Advanced account report export as CSV for deeper analysis or import into your own tools.",
      adsRemoved: true,
      speedLabel: "Highest speed",
      speed:
        "Always served by the fastest available queue in SAFE. Ideal for frequent encryption jobs.",
      priority: "Top priority queue in all encryption pipelines.",
      multiKey: true,
      folderEncryption: true,
      backupEncryptedFile: true,
      userIdLock: true,
      coinsUsage:
        "Coins are charged based on encrypted file size (for example, around 1 SAFE coin per 10 MB, up to 50 MB). Decryption is always free.",
      accessNote:
        "Gold keeps the same flexible rule:\n" +
        "• Lock file strictly to your Telegram user ID, or\n" +
        "• Allow decryption from any Telegram account that has the correct password.\n" +
        "Folder encryption and optional encrypted backups are also available in this plan."
    }
  };

  // ----------------- Modal DOM -----------------

  var modalState = {
    root: null,
    currentPlanId: null,
    purchaseHandler: null
  };

  function ensureModalRoot() {
    if (modalState.root) return modalState.root;

    var root = document.createElement("div");
    root.id = "safe-plan-modal";
    root.className = "safe-modal-root";

    var backdrop = document.createElement("div");
    backdrop.className = "safe-modal-backdrop";

    var modal = document.createElement("div");
    modal.className = "safe-modal";
    // Make sure the modal never overflows the viewport
    modal.style.maxWidth = "380px";
    modal.style.width = "100%";
    modal.style.maxHeight = "88vh";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";

    var inner = document.createElement("div");
    inner.className = "safe-modal__inner";

    var header = document.createElement("div");
    header.className = "safe-modal__header";

    var title = document.createElement("h3");
    title.className = "safe-modal__title";
    title.textContent = "Plan details";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "safe-modal__close";
    closeBtn.innerHTML = "&times;";

    header.appendChild(title);
    header.appendChild(closeBtn);

    var body = document.createElement("div");
    body.className = "safe-modal__body";
    // Scroll only inside body if content is tall
    body.style.maxHeight = "56vh";
    body.style.overflowY = "auto";

    var footer = document.createElement("div");
    footer.className = "safe-modal__footer";

    inner.appendChild(header);
    inner.appendChild(body);
    inner.appendChild(footer);
    modal.appendChild(inner);

    root.appendChild(backdrop);
    root.appendChild(modal);
    document.body.appendChild(root);

    function close() {
      closeModal();
    }

    backdrop.addEventListener("click", close);
    closeBtn.addEventListener("click", close);

    modalState.root = root;
    return root;
  }

  function openModal() {
    var root = ensureModalRoot();
    root.classList.add("safe-modal-root--visible");
  }

  function closeModal() {
    if (!modalState.root) return;
    modalState.root.classList.remove("safe-modal-root--visible");
    modalState.currentPlanId = null;
  }

  // ----------------- Render modal content -----------------

  function createChip(text) {
    var chip = document.createElement("span");
    chip.textContent = text;
    chip.style.display = "inline-flex";
    chip.style.alignItems = "center";
    chip.style.justifyContent = "center";
    chip.style.borderRadius = "999px";
    chip.style.padding = "2px 8px";
    chip.style.fontSize = "11px";
    chip.style.fontWeight = "500";
    chip.style.border = "1px solid var(--border-subtle)";
    chip.style.background = "rgba(15,23,42,.7)";
    chip.style.color = "var(--text-soft)";
    return chip;
  }

  function createSectionTitle(text) {
    var h = document.createElement("h4");
    h.className = "text-block__title";
    h.textContent = text;
    return h;
  }

  function createList(items) {
    var ul = document.createElement("ul");
    ul.style.margin = "0 0 4px";
    ul.style.paddingLeft = "16px";
    ul.style.fontSize = "13px";
    items.forEach(function (t) {
      if (!t) return;
      var li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });
    return ul;
  }

  function renderPlan(planId) {
    var config = PLAN_CONFIG[planId];
    if (!config) return;

    modalState.currentPlanId = planId;

    var root = ensureModalRoot();
    var titleEl = qs(".safe-modal__title", root);
    var bodyEl = qs(".safe-modal__body", root);
    var footerEl = qs(".safe-modal__footer", root);

    if (!titleEl || !bodyEl || !footerEl) {
      return;
    }

    // Header
    titleEl.textContent = config.name + " details";

    // Body layout — keep it compact and scannable.
    bodyEl.innerHTML = "";

    var headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.alignItems = "center";
    headerRow.style.gap = "8px";

    var titleBlock = document.createElement("div");

    var nameEl = document.createElement("p");
    nameEl.style.margin = "0 0 2px";
    nameEl.style.fontSize = "14px";
    nameEl.style.fontWeight = "600";
    nameEl.textContent = config.name;

    var taglineEl = document.createElement("p");
    taglineEl.style.margin = "0";
    taglineEl.style.fontSize = "12px";
    taglineEl.style.color = "var(--text-muted)";
    taglineEl.textContent = config.tagline;

    titleBlock.appendChild(nameEl);
    titleBlock.appendChild(taglineEl);

    var badgeCol = document.createElement("div");
    badgeCol.style.display = "flex";
    badgeCol.style.flexDirection = "column";
    badgeCol.style.alignItems = "flex-end";
    badgeCol.style.gap = "4px";

    if (config.badge) {
      badgeCol.appendChild(createChip(config.badge));
    }
    if (config.speedLabel) {
      var speedChip = createChip(config.speedLabel);
      speedChip.style.borderColor = "var(--accent)";
      speedChip.style.color = "var(--accent)";
      badgeCol.appendChild(speedChip);
    }

    headerRow.appendChild(titleBlock);
    headerRow.appendChild(badgeCol);

    var summaryCard = document.createElement("div");
    summaryCard.style.marginTop = "6px";
    summaryCard.style.padding = "8px 10px";
    summaryCard.style.borderRadius = "12px";
    summaryCard.style.border = "1px solid var(--border-subtle)";
    summaryCard.style.background = "rgba(15,23,42,.85)";

    var summaryTitle = document.createElement("p");
    summaryTitle.style.margin = "0 0 4px";
    summaryTitle.style.fontSize = "12px";
    summaryTitle.style.color = "var(--text-soft)";
    summaryTitle.textContent = "Best for";

    var summaryText = document.createElement("p");
    summaryText.style.margin = "0";
    summaryText.style.fontSize = "13px";
    summaryText.textContent = config.bestFor;

    summaryCard.appendChild(summaryTitle);
    summaryCard.appendChild(summaryText);

    var hint = document.createElement("p");
    hint.style.margin = "6px 0 0";
    hint.style.fontSize = "11px";
    hint.style.color = "var(--text-muted)";
    hint.textContent =
      "This description is based on the SAFE roadmap and may be slightly adjusted in the final production release.";

    bodyEl.appendChild(headerRow);
    bodyEl.appendChild(summaryCard);
    bodyEl.appendChild(hint);

    // Section: Limits & formats
    bodyEl.appendChild(createSectionTitle("Limits & formats"));
    bodyEl.appendChild(
      createList([
        "Max file size: " + config.sizeLimit + ".",
        config.formats
      ])
    );

    // Section: Access control (user ID lock)
    bodyEl.appendChild(createSectionTitle("Access control & user ID lock"));

    var accessParagraph = document.createElement("p");
    accessParagraph.className = "text-block__body";
    accessParagraph.style.marginBottom = "4px";
    accessParagraph.style.whiteSpace = "pre-line";
    accessParagraph.textContent = config.accessNote;
    bodyEl.appendChild(accessParagraph);

    if (planId !== "free") {
      var compareNote = document.createElement("p");
      compareNote.style.margin = "0 0 4px";
      compareNote.style.fontSize = "11px";
      compareNote.style.color = "var(--text-muted)";
      compareNote.textContent =
        "Free plan cannot lock files to a specific Telegram user ID. Paid plans add this option per file.";
      bodyEl.appendChild(compareNote);
    }

    // Section: Extra features
    bodyEl.appendChild(createSectionTitle("Extra features"));

    var extraItems = [];

    if (config.adsRemoved) {
      extraItems.push("All in-bot ads and promotional banners are removed.");
    } else {
      extraItems.push(
        "You may still see in-bot promotions and banners while using SAFE."
      );
    }

    if (config.multiKey) {
      extraItems.push(
        "Multiple keys per file supported, with a cleaner view in your key status panel."
      );
    } else {
      extraItems.push("Multiple registered keys per file are not available.");
    }

    if (config.folderEncryption) {
      extraItems.push(
        "Folder encryption: SAFE can compress a folder (ZIP) and then encrypt it as a single SAFE file."
      );
    }

    if (config.backupEncryptedFile) {
      extraItems.push(
        "Optional backup of the encrypted file (without key material) on SAFE servers."
      );
    }

    // Speed / priority
    extraItems.push(config.speed);
    extraItems.push(config.priority);
    extraItems.push(config.reports);

    bodyEl.appendChild(createList(extraItems));

    // Section: Coins & billing
    bodyEl.appendChild(createSectionTitle("Coins & billing"));

    var coinsParagraph = document.createElement("p");
    coinsParagraph.className = "text-block__body";
    coinsParagraph.textContent = config.coinsUsage;
    bodyEl.appendChild(coinsParagraph);

    // Footer: action buttons
    footerEl.innerHTML = "";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "btn btn--ghost btn--sm";
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", function () {
      closeModal();
    });

    var buyBtn = document.createElement("button");
    buyBtn.type = "button";
    buyBtn.className = "btn btn--primary btn--sm";
    buyBtn.textContent = "Buy this plan";

    buyBtn.addEventListener("click", function () {
      var handler = modalState.purchaseHandler;
      var planInfo = config;
      if (typeof handler === "function") {
        try {
          handler(planInfo);
        } catch (err) {
          console.error("[SAFE] Plan purchase handler error:", err);
        }
      } else {
        console.log("[SAFE] Selected plan:", planInfo.id, planInfo);
      }
      closeModal();
    });

    footerEl.appendChild(closeBtn);
    footerEl.appendChild(buyBtn);

    // Reset scroll to the top every time we open a plan
    bodyEl.scrollTop = 0;
  }

  // ----------------- Wiring details buttons -----------------

  function attachPlanButtons() {
    var storeSection = document.getElementById("section-store");
    if (!storeSection) return;

    // Find the "Upgrade plan" card inside the Store section
    var cards = qsa(".panel-card", storeSection);
    if (!cards.length) return;

    var upgradeCard = null;
    for (var i = 0; i < cards.length; i++) {
      var titleEl = qs(".panel-card__title", cards[i]);
      if (!titleEl) continue;
      if (normalizeName(titleEl.textContent) === "upgrade plan") {
        upgradeCard = cards[i];
        break;
      }
    }

    if (!upgradeCard) return;

    var packages = qsa(".package", upgradeCard);
    if (!packages.length) return;

    packages.forEach(function (pkg) {
      var nameEl = qs(".package__name", pkg);
      var btn = qs("button.btn", pkg);
      if (!nameEl || !btn) return;

      var name = normalizeName(nameEl.textContent);
      var planId = null;

      if (name.indexOf("bronze") !== -1) planId = "bronze";
      else if (name.indexOf("silver") !== -1) planId = "silver";
      else if (name.indexOf("gold") !== -1) planId = "gold";

      if (!planId) return;

      var newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener("click", function (ev) {
        ev.preventDefault();
        renderPlan(planId);
        openModal();
      });
    });
  }

  // ----------------- Public API -----------------

  var api = {
    /**
     * Manually open a plan modal.
     * @param {"free"|"bronze"|"silver"|"gold"} planId
     */
    openPlanModal: function (planId) {
      if (!PLAN_CONFIG[planId]) return;
      renderPlan(planId);
      openModal();
    },

    /**
     * Set purchase handler for "Buy this plan" button.
     * handler receives one argument:
     *    (planInfo: PLAN_CONFIG entry)
     */
    setPurchaseHandler: function (handler) {
      if (typeof handler === "function") {
        modalState.purchaseHandler = handler;
      } else {
        modalState.purchaseHandler = null;
      }
    },

    /**
     * Expose plan configuration as a shallow copy.
     */
    getPlanConfig: function (planId) {
      var cfg = PLAN_CONFIG[planId];
      if (!cfg) return null;
      var copy = {};
      Object.keys(cfg).forEach(function (k) {
        copy[k] = cfg[k];
      });
      return copy;
    }
  };

  global.safePlan = api;

  // ----------------- Init on DOM ready -----------------

  document.addEventListener("DOMContentLoaded", function () {
    attachPlanButtons();
  });
})(window);
