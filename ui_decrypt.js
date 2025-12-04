(function(w,d){
var L=w.SAFE_I18N||{},core=w.SAFE_UI_CORE,crypto=w.SAFE_CRYPTO;
if(!core||!crypto)return;
function q(s,r){return(r||d).querySelector(s)}
function setup(){
  var sec=q("#section-crypto");
  if(!sec)return;
  var decBtn=q("#section-crypto .panel-card:nth-of-type(2) .option-item:nth-of-type(1)");
  if(decBtn)decBtn.addEventListener("click",openDecryptModal);
}
function openDecryptModal(){
  var body="<div class=\"safe-field\"><label class=\"safe-field__label\">"+(L.field_file_label||"File")+"</label><input class=\"safe-field__input\" type=\"file\" id=\"safe-dec-file\" accept=\".SAFE,.safe\"></div>";
  body+="<div class=\"safe-field\"><label class=\"safe-field__label\">"+(L.field_password_label||"Password")+"</label><input class=\"safe-field__input\" type=\"password\" id=\"safe-dec-pwd\"></div>";
  body+="<div class=\"safe-field__error\" id=\"safe-dec-error\"></div>";
  body+="<div class=\"safe-progress\"><div class=\"safe-progress__bar\" id=\"safe-dec-progress\"></div></div>";
  body+="<div class=\"safe-modal__status\" id=\"safe-dec-status\">"+(L.status_ready||"Ready")+"</div>";
  var footer="<button type=\"button\" class=\"btn btn--ghost btn--sm\" id=\"safe-dec-cancel\">"+(L.btn_cancel||"Cancel")+"</button><button type=\"button\" class=\"btn btn--primary btn--sm\" id=\"safe-dec-start\" disabled>"+(L.btn_start||"Start")+"</button>";
  var modalInner=core.showModal(L.modal_decrypt_title||"New decryption",body,footer);
  var fileIn=q("#safe-dec-file",modalInner),pwd=q("#safe-dec-pwd",modalInner),err=q("#safe-dec-error",modalInner),btn=q("#safe-dec-start",modalInner),cancel=q("#safe-dec-cancel",modalInner),bar=q("#safe-dec-progress",modalInner),status=q("#safe-dec-status",modalInner);
  function validate(){
    err.textContent="";
    var f=fileIn.files[0];
    if(!f){btn.disabled=!0;return}
    var p=pwd.value||"";
    if(p.length<1){btn.disabled=!0;return}
    btn.disabled=!1;
  }
  fileIn.addEventListener("change",validate);
  pwd.addEventListener("input",validate);
  cancel.addEventListener("click",core.closeModal);
  btn.addEventListener("click",function(){
    err.textContent="";
    btn.disabled=!0;cancel.disabled=!0;fileIn.disabled=!0;pwd.disabled=!0;
    status.textContent=L.status_working||"Working...";
    var f=fileIn.files[0],p=pwd.value;
    crypto.decryptFile(f,p,function(progress){
      bar.style.width=Math.round(progress*100)+"%";
    }).then(function(res){
      status.textContent=L.status_done||"Done";
      bar.style.width="100%";
      core.showToast(L.toast_decrypt_success||"File decrypted successfully.","success");
      var a=d.createElement("a");
      a.href=URL.createObjectURL(res.blob);
      a.download=res.name||"file";
      d.body.appendChild(a);
      a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},100);
      core.closeModal();
    }).catch(function(e){
      console.error(e);
      err.textContent=L.toast_operation_failed||"Operation failed. Please check password and file.";
      status.textContent=L.status_error||"Error";
      core.showToast(L.toast_operation_failed||"Operation failed. Please check password and file.","error");
      btn.disabled=!1;cancel.disabled=!1;fileIn.disabled=!1;pwd.disabled=!1;
    });
  });
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",setup);else setup();
})(window,document);
