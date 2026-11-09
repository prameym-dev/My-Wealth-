# My Wealth PWA – IndexedDB storage update

This build moves the primary finance dataset from localStorage to IndexedDB (`mywealth-db`, object store `finance`, key `app-state`). On first launch it migrates the existing `mywealth-v1` localStorage dataset into IndexedDB if no IndexedDB dataset exists. Large Bluecoins imports are written in batches of 200 records; each batch is committed before progress advances. Re-importing after an interrupted import skips records already present by Bluecoins source ID.

## Deploy
Upload the contents of this folder to the root of the existing GitHub Pages repository, replacing matching files. Keep the existing `icons/` folder. Commit changes and wait for Pages to publish. The service-worker cache version has been incremented to force refreshed app assets.

## Important
- Do not clear Safari website data or delete the Home Screen app before confirming that existing records have migrated.
- IndexedDB has substantially more capacity than localStorage, but browser/device storage can still be cleared or evicted. Use the JSON backup/export regularly.
- If an import is interrupted, select the same Bluecoins JSON again; source IDs already saved are skipped.
