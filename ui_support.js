(function(w,d){
function q(s,c){return(c||d).querySelector(s)}
function ce(t,c){var e=d.createElement(t);if(c)e.className=c;return e}
function openRules(){
var old=q(".safe-rules-backdrop");if(old&&old.parentNode)old.parentNode.removeChild(old);
var bg=ce("div","safe-rules-backdrop"),box=ce("div","safe-rules"),head=ce("div","safe-rules__header"),title=ce("div","safe-rules__title"),close=ce("button","safe-rules__close"),body=ce("div","safe-rules__body"),pre=ce("pre","safe-rules__text"),foot=ce("div","safe-rules__footer"),btn=ce("button","btn btn--primary btn--sm");
title.textContent="SAFE – rules & terms";close.type="button";close.textContent="×";close.onclick=function(){if(bg.parentNode)bg.parentNode.removeChild(bg)};
head.appendChild(title);head.appendChild(close);
pre.textContent="Loading SAFE rules…";body.appendChild(pre);
btn.type="button";btn.textContent="Close";btn.onclick=function(){if(bg.parentNode)bg.parentNode.removeChild(bg)};
foot.appendChild(btn);
box.appendChild(head);box.appendChild(body);box.appendChild(foot);
bg.appendChild(box);d.body.appendChild(bg);
fetch("rules_en.txt",{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("http_error");return r.text()}).then(function(t){pre.textContent=t}).catch(function(){pre.textContent="Could not load SAFE rules. Please try again later.";});
}
function bind(){
var triggers=d.querySelectorAll('[data-open="support-rules"]'),i;if(!triggers.length)return;
for(i=0;i<triggers.length;i++){(function(el){var clone=el.cloneNode(true);clone.setAttribute("data-open","support-rules");el.parentNode.replaceChild(clone,el);clone.addEventListener("click",openRules)})(triggers[i]);}
}
function onReady(){bind()}
if(d.readyState==="complete"||d.readyState==="interactive")setTimeout(onReady,0);else w.addEventListener("load",onReady,{once:true})
})(window,document);
