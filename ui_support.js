(function(w,d){
function q(s,c){return(c||d).querySelector(s)}
function loadText(target,path,fallback){
 if(!target)return;
 target.textContent="Loading…";
 fetch(path,{cache:"no-store"}).then(function(r){
  if(!r.ok)throw new Error("http");
  return r.text();
 }).then(function(t){
  target.textContent=t;
 }).catch(function(){
  target.textContent=fallback||"Could not load this text. Please try again later.";
 });
}
function openChat(){
 var url="https://t.me/E2Ebox";
 try{
  if(w.Telegram&&Telegram.WebApp&&Telegram.WebApp.openTelegramLink){
   Telegram.WebApp.openTelegramLink(url);
   return;
  }
 }catch(e){}
 w.open(url,"_blank");
}
function bind(){
 var box=q("#support-rules-text");
 if(box)loadText(box,"texts/rules_en.txt","No rules file found. Please contact support.");
 var btnChat=q('[data-support="chat"]');
 if(btnChat){
  var c=btnChat.cloneNode(true);
  btnChat.parentNode.replaceChild(c,btnChat);
  c.addEventListener("click",openChat);
 }
 var btnFaq=q('[data-support="faq"]');
 if(btnFaq){
  var f=btnFaq.cloneNode(true);
  btnFaq.parentNode.replaceChild(f,btnFaq);
  f.addEventListener("click",function(){
   loadText(box,"texts/faq_en.txt","FAQ is not available yet.");
  });
 }
}
function onReady(){bind()}
if(d.readyState==="complete"||d.readyState==="interactive")setTimeout(onReady,0);
else w.addEventListener("load",onReady,{once:true});
})(window,document);
