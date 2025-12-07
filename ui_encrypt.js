(function(w,d){
function q(s,c){return(c||d).querySelector(s)}
function ce(t,c){var e=d.createElement(t);if(c)e.className=c;return e}
function strength(p){
var s=p||"",r={len:s.length>=8,digit:/\d/.test(s),case:/[a-z]/.test(s)&&/[A-Z]/.test(s),special:/[^A-Za-z0-9]/.test(s),latin:/^[\x20-\x7E]*$/.test(s)},score=0;
if(r.len)score++;if(r.digit)score++;if(r.case)score++;if(r.special)score++;if(s.length>=12)score++;
var lvl=0;if(score>=1)lvl=1;if(score>=2)lvl=2;if(score>=3)lvl=3;if(score>=4)lvl=4;if(score>=5)lvl=5;
return{rules:r,level:lvl}
}
function updateRules(list,res){
var items=list.querySelectorAll("li"),i;
for(i=0;i<items.length;i++){
var el=items[i],k=el.getAttribute("data-rule"),base=el.getAttribute("data-label")||el.textContent.replace(/^✔\s*/,"");
if(!el.getAttribute("data-label"))el.setAttribute("data-label",base);
if(res.rules[k]){el.textContent="✔ "+base;el.classList.add("ok")}else{el.textContent=base;el.classList.remove("ok")}
}
}
function updateMeter(bar,lvl){
var w=[0,20,40,60,80,100],c=["transparent","#ef4444","#f97316","#eab308","#22c55e","#06b6d4"];
bar.style.width=w[lvl]+"%";
bar.style.background=c[lvl]||c[0]
}
function openEncrypt(){
var root=q(".safe-modal-root");if(root&&root.parentNode)root.parentNode.removeChild(root);
root=ce("div","safe-modal-root");
var bd=ce("div","safe-modal-backdrop"),box=ce("div","safe-modal"),inner=ce("div","safe-modal__inner");
box.appendChild(inner);root.appendChild(bd);root.appendChild(box);d.body.appendChild(root);bd.onclick=close;
var h=ce("div","safe-modal__header"),ttl=ce("h3","safe-modal__title"),cls=ce("button","safe-modal__close");
ttl.textContent="New encryption";cls.type="button";cls.textContent="×";cls.onclick=close;h.appendChild(ttl);h.appendChild(cls);inner.appendChild(h);
var body=ce("div","safe-modal__body"),ftr=ce("div","safe-modal__footer");inner.appendChild(body);inner.appendChild(ftr);

var fField=ce("div","safe-field"),fLab=ce("label","safe-field__label"),fInp=ce("input","safe-field__input");
fLab.textContent="File";fInp.type="file";fInp.id="safe-enc-file";fField.appendChild(fLab);fField.appendChild(fInp);body.appendChild(fField);

var pField=ce("div","safe-field"),pLab=ce("label","safe-field__label"),pWrap=ce("div","safe-field__input-wrap"),pInp=ce("input","safe-field__input");
pLab.textContent="Password";pInp.type="password";pInp.id="safe-enc-pwd";pInp.autocomplete="new-password";
var btnGen=ce("button","safe-field__icon-btn safe-field__icon-btn--gen");btnGen.type="button";btnGen.innerHTML='<i class="material-icons">auto_fix_high</i>';
var btnEye=ce("button","safe-field__icon-btn safe-field__icon-btn--eye");btnEye.type="button";btnEye.innerHTML='<i class="material-icons">visibility</i>';
pWrap.appendChild(pInp);pWrap.appendChild(btnGen);pWrap.appendChild(btnEye);pField.appendChild(pLab);pField.appendChild(pWrap);body.appendChild(pField);

var rules=ce("ul","safe-password-rules");
rules.innerHTML='<li data-rule="len">At least 8 characters</li><li data-rule="digit">At least one digit</li><li data-rule="case">Lower + upper case letters</li><li data-rule="special">At least one special character</li><li data-rule="latin">Only English letters and digits</li>';
body.appendChild(rules);

var meterWrap=ce("div","safe-progress"),meter=ce("div","safe-progress__bar");meterWrap.appendChild(meter);body.appendChild(meterWrap);

var cBlock=ce("div","safe-field");cBlock.style.display="none";
var cLab=ce("label","safe-field__label"),cWrap=ce("div","safe-field__input-wrap"),cInp=ce("input","safe-field__input");
cLab.textContent="Repeat password";cInp.type="password";cInp.id="safe-enc-pwd2";cInp.autocomplete="new-password";
var cEye=ce("button","safe-field__icon-btn safe-field__icon-btn--eyehold");cEye.type="button";cEye.innerHTML='<i class="material-icons">visibility</i>';
cWrap.appendChild(cInp);cWrap.appendChild(cEye);cBlock.appendChild(cLab);cBlock.appendChild(cWrap);
var cErr=ce("div","safe-field__error");cErr.id="safe-enc-match";cBlock.appendChild(cErr);body.appendChild(cBlock);

var err=ce("div","safe-field__error");err.id="safe-enc-error";body.appendChild(err);

var status=ce("div","safe-modal__status");status.id="safe-enc-status";status.textContent="Ready";body.appendChild(status);

var btnCancel=ce("button","btn btn--ghost"),btnBack=ce("button","btn btn--ghost"),btnNext=ce("button","btn btn--primary"),btnStart=ce("button","btn btn--primary");
btnCancel.type="button";btnBack.type="button";btnNext.type="button";btnStart.type="button";
btnCancel.textContent="Cancel";btnBack.textContent="Back";btnNext.textContent="Next";btnStart.textContent="Start";
btnBack.style.display="none";btnStart.style.display="none";btnNext.disabled=true;btnStart.disabled=true;
ftr.appendChild(btnCancel);ftr.appendChild(btnBack);ftr.appendChild(btnNext);ftr.appendChild(btnStart);

function setInputState(el,state){
el.classList.remove("safe-field__input--error","safe-field__input--ok");
if(state==="error")el.classList.add("safe-field__input--error");
if(state==="ok")el.classList.add("safe-field__input--ok")
}
function evalStep1(){
var fileOk=fInp.files&&fInp.files[0],pwd=pInp.value||"",res=strength(pwd);
updateRules(rules,res);updateMeter(meter,res.level);if(!pwd)updateMeter(meter,0);
btnNext.disabled=!(fileOk&&res.level>=4&&res.rules.latin)
}
function evalStep2(){
var a=pInp.value||"",b=cInp.value||"";
if(!b){setInputState(cInp,"");cErr.textContent="";btnStart.disabled=true;return}
if(a===b){setInputState(cInp,"ok");cErr.textContent="";btnStart.disabled=false}
else{setInputState(cInp,"error");cErr.textContent="Passwords do not match.";btnStart.disabled=true}
}
function step1(){
cBlock.style.display="none";rules.style.display="block";meterWrap.style.display="block";
btnBack.style.display="none";btnNext.style.display="inline-flex";btnStart.style.display="none";btnStart.disabled=true;
pInp.readOnly=false;btnGen.style.display="inline-flex";btnEye.style.display="inline-flex";evalStep1()
}
function step2(){
cBlock.style.display="block";rules.style.display="none";meterWrap.style.display="none";
btnBack.style.display="inline-flex";btnNext.style.display="none";btnStart.style.display="inline-flex";btnStart.disabled=true;
pInp.readOnly=true;btnGen.style.display="none";btnEye.style.display="none";cInp.value="";setInputState(cInp,"");cErr.textContent=""
}
function showTerms(){
var old=q(".safe-popup-backdrop");if(old&&old.parentNode)old.parentNode.removeChild(old);
var bg=ce("div","safe-popup-backdrop"),pop=ce("div","safe-popup"),t=ce("div","safe-popup__title"),txt=ce("div","safe-popup__text"),acts=ce("div","safe-popup__actions"),bTerms=ce("button","btn btn--ghost btn--sm"),bOk=ce("button","btn btn--primary btn--sm");
t.textContent="SAFE – terms of use";txt.textContent="By starting encryption you confirm that you have read and accepted the SAFE rules and terms of use.";
bTerms.type="button";bOk.type="button";bTerms.textContent="Terms of use";bOk.textContent="OK";
acts.appendChild(bTerms);acts.appendChild(bOk);pop.appendChild(t);pop.appendChild(txt);pop.appendChild(acts);bg.appendChild(pop);d.body.appendChild(bg);
bOk.onclick=function(){if(bg.parentNode)bg.parentNode.removeChild(bg);startReal()};
bTerms.onclick=function(){if(bg.parentNode)bg.parentNode.removeChild(bg);close();var nav=q('.nav-item[data-section="support"]');if(nav)nav.click()}
}
function startReal(){
var file=fInp.files&&fInp.files[0],pwd=pInp.value||"";
if(!file||!pwd)return;
err.textContent="";
status.textContent="Checking your SAFE account...";
var tg=w.Telegram&&w.Telegram.WebApp&&w.Telegram.WebApp.initDataUnsafe&&w.Telegram.WebApp.initDataUnsafe.user?w.Telegram.WebApp.initDataUnsafe.user:null;
if(!tg||!tg.id){
var msg1="Cannot detect Telegram WebApp user. Please open SAFE from the official bot.";
status.textContent="Cannot detect account.";
if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg1,"error");else if(w.alert)alert(msg1);
return
}
var uid=tg.id;
function maskKey(p){p=p||"";if(p.length<=4)return p;return p.slice(0,2)+"****"+p.slice(-2)}
var payload={user_id:uid,file_name:file.name,file_size_bytes:file.size,mime_type:file.type||"",password_mask:maskKey(pwd)};
fetch("https://safe-bot-worker.alirahimikiasari.workers.dev/api/encrypt/precheck",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify(payload)
}).then(function(res){return res.json().catch(function(){return null})}).then(function(data){
if(!data||!data.ok){
var msg2=(data&&data.message)||"Check failed";
status.textContent=msg2;
if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg2,"error");
return
}
status.textContent="Account OK. Starting encryption...";
if(w.dispatchEvent&&w.CustomEvent){
var ev=new CustomEvent("safe:start-encryption",{detail:{file:file,password:pwd,meta:data}});
w.dispatchEvent(ev)
}
close()
}).catch(function(){
var msg3="Cannot contact SAFE backend. Please try again.";
status.textContent=msg3;
if(w.SAFE_UI_CORE&&w.SAFE_UI_CORE.showToast)w.SAFE_UI_CORE.showToast(msg3,"error")
})
}
function close(){var r=q(".safe-modal-root");if(r&&r.parentNode)r.parentNode.removeChild(r)}
fInp.onchange=evalStep1;pInp.oninput=evalStep1;
btnGen.onclick=function(){
var c="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{}",out="",i;
for(i=0;i<16;i++)out+=c.charAt(Math.floor(Math.random()*c.length));
pInp.value=out;evalStep1()
};
btnEye.onclick=function(){
if(pInp.type==="password"){pInp.type="text";btnEye.innerHTML='<i class="material-icons">visibility_off</i>'}
else{pInp.type="password";btnEye.innerHTML='<i class="material-icons">visibility</i>'}
};
cInp.oninput=evalStep2;
cEye.onmousedown=function(e){e.preventDefault();cInp.type="text"};
cEye.onmouseup=function(){cInp.type="password"};
cEye.onmouseleave=function(){cInp.type="password"};
cEye.ontouchstart=function(e){e.preventDefault();cInp.type="text"};
cEye.ontouchend=function(){cInp.type="password"};
btnCancel.onclick=close;
btnBack.onclick=function(){step1()};
btnNext.onclick=function(){if(!btnNext.disabled)step2()};
btnStart.onclick=function(){if(!btnStart.disabled)showTerms()};
evalStep1();root.classList.add("safe-modal-root--visible")
}
function bind(){
var b=q("#btn-encrypt-new");if(!b)return;
var clone=b.cloneNode(true);clone.id=b.id;b.parentNode.replaceChild(clone,b);
clone.addEventListener("click",openEncrypt)
}
function onReady(){bind()}
if(d.readyState==="complete"||d.readyState==="interactive")setTimeout(onReady,0);
else w.addEventListener("load",onReady,{once:true})
})(window,document);
