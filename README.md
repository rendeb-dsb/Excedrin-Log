# Excedrin PWA v30

Version 27 of the Excedrin PWA. This version retains the v25/v26 Stats behavior, including frequency and gap-series summaries, and uses v30 as the application version.

Important update detail: `sw-v24.js` is intentionally replaced with the v30 service-worker code. The installed v24 service worker was still controlling the site, so changing the old script in place allows the browser to update the currently controlling worker without clearing IndexedDB or site data. The app registers `sw-v24.js` for this transition.

Existing IndexedDB data is preserved.
