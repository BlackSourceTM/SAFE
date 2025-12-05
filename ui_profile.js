// ui_profile.js
(function(){
function qs(s,r){return(r||document).querySelector(s)}
function getUserModel(){
try{
if(window.Telegram&&Telegram.WebApp&&Telegram.WebApp.initDataUnsafe&&Telegram.WebApp.initDataUnsafe.user){
var u=Telegram.WebApp.initDataUnsafe.user
var username=u.username||(u.first_name||"user")
return{username:username,userId:u.id||0}
}
}catch(e){}
return{username:"demo_user",userId:22130261}
}
function ensureModalRoot(){
var root=qs(".safe-modal-root")
if(!root){
root=document.createElement("div")
root.className="safe-modal-root"
root.innerHTML='<div class="safe-modal-backdrop"></div><div class="safe-modal"><div class="safe-modal__inner"><header class="safe-modal__header"><h2 class="safe-modal__title"></h2><button type="button" class="safe-modal__close">✕</button></header><div class="safe-modal__body"></div><footer class="safe-modal__footer"></footer></div></div>'
document.body.appendChild(root)
}
return root
}
function showModal(){ensureModalRoot().classList.add("safe-modal-root--visible")}
function hideModal(){var r=qs(".safe-modal-root");if(r)r.classList.remove("safe-modal-root--visible")}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function renderStep1(user){
var root=ensureModalRoot(),titleEl=qs(".safe-modal__title",root),bodyEl=qs(".safe-modal__body",root),footerEl=qs(".safe-modal__footer",root),closeBtn=qs(".safe-modal__close",root),backdrop=qs(".safe-modal-backdrop",root)
titleEl.textContent="Delete SAFE account – step 1 of 3"
bodyEl.innerHTML=""
var p1=document.createElement("p");p1.textContent="Deleting your SAFE account is a permanent action. It will remove your SAFE metadata, coins and usage history in the final version."
var p2=document.createElement("p");p2.textContent="If you only want to stop using SAFE for a while, you can simply disable or remove the bot from Telegram settings instead of deleting the account here."
var p3=document.createElement("p");p3.textContent="Do you still want to delete your SAFE account?"
bodyEl.appendChild(p1);bodyEl.appendChild(p2);bodyEl.appendChild(p3)
footerEl.innerHTML=""
var buttons=[
{label:"Yes",variant:"btn--danger",action:"yes1"},
{label:"No",variant:"btn--ghost",action:"no"},
{label:"Not sure",variant:"btn--ghost",action:"unsure"},
{label:"Cancel",variant:"btn--ghost",action:"cancel"}
]
shuffle(buttons).forEach(function(cfg){
var b=document.createElement("button")
b.type="button"
b.className="btn "+cfg.variant+" btn--sm"
b.textContent=cfg.label
b.addEventListener("click",function(){
if(cfg.action==="yes1"){renderStep2(user);return}
hideModal()
})
footerEl.appendChild(b)
})
closeBtn.onclick=hideModal
backdrop.onclick=hideModal
showModal()
}
function renderStep2(user){
var root=ensureModalRoot(),titleEl=qs(".safe-modal__title",root),bodyEl=qs(".safe-modal__body",root),footerEl=qs(".safe-modal__footer",root),closeBtn=qs(".safe-modal__close",root),backdrop=qs(".safe-modal-backdrop",root)
titleEl.textContent="Delete SAFE account – step 2 of 3"
bodyEl.innerHTML=""
var p1=document.createElement("p");p1.textContent="Are you sure you want to delete your SAFE account?"
var p2=document.createElement("p");p2.textContent="This confirmation is required to avoid accidental deletions."
bodyEl.appendChild(p1);bodyEl.appendChild(p2)
footerEl.innerHTML=""
var buttons=[
{label:"Yes, I am absolutely sure",variant:"btn--danger",action:"yes2"},
{label:"No",variant:"btn--ghost",action:"no"},
{label:"Yes",variant:"btn--ghost",action:"softyes"},
{label:"I don't know",variant:"btn--ghost",action:"unsure"}
]
shuffle(buttons).forEach(function(cfg){
var b=document.createElement("button")
b.type="button"
b.className="btn "+cfg.variant+" btn--sm"
b.textContent=cfg.label
b.addEventListener("click",function(){
if(cfg.action==="yes2"){renderStep3(user);return}
hideModal()
})
footerEl.appendChild(b)
})
closeBtn.onclick=hideModal
backdrop.onclick=hideModal
showModal()
}
function renderStep3(user){
var root=ensureModalRoot(),titleEl=qs(".safe-modal__title",root),bodyEl=qs(".safe-modal__body",root),footerEl=qs(".safe-modal__footer",root),closeBtn=qs(".safe-modal__close",root),backdrop=qs(".safe-modal-backdrop",root)
var idStr=String(user.userId||"00000000")
titleEl.textContent="Delete SAFE account – step 3 of 3"
bodyEl.innerHTML=""
var p1=document.createElement("p");p1.textContent="To confirm the deletion, please type the following line exactly as shown:"
var p2=document.createElement("p");p2.textContent='DELETE '+idStr
var p3=document.createElement("p");p3.textContent="In the final SAFE release, this will send a signed request to the backend to remove your account metadata and close the chat."
var field=document.createElement("div");field.className="safe-field"
var label=document.createElement("label");label.className="safe-field__label";label.textContent="Confirmation phrase"
var input=document.createElement("input");input.type="text";input.className="safe-field__input";input.autocomplete="off";input.id="safe-delete-confirm-input"
var err=document.createElement("div");err.className="safe-field__error";err.id="safe-delete-confirm-error";err.textContent=""
field.appendChild(label);field.appendChild(input)
bodyEl.appendChild(p1);bodyEl.appendChild(p2);bodyEl.appendChild(p3);bodyEl.appendChild(field);bodyEl.appendChild(err)
footerEl.innerHTML=""
var btnBack=document.createElement("button");btnBack.type="button";btnBack.className="btn btn--ghost btn--sm";btnBack.textContent="Back"
var btnConfirm=document.createElement("button");btnConfirm.type="button";btnConfirm.className="btn btn--danger btn--sm";btnConfirm.textContent="Confirm deletion";btnConfirm.disabled=true
footerEl.appendChild(btnBack);footerEl.appendChild(btnConfirm)
function updateState(){
var v=(input.value||"").trim()
var expected="DELETE "+idStr
if(v===expected){
err.textContent=""
input.classList.remove("safe-field__input--error")
input.classList.add("safe-field__input--ok")
btnConfirm.disabled=false
}else{
if(v.length>0){
err.textContent='Please type: "'+expected+'".'
input.classList.add("safe-field__input--error")
input.classList.remove("safe-field__input--ok")
}else{
err.textContent=""
input.classList.remove("safe-field__input--error","safe-field__input--ok")
}
btnConfirm.disabled=true
}
}
input.addEventListener("input",updateState)
closeBtn.onclick=hideModal
backdrop.onclick=hideModal
btnBack.onclick=function(){renderStep2(user)}
btnConfirm.onclick=function(){
try{
var ev=new CustomEvent("safe:request-account-deletion",{detail:{username:user.username,userId:user.userId,phrase:input.value}})
window.dispatchEvent(ev)
}catch(e){}
console.log("SAFE delete account requested (frontend only):",user)
renderStepFinal(user)
}
showModal()
}
function renderStepFinal(user){
var root=ensureModalRoot(),titleEl=qs(".safe-modal__title",root),bodyEl=qs(".safe-modal__body",root),footerEl=qs(".safe-modal__footer",root),closeBtn=qs(".safe-modal__close",root),backdrop=qs(".safe-modal-backdrop",root)
titleEl.textContent="Delete request registered"
bodyEl.innerHTML=""
var p1=document.createElement("p");p1.textContent="Your delete request has been confirmed on this device."
var p2=document.createElement("p");p2.textContent="In the full SAFE backend, this step would send the request to remove your account metadata and close the chat with the bot."
var p3=document.createElement("p");p3.textContent="You can now close this window. Until the deletion is processed, you may still access SAFE.";
bodyEl.appendChild(p1);bodyEl.appendChild(p2);bodyEl.appendChild(p3)
footerEl.innerHTML=""
var btnClose=document.createElement("button");btnClose.type="button";btnClose.className="btn btn--primary btn--sm";btnClose.textContent="Close"
footerEl.appendChild(btnClose)
function done(){hideModal()}
closeBtn.onclick=done
backdrop.onclick=done
btnClose.onclick=done
showModal()
}
function initDeleteAccountFlow(){
var user=getUserModel()
var btn=qs("#section-profile .option-item--danger")
if(!btn)return
var clone=btn.cloneNode(true)
btn.parentNode.replaceChild(clone,btn)
clone.addEventListener("click",function(){renderStep1(user)})
}
document.addEventListener("DOMContentLoaded",function(){initDeleteAccountFlow()})
})();
