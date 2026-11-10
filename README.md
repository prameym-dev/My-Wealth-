# My Wealth — Reference UI Redesign

This build applies the supplied multi-screen reference design across the My Wealth iPhone PWA.

## Included
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
- Existing transaction, account, budget, asset and investment records are not intentionally rewritten by this UI update.
- Export a full JSON backup from Settings before deploying any update.
- Do not clear Safari website data or remove the Home Screen app.

## Deploy
1. Download and extract this ZIP.
2. Upload the contents of `My-Wealth--main` to the root of the existing GitHub Pages repository, replacing matching files.
3. Commit the changes and wait for GitHub Pages to finish deploying.
4. Close the Home Screen app fully and reopen it. The service-worker cache version has been updated to load the new UI.

## Scope and limitations
This is a reference-led responsive implementation, not a guarantee of literal pixel identity across every iPhone/browser size. Device screenshot QA is still required. The eCAS PDF parser remains safely gated until its MF + demat extraction can be reconciled against statement totals. Live market prices are not enabled in this UI build.
