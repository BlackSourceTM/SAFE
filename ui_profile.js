(function(){
  function qs(sel,root){
    return (root||document).querySelector(sel);
  }
  function qsa(sel,root){
    return Array.from((root||document).querySelectorAll(sel));
  }

  function createConfirmModal(options){
    var root=qs(".safe-modal-root");
    if(!root){
      root=document.createElement("div");
      root.className="safe-modal-root";
      root.innerHTML='' +
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

    var titleEl=qs(".safe-modal__title",root);
    var bodyEl=qs(".safe-modal__body",root);
    var footerEl=qs(".safe-modal__footer",root);
    var closeBtn=qs(".safe-modal__close",root);

    titleEl.textContent=options.title||"Confirm action";
    bodyEl.innerHTML="";
    (options.lines||[]).forEach(function(txt){
      var p=document.createElement("p");
      p.textContent=txt;
      bodyEl.appendChild(p);
    });

    footerEl.innerHTML="";
    (options.buttons||[]).forEach(function(btnCfg){
      var btn=document.createElement("button");
      btn.type="button";
      btn.className="btn "+(btnCfg.variant||"btn--secondary")+" btn--sm";
      btn.textContent=btnCfg.label;
      btn.addEventListener("click",function(){
        if(btnCfg.onClick)btnCfg.onClick();
        hide();
      });
      footerEl.appendChild(btn);
    });

    function hide(){
      root.classList.remove("safe-modal-root--visible");
    }
    closeBtn.onclick=hide;
    qs(".safe-modal-backdrop",root).onclick=hide;

    root.classList.add("safe-modal-root--visible");
  }

  function initDeleteAccount(){
    var btn=qs("#section-profile .option-item--danger");
    if(!btn)return;

    btn.addEventListener("click",function(){
      createConfirmModal({
        title:"Delete SAFE account",
        lines:[
          "This will start the account deletion flow in the final version.",
          "All your SAFE metadata, coins and history will be scheduled for removal.",
          "Are you sure you want to continue?"
        ],
        buttons:[
          {
            label:"Cancel",
            variant:"btn--ghost",
            onClick:null
          },
          {
            label:"I understand",
            variant:"btn--primary",
            onClick:function(){
              console.log("Delete account confirmation clicked (frontend only).");
            }
          }
        ]
      });
    });
  }

  document.addEventListener("DOMContentLoaded",function(){
    initDeleteAccount();
  });
})();
