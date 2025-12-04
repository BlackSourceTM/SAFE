(function(w,d){
"use strict";
const te=new TextEncoder(),td=new TextDecoder();
function s2b(s){return te.encode(s)}
function b2s(b){return td.decode(b)}
function rnd(n){const a=new Uint8Array(n);crypto.getRandomValues(a);return a}
function concat(parts){let len=0;for(const p of parts)len+=p.length;const out=new Uint8Array(len);let off=0;for(const p of parts){out.set(p,off);off+=p.length}return out}
function u32to4(v){return new Uint8Array([(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255])}
function u4tou32(b){return((b[0]<<24)|(b[1]<<16)|(b[2]<<8)|b[3])>>>0}
function readFileBuf(file){return new Promise((res,rej)=>{const r=new FileReader();r.onerror=()=>rej(new Error("FILE_READ"));r.onload=()=>res(r.result);r.readAsArrayBuffer(file)})}
function deriveKey(pwdBytes,salt){return crypto.subtle.importKey("raw",pwdBytes,"PBKDF2",false,["deriveKey"]).then(base=>crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:210000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]))}
function aesEnc(key,iv,data){return crypto.subtle.encrypt({name:"AES-GCM",iv},key,data)}
function aesDec(key,iv,data){return crypto.subtle.decrypt({name:"AES-GCM",iv},key,data)}
function baseNameNoExt(name){const i=name.lastIndexOf(".");return i<=0?name:name.slice(0,i)}
const MAGIC=s2b("SAFE");
function encryptFile(file,password,onProgress){
  if(!file||!password)return Promise.reject(new Error("INVALID"));
  onProgress&&onProgress(0,"start");
  const pwdBytes=s2b(password),salt=rnd(16),nonceH=rnd(12),nonceD=rnd(12);let fileBuf;
  return readFileBuf(file).then(buf=>{fileBuf=buf;onProgress&&onProgress(.25,"key");return deriveKey(pwdBytes,salt)}).then(key=>{
    onProgress&&onProgress(.45,"header");
    const headerObj={name:file.name,size:file.size,type:file.type||"",ts:Date.now()};
    const headerJson=s2b(JSON.stringify(headerObj));
    return Promise.all([aesEnc(key,nonceH,headerJson),aesEnc(key,nonceD,fileBuf)]).then(r=>{
      const h=new Uint8Array(r[0]),c=new Uint8Array(r[1]);
      const headerLen=u32to4(h.length),ver=new Uint8Array([1]);
      const out=concat([MAGIC,ver,nonceH,nonceD,salt,headerLen,h,c]);
      onProgress&&onProgress(1,"done");
      let safeName=baseNameNoExt(file.name)||"file";safeName+=".SAFE";
      return{blob:new Blob([out],{type:"application/octet-stream"}),name:safeName,meta:headerObj}
    })
  })
}
function decryptFile(file,password,onProgress){
  if(!file||!password)return Promise.reject(new Error("INVALID"));
  onProgress&&onProgress(0,"start");
  return readFileBuf(file).then(ab=>{
    const buf=new Uint8Array(ab);
    if(buf.length<4+1+12+12+16+4)throw new Error("TOO_SMALL");
    for(let i=0;i<4;i++)if(buf[i]!==MAGIC[i])throw new Error("BAD_MAGIC");
    const ver=buf[4];if(ver!==1)throw new Error("BAD_VER");
    let off=5;
    const nonceH=buf.slice(off,off+12);off+=12;
    const nonceD=buf.slice(off,off+12);off+=12;
    const salt=buf.slice(off,off+16);off+=16;
    const headerLen=u4tou32(buf.slice(off,off+4));off+=4;
    if(buf.length<off+headerLen)throw new Error("HDR_LEN");
    const headerEnc=buf.slice(off,off+headerLen);off+=headerLen;
    const cipher=buf.slice(off);
    onProgress&&onProgress(.3,"key");
    const pwdBytes=s2b(password);
    return deriveKey(pwdBytes,salt).then(key=>Promise.all([aesDec(key,nonceH,headerEnc),aesDec(key,nonceD,cipher)])).then(r=>{
      onProgress&&onProgress(.95,"decode");
      const headerJson=b2s(new Uint8Array(r[0]));let meta;
      try{meta=JSON.parse(headerJson)}catch(e){throw new Error("HDR_JSON")}
      onProgress&&onProgress(1,"done");
      const blob=new Blob([r[1]],{type:meta.type||"application/octet-stream"});
      return{blob,name:meta.name||"file",meta}
    })
  })
}

/* ui core */
function q(s,r){return(r||d).querySelector(s)}
function ce(t,c){const e=d.createElement(t);if(c)e.className=c;return e}
let modalRoot=null,toastTimer=null;
function ensureModal(){
  if(modalRoot)return modalRoot;
  modalRoot=ce("div","safe-modal-root");
  modalRoot.innerHTML="<div class=\"safe-modal-backdrop\"></div><div class=\"safe-modal\"><div class=\"safe-modal__inner\"></div></div>";
  d.body.appendChild(modalRoot);
  modalRoot.addEventListener("click",e=>{if(e.target.classList.contains("safe-modal-backdrop"))closeModal()});
  return modalRoot;
}
function showModal(title,bodyHtml,footerHtml){
  const root=ensureModal(),inner=q(".safe-modal__inner",root);
  inner.innerHTML="<div class=\"safe-modal__header\"><h2 class=\"safe-modal__title\"></h2><button class=\"safe-modal__close\" type=\"button\">×</button></div><div class=\"safe-modal__body\"></div><div class=\"safe-modal__footer\"></div>";
  q(".safe-modal__title",inner).textContent=title||"";
  q(".safe-modal__body",inner).innerHTML=bodyHtml||"";
  q(".safe-modal__footer",inner).innerHTML=footerHtml||"";
  q(".safe-modal__close",inner).addEventListener("click",closeModal);
  root.classList.add("safe-modal-root--visible");
  return inner;
}
function closeModal(){if(!modalRoot)return;modalRoot.classList.remove("safe-modal-root--visible")}
function toast(msg,type){
  let t=q(".safe-toast",d.body);
  if(!t){t=ce("div","safe-toast");d.body.appendChild(t)}
  t.textContent=msg||"";t.className="safe-toast safe-toast--"+(type||"info");t.classList.add("safe-toast--visible");
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("safe-toast--visible"),2600);
}

/* nav */
function initNav(){
  const items=[...d.querySelectorAll(".nav-item")];
  const sections=[...d.querySelectorAll(".panel-section")];
  if(!items.length||!sections.length)return;
  function activate(key){
    items.forEach(b=>b.classList.toggle("nav-item--active",b.getAttribute("data-section")===key));
    sections.forEach(s=>s.classList.toggle("panel-section--active",s.id==="section-"+key));
  }
  items.forEach(b=>b.addEventListener("click",()=>{const k=b.getAttribute("data-section");if(k)activate(k)}));
  activate("crypto");
}

/* encrypt modal */
function openEncryptModal(){
  const body="<div class=\"safe-field\"><label class=\"safe-field__label\">File</label><input class=\"safe-field__input\" type=\"file\" id=\"safe-enc-file\"></div>"
    +"<div class=\"safe-field\"><label class=\"safe-field__label\">Password</label><input class=\"safe-field__input\" type=\"password\" id=\"safe-enc-pwd\"></div>"
    +"<div class=\"safe-field\"><label class=\"safe-field__label\">Repeat password</label><input class=\"safe-field__input\" type=\"password\" id=\"safe-enc-pwd2\"></div>"
    +"<div class=\"safe-field__error\" id=\"safe-enc-error\"></div>"
    +"<div class=\"safe-progress\"><div class=\"safe-progress__bar\" id=\"safe-enc-progress\"></div></div>"
    +"<div class=\"safe-modal__status\" id=\"safe-enc-status\">Ready</div>";
  const footer="<button type=\"button\" class=\"btn btn--ghost btn--sm\" id=\"safe-enc-cancel\">Cancel</button>"
    +"<button type=\"button\" class=\"btn btn--primary btn--sm\" id=\"safe-enc-start\" disabled>Start</button>";
  const m=showModal("New encryption",body,footer);
  const fileIn=q("#safe-enc-file",m),pwd=q("#safe-enc-pwd",m),pwd2=q("#safe-enc-pwd2",m),err=q("#safe-enc-error",m),btn=q("#safe-enc-start",m),cancel=q("#safe-enc-cancel",m),bar=q("#safe-enc-progress",m),status=q("#safe-enc-status",m);
  function validate(){
    err.textContent="";
    const f=fileIn.files[0];if(!f){btn.disabled=true;return}
    const p=pwd.value||"",p2=pwd2.value||"";
    if(p.length<8){btn.disabled=true;err.textContent="Password must be at least 8 characters.";return}
    if(p!==p2){btn.disabled=true;err.textContent="Passwords do not match.";return}
    btn.disabled=false;
  }
  fileIn.addEventListener("change",validate);
  pwd.addEventListener("input",validate);
  pwd2.addEventListener("input",validate);
  cancel.addEventListener("click",closeModal);
  btn.addEventListener("click",()=>{
    err.textContent="";btn.disabled=true;cancel.disabled=true;fileIn.disabled=true;pwd.disabled=true;pwd2.disabled=true;
    status.textContent="Working...";
    const f=fileIn.files[0],p=pwd.value;
    encryptFile(f,p,prog=>{bar.style.width=Math.round(prog*100)+"%"}).then(res=>{
      status.textContent="Done";bar.style.width="100%";toast("File encrypted successfully.","success");
      const a=d.createElement("a");a.href=URL.createObjectURL(res.blob);a.download=res.name;d.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},100);
      closeModal();
    }).catch(e=>{
      console.error(e);err.textContent="Operation failed. Please check password and file.";status.textContent="Error";toast("Operation failed. Please check password and file.","error");
      btn.disabled=false;cancel.disabled=false;fileIn.disabled=false;pwd.disabled=false;pwd2.disabled=false;
    });
  });
}

/* decrypt modal */
function openDecryptModal(){
  const body="<div class=\"safe-field\"><label class=\"safe-field__label\">File</label><input class=\"safe-field__input\" type=\"file\" id=\"safe-dec-file\" accept=\".SAFE,.safe\"></div>"
    +"<div class=\"safe-field\"><label class=\"safe-field__label\">Password</label><input class=\"safe-field__input\" type=\"password\" id=\"safe-dec-pwd\"></div>"
    +"<div class=\"safe-field__error\" id=\"safe-dec-error\"></div>"
    +"<div class=\"safe-progress\"><div class=\"safe-progress__bar\" id=\"safe-dec-progress\"></div></div>"
    +"<div class=\"safe-modal__status\" id=\"safe-dec-status\">Ready</div>";
  const footer="<button type=\"button\" class=\"btn btn--ghost btn--sm\" id=\"safe-dec-cancel\">Cancel</button>"
    +"<button type=\"button\" class=\"btn btn--primary btn--sm\" id=\"safe-dec-start\" disabled>Start</button>";
  const m=showModal("New decryption",body,footer);
  const fileIn=q("#safe-dec-file",m),pwd=q("#safe-dec-pwd",m),err=q("#safe-dec-error",m),btn=q("#safe-dec-start",m),cancel=q("#safe-dec-cancel",m),bar=q("#safe-dec-progress",m),status=q("#safe-dec-status",m);
  function validate(){
    err.textContent="";
    const f=fileIn.files[0];if(!f){btn.disabled=true;return}
    const p=pwd.value||"";if(p.length<1){btn.disabled=true;return}
    btn.disabled=false;
  }
  fileIn.addEventListener("change",validate);
  pwd.addEventListener("input",validate);
  cancel.addEventListener("click",closeModal);
  btn.addEventListener("click",()=>{
    err.textContent="";btn.disabled=true;cancel.disabled=true;fileIn.disabled=true;pwd.disabled=true;
    status.textContent="Working...";
    const f=fileIn.files[0],p=pwd.value;
    decryptFile(f,p,prog=>{bar.style.width=Math.round(prog*100)+"%"}).then(res=>{
      status.textContent="Done";bar.style.width="100%";toast("File decrypted successfully.","success");
      const a=d.createElement("a");a.href=URL.createObjectURL(res.blob);a.download=res.name||"file";d.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},100);
      closeModal();
    }).catch(e=>{
      console.error(e);err.textContent="Operation failed. Please check password and file.";status.textContent="Error";toast("Operation failed. Please check password and file.","error");
      btn.disabled=false;cancel.disabled=false;fileIn.disabled=false;pwd.disabled=false;
    });
  });
}

/* attach handlers */
function initButtons(){
  const cryptoSec=q("#section-crypto");if(!cryptoSec)return;
  const encBtn=q("#section-crypto .panel-card:nth-of-type(1) .option-item:nth-of-type(1)");
  const decBtn=q("#section-crypto .panel-card:nth-of-type(2) .option-item:nth-of-type(1)");
  if(encBtn)encBtn.addEventListener("click",openEncryptModal);
  if(decBtn)decBtn.addEventListener("click",openDecryptModal);
}

/* telegram detection (فقط برای جلوگیری از اجرای خارج از تلگرام، بدون گیر دادن زیاد) */
function checkTelegram(){
  const wa=w.Telegram&&w.Telegram.WebApp;
  if(!wa){console.log("SAFE: not in Telegram WebApp (dev mode)");return}
  try{wa.ready();wa.expand()}catch(e){}
}

/* boot */
function boot(){
  console.log("SAFE script boot");
  checkTelegram();
  initNav();
  initButtons();
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",boot);else boot();
})(window,document);
