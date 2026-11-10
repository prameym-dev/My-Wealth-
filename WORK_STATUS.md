# My Wealth release checkpoint

## Completed in this package
- Activity, Budget, Reports and Settings top-bar scoping; Settings has a back button and grouped Appearance / Data / App sections.
- Historical self-transfer candidate detection, review, explicit conversion, audit retention, dismiss and undo.
- CDSL eCAS PDF text parser for MF folios and demat securities, including statement summary, account holdings, transaction history and monthly valuation history.
- Strict category and portfolio reconciliation before import.
- Idempotent eCAS holdings/transaction/snapshot upsert.
- Manual investment holding and transaction create/edit/delete workflows.
- Unit tests and browser smoke-test harness.
- Bluecoins JSON re-import path with one-time /10,000 amount normalization and source-ID duplicate skipping.

## Data safety
- IndexedDB database name, version, object store and `app-state` key are unchanged.
- Historical transfer conversion does not delete original entries; it marks them as retained audit rows and creates one transfer. Undo restores the original rows. Storage failures roll the in-memory change back before the user can continue.
- eCAS import updates matching imported rows and adds missing holdings; it does not clear the holdings array or personal transaction history.
- No database reset or destructive migration is included.

## Verified locally
- CDSL October 2026 sample parser: 20 MF holdings, 79 demat holdings, 6 investment transactions and 12 monthly valuation snapshots; category totals and grand total reconcile exactly with zero variance.
- `npm test` passes all 12 finance-core and static integrity tests.
- JavaScript syntax, duplicate HTML IDs and ZIP integrity checked.

## Known constraints
- PDF.js 3.11.174 is loaded from cdnjs; an internet connection is required when loading the PDF parser into the app. If the library is unavailable, the import is blocked safely and existing holdings are untouched.
- The browser smoke test harness is included; headless Chromium could not be launched in this build environment, so run it on the target iPhone after GitHub Pages deployment. No live market-price feed or Account Aggregator connection is included in this package.
- Wealth tab visual redesign is deliberately deferred to the next phase.
