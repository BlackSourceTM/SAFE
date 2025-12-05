(function(w,d){
var SITEKEY="6LeHPiIsAAAAAMDYduGnHAheksdhXcMOFWvSdgLb";
var VERIFY_URL="https://verify-captcha.mr-rahimi-kiasari.workers.dev";
function q(s,c){return(c||d).querySelector(s)}
function ce(t,c){var e=d.createElement(t);if(c)e.className=c;return e}
function loadCaptcha(cb){
 if(w.grecaptcha&&w.grecaptcha.render){cb();return}
 var ex=d.querySelector("script[data-safe-recaptcha]");if(ex){(w.safeCaptchaReadyQueue||(w.safeCaptchaReadyQueue=[])).push(cb);return}
 w.safeCaptchaReadyQueue=[cb];
 var s=d.createElement("script");
 s.src="https://www.google.com/recaptcha/api.js?onload=SAFE_recaptchaReady&render=explicit";
 s.async=true;s.defer=true;s.setAttribute("data-safe-recaptcha","1");
 d.head.appendChild(s);
}
w.SAFE_recaptchaReady=function(){
 var ql=w.safeCaptchaReadyQueue||[],i;for(i=0;i<ql.length;i++)ql[i]();w.safeCaptchaReadyQueue=[];
};
function setInputState(el,state){
 el.classList.remove("safe-field__input--error","safe-field__input--ok");
 if(state==="error")el.classList.add("safe-field__input--error");
 if(state==="ok")el.classList.add("safe-field__input--ok");
}
function openDecrypt(){
 var root=q(".safe-modal-root");if(root&&root.parentNode)root.parentNode.removeChild(root);
 root=ce("div","safe-modal-root");
 var bd=ce("div","safe-modal-backdrop"),box=ce("div","safe-modal"),inner=ce("div","safe-modal__inner");
 box.appendChild(inner);root.appendChild(bd);root.appendChild(box);d.body.appendChild(root);bd.onclick=close;
 var h=ce("div","safe-modal__header"),ttl=ce("h3","safe-modal__title"),cls=ce("button","safe-modal__close");
 ttl.textContent="New decryption";cls.type="button";cls.textContent="×";cls.onclick=close;
 h.appendChild(ttl);h.appendChild(cls);inner.appendChild(h);
 var body=ce("div","safe-modal__body"),ftr=ce("div","safe-modal__footer");
 inner.appendChild(body);inner.appendChild(ftr);
 var fField=ce("div","safe-field"),fLab=ce("label","safe-field__label"),fInp=ce("input","safe-field__input");
 fLab.textContent="SAFE file";fInp.type="file";fInp.id="safe-dec-file";fInp.accept=".safe";
 fField.appendChild(fLab);fField.appendChild(fInp);body.appendChild(fField);
 var pField=ce("div","safe-field"),pLab=ce("label","safe-field__label"),pWrap=ce("div","safe-field__input-wrap"),pInp=ce("input","safe-field__input");
 pLab.textContent="Password";pInp.type="password";pInp.id="safe-dec-pwd";pInp.autocomplete="current-password";
 var btnEye=ce("button","safe-field__icon-btn safe-field__icon-btn--eye");
 btnEye.type="button";btnEye.innerHTML='<i class="material-icons">visibility</i>';
 pWrap.appendChild(pInp);pWrap.appendChild(btnEye);pField.appendChild(pLab);pField.appendChild(pWrap);body.appendChild(pField);
 var cField=ce("div","safe-field"),cLab=ce("label","safe-field__label"),cBox=ce("div","safe-captcha-box"),cContainer=ce("div","safe-captcha-container");
 cLab.textContent="Captcha";cContainer.id="safe-dec-captcha";cBox.appendChild(cContainer);cField.appendChild(cLab);cField.appendChild(cBox);body.appendChild(cField);
 var err=ce("div","safe-field__error");err.id="safe-dec-error";body.appendChild(err);
 var status=ce("div","safe-modal__status");status.id="safe-dec-status";status.textContent="Ready";body.appendChild(status);
 var btnCancel=ce("button","btn btn--ghost"),btnStart=ce("button","btn btn--primary");
 btnCancel.type="button";btnStart.type="button";btnCancel.textContent="Cancel";btnStart.textContent="Start";
 btnStart.disabled=true;ftr.appendChild(btnCancel);ftr.appendChild(btnStart);
 var widgetId=null,captchaOk=false,failCount=0;
 function updateStart(){
  var fileOk=fInp.files&&fInp.files[0]&&/\.safe$/i.test(fInp.files[0].name);
  var pwdOk=!!pInp.value;
  btnStart.disabled=!(fileOk&&pwdOk&&captchaOk);
  if(!fileOk&&fInp.files&&fInp.files[0]){setInputState(fInp,"error")}else{setInputState(fInp,"")}
 }
 function verifyToken(token){
  status.textContent="Verifying captcha...";
  fetch(VERIFY_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:token})})
   .then(function(r){return r.json?r.json():r})
   .then(function(res){
    if(res&&res.success){
     captchaOk=true;err.textContent="";status.textContent="Captcha verified.";updateStart()
    }else{
     captchaOk=false;failCount++;status.textContent="Captcha failed.";err.textContent="Captcha verification failed. Please try again.";
     if(w.grecaptcha&&widgetId!==null)w.grecaptcha.reset(widgetId);updateStart()
    }
   })
   .catch(function(){
    captchaOk=false;status.textContent="Network error.";err.textContent="Could not verify captcha. Check your connection.";if(w.grecaptcha&&widgetId!==null)w.grecaptcha.reset(widgetId);updateStart()
   });
 }
 function renderCaptcha(){
  if(!(w.grecaptcha&&w.grecaptcha.render)){status.textContent="Captcha could not load.";return}
  widgetId=w.grecaptcha.render("safe-dec-captcha",{sitekey:SITEKEY,callback:function(token){verifyToken(token)}});
 }
 function close(){
  if(root&&root.parentNode)root.parentNode.removeChild(root)
 }
 fInp.onchange=updateStart;
 pInp.oninput=function(){setInputState(pInp,pInp.value?"":"");updateStart()};
 btnEye.onclick=function(){
  if(pInp.type==="password"){pInp.type="text";btnEye.innerHTML='<i class="material-icons">visibility_off</i>'}
  else{pInp.type="password";btnEye.innerHTML='<i class="material-icons">visibility</i>'}
 };
 btnCancel.onclick=close;
 btnStart.onclick=function(){
  if(btnStart.disabled)return;
  var file=fInp.files&&fInp.files[0],pwd=pInp.value||"";
  if(!file||!pwd||!captchaOk)return;
  status.textContent="Starting...";
  if(w.dispatchEvent&&w.CustomEvent){
   var ev=new CustomEvent("safe:start-decryption",{detail:{file:file,password:pwd}});
   w.dispatchEvent(ev)
  }
  close()
 };
 loadCaptcha(renderCaptcha);
 root.classList.add("safe-modal-root--visible");
}
function bind(){
 var b=q("#btn-decrypt-new");if(!b)return;
 var clone=b.cloneNode(true);clone.id=b.id;b.parentNode.replaceChild(clone,b);
 clone.addEventListener("click",openDecrypt)
}
function onReady(){bind()}
 if(d.readyState==="complete"||d.readyState==="interactive")setTimeout(onReady,0);else w.addEventListener("load",onReady,{once:true})
})(window,document);
