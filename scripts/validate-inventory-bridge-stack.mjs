import { spawnSync } from 'node:child_process';

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

function run(command) {
  console.log(`\n▶ ${command}`);
  const result = spawnSync('npm', ['run', command], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} failed with exit code ${result.status ?? 'unknown'}`);
  }
}

try {
  console.log('Inventory bridge stack validation started');
  validators.forEach(run);
  console.log('\nInventory bridge stack validation PASS');
} catch (error) {
  console.error('\nInventory bridge stack validation FAIL');
  console.error(error);
  process.exitCode = 1;
}
