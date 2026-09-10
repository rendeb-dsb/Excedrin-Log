# Excedrin PWA

A simple installable PWA for storing Date and Time records.

## Storage
Records are stored in browser localStorage as versioned JSON:
`{"version":1,"records":[{"date":"09/09/2026","time":"18:39"}]}`

## Export / Import
Export produces `Excedrin.csv`. Import accepts CSV with:
`Date,Time`
followed by one record per line.

## Running
Serve this folder from HTTPS (or localhost for testing). For GitHub Pages, upload all files to a repository and enable Pages. Open the resulting Pages URL on the phone and use the browser's install/add-to-home-screen command.
