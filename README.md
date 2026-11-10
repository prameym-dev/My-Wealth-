# My Wealth — UI & Activity Update

This update is based on the supplied `My-Wealth--main.zip` source and retains the existing IndexedDB database name (`mywealth-db`), object store (`finance`) and `app-state` record. It does not clear or reset existing local data.

## Included in this build
- Refined visual system with consistent green selected-tab pill, matching outline settings icon, cleaner card spacing and responsive form controls.
- Display Mode and Accent Colour shown as separate settings rows.
- Activity long-press selection, selected count, Select All, Deselect All and bulk delete.
- Add Transaction now supports Income, Expense and Self Transfer. Transfers require distinct source and destination accounts and are recorded as a single transfer record with both account references; account balances debit the source and credit the destination without affecting income/expense totals.
- Reports spending-category rows open the underlying expense transactions for the selected date range and account filter.
- Budget month and Set Budget controls share a compact aligned control row.
- Wealth investment area presents only Mutual Funds, Stocks, ETFs and Others, with category detail views and statement snapshot support.

## Important limitations
- The eCAS PDF import control is intentionally gated and does not commit any holdings in this build. A robust CDSL PDF parser must extract and reconcile each demat account and mutual-fund section against the statement totals before it is safe to import. This build does not claim that the eCAS parser is complete.
- Investment category screens will remain empty until holdings are imported or entered through a future verified import/manual-entry workflow.
- Historical transactions are not automatically reclassified as self-transfers. Review likely transfer pairs and back up your data before any historical cleanup.

## Deploy safely
1. Export a full JSON backup from My Wealth Settings before replacing files.
2. Extract this ZIP and upload its contents to the root of the existing GitHub Pages repository, replacing matching files.
3. Commit and wait for GitHub Pages to deploy.
4. Reopen the Home Screen app. The service-worker cache version has been incremented.

Do not clear Safari website data or delete the Home Screen app. The existing IndexedDB database is preserved by this source update.


## UI refresh (November 2026)
- Refined iPhone layout to match the approved My Wealth concept: deep-green header and bottom navigation, compact cards, consistent spacing and rounded controls.
- Reworked settings row spacing and budget month / Set Budget alignment to prevent narrow-screen overlap.
- Preserved existing app state keys, IndexedDB database name, and transaction data model.
- Existing investment import remains safely disabled until CDSL demat extraction can be validated against statement totals.
