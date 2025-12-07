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
var MAGIC=s2b("SAFE");
function encryptFile(file,password,onProgress){
if(!file||!password)return Promise.reject(new Error("INVALID_INPUT"));
onProgress&&onProgress(0,"start");
var pwdBytes=s2b(password),salt=rnd(16),nonceH=rnd(12),nonceD=rnd(12),fileBuf;
return readFileAsArrayBuffer(file).then(function(buf){
fileBuf=buf;onProgress&&onProgress(.25,"key");return deriveKey(pwdBytes,salt)
}).then(function(key){
onProgress&&onProgress(.45,"header");
var headerObj={name:file.name,size:file.size,type:file.type||"",ts:Date.now()};
var headerJson=s2b(JSON.stringify(headerObj));
return Promise.all([aesEnc(key,nonceH,headerJson),aesEnc(key,nonceD,fileBuf)]).then(function(r){
var h=new Uint8Array(r[0]),c=new Uint8Array(r[1]);
var headerLen=u32to4(h.length);
var out=concat([MAGIC,new Uint8Array([1]),nonceH,nonceD,salt,headerLen,h,c]);
onProgress&&onProgress(1,"done");
return{blob:new Blob([out],{type:"application/octet-stream"}),name:(file.name.replace(/\.[^.]+$/,"")||"file")+".safe",meta:headerObj}
})
})
}
function saveBlob(blob,name){
if(window.showSaveFilePicker){
return window.showSaveFilePicker({suggestedName:name}).then(async(h)=>{
var w=await h.createWritable();await w.write(blob);await w.close();return true
}).catch(()=>fallback())
}else return fallback();
function fallback(){
var url=URL.createObjectURL(blob);var a=document.createElement("a");
a.href=url;a.download=name;a.target="_blank";a.click();
setTimeout(()=>URL.revokeObjectURL(url),2000);
return true
}}
w.addEventListener("safe:start-encryption",async function(ev){
var d=ev.detail;if(!d||!d.file||!d.password||!d.meta)return;
var file=d.file,password=d.password,meta=d.meta;
var user_id=meta.user.id_hash;
var file_name=meta.file.name;
var file_size_bytes=meta.file.size_bytes;
var mime_type=meta.file.mime;
var requested_at=new Date().toISOString();
var masked_key=meta.password_mask||"";
var scope=meta.scope||"public";
try{
var result=await encryptFile(file,password,function(p){});
await saveBlob(result.blob,result.name);
await fetch("https://safe-bot-worker.alirahimikiasari.workers.dev/api/encrypt/complete",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
user_id:user_id,
file_name:file_name,
file_size_bytes:file_size_bytes,
mime_type:mime_type,
requested_at:requested_at,
status:"completed",
masked_key:masked_key,
scope:scope
})
});
}catch(e){
await fetch("https://safe-bot-worker.alirahimikiasari.workers.dev/api/encrypt/complete",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
user_id:user_id,
file_name:file_name,
file_size_bytes:file_size_bytes,
requested_at:requested_at,
status:"failed",
error_message:e.message||String(e)
})
});
}
});
w.SAFE_CRYPTO={encryptFile:encryptFile,saveBlob:saveBlob};
})(window);
