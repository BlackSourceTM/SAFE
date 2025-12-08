(function(w){
var te=new TextEncoder(),td=new TextDecoder();
function s2b(s){return te.encode(s)}
function b2s(b){return td.decode(b)}
function rnd(n){var a=new Uint8Array(n);crypto.getRandomValues(a);return a}
function concat(arr){var l=0,i;for(i=0;i<arr.length;i++)l+=arr[i].length;var out=new Uint8Array(l),o=0;for(i=0;i<arr.length;i++){out.set(arr[i],o);o+=arr[i].length}return out}
function u32to4(v){return new Uint8Array([(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255])}
function u4tou32(b){return((b[0]<<24)|(b[1]<<16)|(b[2]<<8)|b[3])>>>0}
function deriveKey(p,s){return crypto.subtle.importKey("raw",p,"PBKDF2",0,["deriveKey"]).then(function(base){return crypto.subtle.deriveKey({name:"PBKDF2",salt:s,iterations:210000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},0,["encrypt","decrypt"])})}
function aesEnc(k,iv,d){return crypto.subtle.encrypt({name:"AES-GCM",iv:iv},k,d)}
function aesDec(k,iv,d){return crypto.subtle.decrypt({name:"AES-GCM",iv:iv},k,d)}
function readFileAB(f){return new Promise(function(res,rej){var r=new FileReader();r.onerror=function(){rej(new Error("FILE_READ_ERROR"))};r.onload=function(){res(r.result)};r.readAsArrayBuffer(f)})}
function basename(n){var i=n.lastIndexOf(".");return i<=0?n:n.slice(0,i)}
var MAGIC=s2b("SAFE");
function safeSave(b,name){
var savePicker=0;try{savePicker=!!window.showSaveFilePicker}catch(e){}
if(savePicker){return window.showSaveFilePicker({suggestedName:name}).then(function(h){return h.createWritable().then(function(wr){return wr.write(b).then(function(){return wr.close()})})}).catch(function(){return fallback()})}
return fallback();
function fallback(){var u=URL.createObjectURL(b);var a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},2000)}
}
function notify(m,t){
if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(m,t||"info");
else if(alert)alert(m)
}
function encryptFile(file,pwd,onProgress,scope,ownerHash){
if(!file||!pwd)return Promise.reject(new Error("INVALID_INPUT"));
onProgress&&onProgress(0,"start");
var p=s2b(pwd),salt=rnd(16),ivH=rnd(12),ivD=rnd(12),fileBuf;
return readFileAB(file).then(function(buf){
fileBuf=buf;
onProgress&&onProgress(.25,"key");
return deriveKey(p,salt)
}).then(function(key){
onProgress&&onProgress(.45,"header");
var info={name:file.name,size:file.size,type:file.type||"",ts:Date.now(),owner:scope==="owner"?ownerHash:null};
var hjson=s2b(JSON.stringify(info));
return Promise.all([aesEnc(key,ivH,hjson),aesEnc(key,ivD,fileBuf)]).then(function(v){
var hh=new Uint8Array(v[0]),cc=new Uint8Array(v[1]);
var hl=u32to4(hh.length),ver=new Uint8Array([1]);
var out=concat([MAGIC,ver,ivH,ivD,salt,hl,hh,cc]);
onProgress&&onProgress(1,"done");
var fname=(basename(file.name)||"file")+".safe";
return{blob:new Blob([out],{type:"application/octet-stream"}),name:fname,meta:info}
})
})
}
function decryptFile(file,pwd,onProgress,report,uidHash){
if(!file||!pwd)return Promise.reject(new Error("INVALID_INPUT"));
onProgress&&onProgress(0,"start");
var p=s2b(pwd),buf;
return readFileAB(file).then(function(ab){
buf=new Uint8Array(ab);
if(buf.length<49)throw new Error("FILE_TOO_SMALL");
var mg=buf.slice(0,4);
for(var i=0;i<4;i++)if(mg[i]!==MAGIC[i])throw new Error("BAD_MAGIC");
var ver=buf[4];if(ver!==1)throw new Error("BAD_VERSION");
var off=5;
var ivH=buf.slice(off,off+12);off+=12;
var ivD=buf.slice(off,off+12);off+=12;
var salt=buf.slice(off,off+16);off+=16;
var hl=u4tou32(buf.slice(off,off+4));off+=4;
if(buf.length<off+hl)throw new Error("BAD_HEADER_LEN");
var hEnc=buf.slice(off,off+hl);off+=hl;
var cipher=buf.slice(off);
onProgress&&onProgress(.3,"key");
return deriveKey(p,salt).then(function(k){
onProgress&&onProgress(.55,"header");
return Promise.all([aesDec(k,ivH,hEnc),aesDec(k,ivD,cipher)]).then(function(r){
var meta;try{meta=JSON.parse(b2s(new Uint8Array(r[0])))}catch(e){throw new Error("BAD_HEADER_JSON")}
if(meta.owner&&meta.owner!==uidHash){
report&&report("failed","OWNER_LOCK_MISMATCH");
throw new Error("This file is owner-locked and cannot be decrypted by this account.")
}
onProgress&&onProgress(1,"done");
return{blob:new Blob([r[1]],{type:meta.type||"application/octet-stream"}),name:meta.name,meta:meta}
})
})
})
}
w.SAFE_CRYPTO={
encryptFile:encryptFile,
decryptFile:decryptFile,
safeSave:safeSave,
notify:notify
}
})(window);
