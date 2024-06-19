import { PassThrough } from 'stream';
import { describe, expect, test } from 'vitest';
import { streamToString } from '../src/stream';

describe('streamToString', () => {
  test('with PassThrough', async () => {
    const data = { key: 'value' };
    const encodedData = JSON.stringify(data);

    const steam = new PassThrough();
    steam.write(encodedData);
    steam.end();

    expect(await streamToString(steam)).toBe(encodedData);
  });
});
