# INVYRA MARKDOWN RETURN NAV FIX V1

## Status
Implemented.

## Scope
UI-only navigation containment fix for Markdown child pages.

## Problem
Markdown child routes such as Reports, Monitor Sheet, Review Queue, Batches, and Acceptance Tests could leave the operator feeling locked inside the page because the sidebar only links back to the root Markdown module and there was no clear in-page return action.

## Files Changed
- `src/pages/MarkdownBatches.jsx`
- `src/pages/MarkdownReviewQueuePage.jsx`
- `src/pages/MarkdownMonitor.jsx`
- `src/pages/MarkdownReports.jsx`
- `src/pages/MarkdownAcceptanceTests.jsx`

## Changes
- Added a consistent `Back to Markdown` button to the header/action area of each Markdown child page.
- Button routes to `/Markdown`.
- Preserved all existing page actions such as Refresh, New Batch, Print / Export, and test status badges.
- No Markdown business logic, schema, POS validation, stock movement, reporting calculations, or Wastage logic was changed.

## Verification
- `npm run build` completed successfully after using the existing local dependency cache.

## Notes
This fixes navigation containment only. It does not alter routes or remove any Markdown child page.
