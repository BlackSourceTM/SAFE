(function(w,d){
function initNav(){
  var items=Array.from(d.querySelectorAll(".nav-item"));
  var sections=Array.from(d.querySelectorAll(".panel-section"));
  if(!items.length||!sections.length)return;
  function activate(key){
    items.forEach(function(b){
      var active=b.getAttribute("data-section")===key;
      b.classList.toggle("nav-item--active",active);
    });
    sections.forEach(function(s){
      var id="section-"+key;
      s.classList.toggle("panel-section--active",s.id===id);
    });
  }
  items.forEach(function(b){
    b.addEventListener("click",function(){
      var key=this.getAttribute("data-section");
      if(key)activate(key);
    });
  });
  activate("crypto");
}
function init(){initNav()}
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init);else init();
})(window,document);
