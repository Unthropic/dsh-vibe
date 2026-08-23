import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const patch = await readFile(join(root, 'cordis.patch.yml'), 'utf8');
const readme = await readFile(join(root, 'README.md'), 'utf8');
const translatedReadme = await readFile(join(root, 'README.zh-CN.md'), 'utf8');

test('package declares the native Harness bundle patch', () => {
  assert.deepEqual(manifest.dsh.bundle, { patch: './cordis.patch.yml' });
  assert.deepEqual(manifest.dsh.client, { platform: 'web', immediately: true });
  assert.equal(manifest.dependencies['@deepseek-ai/schemastery'], '^3.18.1');
});

test('bundle patch inserts dsh-vibe exactly once', () => {
  assert.equal((patch.match(/\bid:\s*dsh-vibe\b/g) ?? []).length, 1);
  assert.equal((patch.match(/\bname:\s*dsh-vibe\b/g) ?? []).length, 1);
  assert.match(patch, /^- insert:\r?\n\s+- id: dsh-vibe\r?\n\s+name: dsh-vibe\r?\n?$/);
});

test('npm package exposes the bundle patch and includes release documentation', () => {
  assert.equal(manifest.exports['./cordis.patch.yml'], './cordis.patch.yml');
  assert.ok(manifest.files.includes('cordis.patch.yml'));
  assert.ok(manifest.files.includes('README.md'));
  assert.ok(manifest.files.includes('README.zh-CN.md'));
  assert.ok(translatedReadme.trim().length > 0);
  assert.match(readme, /English \| \[简体中文\]\(README\.zh-CN\.md\)/);
  assert.match(translatedReadme, /\[English\]\(README\.md\) \| 简体中文/);
});
