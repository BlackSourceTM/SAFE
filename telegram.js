(function(w,d){
function getQuery(k){var s=w.location.search.slice(1).split("&");for(var i=0;i<s.length;i++){var p=s[i].split("=");if(p[0]===k)return decodeURIComponent(p[1]||"");}return""}
var devMode=getQuery("dev")==="1"||w.location.hash.indexOf("#dev")!==-1;
var WebApp=w.Telegram&&w.Telegram.WebApp;
function createOverlay(msg){var o=d.createElement("div");o.id="safe-tg-overlay";o.style.position="fixed";o.style.inset="0";o.style.zIndex="9999";o.style.display="flex";o.style.alignItems="center";o.style.justifyContent="center";o.style.backdropFilter="blur(10px)";o.style.background="rgba(0,0,0,.75)";var b=d.createElement("div");b.style.maxWidth="420px";b.style.margin="16px";b.style.borderRadius="20px";b.style.padding="24px";b.style.background="#111827";b.style.color="#e5e7eb";b.style.fontFamily="system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif";b.style.textAlign="center";b.style.boxShadow="0 24px 60px rgba(0,0,0,.7)";var h=d.createElement("h2");h.textContent="SAFE – E2Ebox";h.style.fontSize="20px";h.style.margin="0 0 8px";var p=d.createElement("p");p.textContent=msg;p.style.fontSize="14px";p.style.lineHeight="1.6";p.style.margin="0 0 12px";b.appendChild(h);b.appendChild(p);if(devMode){var btn=d.createElement("button");btn.textContent="ورود به حالت توسعه (خارج از تلگرام)";btn.style.marginTop="8px";btn.style.padding="10px 16px";btn.style.borderRadius="999px";btn.style.border="none";btn.style.fontSize="13px";btn.style.cursor="pointer";btn.style.background="#22c55e";btn.style.color="#022c22";btn.addEventListener("click",function(){o.remove()});b.appendChild(btn)}o.appendChild(b);d.body.appendChild(o)}
function applyThemeParams(root,wa){var tp=wa.themeParams||{};function s(k,css){if(tp[k])root.style.setProperty(css,tp[k]);}
s("bg_color","--tg-bg-color");
s("text_color","--tg-text-color");
s("hint_color","--tg-hint-color");
s("link_color","--tg-link-color");
s("button_color","--tg-button-color");
s("button_text_color","--tg-button-text-color");
s("secondary_bg_color","--tg-secondary-bg");
}
function init(){var root=d.documentElement;if(!WebApp||!WebApp.initData){createOverlay("این نسخه از SAFE فقط باید از داخل تلگرام و به عنوان Mini App باز شود.");return}WebApp.ready();WebApp.expand();applyThemeParams(root,WebApp);var scheme=WebApp.colorScheme;if(scheme==="light"||scheme==="dark"){root.setAttribute("data-theme",scheme);}
}
w.SAFE_TG={init:init};
if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",init);else init();
})(window,document);
