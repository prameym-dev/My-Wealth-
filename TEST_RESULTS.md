# Regression test results

## Automated suite
Command: `npm test`

Result: **12 passed, 0 failed**.

Coverage:
- CDSL eCAS PDF text parser: mutual-fund folios, demat holdings, stocks, ETFs and REIT/InvIT classification, category totals and portfolio total reconciliation.
- Idempotent eCAS import, imported investment transaction linkage and historical snapshot retention.
- Historical transfer matching, same-account / mismatched / already-paired exclusions, confirm, undo and account-balance preservation.
- Bluecoins source-account mapping, amount normalization by 10,000, source metadata retention and duplicate-source-ID handling.
- Manual investment purchase and redemption application and reversal.
- HTML ID uniqueness, required controls, service-worker core-module cache and top-bar scope checks.

## Real statement/data validation performed during build
- The available October 2026 CDSL statement was parsed locally: 20 mutual-fund holdings, 79 demat holdings, 6 investment transactions and 12 monthly valuation snapshots.
- All four investment categories and the grand total reconciled with zero variance: Mutual Funds ₹16,86,907.40; Stocks ₹3,98,659.70; ETFs ₹4,615.10; Others ₹5,633.04; total ₹20,95,815.24.
- The supplied Bluecoins migration JSON was run through the import normalizer: 5,233 transactions and 14 real accounts (the two no-account placeholders are excluded). Five same-day opposite-flow matches across different accounts were surfaced as **possible** candidates; none were automatically converted.

## Browser test limitation
`tests/e2e-smoke.html` is included for a real browser/iPhone smoke run. Headless Chromium could not start in the build container, so I have not marked the browser-level interaction run as passed. Run the harness after deploying to GitHub Pages, or test the listed flows directly on the iPhone.
