(function(w,d){
function q(s,c){return(c||d).querySelector(s)}
function ce(t,c){var e=d.createElement(t);if(c)e.className=c;return e}
function notify(msg,type){
type=type||"info";
if(w.SAFE_CRYPTO&&w.SAFE_CRYPTO.notify){w.SAFE_CRYPTO.notify(msg,type);return}
if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast){w.SAFE_UI_CORE.showToast(msg,type);return}
if(w.alert)alert(msg)
}
function openDecrypt(){
var root=q(".safe-modal-root");
if(root&&root.parentNode)root.parentNode.removeChild(root);
root=ce("div","safe-modal-root");
var bd=ce("div","safe-modal-backdrop");
var box=ce("div","safe-modal");
var inner=ce("div","safe-modal__inner");
box.appendChild(inner);
root.appendChild(bd);
root.appendChild(box);
d.body.appendChild(root);
bd.onclick=close;
var h=ce("div","safe-modal__header");
var ttl=ce("h3","safe-modal__title");
var cls=ce("button","safe-modal__close");
ttl.textContent="Decrypt file";
cls.type="button";
cls.textContent="×";
cls.onclick=close;
h.appendChild(ttl);
h.appendChild(cls);
inner.appendChild(h);
var body=ce("div","safe-modal__body");
var ftr=ce("div","safe-modal__footer");
inner.appendChild(body);
inner.appendChild(ftr);
var fField=ce("div","safe-field");
var fLab=ce("label","safe-field__label");
var fInp=ce("input","safe-field__input");
fLab.textContent="SAFE file";
fInp.type="file";
fInp.id="safe-dec-file";
fField.appendChild(fLab);
fField.appendChild(fInp);
body.appendChild(fField);
var pField=ce("div","safe-field");
var pLab=ce("label","safe-field__label");
var pInp=ce("input","safe-field__input");
pLab.textContent="Password";
pInp.type="password";
pInp.id="safe-dec-pwd";
pField.appendChild(pLab);
pField.appendChild(pInp);
body.appendChild(pField);
var err=ce("div","safe-field__error");
err.id="safe-dec-error";
body.appendChild(err);
var status=ce("div","safe-modal__status");
status.id="safe-dec-status";
status.textContent="Ready";
body.appendChild(status);
var btnCancel=ce("button","btn btn--ghost");
var btnStart=ce("button","btn btn--primary");
btnCancel.type="button";
btnStart.type="button";
btnCancel.textContent="Cancel";
btnStart.textContent="Start";
btnStart.disabled=true;
ftr.appendChild(btnCancel);
ftr.appendChild(btnStart);
function close(){var r=q(".safe-modal-root");if(r&&r.parentNode)r.parentNode.removeChild(r)}
function setErr(t){err.textContent=t||""}
function setStatus(t){status.textContent=t||""}
function updateState(){btnStart.disabled=!(fInp.files&&fInp.files[0]&&pInp.value)}
fInp.onchange=updateState;
pInp.oninput=updateState;
btnCancel.onclick=close;
btnStart.onclick=function(){
var file=fInp.files&&fInp.files[0];
var pwd=pInp.value||"";
if(!file||!pwd)return;
setErr("");
setStatus("Checking your SAFE account...");
var tg=w.Telegram&&w.Telegram.WebApp&&w.Telegram.WebApp.initDataUnsafe?w.Telegram.WebApp.initDataUnsafe.user:null;
if(!tg||!tg.id){
var m1="Cannot detect Telegram account.";
setErr(m1);
setStatus("Account error.");
notify(m1,"error");
return
}
var uid=tg.id;
var initData = w.Telegram && w.Telegram.WebApp && w.Telegram.WebApp.initData || "";

var payload = {
  init_data: initData,
  user_id: uid,
  file_name: file.name,
  file_size_bytes: file.size,
  mime_type: file.type || "",
  password_mask: maskKey(pwd)
};

fetch("https://safe-bot-worker.alirahimikiasari.workers.dev/api/decrypt/precheck",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(payload)
}).then(function(r){return r.json().catch(function(){return null})}).then(function(data){
if(!data||!data.ok){
var m=(data&&data.message)||"Check failed.";
setErr(m);
setStatus(m);
notify(m,"error");
return
}
setStatus("Decrypting...");
var user_hash=data.user.id_hash;
function report(statusVal,errMsg){
return fetch("https://safe-bot-worker.alirahimikiasari.workers.dev/api/decrypt/report",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
user_id:uid,
file_name:file.name,
file_size_bytes:file.size,
status:statusVal,
error_message:errMsg||null
})
})
}
w.SAFE_CRYPTO.decryptFile(
file,
pwd,
function(p,label){
var pct=Math.round(p*100);
setStatus("Decrypting: "+pct+"%");
},
report,
user_hash
).then(function(out){
setStatus("Saving...");
return w.SAFE_CRYPTO.safeSave(out.blob,out.name).then(function(){
setStatus("Done.");
notify("Decryption complete.","success");
close()
})
}).catch(function(e){
var t=String((e&&e.message)||e);
setErr(t);
setStatus(t);
notify(t,"error")
})
}).catch(function(){
var m2="Cannot contact SAFE backend. Please try again.";
setErr(m2);
setStatus(m2);
notify(m2,"error")
});
};
root.classList.add("safe-modal-root--visible")
}
function bind(){
var b=q("#btn-decrypt-open");
if(!b)return;
var c=b.cloneNode(true);
c.id=b.id;
b.parentNode.replaceChild(c,b);
c.addEventListener("click",openDecrypt)
}
function onReady(){bind()}
if(d.readyState==="complete"||d.readyState==="interactive")setTimeout(onReady,0);
else w.addEventListener("load",onReady,{once:true});
})(window,document);
