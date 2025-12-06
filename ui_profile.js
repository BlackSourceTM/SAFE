// ui_profile.js
(function () {
    "use strict";
  
    function qs(selector, root) {
      return (root || document).querySelector(selector);
    }
  
    function getUserModel() {
      try {
        if (
          window.Telegram &&
          Telegram.WebApp &&
          Telegram.WebApp.initDataUnsafe &&
          Telegram.WebApp.initDataUnsafe.user
        ) {
          var u = Telegram.WebApp.initDataUnsafe.user;
          var username = u.username || u.first_name || "user";
          return { username: username, userId: u.id || 0 };
        }
      } catch (e) {
        // ignore
      }
      // fallback demo user
      return { username: "demo_user", userId: 22130261 };
    }
  
    function initDeleteAccountFlow() {
      var user = getUserModel();
      var originalBtn = qs("#section-profile .option-item--danger");
      if (!originalBtn) return;
  
      if (typeof window.initDeleteAccountUI !== "function") {
        console.warn(
          "[SAFE] initDeleteAccountUI is not available. Make sure ui_delete.js is loaded before ui_profile.js."
        );
        return;
      }
  
      // clone to remove any inline/previous listeners
      var btn = originalBtn.cloneNode(true);
      originalBtn.parentNode.replaceChild(btn, originalBtn);
  
      window.initDeleteAccountUI({
        triggerElement: btn,
        getUser: function () {
          return user;
        },
        onDelete: function () {
          // Here you can call your backend / bot logic for deleting the account.
          // Example: send a payload to the Telegram bot via WebApp:
          if (
            window.Telegram &&
            Telegram.WebApp &&
            typeof Telegram.WebApp.sendData === "function"
          ) {
            Telegram.WebApp.sendData(
              JSON.stringify({
                type: "delete_account",
                userId: user.userId,
                username: user.username
              })
            );
          }
          // If you need HTTP requests, you can also call fetch() to your CF worker here.
        }
      });
    }
  
    document.addEventListener("DOMContentLoaded", function () {
      initDeleteAccountFlow();
    });
  })();
  
