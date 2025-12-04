(function(w){
"use strict";
function getWebApp(){
var t=w.Telegram&&w.Telegram.WebApp;
return t||null
}
function getUser(){
var wa=getWebApp();
if(!wa||!wa.initDataUnsafe)return null;
return wa.initDataUnsafe.user||null
}
function getThemeParams(){
var wa=getWebApp();
return wa&&wa.themeParams?wa.themeParams:{}
}
function getColorScheme(){
var wa=getWebApp();
return wa&&wa.colorScheme?wa.colorScheme:"light"
}
function ready(){
var wa=getWebApp();
if(!wa)return;
try{wa.ready()}catch(e){}
}
function expand(){
var wa=getWebApp();
if(!wa)return;
try{wa.expand()}catch(e){}
}
w.SAFE_TG={getWebApp:getWebApp,getUser:getUser,getThemeParams:getThemeParams,getColorScheme:getColorScheme,ready:ready,expand:expand};
})(window);
