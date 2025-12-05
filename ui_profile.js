// ui_profile.js
(function(){
  function qs(sel,root){return (root||document).querySelector(sel);}
  function qsa(sel,root){return Array.from((root||document).querySelectorAll(sel));}

  function getUserModel(){
    try{
      if(window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user){
        var u = Telegram.WebApp.initDataUnsafe.user;
        var username = u.username || (u.first_name || "user");
        return {
          username: username,
          userId: u.id || 0
        };
      }
    }catch(e){}
    // دمو مود بیرون از تلگرام
    return {
      username: "demo_user",
      userId: 22130261
    };
  }

  function ensureModalRoot(){
    var root = qs(".safe-modal-root");
    if(!root){
      root = document.createElement("div");
      root.className = "safe-modal-root";
      root.innerHTML =
        '<div class="safe-modal-backdrop"></div>' +
        '<div class="safe-modal">' +
          '<div class="safe-modal__inner">' +
            '<header class="safe-modal__header">' +
              '<h2 class="safe-modal__title"></h2>' +
              '<button type="button" class="safe-modal__close">✕</button>' +
            '</header>' +
            '<div class="safe-modal__body"></div>' +
            '<footer class="safe-modal__footer"></footer>' +
          '</div>' +
        '</div>';
      document.body.appendChild(root);
    }
    return root;
  }

  function showModal(){
    var root = ensureModalRoot();
    root.classList.add("safe-modal-root--visible");
  }

  function hideModal(){
    var root = qs(".safe-modal-root");
    if(root){
      root.classList.remove("safe-modal-root--visible");
    }
  }

  function renderStep1(user){
    var root = ensureModalRoot();
    var titleEl = qs(".safe-modal__title",root);
    var bodyEl  = qs(".safe-modal__body",root);
    var footerEl= qs(".safe-modal__footer",root);
    var closeBtn= qs(".safe-modal__close",root);
    var backdrop= qs(".safe-modal-backdrop",root);

    titleEl.textContent = "Delete SAFE account";

    bodyEl.innerHTML = "";
    var p1 = document.createElement("p");
    p1.textContent = "You are about to start the deletion process for your SAFE account.";
    var p2 = document.createElement("p");
    p2.textContent = "All SAFE-related metadata, coins, limits and usage history linked to your account (" +
      (user.username.startsWith("@") ? user.username : "@"+user.username) +
      ", ID " + user.userId + ") will be scheduled for removal in the final version.";
    var p3 = document.createElement("p");
    p3.textContent = "This action cannot be undone once it is processed by the SAFE backend.";
    bodyEl.appendChild(p1);
    bodyEl.appendChild(p2);
    bodyEl.appendChild(p3);

    footerEl.innerHTML = "";
    var btnCancel = document.createElement("button");
    btnCancel.type = "button";
    btnCancel.className = "btn btn--ghost btn--sm";
    btnCancel.textContent = "Cancel";

    var btnNext = document.createElement("button");
    btnNext.type = "button";
    btnNext.className = "btn btn--danger btn--sm";
    btnNext.textContent = "Continue";

    footerEl.appendChild(btnCancel);
    footerEl.appendChild(btnNext);

    closeBtn.onclick = hideModal;
    backdrop.onclick = hideModal;
    btnCancel.onclick = hideModal;
    btnNext.onclick = function(){ renderStep2(user); };

    showModal();
  }

  function renderStep2(user){
    var root = ensureModalRoot();
    var titleEl = qs(".safe-modal__title",root);
    var bodyEl  = qs(".safe-modal__body",root);
    var footerEl= qs(".safe-modal__footer",root);
    var closeBtn= qs(".safe-modal__close",root);
    var backdrop= qs(".safe-modal-backdrop",root);

    titleEl.textContent = "Confirm deletion";

    bodyEl.innerHTML = "";

    var p1 = document.createElement("p");
    p1.textContent = "To confirm, please type DELETE in the box below.";
    var p2 = document.createElement("p");
    p2.textContent = "In the final version, SAFE will send this request to the backend and schedule your account for deletion.";
    var p3 = document.createElement("p");
    p3.textContent = "Your files will remain on your own devices; only SAFE metadata on the server side will be removed.";

    var field = document.createElement("div");
    field.className = "safe-field";
    var label = document.createElement("label");
    label.className = "safe-field__label";
    label.textContent = "Type DELETE to continue";
    var input = document.createElement("input");
    input.type = "text";
    input.className = "safe-field__input";
    input.autocomplete = "off";
    input.id = "safe-delete-confirm-input";

    var err = document.createElement("div");
    err.className = "safe-field__error";
    err.id = "safe-delete-confirm-error";
    err.textContent = "";

    field.appendChild(label);
    field.appendChild(input);

    bodyEl.appendChild(p1);
    bodyEl.appendChild(p2);
    bodyEl.appendChild(p3);
    bodyEl.appendChild(field);
    bodyEl.appendChild(err);

    footerEl.innerHTML = "";
    var btnBack = document.createElement("button");
    btnBack.type = "button";
    btnBack.className = "btn btn--ghost btn--sm";
    btnBack.textContent = "Back";

    var btnConfirm = document.createElement("button");
    btnConfirm.type = "button";
    btnConfirm.className = "btn btn--danger btn--sm";
    btnConfirm.textContent = "Confirm deletion";
    btnConfirm.disabled = true;

    footerEl.appendChild(btnBack);
    footerEl.appendChild(btnConfirm);

    function updateState(){
      var v = (input.value || "").trim().toUpperCase();
      if(v === "DELETE"){
        err.textContent = "";
        input.classList.remove("safe-field__input--error");
        input.classList.add("safe-field__input--ok");
        btnConfirm.disabled = false;
      }else{
        if(v.length>0){
          err.textContent = "Please type DELETE exactly.";
          input.classList.add("safe-field__input--error");
          input.classList.remove("safe-field__input--ok");
        }else{
          err.textContent = "";
          input.classList.remove("safe-field__input--error","safe-field__input--ok");
        }
        btnConfirm.disabled = true;
      }
    }

    input.addEventListener("input",updateState);

    closeBtn.onclick = hideModal;
    backdrop.onclick = hideModal;
    btnBack.onclick = function(){ renderStep1(user); };
    btnConfirm.onclick = function(){
      // اینجا در آینده درخواست واقعی به بک‌اند می‌فرستیم.
      // فعلاً فقط یک رویداد سفارشی برای لایه‌های بعدی و لاگ کنسول:
      try{
        var ev = new CustomEvent("safe:request-account-deletion",{
          detail:{
            username: user.username,
            userId: user.userId
          }
        });
        window.dispatchEvent(ev);
      }catch(e){}
      console.log("SAFE delete account requested (frontend only):",user);
      renderStep3(user);
    };

    showModal();
  }

  function renderStep3(user){
    var root = ensureModalRoot();
    var titleEl = qs(".safe-modal__title",root);
    var bodyEl  = qs(".safe-modal__body",root);
    var footerEl= qs(".safe-modal__footer",root);
    var closeBtn= qs(".safe-modal__close",root);
    var backdrop= qs(".safe-modal-backdrop",root);

    titleEl.textContent = "Request submitted";

    bodyEl.innerHTML = "";
    var p1 = document.createElement("p");
    p1.textContent = "Your delete request has been registered on this device.";
    var p2 = document.createElement("p");
    p2.textContent = "In the full SAFE release, this action will send a signed request to the backend to remove your account metadata.";
    var p3 = document.createElement("p");
    p3.textContent = "You can close this window and continue using SAFE until the deletion is processed.";

    bodyEl.appendChild(p1);
    bodyEl.appendChild(p2);
    bodyEl.appendChild(p3);

    footerEl.innerHTML = "";
    var btnClose = document.createElement("button");
    btnClose.type = "button";
    btnClose.className = "btn btn--primary btn--sm";
    btnClose.textContent = "Close";
    footerEl.appendChild(btnClose);

    function closeAll(){ hideModal(); }

    closeBtn.onclick = closeAll;
    backdrop.onclick = closeAll;
    btnClose.onclick = closeAll;

    showModal();
  }

  function initDeleteAccountFlow(){
    var user = getUserModel();
    // دکمه خطرناک در پروفایل
    var btn = qs("#section-profile .option-item--danger");
    if(!btn)return;
    // برای جلوگیری از لیسنرهای تکراری، کلونش می‌کنیم
    var clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone,btn);
    clone.addEventListener("click",function(){
      renderStep1(user);
    });
  }

  document.addEventListener("DOMContentLoaded",function(){
    initDeleteAccountFlow();
  });
})();
