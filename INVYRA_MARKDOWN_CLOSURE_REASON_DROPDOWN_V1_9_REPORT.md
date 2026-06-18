# INVYRA MARKDOWN CLOSURE REASON DROPDOWN v1.9

## Status
Implemented and build-verified.

## Scope
Markdown Reports holiday / closed-store planning now uses controlled closure reasons instead of free-text-only entry.

## Files Updated
- `src/pages/MarkdownReports.jsx`
- `INVYRA_MARKDOWN_CLOSURE_REASON_DROPDOWN_V1_9_REPORT.md`

## Changes
- Added fixed `CLOSURE_REASON_OPTIONS` list.
- Replaced the Closure Reason free-text input with a dropdown.
- Added a Closure Note field for optional details and required-style prompting when `Other` is selected.
- Updated printable Take-Off Sheet metadata to print the controlled reason plus any Other note.

## Closure Reason Options
- Public holiday
- Christmas / seasonal closure
- Planned store closure
- Emergency closure
- Stocktake closure
- Renovation / maintenance
- Trading hours change
- System / POS outage
- Weather / safety closure
- Other

## Business Rule
Closure reasons should be controlled values so daily/weekly/monthly markdown reports and holiday take-off sheets remain clean and searchable. Unusual closure cases should use `Other` with a note.

## Verification
- `npm run build`
- Result: `BUILD_EXIT:0`

## Guardrails
- No markdown pricing logic changed.
- No scoped overlay logic changed.
- No POS validation logic changed.
- No Item Master price mutation introduced.
- No Wastage logic touched.
