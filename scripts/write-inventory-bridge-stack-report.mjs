import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const outputDir = join(process.cwd(), 'bridge-validation-reports');
const outputFile = join(outputDir, 'inventory-bridge-stack-report.json');
const startedAt = new Date().toISOString();

const validators = [
  'validate:inventory-bridge-relay-admission-evidence-projection',
  'validate:inventory-bridge-relay-readiness-preflight-acceptance',
  'validate:inventory-bridge-relay-handshake-evidence',
  'validate:inventory-bridge-gate-projection',
  'validate:inventory-bridge-gate-requirements-manifest',
  'validate:inventory-bridge-release-blocker-projection',
  'validate:inventory-bridge-release-plan-draft-projection',
  'validate:inventory-bridge-stack-evidence-manifest',
  'validate:inventory-bridge-stack-readiness-review-manifest',
];

function writeReport(status, errorMessage = null) {
  mkdirSync(outputDir, { recursive: true });
  const report = {
    component: 'Inventory',
    repo: 'invyra-base44',
    phase: '1D-D-AL',
    status,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    command: 'node scripts/validate-inventory-bridge-stack.mjs',
    validators,
    error_message: errorMessage,
    guardrails: {
      projection_only: true,
      local_validator_only: true,
      review_readiness_only: true,
      non_operational: true,
      merge_allowed: false,
      release_allowed: false,
      runtime_activation_allowed: false,
      no_relay_enforcement: true,
      no_relay_transport: true,
      no_event_transport: true,
      no_event_sync: true,
      no_event_ingestion: true,
      no_entity_writes: true,
      no_inventory_sync_writes: true,
      no_stock_mutation: true,
      no_price_mutation: true,
      no_pos_order_forecast_mutation: true,
      no_item_master_mutation: true,
    },
  };
  writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Inventory bridge stack report written to ${outputFile}`);
}

const result = spawnSync('node', ['scripts/validate-inventory-bridge-stack.mjs'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status === 0) {
  writeReport('PASS');
} else {
  writeReport('FAIL', `Stack validation exited with code ${result.status ?? 'unknown'}`);
  process.exitCode = result.status || 1;
}
