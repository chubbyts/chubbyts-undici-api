import { PassThrough } from 'stream';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { DecodeError } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { describe, expect, test } from '@jest/globals';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { parseRequestBody } from '../src/request';

describe('parseRequestBody', () => {
  test('without given content type attribute', async () => {
    const request = { attributes: {} } as unknown as ServerRequest;

    const [decoder, decoderMocks] = useObjectMock<Decoder>([]);

    try {
      await parseRequestBody(decoder, request);
      throw new Error('Expect Error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(
        '[Error: Use createContentTypeNegotiationMiddleware to assign request.attributes.contentType.]',
      );
    }

    expect(decoderMocks.length).toBe(0);
  });

  test('with given content type attribute', async () => {
    const data = { key: 'value' };
    const encodedData = JSON.stringify(data);

    const body = new PassThrough();
    body.write(encodedData);
    body.end();

    const request = { attributes: { contentType: 'application/json' }, body } as unknown as ServerRequest;

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedData, 'application/json', { request }], return: data },
    ]);

    expect(await parseRequestBody(decoder, request)).toBe(data);

    expect(decoderMocks.length).toBe(0);
  });

  test('with given content type attribute, but with decode error', async () => {
    const error = new DecodeError('something went wrong');

    const data = { key: 'value' };
    const encodedData = JSON.stringify(data);

    const body = new PassThrough();
    body.write(encodedData);
    body.end();

    const request = { attributes: { contentType: 'application/json' }, body } as unknown as ServerRequest;

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedData, 'application/json', { request }], error },
    ]);

    try {
      await parseRequestBody(decoder, request);
      throw new Error('Expect Error');
    } catch (e) {
      expect(e).toBe(error);
    }

    expect(decoderMocks.length).toBe(0);
  });
});
