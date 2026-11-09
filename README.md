# My Wealth — Dashboard, Filters, Budgets, Reports & Categories update

This update keeps the existing IndexedDB database (`mywealth-db`, store `finance`, key `app-state`) and the current Bluecoins import data model. It does not require re-importing Bluecoins.

## Included
- Compact Home dashboard: smaller net-worth card, one-line income/expense metrics, three recent entries and a fixed-height Home view on iPhone.
- Activity advanced filters: account, transaction type, category, date range and sort order. Account filter can be cleared from Activity.
- Budgets: one Set / edit budgets control, with compact two-column budget cards.
- Reports: date range, account, type and category filters; income/expense trend chart; category spend breakdown; account activity; portfolio allocation.
- Appearance palettes: existing system/light/dark plus blue and dark blue.
- Category manager: add, rename and hide/remove categories from future selection. Existing transactions retain their category text unless renamed.

## Deploy
1. Extract this ZIP.
2. Upload the contents of `mwbuild/` to the root of your existing GitHub Pages repository, replacing matching files.
3. Keep the existing `icons/` folder and files.
4. Commit changes and wait for GitHub Pages to deploy.
5. Close and reopen My Wealth. The service worker cache has been bumped.

## Data safety
- No database reset or Bluecoins re-import is required.
- IndexedDB database and object-store names are unchanged.
- As always, export a full JSON backup before deploying app updates.
