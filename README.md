Excedrin PWA v15

Persistence and update release.

- Excedrin records are stored in IndexedDB in a database named ExcedrinDB.
- The IndexedDB database is independent of the application version number.
- Existing records from the earlier Excedrin localStorage storage are migrated automatically if the IndexedDB store is empty.
- The application does not silently replace unreadable storage with an empty record set.
- Add, Change, Delete, and Import are persisted before the list is updated.
- The service worker uses a versioned cache and removes obsolete Excedrin caches during activation, so updating the application files does not require deleting site data.
- The application registers the service worker on each start and asks the browser to check for an updated worker.

IMPORTANT UPDATE RULE:
Replace the application files in the existing GitHub Pages repository without deleting browser/site data. Do NOT clear cookies, site data, localStorage, or IndexedDB as part of a normal Excedrin update.

Data is stored locally on the device/browser and is not synchronized to another device. Use Export periodically as an independent backup.


v15 UI changes: Actions menu, Add label, compact list rows, and Actions disabled while Add or Change is displayed.
