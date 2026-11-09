# My Wealth — upgraded PWA

## Deploy update
Upload the **contents** of this folder to the root of your existing `my-wealth` GitHub repository, replacing the existing files when prompted. Keep the `icons/` folder and its two PNG files. Commit the changes. GitHub Pages will redeploy at the same URL.

## Bluecoins import
1. Extract `MyWealth_Bluecoins_Migration_Package.zip` on your iPhone or computer.
2. In the package, locate `MyWealth_Bluecoins_Import.json`.
3. Open My Wealth → Settings → Bluecoins migration → Choose Bluecoins JSON.
4. Review the preview and select Import Bluecoins history.

All source transaction records, including reminders, transfers, deleted/status flags and original source record fields, are retained. The app records a source batch ID and skips duplicate source IDs already present. Keep the original `.fydb` backup.

## Accounts
Accounts can be manually added. Close marks an account inactive and retains all entries. Closed accounts can be reopened. Closing does not delete transactions or transfer history.

## Notes
The import is local to the browser/device unless cloud sync is configured. Back up using Settings → Backup & restore → Export full backup before and after migration. The Bluecoins importer stores the original source record fields for audit/recovery. The app is a personal-use tracker; it does not provide live bank feeds or Account Aggregator connectivity.
