// Release: full check, shows what goes into the package, then publishes. Dry run unless --dry-run=false.
import { execSync } from 'node:child_process';
const real = process.argv.includes('--dry-run=false');
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
run('npm run check');
run('npm pack --dry-run');
run(`npm publish${real ? '' : ' --dry-run'}`);
