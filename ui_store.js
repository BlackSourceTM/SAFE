// ui_store.js
// SAFE Store – coins & plans via Telegram Stars (UI only)

(function () {
  "use strict";

  // ---------- CONFIG: pricing & limits ----------

  // Approximate conversion helper:
  // 1 USD ≈ 100 Stars (example), plus 30% buffer for conversion loss
  function usdToStars(usd) {
    var base = 100; // base Stars per USD (adjustable later if needed)
    var bufferFactor = 1.3; // +30% buffer
    return Math.round(usd * base * bufferFactor);
  }

  // Coin packages shown in "Buy coins" card
  var COIN_PACKAGES = [
    {
      id: "coins-50",
      name: "50 SAFE coins",
      coins: 50,
      usd: 1,
      description: "Recommended for light usage."
    },
    {
      id: "coins-100",
      name: "100 SAFE coins",
      coins: 100,
      usd: 2,
      description: "Balanced for regular users."
    },
    {
      id: "coins-500",
      name: "500 SAFE coins",
      coins: 500,
      usd: 8,
      description: "Best value for heavy usage."
    }
  ];

  // Plan pricing (USD) matching roadmap + annual discount
  // Gold ≈ 5 USD per month as requested.
  var PLAN_PRICING = {
    bronze: {
      id: "bronze",
      name: "Bronze plan",
      billing: {
        monthly: 1,
        quarterly: 3,
        yearly: 11 // discounted vs 12
      }
    },
    silver: {
      id: "silver",
      name: "Silver plan",
      billing: {
        monthly: 3,
        quarterly: 9,
        yearly: 33 // discounted vs 36
      }
    },
    gold: {
      id: "gold",
      name: "Gold plan",
      billing: {
        monthly: 5,  // ~5 USD/month
        quarterly: 15,
        yearly: 50 // discounted vs 60
      }
    }
  };

  // Max file size per plan (MB) and coin consumption (for info text)
  var PLAN_LIMITS_MB = {
    free: 99,
    bronze: 500,
    silver: 1200,
    gold: 1800
  };

  var PLAN_MB_PER_COIN = {
    free: 50,  // 1 coin per 50MB
    paid: 30   // 1 coin per 30MB (Bronze/Silver/Gold)
  };

  var BILLING_OPTIONS = [
    {
      id: "monthly",
      label: "Monthly",
      hint: "Pay month by month. Best for short-term usage."
    },
    {
      id: "quarterly",
      label: "3 months",
      hint: "Better value for regular SAFE users."
    },
    {
      id: "yearly",
      label: "12 months",
      hint: "Best value – yearly discount applied."
    }
  ];

  // Star icon, matching tick.png style but smaller
  var STAR_ICON_HTML =
    '<img src="stars.png" alt="" style="width:14px;height:14px;vertical-align:middle;object-fit:contain;margin-left:4px;">';

  // ---------- SMALL HELPERS ----------

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(sel)
    );
  }

  function normalize(text) {
    return (text || "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  // Simple toast for Store
  var storeToast = null;
  var storeToastTimer = null;

  function ensureStoreToast() {
    if (storeToast) return storeToast;
    var el = document.createElement("div");
    el.id = "safe-store-toast";
    el.className = "safe-toast";
    document.body.appendChild(el);
    storeToast = el;
    return el;
  }

  function showStoreToast(message, type) {
    var toast = ensureStoreToast();
    toast.textContent = message || "";
    toast.classList.remove("safe-toast--error", "safe-toast--success");
    if (type === "error") toast.classList.add("safe-toast--error");
    if (type === "success") toast.classList.add("safe-toast--success");
    toast.classList.add("safe-toast--visible");
    if (storeToastTimer) clearTimeout(storeToastTimer);
    storeToastTimer = setTimeout(function () {
      toast.classList.remove("safe-toast--visible");
    }, 3500);
  }

  // Placeholder for backend payment handling via Stars
  function startStarsPayment(payload) {
    console.log("[SAFE Store] Stars payment requested:", payload);
    showStoreToast(
      "Stars payments are not wired to backend yet. This is only the UI layer.",
      "success"
    );
  }

  // ---------- STORE MODAL (separate from delete / panel modals) ----------

  var storeModalState = {
    root: null,
    titleEl: null,
    bodyEl: null,
    footerEl: null
  };

  function ensureStoreModal() {
    if (storeModalState.root) return storeModalState.root;

    var root = document.createElement("div");
    root.id = "safe-store-modal";
    root.className = "safe-modal-root safe-store-modal-root";

    var backdrop = document.createElement("div");
    backdrop.className = "safe-modal-backdrop";

    var modal = document.createElement("div");
    modal.className = "safe-modal";
    modal.style.maxWidth = "380px";
    modal.style.width = "100%";
    modal.style.maxHeight = "80vh";
    modal.style.display = "flex";
    modal.style.flexDirection = "column";

    var inner = document.createElement("div");
    inner.className = "safe-modal__inner";

    var header = document.createElement("div");
    header.className = "safe-modal__header";

    var title = document.createElement("h3");
    title.className = "safe-modal__title";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "safe-modal__close";
    closeBtn.innerHTML = "&times;";

    header.appendChild(title);
    header.appendChild(closeBtn);

    var body = document.createElement("div");
    body.className = "safe-modal__body";
    body.style.maxHeight = "55vh";
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

    backdrop.addEventListener("click", closeStoreModal);
    closeBtn.addEventListener("click", closeStoreModal);

    storeModalState.root = root;
    storeModalState.titleEl = title;
    storeModalState.bodyEl = body;
    storeModalState.footerEl = footer;

    return root;
  }

  function openStoreModal(config) {
    var root = ensureStoreModal();
    var titleEl = storeModalState.titleEl;
    var bodyEl = storeModalState.bodyEl;
    var footerEl = storeModalState.footerEl;

    titleEl.textContent = config.title || "SAFE Store";
    bodyEl.innerHTML = "";
    footerEl.innerHTML = "";

    if (typeof config.buildBody === "function") {
      config.buildBody(bodyEl);
    }

    // footer buttons
    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn--ghost btn--sm";
    cancelBtn.textContent = config.cancelLabel || "Close";
    cancelBtn.addEventListener("click", closeStoreModal);
    footerEl.appendChild(cancelBtn);

    // FIX: Always create primary button if onPrimary exists,
    // even when primaryLabel is empty (it will be updated later).
    var hasPrimary = typeof config.onPrimary === "function";
    if (hasPrimary) {
      var primaryBtn = document.createElement("button");
      primaryBtn.type = "button";
      primaryBtn.className = "btn btn--primary btn--sm";
      primaryBtn.innerHTML = config.primaryLabel || "Continue";
      primaryBtn.addEventListener("click", function () {
        config.onPrimary();
      });
      footerEl.appendChild(primaryBtn);
    }

    root.classList.add("safe-modal-root--visible");
  }

  function closeStoreModal() {
    if (!storeModalState.root) return;
    storeModalState.root.classList.remove("safe-modal-root--visible");
  }

  // ---------- COINS: modal ----------

  function openCoinPackageModal(pkg) {
    var stars = usdToStars(pkg.usd);

    openStoreModal({
      title: "Buy SAFE coins",
      primaryLabel: "Continue with " + stars + " Stars " + STAR_ICON_HTML,
      buildBody: function (body) {
        var intro = document.createElement("p");
        intro.textContent =
          "You are about to buy " +
          pkg.coins +
          " SAFE coins using Telegram Stars.";
        body.appendChild(intro);

        var pricing = document.createElement("p");
        pricing.innerHTML =
          "Approximate price: <strong>" +
          pkg.usd +
          " USD</strong> (about " +
          stars +
          " Stars " +
          STAR_ICON_HTML +
          ").";
        body.appendChild(pricing);

        var listTitle = document.createElement("p");
        listTitle.textContent = "What this means in practice:";
        body.appendChild(listTitle);

        var ul = document.createElement("ul");
        ul.style.margin = "0 0 4px";
        ul.style.paddingLeft = "18px";
        ul.style.fontSize = "12px";

        [
          "Telegram will show you a native Stars invoice for this package.",
          "After payment is confirmed, SAFE backend will increase your coin balance.",
          "Coins are only used to control encryption limits; decryption is always free.",
          "All file operations remain end-to-end encrypted. Stars are only a payment layer."
        ].forEach(function (t) {
          var li = document.createElement("li");
          li.textContent = t;
          ul.appendChild(li);
        });
        body.appendChild(ul);

        var note = document.createElement("p");
        note.style.fontSize = "11px";
        note.style.color = "var(--text-muted)";
        note.textContent =
          "This is only the UI. Real Stars invoices will be created and validated by SAFE backend in the final version.";
        body.appendChild(note);
      },
      onPrimary: function () {
        startStarsPayment({
          type: "coins",
          packageId: pkg.id,
          coins: pkg.coins,
          usd: pkg.usd,
          stars: stars
        });
      }
    });
  }

  // ---------- PLANS: modal with dropdown billing ----------

  function getBillingOptionsForPlan(planPricing) {
    return BILLING_OPTIONS.filter(function (opt) {
      return planPricing.billing[opt.id] != null;
    });
  }

  function buildBillingDropdown(planPricing, state, onChange) {
    var wrapper = document.createElement("div");
    wrapper.className = "safe-field";
    wrapper.style.marginTop = "10px";

    var label = document.createElement("div");
    label.className = "safe-field__label";
    label.textContent = "Billing period";
    wrapper.appendChild(label);

    var currentBtn = document.createElement("button");
    currentBtn.type = "button";
    currentBtn.className = "btn btn--ghost btn--sm";
    currentBtn.style.display = "flex";
    currentBtn.style.width = "100%";
    currentBtn.style.alignItems = "center";
    currentBtn.style.justifyContent = "space-between";

    var leftSpan = document.createElement("span");
    var rightSpan = document.createElement("span");
    rightSpan.style.whiteSpace = "nowrap";

    currentBtn.appendChild(leftSpan);
    currentBtn.appendChild(rightSpan);

    var menu = document.createElement("div");
    menu.style.marginTop = "6px";
    menu.style.display = "none";
    menu.style.flexDirection = "column";
    menu.style.gap = "4px";

    function setCurrentLabel() {
      var usd = planPricing.billing[state.billingId];
      var stars = usdToStars(usd);

      var opt = BILLING_OPTIONS.find(function (o) {
        return o.id === state.billingId;
      });

      leftSpan.textContent =
        (opt ? opt.label : "Billing") + " – ≈ " + usd + " USD";
      rightSpan.innerHTML = stars + " " + STAR_ICON_HTML;
    }

    currentBtn.addEventListener("click", function () {
      menu.style.display = menu.style.display === "none" ? "flex" : "none";
    });

    getBillingOptionsForPlan(planPricing).forEach(function (opt) {
      var usd = planPricing.billing[opt.id];
      var stars = usdToStars(usd);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--ghost btn--sm";
      btn.style.width = "100%";
      btn.style.justifyContent = "space-between";

      var left = document.createElement("span");
      left.textContent = opt.label + " – ≈ " + usd + " USD";

      var right = document.createElement("span");
      right.innerHTML = stars + " " + STAR_ICON_HTML;

      btn.appendChild(left);
      btn.appendChild(right);

      btn.addEventListener("click", function () {
        state.billingId = opt.id;
        setCurrentLabel();
        menu.style.display = "none";
        if (typeof onChange === "function") {
          onChange(opt.id);
        }
      });

      menu.appendChild(btn);
    });

    // initial
    setCurrentLabel();

    wrapper.appendChild(currentBtn);
    wrapper.appendChild(menu);

    var hint = document.createElement("div");
    hint.className = "safe-modal__status";
    hint.style.marginTop = "4px";

    var opt = BILLING_OPTIONS.find(function (o) {
      return o.id === state.billingId;
    });
    hint.textContent =
      (opt && opt.hint) ||
      "Choose the period that best matches how often you will use SAFE.";
    wrapper.appendChild(hint);

    return {
      root: wrapper,
      update: setCurrentLabel,
      statusEl: hint
    };
  }

  function openPlanPurchaseModal(planInfo, planPricing) {
    if (!planPricing || !planPricing.billing) {
      showStoreToast("Pricing for this plan is not configured yet.", "error");
      return;
    }

    var state = {
      billingId: "monthly"
    };
    if (!planPricing.billing[state.billingId]) {
      state.billingId = Object.keys(planPricing.billing)[0];
    }

    openStoreModal({
      title: "Upgrade to " + planPricing.name,
      // primaryLabel intentionally left empty; it will be updated by updatePlanPrimaryButton
      primaryLabel: "",
      buildBody: function (body) {
        var id = planPricing.id;
        var maxMb = PLAN_LIMITS_MB[id] || null;
        var mbPerCoin =
          id === "free" ? PLAN_MB_PER_COIN.free : PLAN_MB_PER_COIN.paid;

        var intro = document.createElement("p");
        intro.textContent =
          "Upgrade your SAFE account to " +
          planPricing.name +
          " using Telegram Stars.";
        body.appendChild(intro);

        var grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "minmax(0,1fr) minmax(0,1fr)";
        grid.style.gap = "6px 12px";
        grid.style.fontSize = "12px";
        grid.style.marginTop = "4px";

        function addRow(label, value) {
          var row = document.createElement("div");
          row.style.display = "flex";
          row.style.flexDirection = "column";
          var a = document.createElement("span");
          a.style.color = "var(--text-soft)";
          a.textContent = label;
          var b = document.createElement("span");
          b.style.fontWeight = "500";
          b.textContent = value;
          row.appendChild(a);
          row.appendChild(b);
          grid.appendChild(row);
        }

        if (maxMb != null) {
          addRow("Max file size", maxMb + " MB per file");
        }
        addRow(
          "Coin usage",
          mbPerCoin +
            " MB per 1 coin (encryption only, decryption is always free)."
        );
        addRow(
          "Access lock",
          id === "free"
            ? "No account lock – files can be opened from any account with the correct password."
            : "Flexible – you can lock files to your numeric account ID or keep them open to any account with the password."
        );
        addRow(
          "Payment method",
          "Only Telegram Stars – no TON wallet or local gateways."
        );

        body.appendChild(grid);

        var formatsText = document.createElement("p");
        formatsText.style.marginTop = "8px";
        formatsText.style.marginBottom = "2px";
        formatsText.textContent =
          "Format filtering is relaxed on higher plans. In practice you can encrypt almost any non-executable data format:";
        body.appendChild(formatsText);

        var formatsList = document.createElement("ul");
        formatsList.style.paddingLeft = "18px";
        formatsList.style.margin = "0 0 4px";
        formatsList.style.fontSize = "12px";

        [
          "Documents, images, archives and media files used in typical workflows.",
          "Professional formats such as RAW photos, project archives and database dumps on higher tiers.",
          "Executable formats (EXE, BAT, MSI, APK, shell scripts, etc.) are never supported for encryption.",
          "Existing .SAFE files can only be decrypted, not re-encrypted."
        ].forEach(function (t) {
          var li = document.createElement("li");
          li.textContent = t;
          formatsList.appendChild(li);
        });
        body.appendChild(formatsList);

        var selector = buildBillingDropdown(planPricing, state, function () {
          updatePlanPrimaryButton(planPricing, state);
        });
        body.appendChild(selector.root);
      },
      onPrimary: function () {
        var billingId = state.billingId;
        var usd = planPricing.billing[billingId];
        var stars = usdToStars(usd);

        startStarsPayment({
          type: "plan",
          planId: planPricing.id,
          planName: planPricing.name,
          billing: billingId,
          usd: usd,
          stars: stars
        });
      }
    });

    updatePlanPrimaryButton(planPricing, state);
  }

  function updatePlanPrimaryButton(planPricing, state) {
    var root = storeModalState.root;
    if (!root) return;

    var primaryBtn = storeModalState.footerEl.querySelector(".btn--primary");
    if (!primaryBtn) return;

    var billingId = state.billingId;
    if (!planPricing.billing[billingId]) {
      billingId = Object.keys(planPricing.billing)[0];
      state.billingId = billingId;
    }

    var usd = planPricing.billing[billingId];
    var stars = usdToStars(usd);
    var opt = BILLING_OPTIONS.find(function (o) {
      return o.id === billingId;
    });

    primaryBtn.innerHTML =
      "Pay " +
      (opt ? opt.label.toLowerCase() : "subscription") +
      " with " +
      stars +
      " Stars " +
      STAR_ICON_HTML;
  }

  // ---------- WIRING: coins card ----------

  function initCoinsCard() {
    var storeSection = document.getElementById("section-store");
    if (!storeSection) return;

    var coinsCard = qsa(".panel-card", storeSection).find(function (card) {
      var title = qs(".panel-card__title", card);
      return title && normalize(title.textContent) === "buy coins";
    });
    if (!coinsCard) return;

    // Update subtitle under "Buy coins"
    var coinsSubtitle = qs(".panel-card__subtitle", coinsCard);
    if (coinsSubtitle) {
      coinsSubtitle.textContent =
        "Choose a coin package and pay only with Telegram Stars.";
    }

    var packageEls = qsa(".package", coinsCard);
    if (!packageEls.length) return;

    packageEls.forEach(function (el) {
      var nameEl = qs(".package__name", el);
      var priceEl = qs(".package__price", el);
      var btn = qs("button.btn", el);

      if (!nameEl || !priceEl || !btn) return;

      var label = nameEl.textContent.trim();
      var pkg = COIN_PACKAGES.find(function (p) {
        return p.name === label;
      });
      if (!pkg) return;

      var stars = usdToStars(pkg.usd);
      priceEl.innerHTML =
        "≈ " + pkg.usd + " USD · " + stars + " " + STAR_ICON_HTML;

      // Make button say "Buy"
      btn.textContent = "Buy";

      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        openCoinPackageModal(pkg);
      });
    });
  }

  // ---------- WIRING: plan card + safePlan integration ----------

  function initPlanCardButtons() {
    // We only override "Buy this plan" from ui_panel.js via safePlan.setPurchaseHandler
    if (!window.safePlan || typeof window.safePlan.setPurchaseHandler !== "function") {
      console.warn(
        "[SAFE Store] safePlan.setPurchaseHandler not available. Make sure ui_panel.js is loaded before ui_store.js."
      );
      return;
    }

    window.safePlan.setPurchaseHandler(function (planInfo) {
      var pricing = PLAN_PRICING[planInfo.id];
      if (!pricing) {
        showStoreToast(
          'Pricing for plan "' + planInfo.name + '" is not configured yet.',
          "error"
        );
        return;
      }
      openPlanPurchaseModal(planInfo, pricing);
    });
  }

  // ---------- WIRING: subtitle of Store section ----------

  function updateStoreSubtitle() {
    var storeSection = document.getElementById("section-store");
    if (!storeSection) return;
    var subtitle = qs(".panel-section__subtitle", storeSection);
    if (subtitle) {
      subtitle.textContent =
        "Buy SAFE coins or upgrade your plan. All payments are processed only with Telegram Stars.";
    }
  }

  // ---------- INIT ----------

  function initStore() {
    updateStoreSubtitle();
    initCoinsCard();
    initPlanCardButtons();
    ensureStoreToast();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStore);
  } else {
    initStore();
  }

  // Optional public API
  window.SafeStore = {
    openPlanModal: openPlanPurchaseModal,
    openCoinPackageModal: openCoinPackageModal,
    usdToStars: usdToStars
  };
})();
