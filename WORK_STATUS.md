# My Wealth — Work Status

## Included in this release
- Historical Bluecoins self-transfer candidate detection, confirmation, reconciliation and undo.
- eCAS statement text parser, reconciled import preview, duplicate-safe import and investment transaction workflows.
- Activity toolbar and selection actions; Activity-only search and advanced filter.
- Reports spending/income/net-worth views, category drill-down and modal advanced filters.
- Dedicated Set Budget page with month selection and category-wise editable monthly limits.
- Settings main page separated from Cloud backup & restore, Import data and Export data subpages.
- Home dashboard cleanup and darker card surfaces in dark mode.
- IndexedDB persistence and rollback safeguards retained.

## Deferred
- Wealth tab visual overhaul and live market-price updates remain the next phase.
- iPhone/GitHub Pages end-to-end verification is still required.


## Phase 6 — Wealth overview design (10 Nov 2026)
- Reworked the Wealth landing page around Total Financial Wealth, the four investment categories, portfolio performance, asset allocation, Accounts, other assets and liabilities.
- Bank account balances remain managed in Accounts and are included once in Total Financial Wealth; no duplicate Bank Accounts investment category is added.
- Others remains one top-level category, with subtypes for Bank Deposit / RD, Fixed Deposit, Sovereign Gold Bond and Other Asset.
- Added invested amount, current value, gain/loss and an XIRR estimate based on dated recorded cash flows. XIRR is withheld when the recorded history is insufficient.
- Existing IndexedDB database and record structure are retained; new holding subtype is an optional field on investment records.
- Manual/live price feed integration and detailed FD/SGB terms (rates, maturity, coupon and redemption schedules) remain follow-on work.
- Browser/device QA on iPhone remains required.
