# My Wealth — eCAS Investments & Reports update

This update is based on the supplied `My-Wealth--main.zip` source. It keeps the existing IndexedDB database (`mywealth-db`, object store `finance`, key `app-state`) and extends the existing state without resetting transactions, accounts, budgets, assets, liabilities or Bluecoins history.

## Included

- Wealth → Investments: manually maintain mutual funds, stocks, ETFs and other holdings; record investment buys/SIPs/sells/dividends/switches; retain statement snapshots.
- CDSL eCAS PDF import: select a text-based, unlocked PDF; the app extracts mutual fund folio holdings, units, NAV, cumulative invested amount and valuation, then shows a review screen before import. The demat holding statement is also parsed into stocks, ETFs and other securities with ISIN, quantity, price, value and depository account. Mutual funds are matched by ISIN + folio; demat securities by ISIN + depository account. A dated portfolio snapshot is retained from the statement summary.
- Holdings CSV import remains available.
- Holding return percentage and XIRR display. XIRR is calculated from dated investment ledger cash flows plus the current valuation. It is intentionally shown as unavailable until there are enough dated cash flows; incomplete transaction histories can produce misleading XIRR, so import historical transactions before relying on it.
- Reports → Spending by category: tap a category to see the underlying expense transactions, with date range, account and sort filters.
- Service worker cache version incremented so the updated app shell can be fetched.
- Wealth → Investments now shows only four category cards: Mutual Funds, Stocks, ETFs and Others. Tapping a card opens category metrics, individual holdings and any investment ledger transactions already recorded.

## Import scope and limitations

- The eCAS PDF importer imports **mutual fund folio holdings and demat holdings**. Demat securities are classified into Stocks, ETFs and Others (including REITs/InvITs) based on the statement security descriptions. It does not yet import the complete detailed investment transaction ledger.
- The statement's overall portfolio value is stored as a snapshot, and all parsed mutual fund and demat holdings are added as investment holdings. Do not separately add those same securities as manual assets, or net worth will double-count them.
- Live NAV/share prices are not fetched. Imported valuations are the statement-date values, not live prices.
- PDF parsing requires the PDF.js library from the CDN and a text-based, unlocked PDF. A scanned image-only PDF or password-protected PDF may not parse; use an unlocked text PDF or CSV in that case.
- XIRR is only as reliable as the dated cash flows entered in the investment ledger. The October 2026 CAS provides cumulative invested amounts for mutual funds. Its demat holdings table does not provide cost basis for shares/ETFs and the statement import does not yet load full dated transaction history; therefore demat absolute returns and XIRR remain unavailable until the user adds that history.
- The cash transaction link field is a reference only; the app does not automatically match or create Activity transactions. Unmatched investment entries remain in the investment ledger and are not added to bank accounts.

## Safe deployment

1. In your currently deployed My Wealth app, go to Settings and export a full JSON backup. Keep it somewhere safe.
2. Extract this ZIP. Upload the files from the extracted folder to the root of the existing GitHub Pages repository, replacing matching files. Keep the `icons/` folder.
3. Commit the changes and wait for GitHub Pages to deploy.
4. Reopen My Wealth from Safari. The service worker cache version has been incremented.

**Do not clear Safari website data, delete the Home Screen app, or reset IndexedDB.** Those actions can remove locally stored financial records. The update does not intentionally clear or replace your existing database.
