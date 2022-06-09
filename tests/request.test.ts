import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { DecodeError, Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { describe, expect, test } from '@jest/globals';
import { PassThrough } from 'stream';
import { parseRequestBody } from '../src/request';

describe('parseRequestBody', () => {
  test('without given content type attribute', async () => {
    const request = { attributes: {} } as unknown as ServerRequest;

    const decoder: Decoder = {
      decode: () => ({}),
      contentTypes: ['application/json'],
    };

    try {
      await parseRequestBody(decoder, request);
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(
        `[Error: Use createContentTypeNegotiationMiddleware to assign request.attributes.contentType.]`,
      );
    }
  });

  test('with given content type attribute', async () => {
    const data = { key: 'value' };
    const encodedData = JSON.stringify(data);

    const body = new PassThrough();
    body.write(encodedData);
    body.end();

    const request = { attributes: { contentType: 'application/json' }, body } as unknown as ServerRequest;

    const decode: Decoder['decode'] = jest.fn((givenEncodedData: string, givenContentType: string): Data => {
      expect(givenEncodedData).toBe(encodedData);
      expect(givenContentType).toBe('application/json');

      return data;
    });

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    expect(await parseRequestBody(decoder, request)).toBe(data);

    expect(decode).toHaveBeenCalledTimes(1);
  });

  test('with given content type attribute, but with decode error', async () => {
    const data = { key: 'value' };
    const encodedData = JSON.stringify(data);

    const body = new PassThrough();
    body.write(encodedData);
    body.end();

    const request = { attributes: { contentType: 'application/json' }, body } as unknown as ServerRequest;

    const decode: Decoder['decode'] = jest.fn((givenEncodedData: string, givenContentType: string): Data => {
      expect(givenEncodedData).toBe(encodedData);
      expect(givenContentType).toBe('application/json');

      throw new DecodeError('something went wrong');
    });

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    try {
      await parseRequestBody(decoder, request);
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: something went wrong]`);
    }

    expect(decode).toHaveBeenCalledTimes(1);
  });

  test('with given content type attribute, but with unknown error', async () => {
    const error = new Error('something went wrong');

    const data = { key: 'value' };
    const encodedData = JSON.stringify(data);

    const body = new PassThrough();
    body.write(encodedData);
    body.end();

    const request = { attributes: { contentType: 'application/json' }, body } as unknown as ServerRequest;

    const decode: Decoder['decode'] = jest.fn((givenEncodedData: string, givenContentType: string): Data => {
      expect(givenEncodedData).toBe(encodedData);
      expect(givenContentType).toBe('application/json');

      throw error;
    });

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    try {
      await parseRequestBody(decoder, request);
      fail('Expect error');
    } catch (e) {
      expect(e).toBe(error);
    }

    expect(decode).toHaveBeenCalledTimes(1);
  });
});
