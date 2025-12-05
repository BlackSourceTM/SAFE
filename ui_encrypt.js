// ui_encrypt.js
(function(){
function q(s,c){return(c||document).querySelector(s)}
function qa(s,c){return(c||document).querySelectorAll(s)}
function cEl(t,cls){var e=document.createElement(t);if(cls)e.className=cls;return e}
function setupEntryButton(){
var btn=q('#section-crypto .panel-card:first-of-type .option-item');if(!btn)return;
btn.addEventListener('click',openEncryptFlow,{once:true});btn.addEventListener('click',function(){openEncryptFlow()})
}
function openEncryptFlow(){
if(q('.encrypt-flow'))return;
var o=cEl('div','encrypt-flow'),backdrop=cEl('div','encrypt-flow__backdrop'),card=cEl('div','encrypt-flow__card');
o.appendChild(backdrop);o.appendChild(card);
var h=cEl('div','encrypt-flow__header');h.textContent='New encryption';card.appendChild(h);
var body=cEl('div','encrypt-flow__body');card.appendChild(body);
var step1=cEl('div','encrypt-step encrypt-step--active');step1.dataset.step='1';
var fGroup=cEl('div','ef-field');var fLabel=cEl('label','ef-label');fLabel.textContent='Select file';fGroup.appendChild(fLabel);
var fDrop=cEl('div','ef-drop');fDrop.tabIndex=0;fDrop.innerHTML='<div class="ef-drop__icon">📁</div><div class="ef-drop__text">Click to choose a file or drop it here.</div><div class="ef-drop__file" id="encFileName">No file selected.</div>';
var fInput=cEl('input','ef-drop__input');fInput.type='file';fInput.style.display='none';fDrop.appendChild(fInput);fGroup.appendChild(fDrop);step1.appendChild(fGroup);
var pwdGroup=cEl('div','ef-field');var pLabel=cEl('label','ef-label');pLabel.textContent='Master password';pwdGroup.appendChild(pLabel);
var pWrap=cEl('div','ef-input-wrap');var pInput=cEl('input','ef-input');pInput.type='password';pInput.autocomplete='new-password';pInput.id='encPassword';pWrap.appendChild(pInput);
var genBtn=cEl('button','ef-icon-btn ef-icon-btn--magic');genBtn.type='button';genBtn.innerHTML='✨';pWrap.appendChild(genBtn);
var eyeBtn=cEl('button','ef-icon-btn ef-icon-btn--eye');eyeBtn.type='button';eyeBtn.innerHTML='👁️';pWrap.appendChild(eyeBtn);
pwdGroup.appendChild(pWrap);
var rules=cEl('ul','ef-rules');rules.innerHTML='<li data-rule="len">At least 8 characters</li><li data-rule="digit">At least one digit</li><li data-rule="case">Lower and upper case letters</li><li data-rule="special">At least one special character</li><li data-rule="latin">Only English letters and numbers</li>';pwdGroup.appendChild(rules);
var meterWrap=cEl('div','ef-meter');var meterBar=cEl('div','ef-meter__bar');meterBar.id='encPwdMeter';meterWrap.appendChild(meterBar);pwdGroup.appendChild(meterWrap);
step1.appendChild(pwdGroup);
var step1Actions=cEl('div','ef-actions');var nextBtn=cEl('button','btn btn--primary ef-btn-next');nextBtn.type='button';nextBtn.disabled=true;nextBtn.textContent='Next';step1Actions.appendChild(nextBtn);step1.appendChild(step1Actions);
body.appendChild(step1);
var step2=cEl('div','encrypt-step');step2.dataset.step='2';
var p2Group=cEl('div','ef-field');var p2Label=cEl('label','ef-label');p2Label.textContent='Confirm password';p2Group.appendChild(p2Label);
var p2Wrap=cEl('div','ef-input-wrap');var pReadonly=cEl('input','ef-input ef-input--readonly');pReadonly.type='text';pReadonly.readOnly=true;pReadonly.id='encPasswordReadonly';p2Wrap.appendChild(pReadonly);
var p2EyeHold=cEl('button','ef-icon-btn ef-icon-btn--eyehold');p2EyeHold.type='button';p2EyeHold.innerHTML='👁️';p2Wrap.appendChild(p2EyeHold);p2Group.appendChild(p2Wrap);
var p2ConfirmGroup=cEl('div','ef-field ef-field--confirm');var p2ConfirmLabel=cEl('label','ef-label');p2ConfirmLabel.textContent='Repeat password';p2ConfirmGroup.appendChild(p2ConfirmLabel);
var p2ConfirmWrap=cEl('div','ef-input-wrap');var p2Confirm=cEl('input','ef-input');p2Confirm.type='password';p2Confirm.autocomplete='new-password';p2Confirm.id='encPasswordConfirm';p2ConfirmWrap.appendChild(p2Confirm);p2ConfirmGroup.appendChild(p2ConfirmWrap);
var p2Hint=cEl('div','ef-hint');p2Hint.id='encConfirmHint';p2Hint.textContent='Passwords must match exactly.';p2Group.appendChild(p2ConfirmGroup);p2Group.appendChild(p2Hint);
step2.appendChild(p2Group);
var step2Actions=cEl('div','ef-actions');var backBtn=cEl('button','btn btn--ghost ef-btn-back');backBtn.type='button';backBtn.textContent='Back';var startBtn=cEl('button','btn btn--primary ef-btn-start');startBtn.type='button';startBtn.disabled=true;startBtn.textContent='Start';step2Actions.appendChild(backBtn);step2Actions.appendChild(startBtn);step2.appendChild(step2Actions);
body.appendChild(step2);
document.body.appendChild(o);
function updateFileName(){
var n='No file selected.';if(fInput.files&&fInput.files[0])n=fInput.files[0].name;q('#encFileName',o).textContent=n;validateStep1()
}
function genPassword(){
var chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[];:,.<>?';var r='';for(var i=0;i<16;i++)r+=chars[Math.floor(Math.random()*chars.length)];pInput.value=r;updateStrength()
}
function toggleEye(){
if(pInput.type==='password'){pInput.type='text';eyeBtn.classList.add('is-on')}else{pInput.type='password';eyeBtn.classList.remove('is-on')}
}
function strength(p){
var s=p||'';if(!s.length)return{score:0,active:[]};
var rulesArr=[],score=0;
if(s.length>=8){rulesArr.push('len');score++}
if(/[0-9]/.test(s)){rulesArr.push('digit');score++}
if(/[a-z]/.test(s)&&/[A-Z]/.test(s)){rulesArr.push('case');score++}
if(/[^A-Za-z0-9]/.test(s)){rulesArr.push('special');score++}
if(/^[\x20-\x7E]+$/.test(s)){rulesArr.push('latin')}else{rulesArr=rulesArr.filter(function(x){return x!=='latin'})}
if(s.length>=12&&score<4)score++;
if(score>4)score=4;
return{score:score,active:rulesArr}
}
function updateStrength(){
var v=pInput.value;var st=strength(v);var lis=qa('.ef-rules li',o);lis.forEach(function(li){var r=li.getAttribute('data-rule');if(st.active.indexOf(r)!==-1)li.classList.add('ok');else li.classList.remove('ok')});
var bar=meterBar;if(!v){bar.style.width='0%';bar.style.background='transparent';validateStep1();return}
var pct=['20%','40%','60%','80%','100%'][st.score];var col=['#ff4b4b','#ff8a3c','#ffd84a','#3ed86b','#21e3e3'][st.score];bar.style.width=pct;bar.style.background=col;validateStep1()
}
function validateStep1(){
var hasFile=fInput.files&&fInput.files[0];var v=pInput.value;var st=strength(v);var ok=hasFile&&st.score>=3&&st.active.indexOf('latin')!==-1;if(ok)nextBtn.disabled=false;else nextBtn.disabled=true
}
function goStep2(){
step1.classList.remove('encrypt-step--active');step2.classList.add('encrypt-step--active');
rules.style.display='none';meterWrap.style.display='none';genBtn.style.display='none';eyeBtn.style.display='none';pInput.type='text';pReadonly.value=pInput.value;validateStep2()
}
function goStep1(){
step2.classList.remove('encrypt-step--active');step1.classList.add('encrypt-step--active');
rules.style.display='';meterWrap.style.display='';genBtn.style.display='';eyeBtn.style.display='';pInput.type='password';validateStep1()
}
function validateStep2(){
var v=p2Confirm.value;var base=pInput.value;var wrap=p2ConfirmWrap;var ok=v&&v===base;if(ok){wrap.classList.remove('ef-input-wrap--error');wrap.classList.add('ef-input-wrap--ok');p2Hint.textContent='Passwords match.';startBtn.disabled=false}else{wrap.classList.add('ef-input-wrap--error');wrap.classList.remove('ef-input-wrap--ok');p2Hint.textContent='Passwords do not match.';startBtn.disabled=true}
}
function openTermsDialog(){
var m=cEl('div','ef-modal'),box=cEl('div','ef-modal__box');m.appendChild(box);var t=cEl('div','ef-modal__title');t.textContent='Terms of use';box.appendChild(t);var txt=cEl('div','ef-modal__body');txt.textContent='By pressing OK you confirm that you have read and accepted the SAFE bot rules and terms of use.';box.appendChild(txt);var actions=cEl('div','ef-modal__actions');var okBtn=cEl('button','btn btn--primary');okBtn.type='button';okBtn.textContent='OK';var termsBtn=cEl('button','btn btn--ghost');termsBtn.type='button';termsBtn.textContent='Terms of use';actions.appendChild(termsBtn);actions.appendChild(okBtn);box.appendChild(actions);document.body.appendChild(m);
okBtn.addEventListener('click',function(){document.body.removeChild(m);fakeStart()});
termsBtn.addEventListener('click',function(){document.body.removeChild(m);openSupportSection()})
}
function fakeStart(){
console.log('Encryption start placeholder');if(window.Telegram&&Telegram.WebApp)Telegram.WebApp.HapticFeedback&&Telegram.WebApp.HapticFeedback.impactOccurred&&Telegram.WebApp.HapticFeedback.impactOccurred('medium')
}
function openSupportSection(){
var btn=q('.nav button[data-section="support"]');if(btn)btn.click()
}
fDrop.addEventListener('click',function(){fInput.click()});
fDrop.addEventListener('dragover',function(e){e.preventDefault();fDrop.classList.add('ef-drop--hover')});
fDrop.addEventListener('dragleave',function(e){e.preventDefault();fDrop.classList.remove('ef-drop--hover')});
fDrop.addEventListener('drop',function(e){e.preventDefault();fDrop.classList.remove('ef-drop--hover');if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]){fInput.files=e.dataTransfer.files;updateFileName()}});
fInput.addEventListener('change',updateFileName);
genBtn.addEventListener('click',genPassword);
eyeBtn.addEventListener('click',toggleEye);
pInput.addEventListener('input',updateStrength);
nextBtn.addEventListener('click',goStep2);
backBtn.addEventListener('click',goStep1);
p2Confirm.addEventListener('input',validateStep2);
p2EyeHold.addEventListener('mousedown',function(){p2Confirm.type='text'});
p2EyeHold.addEventListener('mouseup',function(){p2Confirm.type='password'});
p2EyeHold.addEventListener('mouseleave',function(){p2Confirm.type='password'});
p2EyeHold.addEventListener('touchstart',function(e){e.preventDefault();p2Confirm.type='text'},{passive:false});
p2EyeHold.addEventListener('touchend',function(){p2Confirm.type='password'});
startBtn.addEventListener('click',openTermsDialog);
backdrop.addEventListener('click',function(){document.body.removeChild(o)})
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupEntryButton);else setupEntryButton()
})();
