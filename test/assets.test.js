import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import sharp from 'sharp';

const assets = [
  { name: 'background.gif', pages: 24 },
  { name: 'thinking.gif', pages: 20 },
];

const manboAssets = ['brain-off.webp', 'joy.webp', 'loading.webp'];

for (const asset of assets) {
  test(`${asset.name} is a valid, compact animated GIF`, async () => {
    const path = join(import.meta.dirname, '..', 'assets', asset.name);
    const metadata = await sharp(path, { animated: true }).metadata();
    const info = await stat(path);

    assert.equal(metadata.format, 'gif');
    assert.equal(metadata.width, 720);
    assert.equal(metadata.pageHeight, 405);
    assert.equal(metadata.pages, asset.pages);
    assert.ok(metadata.delay?.every((delay) => delay >= 100));
    assert.ok(info.size < 1_000_000, `${asset.name} should remain below 1 MB`);

    // Force every frame through the decoder so truncated LZW streams fail.
    await sharp(path, { animated: true }).raw().toBuffer();
  });
}

for (const name of manboAssets) {
  test(`${name} is a valid, compact Manbo reaction frame`, async () => {
    const path = join(import.meta.dirname, '..', 'assets', 'manbo', name);
    const metadata = await sharp(path).metadata();
    const info = await stat(path);

    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.width, 256);
    assert.equal(metadata.height, 256);
    assert.ok(info.size < 20_000, `${name} should remain below 20 KB`);

    // Force the complete image through the decoder so corrupt files fail.
    await sharp(path).raw().toBuffer();
  });
}

test('Manbo reaction frames remain below 60 KB in total', async () => {
  const sizes = await Promise.all(
    manboAssets.map(async (name) => {
      const path = join(import.meta.dirname, '..', 'assets', 'manbo', name);
      return (await stat(path)).size;
    }),
  );

  assert.ok(
    sizes.reduce((total, size) => total + size, 0) < 60_000,
    'Manbo reaction frames should remain below 60 KB in total',
  );
});

test('Manbo thinking loop is a compact MP3 asset', async () => {
  const path = join(import.meta.dirname, '..', 'assets', 'manbo', 'thinking-loop.mp3');
  const [data, info] = await Promise.all([readFile(path), stat(path)]);

  assert.equal(data.subarray(0, 3).toString('ascii'), 'ID3');
  assert.ok(info.size > 50_000, 'thinking-loop.mp3 should contain a real music clip');
  assert.ok(info.size < 150_000, 'thinking-loop.mp3 should remain below 150 KB');
  assert.ok(
    data
      .subarray(10)
      .some((byte, index, bytes) => byte === 0xff && (bytes[index + 1] & 0xe0) === 0xe0),
    'thinking-loop.mp3 should contain an MPEG audio frame',
  );
});
