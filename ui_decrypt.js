(function(w,d){
function q(s,c){return(c||d).querySelector(s)}
function ce(t,c){var e=d.createElement(t);if(c)e.className=c;return e}
function openDecrypt(){
var root=q(".safe-modal-root");if(root&&root.parentNode)root.parentNode.removeChild(root);
root=ce("div","safe-modal-root");
var bd=ce("div","safe-modal-backdrop"),box=ce("div","safe-modal"),inner=ce("div","safe-modal__inner");
box.appendChild(inner);root.appendChild(bd);root.appendChild(box);d.body.appendChild(root);bd.onclick=close;
var h=ce("div","safe-modal__header"),ttl=ce("h3","safe-modal__title"),cls=ce("button","safe-modal__close");
ttl.textContent="Decrypt file";cls.type="button";cls.textContent="×";cls.onclick=close;h.appendChild(ttl);h.appendChild(cls);inner.appendChild(h);
var body=ce("div","safe-modal__body"),ftr=ce("div","safe-modal__footer");inner.appendChild(body);inner.appendChild(ftr);
var fField=ce("div","safe-field"),fLab=ce("label","safe-field__label"),fInp=ce("input","safe-field__input");
fLab.textContent="SAFE file";fInp.type="file";fInp.id="safe-dec-file";fField.appendChild(fLab);fField.appendChild(fInp);body.appendChild(fField);
var pField=ce("div","safe-field"),pLab=ce("label","safe-field__label"),pWrap=ce("div","safe-field__input-wrap"),pInp=ce("input","safe-field__input");
pLab.textContent="Password";pInp.type="password";pInp.id="safe-dec-pwd";pInp.autocomplete="current-password";
var btnEye=ce("button","safe-field__icon-btn safe-field__icon-btn--eye");btnEye.type="button";btnEye.innerHTML='<i class="material-icons">visibility</i>';
pWrap.appendChild(pInp);pWrap.appendChild(btnEye);pField.appendChild(pLab);pField.appendChild(pWrap);body.appendChild(pField);
var err=ce("div","safe-field__error");err.id="safe-dec-error";body.appendChild(err);
var status=ce("div","safe-modal__status");status.id="safe-dec-status";status.textContent="Ready";body.appendChild(status);
var btnCancel=ce("button","btn btn--ghost"),btnStart=ce("button","btn btn--primary");
btnCancel.type="button";btnStart.type="button";btnCancel.textContent="Cancel";btnStart.textContent="Start";btnStart.disabled=true;ftr.appendChild(btnCancel);ftr.appendChild(btnStart);
function setInputState(el,state){el.classList.remove("safe-field__input--error","safe-field__input--ok");if(state==="error")el.classList.add("safe-field__input--error");if(state==="ok")el.classList.add("safe-field__input--ok")}
function maskKey(p){p=p||"";if(p.length<=4)return p;return p.slice(0,2)+"****"+p.slice(-2)}
function updateStart(){
var file=fInp.files&&fInp.files[0];var okFile=file&&/\.safe$/i.test(file.name);var pwdOk=!!pInp.value;
btnStart.disabled=!(okFile&&pwdOk);
if(file&&!okFile){setInputState(fInp,"error");err.textContent="Please select a valid .SAFE file."}else{setInputState(fInp,"");if(err.textContent==="Please select a valid .SAFE file.")err.textContent=""}
}
function showToast(msg,type){
var ui=w.SAFE_UI_CORE;
if(ui&&typeof ui.showToast==="function"){ui.showToast(msg,type||"info")}
else if(w.Telegram&&w.Telegram.WebApp&&w.Telegram.WebApp.showAlert){w.Telegram.WebApp.showAlert(msg)}
else if(w.alert){alert(msg)}
}
function startReal(){
var file=fInp.files&&fInp.files[0],pwd=pInp.value||"";if(!file||!pwd)return;
status.textContent="Checking your SAFE account...";
err.textContent="";
var tg=w.Telegram&&w.Telegram.WebApp&&w.Telegram.WebApp.initDataUnsafe&&w.Telegram.WebApp.initDataUnsafe.user?w.Telegram.WebApp.initDataUnsafe.user:null;
if(!tg||!tg.id){
var msg1="Cannot detect Telegram WebApp user. Please open SAFE from the official bot.";
status.textContent="Cannot detect account.";setInputState(fInp,"error");
showToast(msg1,"error");return
}
var uid=tg.id;
var payload={user_id:uid,file_name:file.name,file_size_bytes:file.size,mime_type:file.type||"",password_mask:maskKey(pwd)};
fetch("https://safe-bot-worker.alirahimikiasari.workers.dev/api/decrypt/precheck",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(function(res){
return res.json().catch(function(){return null})
}).then(function(data){
if(!data||!data.ok){
var msg2=(data&&data.message)||"Check failed";
status.textContent=msg2;err.textContent=msg2;showToast(msg2,"error");return
}
status.textContent="Account OK. Starting decryption...";
if(w.dispatchEvent&&w.CustomEvent){
var ev=new CustomEvent("safe:start-decryption",{detail:{file:file,password:pwd,meta:data}});
w.dispatchEvent(ev)
}
close()
}).catch(function(){
var msg3="Cannot contact SAFE backend. Please try again.";
status.textContent=msg3;err.textContent=msg3;showToast(msg3,"error")
})
}
function close(){var r=q(".safe-modal-root");if(r&&r.parentNode)r.parentNode.removeChild(r)}
fInp.onchange=updateStart;pInp.oninput=updateStart;
btnEye.onclick=function(){if(pInp.type==="password"){pInp.type="text";btnEye.innerHTML='<i class="material-icons">visibility_off</i>'}else{pInp.type="password";btnEye.innerHTML='<i class="material-icons">visibility</i>'}};
btnCancel.onclick=close;
btnStart.onclick=function(){if(!btnStart.disabled)startReal()};
updateStart();root.classList.add("safe-modal-root--visible")}
function bind(){var b=q("#btn-decrypt-new");if(!b)return;var clone=b.cloneNode(true);clone.id=b.id;b.parentNode.replaceChild(clone,b);clone.addEventListener("click",openDecrypt)}
function onReady(){bind()}
if(d.readyState==="complete"||d.readyState==="interactive")setTimeout(onReady,0);else w.addEventListener("load",onReady,{once:true})
})(window,document);
