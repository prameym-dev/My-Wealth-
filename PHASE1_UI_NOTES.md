# Phase 1 — UI rebuild checkpoint

This phase updates the presentation layer only. It does not alter finance records, IndexedDB schemas, transaction calculations, or import logic.

## Design target
- Forest-green app header and fixed bottom navigation.
- Deep-green rounded active-tab pill.
- Pale green/white canvas with consistent rounded cards and restrained shadows.
- Symmetrical two-column summary and investment grids.
- Compact month/date controls with Set Budget aligned on the same row.
- Clearly separated Display Mode and Accent Colour settings rows.
- Touch-friendly controls with no horizontal overflow on narrow iPhone widths.

## Scope boundary
Phase 1 is a visual/layout pass. Functional work for historical transfers, the complete CDSL demat parser, investment transaction linking, and Phase 2–5 QA is not claimed complete.

## Manual visual QA still required
Open each tab on the target iPhone after deployment and check actual safe-area behavior, modal height, scrolling, and long labels. This package has passed static HTML/CSS/JS checks, not device/browser screenshot comparison.
