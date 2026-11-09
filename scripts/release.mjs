// Release: full check, shows what goes into the package, then publishes. Dry run unless --dry-run=false.
// A real publish only happens from a commit tagged v<version> with a clean tree; normally the Release workflow
// (.github/workflows/release.yml) runs it when the tag is pushed. No tag, no publish.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const real = process.argv.includes('--dry-run=false');
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const git = (args) => execSync(`git ${args}`, { encoding: 'utf8' }).trim();

if (real) {
  const tag = `v${JSON.parse(readFileSync('package.json', 'utf8')).version}`;
  const tags = process.env.GITHUB_REF_TYPE === 'tag' ? [process.env.GITHUB_REF_NAME] : git('tag --points-at HEAD').split('\n');
  const fail = (why) => {
    console.error(`Not publishing: ${why}\nRelease by tagging: git tag ${tag} && git push origin ${tag}`);
    process.exit(1);
  };
  if (!tags.includes(tag)) fail(`this commit is not tagged ${tag} (package.json version).`);
  if (git('status --porcelain')) fail('the working tree has uncommitted changes.');
}
run('npm run check');
run('npm pack --dry-run');
run(`npm publish${real ? '' : ' --dry-run'}`);
