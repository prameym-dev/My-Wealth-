# My Wealth — iPhone installable web app (PWA)

A mobile-first finance tracker designed for iPhone Safari. It can be added to the Home Screen and run in standalone mode.

## Included
- INR dashboard and net-worth summary
- Income and expense transactions
- Manual asset and liability records
- Monthly category budgets
- Monthly spending reports and portfolio allocation
- CSV transaction import and export
- Full JSON local backup and restore
- Optional Supabase email/password cloud sync with per-user Row Level Security
- Offline app shell via service worker

## Important limits
- This is a PWA, not a native Swift/SwiftUI app.
- It must be hosted on HTTPS to install and use service workers on iPhone.
- Local records are stored in browser localStorage. Cloud sync is optional and is not active until you create and configure your own Supabase project.
- Cloud sync is a basic single-document sync. It is not end-to-end encrypted, and simultaneous edits on multiple devices can conflict. Export regular backups. For sensitive financial use, production hardening and a security review are recommended.
- No automatic bank feeds, UPI integrations, PDF parsing, live market prices, automatic recurring payment execution, or live investment performance calculations are included.
- Statement CSV import expects headers: date,description,amount,type,category. It supports quoted CSV fields. Positive amount is treated as income; negative amount as expense unless type explicitly contains income.
- The app does not store bank passwords, OTPs, card PINs or full card numbers.

## Deploy free with GitHub Pages
1. Create a GitHub account and a new public repository named `my-wealth`.
2. Upload all files/folders from this package to the repository root.
3. In repository Settings → Pages, choose Deploy from a branch, select `main` and `/ (root)`, then Save.
4. Wait for GitHub Pages to publish the HTTPS URL.
5. Open that URL in Safari on your iPhone.
6. Tap Share → Add to Home Screen → Add.
7. Launch My Wealth from the Home Screen.

A public repository exposes the static app source. Do not put private keys or personal financial data in the repository. The Supabase anon key is designed for client use only when Row Level Security is correctly configured.

## Optional cloud sync with Supabase
1. Create a project at https://supabase.com.
2. In SQL Editor, run the complete contents of `supabase-schema.sql`.
3. In Project Settings → API, copy the Project URL and anon/public key (not service_role).
4. Open My Wealth → Settings → Configure cloud sync; paste the URL and anon/public key.
5. Choose Sign in / create account and create an account with email/password.
6. Verify email if email confirmation is enabled.
7. Sign in, then tap Sync now.
8. Repeat the configuration and sign-in on other devices using the same project and user account.

### Cloud sync caution
The current sync model merges records by ID into one JSON document. It is suitable as a starter for one person's low-volume data, but it is not a robust multi-device conflict-resolution system. Avoid editing the same records concurrently across devices. Do not rely on it as your only backup. A production version should use normalized tables, per-record timestamps, conflict handling, encryption strategy, and tested restore procedures.

## iPhone install
Use Safari, not an in-app browser. HTTPS is required. If Add to Home Screen is not visible, use the Share sheet's Edit Actions option or update iOS.

## Backup
Settings → Export full backup saves a JSON file. Store it somewhere private. Export CSV separately for transaction records.
