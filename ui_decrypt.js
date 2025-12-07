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
btnCancel.type="button";btnStart.type="button";
btnCancel.textContent="Cancel";btnStart.textContent="Start";
btnStart.disabled=true;
ftr.appendChild(btnCancel);ftr.appendChild(btnStart);
function setError(msg){err.textContent=msg||""}
function setStatus(msg){status.textContent=msg||""}
function evalReady(){
var fileOk=fInp.files&&fInp.files[0];
var pwd=pInp.value||"";
btnStart.disabled=!(fileOk&&pwd.length>0)
}
function close(){var r=q(".safe-modal-root");if(r&&r.parentNode)r.parentNode.removeChild(r)}
fInp.onchange=function(){setError("");setStatus("Ready");evalReady()};
pInp.oninput=function(){setError("");setStatus("Ready");evalReady()};
btnEye.onclick=function(){if(pInp.type==="password"){pInp.type="text";btnEye.innerHTML='<i class="material-icons">visibility_off</i>'}else{pInp.type="password";btnEye.innerHTML='<i class="material-icons">visibility</i>'}};
btnCancel.onclick=close;
btnStart.onclick=function(){
if(btnStart.disabled)return;
var file=fInp.files&&fInp.files[0],pwd=pInp.value||"";
if(!file||!pwd)return;
setError("");
setStatus("Checking your SAFE account...");
var tg=w.Telegram&&w.Telegram.WebApp&&w.Telegram.WebApp.initDataUnsafe&&w.Telegram.WebApp.initDataUnsafe.user?w.Telegram.WebApp.initDataUnsafe.user:null;
if(!tg||!tg.id){
var msg1="Cannot detect Telegram WebApp user. Please open SAFE from the official bot.";
setStatus("Cannot detect account.");
setError(msg1);
if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg1,"error");else if(w.alert)alert(msg1);
return
}
var uid=tg.id;
var payload={user_id:uid,file_name:file.name,file_size_bytes:file.size,mime_type:file.type||""};
fetch("https://safe-bot-worker.alirahimikiasari.workers.dev/api/decrypt/precheck",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(function(res){
return res.json().catch(function(){return null})
}).then(function(data){
if(!data||!data.ok){
var msg2=(data&&data.message)||"Check failed";
setStatus(msg2);
setError(msg2);
if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg2,"error");else if(w.alert)alert(msg2);
return
}
setStatus("Account OK. Starting decryption...");
if(w.dispatchEvent&&w.CustomEvent){
var ev=new CustomEvent("safe:start-decryption",{detail:{file:file,password:pwd,meta:data}});
w.dispatchEvent(ev)
}
close()
}).catch(function(e){
var msg3="Cannot contact SAFE backend. Please try again.";
setStatus(msg3);
setError(msg3);
if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg3,"error");else if(w.alert)alert(msg3);
})
};
root.classList.add("safe-modal-root--visible")
}
function bind(){
var b=q("#btn-decrypt-new");
if(!b)return;
var clone=b.cloneNode(true);
clone.id=b.id;
b.parentNode.replaceChild(clone,b);
clone.addEventListener("click",openDecrypt)
}
function onReady(){bind()}
if(d.readyState==="complete"||d.readyState==="interactive")setTimeout(onReady,0);else w.addEventListener("load",onReady,{once:true})
})(window,document);
