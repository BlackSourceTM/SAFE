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
function encryptFileExt(file,password,opts){
  opts=opts||{};
  var onProgress=opts.onProgress||null;
  var scope=opts.scope||"any";
  var ownerId=opts.ownerId||null;
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
    if(scope==="owner"&&ownerId){headerObj.scope="owner";headerObj.owner_id=String(ownerId)}else{headerObj.scope="any"}
    var headerJson=s2b(JSON.stringify(headerObj));
    return Promise.all([aesEnc(key,nonceH,headerJson),aesEnc(key,nonceD,fileBuf)]).then(function(res){
      var h=new Uint8Array(res[0]),c=new Uint8Array(res[1]);
      var headerLen=u32to4(h.length);
      var ver=new Uint8Array([1]);
      var out=concat([MAGIC,ver,nonceH,nonceD,salt,headerLen,h,c]);
      onProgress&&onProgress(1,"done");
      var safeName=baseNameNoExt(file.name)||"file";
      safeName+=".SAFE";
      return{blob:new Blob([out],{type:"application/octet-stream"}),name:safeName,meta:headerObj}
    })
  })
}
function encryptFile(file,password,onProgress){return encryptFileExt(file,password,{onProgress:onProgress})}
function decryptFileExt(file,password,opts){
  opts=opts||{};
  var onProgress=opts.onProgress||null;
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
        if(meta&&meta.scope==="owner"&&meta.owner_id){
          var tg=w.Telegram&&w.Telegram.WebApp&&w.Telegram.WebApp.initDataUnsafe&&w.Telegram.WebApp.initDataUnsafe.user;
          var curId=tg&&tg.id?String(tg.id):null;
          if(!curId||curId!==String(meta.owner_id))throw new Error("OWNER_MISMATCH")
        }
        onProgress&&onProgress(1,"done");
        var outBlob=new Blob([res[1]],{type:meta.type||"application/octet-stream"});
        var outName=meta.name||"file";
        return{blob:outBlob,name:outName,meta:meta}
      })
    })
  })
}
function decryptFile(file,password,onProgress){return decryptFileExt(file,password,{onProgress:onProgress})}
function canUseFS(){return typeof w!=="undefined"&&"showSaveFilePicker"in w}
function saveBlobWithFS(blob,name){
  return w.showSaveFilePicker({suggestedName:name||"file",types:[{description:"SAFE file",accept:{"application/octet-stream":[".safe",".SAFE",".*"]}}]}).then(function(handle){return handle.createWritable().then(function(stream){return stream.write(blob).then(function(){return stream.close()})})})
}
function openDownloadWindow(blob,filename){
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url;
  a.download=filename||"file";
  a.target="_blank";
  a.rel="noopener";
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url)},2000)
}
function notify(msg,type){
  if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg,type||"info");else if(w.alert)w.alert(msg)
}
w.addEventListener("safe:start-encryption",function(ev){
  var d=ev.detail||{};
  var file=d.file,password=d.password,meta=d.meta||{},scope=d.scope||"any";
  if(!file||!password){notify("Missing file or password.","error");return}
  var plan=meta.plan||"free";
  var lockScope="any",ownerId=null;
  if(plan!=="free"&&scope==="owner"){
    var tg=w.Telegram&&w.Telegram.WebApp&&w.Telegram.WebApp.initDataUnsafe&&w.Telegram.WebApp.initDataUnsafe.user;
    if(tg&&tg.id){lockScope="owner";ownerId=String(tg.id)}else{lockScope="any"}
  }
  notify("Encryption started...","info");
  encryptFileExt(file,password,{scope:lockScope,ownerId:ownerId,onProgress:function(p,stage){} }).then(function(res){
    var blob=res.blob,name=res.name;
    if(canUseFS()){
      saveBlobWithFS(blob,name).then(function(){notify("Encrypted file saved.","success")}).catch(function(e){notify("Save failed: "+(e&&e.message?e.message:String(e)),"error")})
    }else{
      openDownloadWindow(blob,name);
      notify("Encrypted file ready. Download started.","success")
    }
  }).catch(function(err){
    var msg=err&&err.message?err.message:String(err);
    if(msg==="OWNER_MISMATCH")msg="This SAFE file is locked to another Telegram account.";
    notify("Encryption failed: "+msg,"error")
  })
});
w.addEventListener("safe:start-decryption",function(ev){
  var d=ev.detail||{};
  var file=d.file,password=d.password;
  if(!file||!password){notify("Missing file or password.","error");return}
  notify("Decryption started...","info");
  decryptFileExt(file,password,{onProgress:function(p,stage){} }).then(function(res){
    var blob=res.blob,name=res.name;
    if(canUseFS()){
      saveBlobWithFS(blob,name).then(function(){notify("Decrypted file saved.","success")}).catch(function(e){notify("Save failed: "+(e&&e.message?e.message:String(e)),"error")})
    }else{
      openDownloadWindow(blob,name);
      notify("Decrypted file ready. Download started.","success")
    }
  }).catch(function(err){
    var msg=err&&err.message?err.message:String(err);
    if(msg==="OWNER_MISMATCH")msg="This SAFE file is locked to another Telegram account.";
    notify("Decryption failed: "+msg,"error")
  })
});
w.SAFE_CRYPTO={encryptFile:encryptFile,decryptFile:decryptFile};
})(window);
