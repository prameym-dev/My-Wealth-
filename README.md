# My Wealth — Reference UI Redesign

This build applies the supplied multi-screen reference design across the My Wealth iPhone PWA.

## Included
- Wealth overview with Total Financial Wealth (investment value plus Accounts balances), four investment categories, portfolio performance, gain/loss, XIRR when cash-flow history supports it, and allocation. Others groups Bank Deposits/RDs, Fixed Deposits, Sovereign Gold Bonds and Other Assets under one category.
- Consistent forest-green header and bottom navigation, rounded active-tab treatment, pale mint canvas and matching cards/buttons.
- Home dashboard summary cards, monthly cash-flow summary and compact recent activity.
- Activity date-grouped transactions, month navigation, type filters, advanced filters and long-press multi-select with Select All / Deselect All and bulk Add / Edit / Categorise / Delete actions.
- Add Transaction with Income, Expense and Self Transfer.
- Wealth overview with Mutual Funds, Stocks, ETFs and Others, category detail with valuation/cost/gain-return summary and holding list.
- Budget progress gauge, category spend bars and category transaction drill-down.
- Reports for income, expenses, category spending, account activity and current net-worth breakdown, with category drill-down.
- Settings with separate Display Mode and Accent Colour, category management, Accounts shortcut, backup/restore and imports.

## Data safety
- Preserves the existing IndexedDB database `mywealth-db`, object store `finance`, and `app-state` record. No database reset or destructive migration was added.
- Ordinary existing transactions, accounts, budgets and assets are retained. The explicit Bluecoins/eCAS import actions only add missing source rows or update matching imported holdings; they do not clear the data arrays.
- Export a full JSON backup from Settings before deploying any update.
- Do not clear Safari website data or remove the Home Screen app.

## Deploy
1. Download and extract this ZIP.
2. Upload the contents of `My-Wealth--main` to the root of the existing GitHub Pages repository, replacing matching files.
3. Commit the changes and wait for GitHub Pages to finish deploying.
4. Close the Home Screen app fully and reopen it. The service-worker cache version has been updated to load the new UI.

## Scope and limitations
This is a reference-led responsive implementation, not a guarantee of literal pixel identity across every iPhone/browser size. Device screenshot QA is still required. CDSL eCAS PDF extraction is implemented and gated by strict statement-total reconciliation. Live market prices are not enabled in this UI build; the Wealth visual redesign is intentionally deferred.


## Activity reference update (10 Nov 2026)
- Activity title moves to the top bar and replaces the app name on this page.
- Search and advanced filters sit beside Settings.
- Selection checkboxes precede category icons.
- The bottom selection tray offers Add, Edit, Copy and Delete.
- Transaction types have icons and the date field has a trailing calendar glyph.


## Activity toolbar repair
- Removed Set Budget from Activity and replaced it with Add Transaction in the month-navigation row.
- Search expands inline in the top navigation; the standalone search row is removed.
- Moved the bulk selection toolbar outside the scrolling page and anchored it above bottom navigation.
- Updated shared navigation, transaction, search, filter, bulk-action and calendar glyphs to inline outline SVGs.
- Reduced the transaction date field height to match other form controls.


## Budget header and category redesign (10 Nov 2026)
- Budget screen now uses a contextual top navigation title and a Set budget action beside Settings.
- Removed the redundant in-page Budget heading and Set budget button.
- Budget categories render as icon-led rows with spent/limit values, a progress bar and percentage used.
- Replaced the settings glyph with a cleaner outline gear.
- Forced the Add Transaction date control to the same 42px height as the other form fields.


## Null-reference initialization fix (10 Nov 2026)
- Restored the clear-account-filter control referenced by Activity rendering.
- Added null guards around its event binding and visibility update so a missing optional control cannot stop app initialization.
- Bumped the service-worker cache version to force clients to fetch the repaired assets.
- No finance data schema or IndexedDB database name/version was changed.

## Phase 5 — historical transfers, CDSL eCAS and investment workflows

### Bluecoins migration integrity
- The prepared Bluecoins migration JSON is imported idempotently by source transaction ID. Existing source IDs are skipped on repeat import.
- Raw Bluecoins amounts are normalized once by dividing by 10,000, matching the one-time correction previously required. Raw source amount and a correction marker are retained to prevent accidental rescaling.
- Source account links, transfer group IDs, reminder flags, deleted flags, labels and key source metadata are retained.


### Historical self-transfer reconciliation
- Settings → Data → Historical transfer reconciliation scans for opposite Income/Expense pairs with the same amount, close dates and different accounts.
- Candidates are suggestions only; each pair requires explicit confirmation.
- Confirming creates one Transfer record and flags the two original rows as retained audit records. Account balances, income and expense reports exclude the retained source rows so the movement is counted once.
- Every converted pair can be undone, restoring both original rows. Dismissed pairs are remembered and excluded from future suggestions.
- The supplied Bluecoins migration package surfaced five same-day, equal-amount cross-account possibilities. They are shown as review candidates only; none is automatically converted.

### CDSL eCAS PDF import
- The PDF parser extracts the 20 mutual-fund folios, demat holdings, six investment transactions and 12 monthly portfolio valuations in the supplied October 2026 CDSL statement format.
- Import is blocked unless the parsed totals reconcile to the statement summary by category and at portfolio level.
- The October 2026 reference statement reconciles to MF folios ₹16,86,907.40, Stocks ₹3,98,659.70, ETFs ₹4,615.10, Others ₹5,633.04 and total ₹20,95,815.24 (zero variance in the local parser validation).
- PDF extraction lazy-loads PDF.js 3.11.174 from cdnjs when a PDF is selected. An internet connection is required at import time to fetch the parser and worker; the PDF is then parsed in the browser and finance data stays in IndexedDB. PDF.js is not included in the offline service-worker cache. An optional PDF password field supports protected statements; the password is kept only in the dialog and cleared when it closes.
- Import is idempotent by ISIN/folio or demat account/ISIN and statement keys; re-import updates matching eCAS holdings and does not duplicate them. Manual holdings are not globally cleared.

### Investment workflows
- Add, edit and delete manual holdings across Mutual Funds, Stocks, ETFs and Others.
- Add, edit and delete investment transactions (Purchase, SIP, Redemption, Switch, Dividend, Fee and Bonus).
- Purchase/SIP/Bonus/Redemption/Fee manual entries update linked holding units, cost and/or value using stored reversible deltas; eCAS statement transactions are imported as history only and do not double-apply to statement holdings.
- Investment snapshots and historical eCAS monthly valuations are retained.
- Investment category details include Overview, Holdings and Transactions views. Incomplete cost history is labelled instead of producing a misleading return percentage.

### Regression tests
Run `npm test` from the repository root. The 12 automated tests cover CDSL parser reconciliation, idempotent eCAS import, Bluecoins import normalization/deduplication, transfer candidate detection, transfer conversion/undo, account-balance preservation and static UI integrity. `tests/e2e-smoke.html` is an additional browser smoke test for top-bar scoping, navigation, settings, reports, budget and Add Transaction. The headless browser could not be launched in the build environment, so run this harness on the deployed iPhone PWA.

## UI refinement release — 10 Nov 2026
- Reports advanced filters now open in a modal dialog; date and select controls use a consistent compact 42px field height.
- Removed the four separate Assets, Liabilities, Investments and Cash & Bank summary tiles from Home.
- Added a dedicated Set Budget page with a top-bar back button, month selector, editable category limits and a single Save Budgets action.
- Replaced the Settings gear artwork with a clean, symmetrical outline gear.
- Dark-mode cards and report/budget surfaces now use darker neutral surfaces instead of bright white/pastel blocks.
- Settings main page is simplified; Cloud backup & restore, Import data and Export data each open a dedicated subpage.
- Hardened advanced-filter category population for both array-based custom categories and Bluecoins' imported object-shaped category metadata.


## Reminders & Bills — Build 15
- The reminders module initializes at application startup, independently of Cloud settings.
- Deleting a reminder refreshes the monthly list and Home upcoming-payments card immediately.
- Credit-card reminders select the destination card by account name/type (including legacy accounts such as `Amazon ICICI CC` whose type may be `Other`). At payment time the user selects a bank source; the app creates a self-transfer, not an expense.
- MF reminders default to ₹20,000, SBI, the 10th of each month and a 09:00 reminder-notification time. The 10th rolls forward over Sundays, second/fourth Saturdays and the 2026 Mumbai bank-holiday dates currently embedded from the RBI calendar. The annual holiday list should be refreshed as RBI publishes it; extra local dates can be stored in `state.bankHolidayDates`.
- A reminder remains a reminder until payment is recorded. A matching real Bluecoins MF expense (Investment (Buy), note `MF`, same account and amount near the scheduled date) is linked to the occurrence automatically and idempotently; the scheduled Bluecoins reminder source rows are never treated as real expenses.
- Reminder rows are excluded from dashboard cash flow and budget spending.
- Notification time is stored per reminder; foreground notifications work while the app is active. Background push still requires a configured push service. The PWA does not initiate bank debits.
- The month selector is constrained to 44% of the reminder toolbar; Add reminder uses the remaining width.


## Build 16 — scheduled transaction auto-booking
- Fixed-amount reminders can optionally auto-book an expense at the configured due occurrence.
- Existing MF reminders default to auto-book enabled, with a 10:00 AM booking time, ₹20,000 amount, SBI account, Investment (Buy) category and MF note preserved from the reminder.
- MF dates move to the next SBI working day using the configured bank holiday calendar and weekend rules.
- Generated transactions are tagged with reminder ID and occurrence date so repeated checks/restarts cannot duplicate the same scheduled expense.
- Credit-card reminders are excluded from automatic expense booking; settlement remains a bank-to-credit-card transfer.
- If the app is closed at the scheduled time, the booking is created on the next app launch/foreground check and backdated to the scheduled date; closed-app execution requires a future server-side scheduler.
