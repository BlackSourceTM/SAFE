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
async function safeSave(blob,name){
try{
if(window.showSaveFilePicker){
let handle=await window.showSaveFilePicker({suggestedName:name});
let wStream=await handle.createWritable();
await wStream.write(blob);
await wStream.close();
return true
}
}catch(e){}
var url=URL.createObjectURL(blob);
var a=document.createElement("a");
a.href=url;
a.download=name;
a.style.display="none";
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
setTimeout(function(){URL.revokeObjectURL(url)},5000);
return true
}
function notify(msg,type){
if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg,type||"info")
}
var MAGIC=s2b("SAFE");
async function encryptFile(file,password,opts,onProgress){
if(!file||!password)return Promise.reject(new Error("INVALID_INPUT"));
onProgress&&onProgress(0,"start");
var pwdBytes=s2b(password),salt=rnd(16),nonceH=rnd(12),nonceD=rnd(12),fileBuf;
var ownerHash=opts&&opts.owner_hash?String(opts.owner_hash):null;
return readFileAsArrayBuffer(file).then(function(b){
fileBuf=b;
onProgress&&onProgress(.25,"key");
return deriveKey(pwdBytes,salt)
}).then(function(key){
onProgress&&onProgress(.45,"header");
var headerObj={name:file.name,size:file.size,type:file.type||"",ts:Date.now(),owner:ownerHash};
var headerJson=s2b(JSON.stringify(headerObj));
return Promise.all([aesEnc(key,nonceH,headerJson),aesEnc(key,nonceD,fileBuf)]).then(function(res){
var h=new Uint8Array(res[0]),c=new Uint8Array(res[1]);
var headerLen=u32to4(h.length);
var ver=new Uint8Array([1]);
var out=concat([MAGIC,ver,nonceH,nonceD,salt,headerLen,h,c]);
onProgress&&onProgress(1,"done");
var safeName=(baseNameNoExt(file.name)||"file")+".safe";
return{blob:new Blob([out],{type:"application/octet-stream"}),name:safeName,meta:headerObj}
})
})
}
async function decryptFile(file,password,onProgress,reportFn,currentUserHash){
if(!file||!password)return Promise.reject(new Error("INVALID_INPUT"));
onProgress&&onProgress(0,"start");
var pwdBytes=s2b(password),buf;
try{
var ab=await readFileAsArrayBuffer(file);
buf=new Uint8Array(ab);
if(buf.length<4+1+12+12+16+4)throw new Error("FILE_TOO_SMALL");
for(var i=0;i<4;i++)if(buf[i]!==MAGIC[i])throw new Error("BAD_MAGIC");
var ver=buf[4];
if(ver!==1)throw new Error("BAD_VERSION");
var off=5;
var nonceH=buf.slice(off,off+12);off+=12;
var nonceD=buf.slice(off,off+12);off+=12;
var salt=buf.slice(off,off+16);off+=16;
var headerLen=u4tou32(buf.slice(off,off+4));off+=4;
if(buf.length<off+headerLen)throw new Error("BAD_HEADER_LEN");
var headerEnc=buf.slice(off,off+headerLen);off+=headerLen;
var cipher=buf.slice(off);
onProgress&&onProgress(.3,"key");
var key=await deriveKey(pwdBytes,salt);
onProgress&&onProgress(.55,"header");
var headerJson=b2s(new Uint8Array(await aesDec(key,nonceH,headerEnc)));
var meta=JSON.parse(headerJson);
var ownerHash=meta.owner||null;
if(ownerHash&&currentUserHash&&ownerHash!==currentUserHash){
await reportFn("failed","OWNER_MISMATCH");
throw new Error("This file is locked to another account.")
}
onProgress&&onProgress(.85,"data");
var plain=new Uint8Array(await aesDec(key,nonceD,cipher));
onProgress&&onProgress(1,"done");
await reportFn("completed",null);
var outBlob=new Blob([plain],{type:meta.type||"application/octet-stream"});
return{blob:outBlob,name:meta.name,meta:meta}
}catch(e){
await reportFn("failed",String(e&&e.message||e));
throw e
}
}
w.SAFE_CRYPTO={encryptFile:encryptFile,decryptFile:decryptFile,notify:notify,safeSave:safeSave};
})(window);
