# Wastage & Loss Reports Update

This follow-up documents the Reports tab update for the Wastage & Loss Events workflow.

## Scope

The Reports section now needs to support every stock-out class introduced by the controlled stock-out/loss foundation:

- Wastage
- Damage / Breakage
- Expired / Spoiled
- Store Use
- Suspected Theft / Loss
- Confirmed Theft Loss
- Unknown Shrinkage

## Reporting Rules

- Wastage and store use must no longer be the only report lanes.
- Theft/loss/shrinkage events should be visible as controlled loss reporting lanes.
- Pending controlled loss should remain separate from posted net stock-out loss.
- Confirmed theft loss should be visible after review/classification.
- Unknown shrinkage should be visible as its own category.
- CSV export should include review fields and reference fields.

## Files Added / Changed

- `src/components/wastage/LossReportsTab.jsx`
- `src/components/wastage/ReportsTab.jsx`

## Notes

The existing `ReportsTab.jsx` is now a thin wrapper around the new loss-aware reporting implementation. This keeps routing stable while allowing the report implementation to be widened safely.
