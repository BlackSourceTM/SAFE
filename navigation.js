(function(w,d){
"use strict";
function qa(s){return d.querySelectorAll(s)}
function initNav(){
var items=qa(".nav-item"),secs=qa(".panel-section");
if(!items.length||!secs.length)return;
function act(k){
items.forEach(function(b){b.classList.toggle("nav-item--active",b.dataset.section===k)});
secs.forEach(function(s){s.classList.toggle("panel-section--active",s.id==="section-"+k)});
}
items.forEach(function(b){b.addEventListener("click",function(){act(b.dataset.section)})});
act("crypto");
}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",initNav);else initNav();
})(window,document);
