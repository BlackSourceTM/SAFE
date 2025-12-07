(function(w){
var te=new TextEncoder(),td=new TextDecoder();
function s2b(str){return te.encode(str)}
function b2s(buf){return td.decode(buf)}
function rnd(len){var a=new Uint8Array(len);crypto.getRandomValues(a);return a}
function concat(parts){var len=0;for(var i=0;i<parts.length;i++)len+=parts[i].length;var out=new Uint8Array(len),off=0;for(i=0;i<parts.length;i++){out.set(parts[i],off);off+=parts[i].length}return out}
function u32to4(v){return new Uint8Array([(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255])}
function u4tou32(b){return((b[0]<<24)|(b[1]<<16)|(b[2]<<8)|b[3])>>>0}
function deriveKey(pwdBytes,salt){return crypto.subtle.importKey("raw",pwdBytes,"PBKDF2",!1,["deriveKey"]).then(function(base){return crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:210000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])})}
function aesEnc(key,iv,data){return crypto.subtle.encrypt({name:"AES-GCM",iv:iv},key,data)}
function aesDec(key,iv,data){return crypto.subtle.decrypt({name:"AES-GCM",iv:iv},key,data)}
function readFileAsArrayBuffer(file){return new Promise(function(res,rej){var r=new FileReader();r.onerror=function(){rej(new Error("FILE_READ_ERROR"))};r.onload=function(){res(r.result)};r.readAsArrayBuffer(file)})}
function baseNameNoExt(name){var i=name.lastIndexOf(".");if(i<=0)return name;return name.slice(0,i)}
var MAGIC=s2b("SAFE");
function encryptFile(file,password,onProgress,options){
 if(!file||!password)return Promise.reject(new Error("INVALID_INPUT"));
 var opts=options||{},cb=typeof onProgress==="function"?onProgress:null;
 var lockMode=opts.lockMode||"any",ownerHash=opts.ownerHash||null;
 cb&&cb(0,"start");
 var pwdBytes=s2b(password),salt=rnd(16),nonceH=rnd(12),nonceD=rnd(12),fileBuf;
 return readFileAsArrayBuffer(file).then(function(buf){
  fileBuf=buf;
  cb&&cb(.25,"key");
  return deriveKey(pwdBytes,salt)
 }).then(function(key){
  cb&&cb(.45,"header");
  var headerObj={name:file.name,size:file.size,type:file.type||"",ts:Date.now(),lock:lockMode,owner:ownerHash};
  var headerJson=s2b(JSON.stringify(headerObj));
  return Promise.all([aesEnc(key,nonceH,headerJson),aesEnc(key,nonceD,fileBuf)]).then(function(res){
   var h=new Uint8Array(res[0]),c=new Uint8Array(res[1]);
   var headerLen=u32to4(h.length);
   var ver=new Uint8Array([1]);
   var out=concat([MAGIC,ver,nonceH,nonceD,salt,headerLen,h,c]);
   cb&&cb(1,"done");
   var safeName=baseNameNoExt(file.name)||"file";
   safeName+=".safe";
   return{blob:new Blob([out],{type:"application/octet-stream"}),name:safeName,meta:headerObj}
  })
 })
}
function decryptFile(file,password,onProgress,options){
 if(!file||!password)return Promise.reject(new Error("INVALID_INPUT"));
 var opts=options||{},cb=typeof onProgress==="function"?onProgress:null;
 var enforceLock=!!opts.enforceLock,ownerHash=opts.ownerHash||null;
 cb&&cb(0,"start");
 var pwdBytes=s2b(password),buf;
 return readFileAsArrayBuffer(file).then(function(ab){
  buf=new Uint8Array(ab);
  if(buf.length<4+1+12+12+16+4)throw new Error("FILE_TOO_SMALL");
  var magic=buf.slice(0,4);
  for(var i=0;i<4;i++)if(magic[i]!==MAGIC[i])throw new Error("BAD_MAGIC");
  var ver=buf[4];if(ver!==1)throw new Error("BAD_VERSION");
  var off=5;
  var nonceH=buf.slice(off,off+12);off+=12;
  var nonceD=buf.slice(off,off+12);off+=12;
  var salt=buf.slice(off,off+16);off+=16;
  var headerLen=u4tou32(buf.slice(off,off+4));off+=4;
  if(buf.length<off+headerLen)throw new Error("BAD_HEADER_LEN");
  var headerEnc=buf.slice(off,off+headerLen);off+=headerLen;
  var cipher=buf.slice(off);
  cb&&cb(.3,"key");
  return deriveKey(pwdBytes,salt).then(function(key){
   cb&&cb(.55,"header");
   return aesDec(key,nonceH,headerEnc).then(function(hPlain){
    var headerJson=b2s(new Uint8Array(hPlain)),meta;
    try{meta=JSON.parse(headerJson)}catch(e){throw new Error("BAD_HEADER_JSON")}
    if(enforceLock&&meta&&meta.lock==="owner"){
     if(!ownerHash||meta.owner!==ownerHash){var e=new Error("OWNER_MISMATCH");e.code="OWNER_MISMATCH";throw e}
    }
    cb&&cb(.8,"data");
    return aesDec(key,nonceD,cipher).then(function(dPlain){
     cb&&cb(1,"done");
     var outBlob=new Blob([dPlain],{type:meta.type||"application/octet-stream"});
     var outName=meta.name||"file";
     return{blob:outBlob,name:outName,meta:meta}
    })
   })
  })
 })
}
function notify(msg,type){
 if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg,type||"info");else if(w.alert)alert(msg)
}
function getStatusEl(id){return document.getElementById(id)}
function maskKey(p){p=p||"";if(p.length<=4)return p;return p.slice(0,2)+"****"+p.slice(-2)}
function hasFSAccess(){return typeof w.showSaveFilePicker==="function"}
function saveBlob(blob,defaultName,ctx){
 var name=defaultName||"file.bin";
 if(hasFSAccess()){
  return w.showSaveFilePicker({suggestedName:name}).then(function(handle){
   return handle.createWritable().then(function(wr){
    return wr.write(blob).then(function(){return wr.close()})
   })
  }).catch(function(err){
   if(err&&err.name==="AbortError")return;
   return fallbackSave(blob,name)
  })
 }
 return fallbackSave(blob,name)
}
function fallbackSave(blob,name){
 return new Promise(function(res){
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url;a.download=name;a.target="_blank";
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);res()},1500)
 })
}
function getTelegramUser(){
 var t=w.Telegram&&w.Telegram.WebApp&&w.Telegram.WebApp.initDataUnsafe&&w.Telegram.WebApp.initDataUnsafe.user;
 return t||null
}
function ownerHashFromTelegram(){
 var u=getTelegramUser();if(!u||!u.id)return null;
 var s=String(u.id),h=0,i;for(i=0;i<s.length;i++)h=(h*131+s.charCodeAt(i))>>>0;
 return h.toString(16).padStart(8,"0")
}
function sendEncryptLog(detail,res,extra){
 try{
  var backend="https://safe-bot-worker.alirahimikiasari.workers.dev/api/encrypt/complete";
  var tg=getTelegramUser();
  var file=detail&&detail.file,resMeta=res&&res.meta,meta=detail&&detail.meta;
  var body={
   user_id:tg?tg.id:null,
   file_name:file?file.name:(resMeta&&resMeta.name)||"",
   file_size_bytes:file?file.size:(resMeta&&resMeta.size)||0,
   file_ext:meta&&meta.file&&meta.file.ext||null,
   masked_key:maskKey(detail&&detail.password),
   status:extra&&extra.status||"failed",
   error_message:extra&&extra.error_message||null,
   scope:extra&&extra.lockMode||null,
   plan:meta&&meta.plan||null
  };
  fetch(backend,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){if(r&&r.json)return r.json();return null}).then(function(data){if(!data||!data.ok)console.log("Encrypt log error",data)}).catch(function(e){console.log("Encrypt log fetch error",e)})
 }catch(e){console.log("Encrypt log exception",e)}
}
function sendDecryptLog(detail,res,extra){
 try{
  var backend="https://safe-bot-worker.alirahimikiasari.workers.dev/api/decrypt/log";
  var tg=getTelegramUser();
  var file=detail&&detail.file,resMeta=res&&res.meta;
  var body={
   user_id:tg?tg.id:null,
   file_name:resMeta&&resMeta.name||file&&file.name||"",
   file_size_bytes:resMeta&&resMeta.size||file&&file.size||0,
   status:extra&&extra.status||"failed",
   error_message:extra&&extra.error_message||null
  };
  fetch(backend,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){if(r&&r.json)return r.json();return null}).then(function(data){if(!data||!data.ok)console.log("Decrypt log error",data)}).catch(function(e){console.log("Decrypt log fetch error",e)})
 }catch(e){console.log("Decrypt log exception",e)}
}
function handleEncEvent(ev){
 var d=ev.detail||{},file=d.file,password=d.password;
 if(!file||!password){notify("Missing file or password for encryption","error");return}
 var statusEl=getStatusEl("safe-enc-status");
 if(statusEl)statusEl.textContent="Starting encryption...";
 notify("Encryption started","info");
 var lockMode="any";
 if(d.lock_mode==="owner"||d.lock_mode==="any")lockMode=d.lock_mode;else if(d.scope==="owner")lockMode="owner";
 var ownerHash=lockMode==="owner"?ownerHashFromTelegram():null;
 encryptFile(file,password,function(p,stage){
  if(!statusEl)return;
  var label="Working...";
  if(stage==="key")label="Deriving key...";
  else if(stage==="header")label="Encrypting header...";
  else if(stage==="data")label="Encrypting data...";
  else if(stage==="done")label="Finalizing...";
  statusEl.textContent="Encryption: "+Math.round(p*100)+"% – "+label
 },{lockMode:lockMode,ownerHash:ownerHash}).then(function(res){
  if(statusEl)statusEl.textContent="Saving encrypted file...";
  saveBlob(res.blob,res.name,"encrypt").then(function(){
   if(statusEl)statusEl.textContent="Encryption finished.";
   notify("Encryption finished","success");
   sendEncryptLog(d,res,{status:"completed",lockMode:lockMode})
  }).catch(function(e){
   var msg="Save failed: "+(e&&e.message||e);
   if(statusEl)statusEl.textContent=msg;
   notify(msg,"error");
   sendEncryptLog(d,res,{status:"failed",error_message:msg,lockMode:lockMode})
  })
 }).catch(function(err){
  var msg=err&&err.message||String(err||"Error");
  if(statusEl)statusEl.textContent="Encryption failed: "+msg;
  notify("Encryption failed: "+msg,"error");
  sendEncryptLog(d,null,{status:"failed",error_message:msg,lockMode:lockMode})
 })
}
function handleDecEvent(ev){
 var d=ev.detail||{},file=d.file,password=d.password;
 if(!file||!password){notify("Missing file or password for decryption","error");return}
 var statusEl=getStatusEl("safe-dec-status");
 if(statusEl)statusEl.textContent="Starting decryption...";
 notify("Decryption started","info");
 var ownerHash=ownerHashFromTelegram();
 decryptFile(file,password,function(p,stage){
  if(!statusEl)return;
  var label="Working...";
  if(stage==="key")label="Deriving key...";
  else if(stage==="header")label="Decrypting header...";
  else if(stage==="data")label="Decrypting data...";
  else if(stage==="done")label="Finalizing...";
  statusEl.textContent="Decryption: "+Math.round(p*100)+"% – "+label
 },{enforceLock:!0,ownerHash:ownerHash}).then(function(res){
  if(statusEl)statusEl.textContent="Saving decrypted file...";
  saveBlob(res.blob,res.name,"decrypt").then(function(){
   if(statusEl)statusEl.textContent="Decryption finished.";
   notify("Decryption finished","success");
   sendDecryptLog(d,res,{status:"completed"})
  }).catch(function(e){
   var msg="Save failed: "+(e&&e.message||e);
   if(statusEl)statusEl.textContent=msg;
   notify(msg,"error");
   sendDecryptLog(d,res,{status:"failed",error_message:msg})
  })
 }).catch(function(err){
  var msg=err&&err.message||String(err||"Error");
  if(err&&err.code==="OWNER_MISMATCH")msg="This SAFE file is locked to another Telegram account.";
  if(statusEl)statusEl.textContent="Decryption failed: "+msg;
  notify("Decryption failed: "+msg,"error");
  sendDecryptLog(d,null,{status:"failed",error_message:msg})
 })
}
w.SAFE_CRYPTO={encryptFile:encryptFile,decryptFile:decryptFile};
if(w.addEventListener){
 w.addEventListener("safe:start-encryption",handleEncEvent);
 w.addEventListener("safe:start-decryption",handleDecEvent)
}
})(window);
