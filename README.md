# My Wealth — eCAS Investments & Reports update

This update is based on the supplied `My-Wealth--main.zip` source. It keeps the existing IndexedDB database (`mywealth-db`, object store `finance`, key `app-state`) and extends the existing state without resetting transactions, accounts, budgets, assets, liabilities or Bluecoins history.

## Included

- Wealth → Investments: manually maintain mutual funds, stocks, ETFs and other holdings; record investment buys/SIPs/sells/dividends/switches; retain statement snapshots.
- CDSL eCAS PDF import: select a text-based, unlocked PDF; the app extracts mutual fund folio holdings, units, NAV, cumulative invested amount and valuation, then shows a review screen before import. Existing holdings are matched by ISIN + folio and updated rather than duplicated. A dated portfolio snapshot is retained from the statement summary.
- Holdings CSV import remains available.
- Holding return percentage and XIRR display. XIRR is calculated from dated investment ledger cash flows plus the current valuation. It is intentionally shown as unavailable until there are enough dated cash flows; incomplete transaction histories can produce misleading XIRR, so import historical transactions before relying on it.
- Reports → Spending by category: tap a category to see the underlying expense transactions, with date range, account and sort filters.
- Service worker cache version incremented so the updated app shell can be fetched.

## Import scope and limitations

- The eCAS PDF importer currently imports **mutual fund folio holdings**. It does not yet parse demat equity/ETF holdings or the detailed cash/investment transaction tables. Those securities can be entered manually or imported using the holdings CSV template.
- The statement's overall portfolio value is stored as a snapshot, but only parsed mutual fund folios are added as investment holdings. Do not separately add those same mutual fund folios as manual assets, or net worth will double-count them.
- Live NAV/share prices are not fetched. Imported valuations are the statement-date values, not live prices.
- PDF parsing requires the PDF.js library from the CDN and a text-based, unlocked PDF. A scanned image-only PDF or password-protected PDF may not parse; use an unlocked text PDF or CSV in that case.
- XIRR is only as reliable as the dated cash flows entered in the investment ledger. The October 2026 CAS holdings table provides cumulative invested amounts but not the complete dated cash-flow history needed for a trustworthy XIRR.
- The cash transaction link field is a reference only; the app does not automatically match or create Activity transactions. Unmatched investment entries remain in the investment ledger and are not added to bank accounts.

## Safe deployment

1. In your currently deployed My Wealth app, go to Settings and export a full JSON backup. Keep it somewhere safe.
2. Extract this ZIP. Upload the files from the extracted folder to the root of the existing GitHub Pages repository, replacing matching files. Keep the `icons/` folder.
3. Commit the changes and wait for GitHub Pages to deploy.
4. Reopen My Wealth from Safari. The service worker cache version has been incremented.

**Do not clear Safari website data, delete the Home Screen app, or reset IndexedDB.** Those actions can remove locally stored financial records. The update does not intentionally clear or replace your existing database.
