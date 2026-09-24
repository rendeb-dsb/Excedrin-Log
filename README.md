# Excedrin PWA v24

Persistence, update, and statistics release.

- Excedrin records are stored in IndexedDB in a database named ExcedrinDB.
- The IndexedDB database is independent of the application version number.
- Existing records from the earlier Excedrin localStorage storage are migrated automatically if the IndexedDB store is empty.
- The application does not silently replace unreadable storage with an empty record set.
- Add, Change, Delete, and Import are persisted before the list is updated.
- Version 22 uses a new service-worker filename (`sw-v24.js`) and cache name (`excedrin-v24`).
- Stats is displayed to the right of Actions. It replaces the current screen and shows the total number of List rows, a frequency table by date, and a gap list showing missing calendar days between recorded dates.
- Existing IndexedDB records are not deleted or replaced by the application update.

IMPORTANT UPDATE RULE:
Replace the application files in the existing GitHub Pages repository without deleting browser/site data. Do NOT clear cookies, site data, localStorage, or IndexedDB as part of a normal Excedrin update.

Data is stored locally on the device/browser and is not synchronized to another device. Use Export periodically as an independent backup.
