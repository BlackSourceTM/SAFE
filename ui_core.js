(function(w,d){
function q(s,r){return(r||d).querySelector(s)}
function ce(t,c){var e=d.createElement(t);if(c)e.className=c;return e}
var modalEl=null,toastTimer=null;
function ensureModalRoot(){
  if(modalEl)return modalEl;
  modalEl=ce("div","safe-modal-root");
  modalEl.innerHTML="<div class=\"safe-modal-backdrop\"></div><div class=\"safe-modal\"><div class=\"safe-modal__inner\"></div></div>";
  d.body.appendChild(modalEl);
  modalEl.addEventListener("click",function(e){
    if(e.target.classList.contains("safe-modal-backdrop"))closeModal();
  });
  return modalEl;
}
function showModal(title,bodyHtml,footerHtml){
  var root=ensureModalRoot();
  var inner=q(".safe-modal__inner",root);
  inner.innerHTML="<div class=\"safe-modal__header\"><h2 class=\"safe-modal__title\"></h2><button class=\"safe-modal__close\" type=\"button\">×</button></div><div class=\"safe-modal__body\"></div><div class=\"safe-modal__footer\"></div>";
  q(".safe-modal__title",inner).textContent=title||"";
  q(".safe-modal__body",inner).innerHTML=bodyHtml||"";
  q(".safe-modal__footer",inner).innerHTML=footerHtml||"";
  q(".safe-modal__close",inner).addEventListener("click",closeModal);
  root.classList.add("safe-modal-root--visible");
  return inner;
}
function closeModal(){
  if(!modalEl)return;
  modalEl.classList.remove("safe-modal-root--visible");
}
function showToast(msg,type){
  var ex=q(".safe-toast",d.body);
  if(!ex){ex=ce("div","safe-toast");d.body.appendChild(ex);}
  ex.textContent=msg||"";
  ex.className="safe-toast safe-toast--"+(type||"info");
  ex.classList.add("safe-toast--visible");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){ex.classList.remove("safe-toast--visible")},2600);
}
w.SAFE_UI_CORE={showModal:showModal,closeModal:closeModal,showToast:showToast};
})(window,document);
