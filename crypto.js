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
function encryptFile(file,password,onProgress){
  if(!file||!password)return Promise.reject(new Error("INVALID_INPUT"));
  onProgress&&onProgress(0,"start");
  var pwdBytes=s2b(password),salt=rnd(16),nonceH=rnd(12),nonceD=rnd(12),fileBuf;
  return readFileAsArrayBuffer(file).then(function(buf){
    fileBuf=buf;
    onProgress&&onProgress(.25,"key");
    return deriveKey(pwdBytes,salt)
  }).then(function(key){
    onProgress&&onProgress(.45,"header");
    var headerObj={name:file.name,size:file.size,type:file.type||"",ts:Date.now()};
    var headerJson=s2b(JSON.stringify(headerObj));
    return Promise.all([aesEnc(key,nonceH,headerJson),aesEnc(key,nonceD,fileBuf)]).then(function(res){
      var h=new Uint8Array(res[0]),c=new Uint8Array(res[1]);
      var headerLen=u32to4(h.length);
      var ver=new Uint8Array([1]);
      var out=concat([MAGIC,ver,nonceH,nonceD,salt,headerLen,h,c]);
      onProgress&&onProgress(1,"done");
      var safeName=baseNameNoExt(file.name)||"file";
      safeName+=".safe";
      return{blob:new Blob([out],{type:"application/octet-stream"}),name:safeName,meta:headerObj}
    })
  })
}
function decryptFile(file,password,onProgress){
  if(!file||!password)return Promise.reject(new Error("INVALID_INPUT"));
  onProgress&&onProgress(0,"start");
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
    onProgress&&onProgress(.3,"key");
    return deriveKey(pwdBytes,salt).then(function(key){
      onProgress&&onProgress(.55,"header");
      return Promise.all([aesDec(key,nonceH,headerEnc),aesDec(key,nonceD,cipher)]).then(function(res){
        var headerJson=b2s(new Uint8Array(res[0]));
        var meta;
        try{meta=JSON.parse(headerJson)}catch(e){throw new Error("BAD_HEADER_JSON")}
        onProgress&&onProgress(1,"done");
        var outBlob=new Blob([res[1]],{type:meta.type||"application/octet-stream"});
        var outName=meta.name||"file";
        return{blob:outBlob,name:outName,meta:meta}
      })
    })
  })
}
function saveBlobSmart(blob,defaultName){
  var name=defaultName||"file.bin";
  if(typeof window!=="undefined"&&typeof window.showSaveFilePicker==="function"){
    return window.showSaveFilePicker({suggestedName:name}).then(function(handle){
      return handle.createWritable().then(function(wr){
        return wr.write(blob).then(function(){return wr.close()})
      })
    }).then(function(){
      if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast("File saved on your device.","success");
    }).catch(function(){
      return fallbackDownload(blob,name)
    })
  }
  return fallbackDownload(blob,name)
}
function fallbackDownload(blob,name){
  try{
    var url=URL.createObjectURL(blob);
    var a=document.createElement("a");
    a.href=url;
    a.download=name;
    a.target="_blank";
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      document.body.removeChild(a);
      URL.revokeObjectURL(url)
    },0);
    if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast("Download started in your browser.","info");
  }catch(e){
    if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast("Download failed: "+(e.message||e),"error");else if(w.alert)alert("Download failed: "+(e.message||e));
  }
}
w.SAFE_CRYPTO={encryptFile:encryptFile,decryptFile:decryptFile};
function handleEncEvent(ev){
  var d=ev.detail||{},file=d.file,password=d.password,meta=d.meta||{};
  if(!file||!password){
    if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast("Missing file or password for encryption.","error");
    else if(w.alert)alert("Missing file or password for encryption.");
    return;
  }
  if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast("Encryption started...","info");
  encryptFile(file,password,function(p){if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.onEncryptProgress)w.SAFE_UI_CORE.onEncryptProgress(p,meta)}).then(function(res){
    return saveBlobSmart(res.blob,res.name)
  }).then(function(){
    if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast("Encryption finished.","success");
  }).catch(function(e){
    var msg="Encryption failed: "+(e.message||e);
    if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg,"error");else if(w.alert)alert(msg);
  })
}
function handleDecEvent(ev){
  var d=ev.detail||{},file=d.file,password=d.password,meta=d.meta||{};
  if(!file||!password){
    if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast("Missing file or password for decryption.","error");
    else if(w.alert)alert("Missing file or password for decryption.");
    return;
  }
  if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast("Decryption started...","info");
  decryptFile(file,password,function(p){if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.onDecryptProgress)w.SAFE_UI_CORE.onDecryptProgress(p,meta)}).then(function(res){
    return saveBlobSmart(res.blob,res.name)
  }).then(function(){
    if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast("Decryption finished.","success");
  }).catch(function(e){
    var msg="Decryption failed: "+(e.message||e);
    if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg,"error");else if(w.alert)alert(msg);
  })
}
if(w.addEventListener){
  w.addEventListener("safe:start-encryption",handleEncEvent);
  w.addEventListener("safe:start-decryption",handleDecEvent);
}
})(window);
