# INVYRA Markdown Monitor Sheet Deprecation + Reports Consolidation v1.8

## Scope
Deprecated the standalone Markdown Monitor Sheet as an operator workflow page after Markdown Reports gained printable reports, CSV export, Take-Off Sheets, date ranges, grouping, and holiday / closed-store planning.

## Changes
- Removed Monitor Sheet from the Markdown Control Board workflow tabs/actions.
- Removed Monitor Sheet from the Markdown Control Board workflow shortcuts.
- Kept `/Markdown/Monitor` route for backward compatibility.
- Replaced the old monitor sheet implementation with a simple notice that directs users to `Markdown Reports → Print Take-Off Sheet`.
- Updated attention links that previously routed to `/Markdown/Monitor` so they now route to `/Markdown/Reports`.
- Preserved Markdown Reports, Take-Off Sheet printing, holiday planning, scoped overlays, POS validation, and Item Master price safety.

## Files Updated
- `src/pages/Markdown.jsx`
- `src/pages/MarkdownMonitor.jsx`
- `INVYRA_MARKDOWN_MONITOR_DEPRECATION_REPORTS_CONSOLIDATION_V1_8_REPORT.md`

## Acceptance Criteria
- Operators are no longer sent to a mostly empty Monitor Sheet page.
- Printable markdown outputs are consolidated in Reports.
- Existing `/Markdown/Monitor` route does not break.
- Reports remains the single place for date-filtered markdown reporting, Take-Off Sheets, and holiday closure planning.
- No Markdown/Wastage merge.
- No business logic or schema changes.
