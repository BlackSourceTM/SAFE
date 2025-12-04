(function(w,d){
var L=w.SAFE_I18N||{},core=w.SAFE_UI_CORE,crypto=w.SAFE_CRYPTO;
if(!core||!crypto)return;
function q(s,r){return(r||d).querySelector(s)}
function setup(){
  var sec=q("#section-crypto");
  if(!sec)return;
  var encBtn=q("#section-crypto .panel-card:nth-of-type(1) .option-item:nth-of-type(1)");
  if(encBtn)encBtn.addEventListener("click",openEncryptModal);
}
function openEncryptModal(){
  var body="<div class=\"safe-field\"><label class=\"safe-field__label\">"+(L.field_file_label||"File")+"</label><input class=\"safe-field__input\" type=\"file\" id=\"safe-enc-file\"></div>";
  body+="<div class=\"safe-field\"><label class=\"safe-field__label\">"+(L.field_password_label||"Password")+"</label><input class=\"safe-field__input\" type=\"password\" id=\"safe-enc-pwd\"></div>";
  body+="<div class=\"safe-field\"><label class=\"safe-field__label\">"+(L.field_password_confirm_label||"Repeat password")+"</label><input class=\"safe-field__input\" type=\"password\" id=\"safe-enc-pwd2\"></div>";
  body+="<div class=\"safe-field__error\" id=\"safe-enc-error\"></div>";
  body+="<div class=\"safe-progress\"><div class=\"safe-progress__bar\" id=\"safe-enc-progress\"></div></div>";
  body+="<div class=\"safe-modal__status\" id=\"safe-enc-status\">"+(L.status_ready||"Ready")+"</div>";
  var footer="<button type=\"button\" class=\"btn btn--ghost btn--sm\" id=\"safe-enc-cancel\">"+(L.btn_cancel||"Cancel")+"</button><button type=\"button\" class=\"btn btn--primary btn--sm\" id=\"safe-enc-start\" disabled>"+(L.btn_start||"Start")+"</button>";
  var modalInner=core.showModal(L.modal_encrypt_title||"New encryption",body,footer);
  var fileIn=q("#safe-enc-file",modalInner),pwd=q("#safe-enc-pwd",modalInner),pwd2=q("#safe-enc-pwd2",modalInner),err=q("#safe-enc-error",modalInner),btn=q("#safe-enc-start",modalInner),cancel=q("#safe-enc-cancel",modalInner),bar=q("#safe-enc-progress",modalInner),status=q("#safe-enc-status",modalInner);
  function validate(){
    err.textContent="";
    var f=fileIn.files[0];
    if(!f){btn.disabled=!0;return}
    var p=pwd.value||"",p2=pwd2.value||"";
    if(p.length<8){btn.disabled=!0;err.textContent=L.validation_pwd_short||"Password must be at least 8 characters.";return}
    if(p!==p2){btn.disabled=!0;err.textContent=L.validation_pwd_mismatch||"Passwords do not match.";return}
    btn.disabled=!1;
  }
  fileIn.addEventListener("change",validate);
  pwd.addEventListener("input",validate);
  pwd2.addEventListener("input",validate);
  cancel.addEventListener("click",core.closeModal);
  btn.addEventListener("click",function(){
    err.textContent="";
    btn.disabled=!0;cancel.disabled=!0;fileIn.disabled=!0;pwd.disabled=!0;pwd2.disabled=!0;
    status.textContent=L.status_working||"Working...";
    var f=fileIn.files[0],p=pwd.value;
    crypto.encryptFile(f,p,function(progress){
      bar.style.width=Math.round(progress*100)+"%";
    }).then(function(res){
      status.textContent=L.status_done||"Done";
      bar.style.width="100%";
      core.showToast(L.toast_encrypt_success||"File encrypted successfully.","success");
      var a=d.createElement("a");
      a.href=URL.createObjectURL(res.blob);
      a.download=res.name;
      d.body.appendChild(a);
      a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},100);
      core.closeModal();
    }).catch(function(e){
      console.error(e);
      err.textContent=L.toast_operation_failed||"Operation failed. Please check password and file.";
      status.textContent=L.status_error||"Error";
      core.showToast(L.toast_operation_failed||"Operation failed. Please check password and file.","error");
      btn.disabled=!1;cancel.disabled=!1;fileIn.disabled=!1;pwd.disabled=!1;pwd2.disabled=!1;
    });
  });
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",setup);else setup();
})(window,document);
