(function(w,d){
"use strict";
var sheetRoot=null,bodyEl,titleEl,closeBtn;
function ensureSheet(){
if(sheetRoot)return sheetRoot;
sheetRoot=d.createElement("div");
sheetRoot.className="safe-sheet-root";
sheetRoot.innerHTML="<div class=\"safe-sheet-backdrop\"></div><div class=\"safe-sheet\"><div class=\"safe-sheet-header\"><div class=\"safe-sheet-title\"></div><button class=\"safe-sheet-close\">×</button></div><div class=\"safe-sheet-body\"></div></div>";
d.body.appendChild(sheetRoot);
bodyEl=sheetRoot.querySelector(".safe-sheet-body");
titleEl=sheetRoot.querySelector(".safe-sheet-title");
closeBtn=sheetRoot.querySelector(".safe-sheet-close");
sheetRoot.querySelector(".safe-sheet-backdrop").addEventListener("click",closeSheet);
closeBtn.addEventListener("click",closeSheet);
return sheetRoot;
}
function openSheet(title,filePath){
var root=ensureSheet();
titleEl.textContent=title||"";
bodyEl.textContent="Loading...";
root.classList.add("safe-sheet-root--visible");
fetch(filePath).then(function(r){return r.text()}).then(function(t){bodyEl.textContent=t}).catch(function(){bodyEl.textContent="Unable to load."});
}
function closeSheet(){
if(!sheetRoot)return;
sheetRoot.classList.remove("safe-sheet-root--visible");
}
w.SAFE_SHEET={open:openSheet,close:closeSheet};
})(window,document);
