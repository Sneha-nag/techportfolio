/**
 * GoatCounter (private dashboard only — nothing is shown on the public pages).
 *
 * Sign up at https://www.goatcounter.com/ and create a site whose code matches
 * GOATCOUNTER_CODE below (or change this constant to your code).
 *
 * Dashboard: https://GOATCOUNTER_CODE.goatcounter.com/
 * You get: total visitors, referrers, paths (incl. readme.html?project=…),
 * and click events from data-goatcounter-click on the Projects page.
 */
(function () {
  var GOATCOUNTER_CODE = "snehanagabhairava";

  // Keep ?project=… so each README is a separate path in the dashboard.
  window.goatcounter = {
    path: function () {
      return location.pathname + location.search;
    },
  };

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.setAttribute(
    "data-goatcounter",
    "https://" + GOATCOUNTER_CODE + ".goatcounter.com/count"
  );
  document.head.appendChild(s);
})();
