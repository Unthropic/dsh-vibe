import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const patch = await readFile(join(root, 'cordis.patch.yml'), 'utf8');

test('package declares the native Harness bundle patch', () => {
  assert.deepEqual(manifest.dsh.bundle, { patch: './cordis.patch.yml' });
  assert.deepEqual(manifest.dsh.client, { platform: 'web', immediately: true });
});

test('bundle patch inserts dsh-vibe exactly once', () => {
  assert.equal((patch.match(/\bid:\s*dsh-vibe\b/g) ?? []).length, 1);
  assert.equal((patch.match(/\bname:\s*dsh-vibe\b/g) ?? []).length, 1);
  assert.match(patch, /^- insert:\r?\n\s+- id: dsh-vibe\r?\n\s+name: dsh-vibe\r?\n?$/);
});

test('npm package exposes and includes the bundle patch', () => {
  assert.equal(manifest.exports['./cordis.patch.yml'], './cordis.patch.yml');
  assert.ok(manifest.files.includes('cordis.patch.yml'));
});
