// ============================================================
// HireHop Plugin: Automatically change the price group when
// a job status changes.
//
// Current rules:
//   Status 2 (Booked)   → Price C
//   Status 0            → Price A
//
// HOW TO INSTALL:
//   1. Host this file on an https:// web server (e.g. your
//      own site, GitHub Pages, or any static file host).
//   2. In HireHop go to:
//        Settings → Company Settings → Plugins
//   3. Paste in the full https:// URL to this file and save.
//
// To add more rules, just add a new line to STATUS_PRICE_RULES
// in the CONFIGURATION section below.
// ============================================================

$(document).ready(function () {

  // ── CONFIGURATION ────────────────────────────────────────
  // Add as many rules as you like: { status: ID, price_group: "X" }
  var STATUS_PRICE_RULES = [
    { status: 2, price_group: "C" }, // Booked  → Price C
    { status: 0, price_group: "A" }  // Status 0 → Price A
  ];
  // ─────────────────────────────────────────────────────────

  // Only run on job pages (doc_type 1 = job)
  if (typeof($.custom.job_status) === "undefined") return;
  if (typeof(user)                === "undefined") return;
  if (typeof(doc_type)            === "undefined") return;
  if (doc_type !== 1)                              return;

  // Hook into the job_status widget
  $.widget("custom.job_status", $.custom.job_status, {

    // _set_status is called whenever the user picks a new status
    _set_status: function (new_status_id) {

      // Call the original status-change function first
      this._super(new_status_id);

      // Check if this status matches any of our rules
      var matched_price_group = null;
      for (var i = 0; i < STATUS_PRICE_RULES.length; i++) {
        if (parseInt(STATUS_PRICE_RULES[i].status) === parseInt(new_status_id)) {
          matched_price_group = STATUS_PRICE_RULES[i].price_group;
          break;
        }
      }

      // No rule matched — do nothing
      if (matched_price_group === null) return;

      // Save the job with the new price group
      $.ajax({
        url      : "/php_functions/job_save.php",
        type     : "post",
        dataType : "json",
        data     : {
          job         : job,           // "job" is HireHop's global current job number
          price_group : matched_price_group    // Sets the price group (A / B / C / D …)
        },
        success: function (data) {
          if (typeof(data.error) !== "undefined") {
            // Show HireHop's standard error message if something went wrong
            error_message(
              isNaN(parseInt(data.error))
                ? data.error
                : lang.error[data.error]
            );
          } else {
            // Reload the job page so the new prices are reflected everywhere
            hhRedir(window.location.href);
          }
        },
        error: function (jqXHR, textStatus, errorThrown) {
          error_message(lang.error[1] + " (" + errorThrown + ").");
        }
      });
    }

  });

});
