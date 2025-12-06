// ui_delete.js
// Standalone SAFE account delete UI (3-step flow)

(function (global) {
  "use strict";

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  var deleteState = {
    step: 0,
    code: "",
    codeDeadline: 0,
    attemptsLeft: 3,
    countdownTimerId: null,
    config: {
      onDelete: null,
      getUser: null
    }
  };

  // ---------- DOM helpers ----------

  function ensureModalRoot() {
    var root = document.getElementById("safe-delete-account-modal");
    if (!root) {
      root = document.createElement("div");
      root.id = "safe-delete-account-modal";
      root.className = "safe-modal-root";

      var backdrop = document.createElement("div");
      backdrop.className = "safe-modal-backdrop";

      var modal = document.createElement("div");
      modal.className = "safe-modal";

      var inner = document.createElement("div");
      inner.className = "safe-modal__inner";

      var header = document.createElement("div");
      header.className = "safe-modal__header";

      var title = document.createElement("h3");
      title.className = "safe-modal__title";
      title.textContent = "Delete SAFE account";

      var closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "safe-modal__close";
      closeBtn.innerHTML = "&times;";

      header.appendChild(title);
      header.appendChild(closeBtn);

      var body = document.createElement("div");
      body.className = "safe-modal__body";

      var footer = document.createElement("div");
      footer.className = "safe-modal__footer";

      inner.appendChild(header);
      inner.appendChild(body);
      inner.appendChild(footer);

      modal.appendChild(inner);
      root.appendChild(backdrop);
      root.appendChild(modal);

      document.body.appendChild(root);
    }
    return root;
  }

  function ensureToastRoot() {
    var toast = document.getElementById("safe-delete-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "safe-delete-toast";
      toast.className = "safe-toast";
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showToast(message, type) {
    var toast = ensureToastRoot();
    toast.textContent = message || "";
    toast.classList.remove("safe-toast--error", "safe-toast--success");
    if (type === "error") toast.classList.add("safe-toast--error");
    if (type === "success") toast.classList.add("safe-toast--success");
    toast.classList.add("safe-toast--visible");

    if (toast._timerId) {
      clearTimeout(toast._timerId);
    }
    toast._timerId = setTimeout(function () {
      toast.classList.remove("safe-toast--visible");
    }, 3500);
  }

  function openModal() {
    ensureModalRoot().classList.add("safe-modal-root--visible");
  }

  function closeModal() {
    ensureModalRoot().classList.remove("safe-modal-root--visible");
  }

  function clearCountdown() {
    if (deleteState.countdownTimerId) {
      clearInterval(deleteState.countdownTimerId);
      deleteState.countdownTimerId = null;
    }
  }

  function resetState() {
    clearCountdown();
    deleteState.step = 0;
    deleteState.code = "";
    deleteState.codeDeadline = 0;
    deleteState.attemptsLeft = 3;

    var root = ensureModalRoot();
    var bodyEl = qs(".safe-modal__body", root);
    var footerEl = qs(".safe-modal__footer", root);
    if (bodyEl) bodyEl.innerHTML = "";
    if (footerEl) footerEl.innerHTML = "";
  }

  function shuffle(array) {
    var a = array.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function generateCode() {
    var n = Math.floor(100000 + Math.random() * 900000);
    return String(n);
  }

  function formatRemaining(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ":" + (s < 10 ? "0" + s : s);
  }

  // ---------- Step renderers ----------

  function renderStep1() {
    deleteState.step = 1;
    clearCountdown();

    var root = ensureModalRoot();
    var titleEl = qs(".safe-modal__title", root);
    var bodyEl = qs(".safe-modal__body", root);
    var footerEl = qs(".safe-modal__footer", root);

    if (!titleEl || !bodyEl || !footerEl) return;

    titleEl.textContent = "Delete SAFE account – step 1 of 3";
    bodyEl.innerHTML = "";
    footerEl.innerHTML = "";

    var p1 = document.createElement("p");
    p1.textContent =
      "Deleting your SAFE account is permanent and cannot be undone.";

    var p2 = document.createElement("p");
    p2.textContent =
      "In the final version this will remove all SAFE-related metadata, coins and usage history linked to your account.";

    var p3 = document.createElement("p");
    p3.textContent =
      "If you only want to stop using the bot for a while, you can disable or block it from Telegram settings instead of deleting your account here.";

    var p4 = document.createElement("p");
    p4.style.fontWeight = "600";
    p4.textContent = "Do you still want to delete your SAFE account?";

    bodyEl.appendChild(p1);
    bodyEl.appendChild(p2);
    bodyEl.appendChild(p3);
    bodyEl.appendChild(p4);

    var actions = [
      { key: "yes", label: "Yes" },
      { key: "no", label: "No" },
      { key: "not_sure", label: "Not sure" },
      { key: "cancel", label: "Cancel" }
    ];

    renderChoiceButtons(footerEl, actions, function (key) {
      if (key === "yes") {
        renderStep2();
      } else {
        showToast("Account delete flow was cancelled.", "error");
        closeModal();
        resetState();
      }
    });
  }

  function renderStep2() {
    deleteState.step = 2;
    clearCountdown();

    var root = ensureModalRoot();
    var titleEl = qs(".safe-modal__title", root);
    var bodyEl = qs(".safe-modal__body", root);
    var footerEl = qs(".safe-modal__footer", root);

    if (!titleEl || !bodyEl || !footerEl) return;

    titleEl.textContent = "Delete SAFE account – step 2 of 3";
    bodyEl.innerHTML = "";
    footerEl.innerHTML = "";

    var p1 = document.createElement("p");
    p1.textContent =
      "Are you really sure you want to delete your SAFE account?";

    var p2 = document.createElement("p");
    p2.textContent =
      "This confirmation is required to avoid accidental deletions.";

    var p3 = document.createElement("p");
    p3.style.fontWeight = "600";
    p3.textContent = "Are you absolutely sure about this decision?";

    bodyEl.appendChild(p1);
    bodyEl.appendChild(p2);
    bodyEl.appendChild(p3);

    var actions = [
      { key: "full_yes", label: "Yes, I am absolutely sure" },
      { key: "no", label: "No" },
      { key: "back", label: "Go back" },
      { key: "dont_know", label: "I am not sure" }
    ];

    renderChoiceButtons(footerEl, actions, function (key) {
      if (key === "full_yes") {
        renderStep3();
      } else if (key === "back") {
        renderStep1();
      } else {
        showToast("Account delete flow was cancelled.", "error");
        closeModal();
        resetState();
      }
    });
  }

  function renderStep3() {
    deleteState.step = 3;
    clearCountdown();

    deleteState.code = generateCode();
    deleteState.attemptsLeft = 3;
    deleteState.codeDeadline = Date.now() + 2 * 60 * 1000;

    var root = ensureModalRoot();
    var titleEl = qs(".safe-modal__title", root);
    var bodyEl = qs(".safe-modal__body", root);
    var footerEl = qs(".safe-modal__footer", root);

    if (!titleEl || !bodyEl || !footerEl) return;

    titleEl.textContent = "Delete SAFE account – step 3 of 3";
    bodyEl.innerHTML = "";
    footerEl.innerHTML = "";

    var p1 = document.createElement("p");
    p1.textContent =
      "To prevent abuse or accidental deletion, you must confirm this action with a one-time verification code.";

    var p2 = document.createElement("p");
    p2.textContent =
      "The code below is only valid for 2 minutes and you have a maximum of 3 attempts to enter it correctly.";

    var codeBox = document.createElement("div");
    codeBox.style.marginTop = "8px";
    codeBox.style.padding = "8px 10px";
    codeBox.style.borderRadius = "10px";
    codeBox.style.border = "1px dashed var(--border-subtle)";
    codeBox.style.display = "flex";
    codeBox.style.alignItems = "center";
    codeBox.style.justifyContent = "space-between";
    codeBox.style.gap = "8px";

    var codeLabel = document.createElement("span");
    codeLabel.style.fontSize = "13px";
    codeLabel.textContent = "Delete confirmation code:";

    var codeValueWrap = document.createElement("div");
    codeValueWrap.style.display = "flex";
    codeValueWrap.style.alignItems = "center";
    codeValueWrap.style.gap = "8px";

    var codeValue = document.createElement("span");
    codeValue.style.fontFamily = "monospace";
    codeValue.style.fontSize = "14px";
    codeValue.style.padding = "2px 8px";
    codeValue.style.borderRadius = "999px";
    codeValue.style.background = "rgba(148,163,184,.18)";
    codeValue.style.filter = "blur(4px)";
    codeValue.style.userSelect = "none";
    codeValue.setAttribute("data-visible", "false");
    codeValue.textContent = deleteState.code;

    var showBtn = document.createElement("button");
    showBtn.type = "button";
    showBtn.className = "btn btn--ghost btn--sm";
    showBtn.textContent = "Show code";

    showBtn.addEventListener("click", function () {
      var visible = codeValue.getAttribute("data-visible") === "true";
      if (visible) {
        codeValue.style.filter = "blur(4px)";
        codeValue.setAttribute("data-visible", "false");
        showBtn.textContent = "Show code";
      } else {
        codeValue.style.filter = "none";
        codeValue.setAttribute("data-visible", "true");
        showBtn.textContent = "Hide code";
      }
    });

    codeValueWrap.appendChild(codeValue);
    codeValueWrap.appendChild(showBtn);

    codeBox.appendChild(codeLabel);
    codeBox.appendChild(codeValueWrap);

    var field = document.createElement("div");
    field.className = "safe-field";
    field.style.marginTop = "10px";

    var label = document.createElement("label");
    label.className = "safe-field__label";
    label.textContent = "Type the confirmation code exactly as shown:";

    var input = document.createElement("input");
    input.className = "safe-field__input";
    input.type = "text";
    input.placeholder = "e.g. 482931";
    input.autocomplete = "off";
    input.inputMode = "numeric";

    var err = document.createElement("div");
    err.className = "safe-field__error";
    err.textContent = "";

    field.appendChild(label);
    field.appendChild(input);
    field.appendChild(err);

    var status = document.createElement("div");
    status.className = "safe-modal__status";
    status.style.marginTop = "4px";

    bodyEl.appendChild(p1);
    bodyEl.appendChild(p2);
    bodyEl.appendChild(codeBox);
    bodyEl.appendChild(field);
    bodyEl.appendChild(status);

    function updateStatus() {
      if (!deleteState.codeDeadline) {
        status.textContent = "";
        return;
      }
      var remaining = deleteState.codeDeadline - Date.now();
      if (remaining < 0) remaining = 0;
      status.textContent =
        "Time left: " +
        formatRemaining(remaining) +
        " | Attempts left: " +
        deleteState.attemptsLeft;
    }

    updateStatus();
    deleteState.countdownTimerId = setInterval(function () {
      updateStatus();
      if (Date.now() > deleteState.codeDeadline) {
        clearCountdown();
        err.textContent =
          "This code has expired. Please start the delete process again.";
        showToast("Delete code expired. The flow will restart.", "error");
        setTimeout(function () {
          renderStep1();
        }, 1500);
      }
    }, 1000);

    var cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn--ghost btn--sm";
    cancelBtn.textContent = "Cancel";

    cancelBtn.addEventListener("click", function () {
      showToast("Account delete flow was cancelled.", "error");
      closeModal();
      resetState();
    });

    var confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "btn btn--primary btn--sm";
    confirmBtn.textContent = "Confirm delete";

    confirmBtn.addEventListener("click", function () {
      err.textContent = "";

      if (Date.now() > deleteState.codeDeadline) {
        err.textContent = "This code has expired.";
        showToast("Delete code expired. Please try again.", "error");
        renderStep1();
        return;
      }

      var value = (input.value || "").trim();
      if (!value) {
        err.textContent = "Please enter the confirmation code first.";
        return;
      }

      if (value !== deleteState.code) {
        deleteState.attemptsLeft -= 1;
        if (deleteState.attemptsLeft <= 0) {
          err.textContent =
            "You have used all attempts. The delete request was cancelled.";
          showToast("3 invalid attempts. Delete was cancelled.", "error");
          renderStep1();
          return;
        } else {
          err.textContent =
            "Invalid code. Please try again. Attempts left: " +
            deleteState.attemptsLeft +
            ".";
          updateStatus();
          return;
        }
      }

      // correct code → proceed
      renderProgressStep();
    });

    footerEl.appendChild(cancelBtn);
    footerEl.appendChild(confirmBtn);
  }

  function renderProgressStep() {
    deleteState.step = 4;
    clearCountdown();

    var root = ensureModalRoot();
    var titleEl = qs(".safe-modal__title", root);
    var bodyEl = qs(".safe-modal__body", root);
    var footerEl = qs(".safe-modal__footer", root);

    if (!titleEl || !bodyEl || !footerEl) return;

    titleEl.textContent = "Deleting your SAFE account...";
    bodyEl.innerHTML = "";
    footerEl.innerHTML = "";

    var p = document.createElement("p");
    p.textContent =
      "We are securely deleting all data linked to your SAFE account. This may take a few seconds.";

    var progress = document.createElement("div");
    progress.className = "safe-progress";

    var bar = document.createElement("div");
    bar.className = "safe-progress__bar";
    bar.style.width = "0%";

    progress.appendChild(bar);

    var status = document.createElement("div");
    status.className = "safe-modal__status";
    status.textContent =
      "Please do not close this screen until the process is finished.";

    bodyEl.appendChild(p);
    bodyEl.appendChild(progress);
    bodyEl.appendChild(status);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--ghost btn--sm";
    btn.disabled = true;
    btn.textContent = "Processing...";

    footerEl.appendChild(btn);

    setTimeout(function () {
      bar.style.width = "40%";
    }, 120);
    setTimeout(function () {
      bar.style.width = "75%";
    }, 600);

    var onDelete = deleteState.config.onDelete;
    var finish = function () {
      bar.style.width = "100%";
      setTimeout(function () {
        renderDoneStep();
      }, 400);
    };

    if (typeof onDelete === "function") {
      Promise.resolve()
        .then(function () {
          return onDelete();
        })
        .then(function () {
          finish();
        })
        .catch(function (err) {
          console.error("SAFE delete error:", err);
          showToast(
            "An error occurred while deleting your account. Please try again later.",
            "error"
          );
          renderStep1();
        });
    } else {
      // simulate when backend is not wired yet
      setTimeout(finish, 1200);
    }
  }

  function renderDoneStep() {
    deleteState.step = 5;
    clearCountdown();

    var root = ensureModalRoot();
    var titleEl = qs(".safe-modal__title", root);
    var bodyEl = qs(".safe-modal__body", root);
    var footerEl = qs(".safe-modal__footer", root);

    if (!titleEl || !bodyEl || !footerEl) return;

    titleEl.textContent = "SAFE account deleted";
    bodyEl.innerHTML = "";
    footerEl.innerHTML = "";

    var p1 = document.createElement("p");
    p1.textContent =
      "Your SAFE account has been deleted successfully and all related data has been removed.";

    var p2 = document.createElement("p");
    p2.style.fontSize = "12px";
    p2.style.color = "var(--text-muted)";
    p2.textContent =
      "If you also want to clean up your Telegram list, you can manually delete the chat with this bot from Telegram.";

    bodyEl.appendChild(p1);
    bodyEl.appendChild(p2);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "btn btn--primary btn--sm";
    closeBtn.textContent = "Close";

    closeBtn.addEventListener("click", function () {
      showToast("Thank you for using SAFE.", "success");
      closeModal();
      resetState();
    });

    footerEl.appendChild(closeBtn);
  }

  function renderChoiceButtons(container, actions, onClick) {
    container.innerHTML = "";
    var wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexWrap = "wrap";
    wrap.style.gap = "8px";
    wrap.style.justifyContent = "flex-end";

    var shuffled = shuffle(actions);
    shuffled.forEach(function (item) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn--ghost btn--sm"; // <-- همه دکمه‌ها ghost
      btn.textContent = item.label;
      btn.addEventListener("click", function () {
        onClick(item.key);
      });
      wrap.appendChild(btn);
    });
    

    container.appendChild(wrap);
  }

  // ---------- Public API ----------

  /**
   * options:
   *  - triggerElement: HTMLElement (required)
   *  - getUser: () => { userId, username } (optional)
   *  - onDelete: () => Promise|void (optional, called after final confirmation)
   */
  function initDeleteAccountUI(options) {
    options = options || {};
    var trigger = options.triggerElement;
    if (!trigger || !(trigger instanceof HTMLElement)) return;

    deleteState.config.onDelete =
      typeof options.onDelete === "function" ? options.onDelete : null;
    deleteState.config.getUser =
      typeof options.getUser === "function" ? options.getUser : null;

    // remove any old click handlers by cloning
    var clone = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(clone, trigger);

    clone.addEventListener("click", function (ev) {
      ev.preventDefault();
      resetState();
      openModal();
      renderStep1();
    });

    // make sure close and backdrop also reset the flow
    var root = ensureModalRoot();
    if (!root.dataset.safeDeleteBound) {
      var backdrop = qs(".safe-modal-backdrop", root);
      var closeBtn = qs(".safe-modal__close", root);

      var handleClose = function () {
        closeModal();
        resetState();
      };

      if (backdrop) backdrop.addEventListener("click", handleClose);
      if (closeBtn) closeBtn.addEventListener("click", handleClose);

      root.dataset.safeDeleteBound = "1";
    }

    ensureToastRoot();
  }

  global.initDeleteAccountUI = initDeleteAccountUI;
})(window);
