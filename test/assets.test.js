import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

import sharp from 'sharp';

const assets = [
  { name: 'background.gif', pages: 24 },
  { name: 'thinking.gif', pages: 20 },
];

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
