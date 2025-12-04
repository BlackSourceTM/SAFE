(function(w,d){
"use strict";
var L=w.SAFE_I18N||{},sheet=w.SAFE_SHEET;
var te=new TextEncoder(),td=new TextDecoder();
function s2b(s){return te.encode(s)}
function b2s(b){return td.decode(b)}
function rnd(n){var a=new Uint8Array(n);crypto.getRandomValues(a);return a}
function concat(parts){var len=0,i;for(i=0;i<parts.length;i++)len+=parts[i].length;var out=new Uint8Array(len),off=0;for(i=0;i<parts.length;i++){out.set(parts[i],off);off+=parts[i].length}return out}
function u32to4(v){return new Uint8Array([(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255])}
function u4tou32(b){return((b[0]<<24)|(b[1]<<16)|(b[2]<<8)|b[3])>>>0}
function readFileBuf(file){return new Promise(function(res,rej){var r=new FileReader();r.onerror=function(){rej(new Error("FILE_READ"))};r.onload=function(){res(r.result)};r.readAsArrayBuffer(file)})}
function deriveKey(pwdBytes,salt){return crypto.subtle.importKey("raw",pwdBytes,"PBKDF2",false,["deriveKey"]).then(function(base){return crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:210000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])})}
function aesEnc(key,iv,data){return crypto.subtle.encrypt({name:"AES-GCM",iv:iv},key,data)}
function aesDec(key,iv,data){return crypto.subtle.decrypt({name:"AES-GCM",iv:iv},key,data)}
function baseNameNoExt(name){var i=name.lastIndexOf(".");if(i<=0)return name;return name.slice(0,i)}
var MAGIC=s2b("SAFE");
function encryptFile(file,password,onProgress){
if(!file||!password)return Promise.reject(new Error("INVALID"));
onProgress&&onProgress(0,"start");
var pwdBytes=s2b(password),salt=rnd(16),nonceH=rnd(12),nonceD=rnd(12),fileBuf;
return readFileBuf(file).then(function(buf){fileBuf=buf;onProgress&&onProgress(.25,"key");return deriveKey(pwdBytes,salt)}).then(function(key){
onProgress&&onProgress(.45,"header");
var headerObj={name:file.name,size:file.size,type:file.type||"",ts:Date.now()};
var headerJson=s2b(JSON.stringify(headerObj));
return Promise.all([aesEnc(key,nonceH,headerJson),aesEnc(key,nonceD,fileBuf)]).then(function(r){
var h=new Uint8Array(r[0]),c=new Uint8Array(r[1]),headerLen=u32to4(h.length),ver=new Uint8Array([1]);
var out=concat([MAGIC,ver,nonceH,nonceD,salt,headerLen,h,c]);
onProgress&&onProgress(1,"done");
var safeName=baseNameNoExt(file.name)||"file";safeName+=".SAFE";
return{blob:new Blob([out],{type:"application/octet-stream"}),name:safeName,meta:headerObj}
})
})
}
function decryptFile(file,password,onProgress){
if(!file||!password)return Promise.reject(new Error("INVALID"));
onProgress&&onProgress(0,"start");
return readFileBuf(file).then(function(ab){
var buf=new Uint8Array(ab);
if(buf.length<4+1+12+12+16+4)throw new Error("TOO_SMALL");
for(var i=0;i<4;i++)if(buf[i]!==MAGIC[i])throw new Error("BAD_MAGIC");
var ver=buf[4];if(ver!==1)throw new Error("BAD_VER");
var off=5,nonceH=buf.slice(off,off+12);off+=12;
var nonceD=buf.slice(off,off+12);off+=12;
var salt=buf.slice(off,off+16);off+=16;
var headerLen=u4tou32(buf.slice(off,off+4));off+=4;
if(buf.length<off+headerLen)throw new Error("HDR_LEN");
var headerEnc=buf.slice(off,off+headerLen);off+=headerLen;
var cipher=buf.slice(off);
onProgress&&onProgress(.3,"key");
var pwdBytes=s2b(password);
return deriveKey(pwdBytes,salt).then(function(key){return Promise.all([aesDec(key,nonceH,headerEnc),aesDec(key,nonceD,cipher)])}).then(function(r){
onProgress&&onProgress(.95,"decode");
var headerJson=b2s(new Uint8Array(r[0])),meta;
try{meta=JSON.parse(headerJson)}catch(e){throw new Error("HDR_JSON")}
onProgress&&onProgress(1,"done");
var blob=new Blob([r[1]],{type:meta.type||"application/octet-stream"});
return{blob:blob,name:meta.name||"file",meta:meta}
})
})
}
function q(s,r){return(r||d).querySelector(s)}
function ce(t,c){var e=d.createElement(t);if(c)e.className=c;return e}
var modalRoot=null,toastEl=null,toastTimer=null;
function ensureModal(){
if(modalRoot)return modalRoot;
modalRoot=ce("div","safe-modal-root");
modalRoot.innerHTML="<div class=\"safe-modal-backdrop\"></div><div class=\"safe-modal\"><div class=\"safe-modal-inner\"></div></div>";
d.body.appendChild(modalRoot);
modalRoot.querySelector(".safe-modal-backdrop").addEventListener("click",closeModal);
return modalRoot;
}
function showModal(title,bodyHtml,footerHtml){
var root=ensureModal(),inner=q(".safe-modal-inner",root);
inner.innerHTML="<div class=\"safe-modal-header\"><div class=\"safe-modal-title\"></div><button class=\"safe-modal-close\">×</button></div><div class=\"safe-modal-body\"></div><div class=\"safe-modal-footer\"></div>";
q(".safe-modal-title",inner).textContent=title||"";
q(".safe-modal-body",inner).innerHTML=bodyHtml||"";
q(".safe-modal-footer",inner).innerHTML=footerHtml||"";
q(".safe-modal-close",inner).addEventListener("click",closeModal);
root.classList.add("safe-modal-root--visible");
return inner;
}
function closeModal(){
if(!modalRoot)return;
modalRoot.classList.remove("safe-modal-root--visible");
}
function showToast(msg,type){
if(!toastEl){toastEl=ce("div","safe-toast");d.body.appendChild(toastEl);}
toastEl.textContent=msg||"";
toastEl.className="safe-toast safe-toast-"+(type||"info")+" safe-toast--visible";
clearTimeout(toastTimer);
toastTimer=setTimeout(function(){toastEl.classList.remove("safe-toast--visible")},2600);
}
function initTelegram(){
var wa=w.Telegram&&w.Telegram.WebApp;
if(!wa)return;
try{wa.ready();wa.expand()}catch(e){}
var tp=wa.themeParams||{},root=d.documentElement;
if(tp.bg_color)root.style.setProperty("--bg-color","#"+tp.bg_color);
if(tp.text_color)root.style.setProperty("--text-color","#"+tp.text_color);
if(tp.hint_color)root.style.setProperty("--subtle-color","#"+tp.hint_color);
if(tp.button_color)root.style.setProperty("--accent","#"+tp.button_color);
root.setAttribute("data-theme",wa.colorScheme==="dark"?"dark":"light");
var u=wa.initDataUnsafe&&wa.initDataUnsafe.user;
if(u){
var id=(""+u.id).slice(-8);
var uname=u.username?("@"+u.username):u.first_name||"User";
var ph=u.photo_url||"";
var hName=q(".user-pill__name"),hHint=q(".user-pill__hint"),avatar=q(".user-pill__avatar");
if(hName)hName.textContent=uname;
if(hHint)hHint.textContent=id;
if(avatar){
if(ph){avatar.style.backgroundImage="url('"+ph+"')";avatar.textContent="";}
else avatar.textContent=(uname.replace("@","")[0]||"U").toUpperCase();
}
}
}
function openEncryptModal(){
var body="<div class=\"safe-field\"><label class=\"safe-label\">"+(L.field_file_label||"File")+"</label><input type=\"file\" id=\"safe-enc-file\" class=\"safe-input\"></div>";
body+="<div class=\"safe-field\"><label class=\"safe-label\">"+(L.field_password_label||"Password")+"</label><input type=\"password\" id=\"safe-enc-pwd\" class=\"safe-input\"></div>";
body+="<div class=\"safe-field\"><label class=\"safe-label\">"+(L.field_password_confirm_label||"Repeat password")+"</label><input type=\"password\" id=\"safe-enc-pwd2\" class=\"safe-input\"></div>";
body+="<div class=\"safe-error\" id=\"safe-enc-error\"></div>";
body+="<div class=\"safe-progress\"><div class=\"safe-progress-bar\" id=\"safe-enc-progress\"></div></div>";
body+="<div class=\"safe-status\" id=\"safe-enc-status\">"+(L.status_ready||"Ready")+"</div>";
var footer="<button type=\"button\" class=\"btn btn-ghost btn-sm\" id=\"safe-enc-cancel\">"+(L.btn_cancel||"Cancel")+"</button>";
footer+="<button type=\"button\" class=\"btn btn-primary btn-sm\" id=\"safe-enc-start\" disabled>"+(L.btn_start||"Start")+"</button>";
var m=showModal(L.modal_encrypt_title||"New encryption",body,footer);
var fileIn=q("#safe-enc-file",m),pwd=q("#safe-enc-pwd",m),pwd2=q("#safe-enc-pwd2",m),err=q("#safe-enc-error",m),btn=q("#safe-enc-start",m),cancel=q("#safe-enc-cancel",m),bar=q("#safe-enc-progress",m),status=q("#safe-enc-status",m);
function validate(){
err.textContent="";
var f=fileIn.files[0];if(!f){btn.disabled=true;return}
var p=pwd.value||"",p2=pwd2.value||"";
if(p.length<8){btn.disabled=true;err.textContent=L.validation_pwd_short||"Password must be at least 8 characters.";return}
if(p!==p2){btn.disabled=true;err.textContent=L.validation_pwd_mismatch||"Passwords do not match.";return}
btn.disabled=false;
}
fileIn.addEventListener("change",validate);
pwd.addEventListener("input",validate);
pwd2.addEventListener("input",validate);
cancel.addEventListener("click",closeModal);
btn.addEventListener("click",function(){
err.textContent="";
btn.disabled=true;cancel.disabled=true;fileIn.disabled=true;pwd.disabled=true;pwd2.disabled=true;
status.textContent=L.status_working||"Working...";
var f=fileIn.files[0],p=pwd.value;
encryptFile(f,p,function(pr){bar.style.width=Math.round(pr*100)+"%"}).then(function(res){
status.textContent=L.status_done||"Done";bar.style.width="100%";
showToast(L.toast_encrypt_success||"File encrypted successfully.","success");
var a=d.createElement("a");a.href=URL.createObjectURL(res.blob);a.download=res.name;d.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},100);
closeModal();
}).catch(function(e){
console.error(e);
err.textContent=L.toast_operation_failed||"Operation failed. Please check password and file.";
status.textContent=L.status_error||"Error";
showToast(L.toast_operation_failed||"Operation failed. Please check password and file.","error");
btn.disabled=false;cancel.disabled=false;fileIn.disabled=false;pwd.disabled=false;pwd2.disabled=false;
});
});
}
function openDecryptModal(){
var body="<div class=\"safe-field\"><label class=\"safe-label\">"+(L.field_file_label||"File")+"</label><input type=\"file\" id=\"safe-dec-file\" class=\"safe-input\" accept=\".SAFE,.safe\"></div>";
body+="<div class=\"safe-field\"><label class=\"safe-label\">"+(L.field_password_label||"Password")+"</label><input type=\"password\" id=\"safe-dec-pwd\" class=\"safe-input\"></div>";
body+="<div class=\"safe-error\" id=\"safe-dec-error\"></div>";
body+="<div class=\"safe-progress\"><div class=\"safe-progress-bar\" id=\"safe-dec-progress\"></div></div>";
body+="<div class=\"safe-status\" id=\"safe-dec-status\">"+(L.status_ready||"Ready")+"</div>";
var footer="<button type=\"button\" class=\"btn btn-ghost btn-sm\" id=\"safe-dec-cancel\">"+(L.btn_cancel||"Cancel")+"</button>";
footer+="<button type=\"button\" class=\"btn btn-primary btn-sm\" id=\"safe-dec-start\" disabled>"+(L.btn_start||"Start")+"</button>";
var m=showModal(L.modal_decrypt_title||"New decryption",body,footer);
var fileIn=q("#safe-dec-file",m),pwd=q("#safe-dec-pwd",m),err=q("#safe-dec-error",m),btn=q("#safe-dec-start",m),cancel=q("#safe-dec-cancel",m),bar=q("#safe-dec-progress",m),status=q("#safe-dec-status",m);
function validate(){
err.textContent="";
var f=fileIn.files[0];if(!f){btn.disabled=true;return}
var p=pwd.value||"";if(p.length<1){btn.disabled=true;return}
btn.disabled=false;
}
fileIn.addEventListener("change",validate);
pwd.addEventListener("input",validate);
cancel.addEventListener("click",closeModal);
btn.addEventListener("click",function(){
err.textContent="";
btn.disabled=true;cancel.disabled=true;fileIn.disabled=true;pwd.disabled=true;
status.textContent=L.status_working||"Working...";
var f=fileIn.files[0],p=pwd.value;
decryptFile(f,p,function(pr){bar.style.width=Math.round(pr*100)+"%"}).then(function(res){
status.textContent=L.status_done||"Done";bar.style.width="100%";
showToast(L.toast_decrypt_success||"File decrypted successfully.","success");
var a=d.createElement("a");a.href=URL.createObjectURL(res.blob);a.download=res.name||"file";d.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},100);
closeModal();
}).catch(function(e){
console.error(e);
err.textContent=L.toast_operation_failed||"Operation failed. Please check password and file.";
status.textContent=L.status_error||"Error";
showToast(L.toast_operation_failed||"Operation failed. Please check password and file.","error");
btn.disabled=false;cancel.disabled=false;fileIn.disabled=false;pwd.disabled=false;
});
});
}
function bindButtons(){
var encBtn=q("#open-encrypt"),decBtn=q("#open-decrypt");
if(encBtn)encBtn.addEventListener("click",openEncryptModal);
if(decBtn)decBtn.addEventListener("click",openDecryptModal);
var faqBtn=d.querySelector(".support-actions .btn-ghost.btn-sm");
if(faqBtn&&sheet&&sheet.open)faqBtn.addEventListener("click",function(){sheet.open(L.sheet_faq_title||"FAQ","texts/faq_en.txt")});
}
function boot(){
initTelegram();
bindButtons();
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot);else boot();
})(window,document);
