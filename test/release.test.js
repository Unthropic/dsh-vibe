import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const releaseScript = join(import.meta.dirname, '..', 'scripts', 'release.mjs');
const releaseHelpers = existsSync(releaseScript)
  ? await import(pathToFileURL(releaseScript).href)
  : undefined;
const skipWithoutPrivateScript = releaseHelpers === undefined;

test('release allowlist includes the bundle patch', { skip: skipWithoutPrivateScript }, () => {
  assert.ok(releaseHelpers.SHIP.includes('cordis.patch.yml'));
});

test(
  'release arguments support dry-run and reject unknown flags',
  { skip: skipWithoutPrivateScript },
  () => {
    const { parseReleaseArgs } = releaseHelpers;
    assert.deepEqual(parseReleaseArgs([]), { dryRun: false });
    assert.deepEqual(parseReleaseArgs(['--dry-run']), { dryRun: true });
    assert.throws(() => parseReleaseArgs(['--force']), /unknown argument/);
  },
);

test(
  'release target validation accepts only the expected sibling repository',
  { skip: skipWithoutPrivateScript },
  async () => {
    const { assertSafeReleaseRoot } = releaseHelpers;
    const parent = await mkdtemp(join(tmpdir(), 'dsh-vibe-release-'));
    const devRoot = join(parent, 'dsh-vibe-dev');
    const releaseRoot = join(parent, 'dsh-vibe');

    try {
      await mkdir(devRoot);
      await mkdir(join(releaseRoot, '.git'), { recursive: true });
      await writeFile(join(releaseRoot, 'package.json'), '{"name":"dsh-vibe"}\n');

      await assert.doesNotReject(assertSafeReleaseRoot(devRoot, releaseRoot));
      await assert.rejects(assertSafeReleaseRoot(devRoot, devRoot), /refusing unsafe target/);
      await assert.rejects(
        assertSafeReleaseRoot(devRoot, join(parent, 'somewhere-else')),
        /refusing unsafe target/,
      );
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  },
);
