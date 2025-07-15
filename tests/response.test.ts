import { PassThrough } from 'stream';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { EncodeError } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { describe, expect, test } from 'vitest';
import { ZodError } from 'zod';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { stringifyResponseBody, valueToData } from '../src/response';

describe('valueToData', () => {
  test('with supported data', () => {
    expect(
      valueToData({
        key1: 'value',
        key2: 2,
        key3: true,
        key4: null,
        key5: undefined,
        key6: new Date('2022-06-09T19:43:12.326Z'),
        key7: ['value', 2, true, null, undefined, new Date('2022-06-09T19:43:12.326Z')],
        key8: {
          key1: 'value',
          key2: 2,
          key3: true,
          key4: null,
          key5: undefined,
          key6: new Date('2022-06-09T19:43:12.326Z'),
          key7: ['value', 2, true, null, undefined, new Date('2022-06-09T19:43:12.326Z')],
        },
      }),
    ).toMatchInlineSnapshot(`
      {
        "key1": "value",
        "key2": 2,
        "key3": true,
        "key4": null,
        "key6": "2022-06-09T19:43:12.326Z",
        "key7": [
          "value",
          2,
          true,
          null,
          "2022-06-09T19:43:12.326Z",
        ],
        "key8": {
          "key1": "value",
          "key2": 2,
          "key3": true,
          "key4": null,
          "key6": "2022-06-09T19:43:12.326Z",
          "key7": [
            "value",
            2,
            true,
            null,
            "2022-06-09T19:43:12.326Z",
          ],
        },
      }
    `);
  });

  test('with unsupported object', () => {
    try {
      valueToData({
        key: {
          errors: [
            new ZodError([
              {
                code: 'custom',
                params: { key: 'value' },
                input: 'data',
                message: 'Custom',
                path: ['path', 'to', 'field'],
              },
            ]),
          ],
        },
      });
      throw new Error('Expect Error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot('[Error: Unsupported value of type ZodError]');
    }
  });

  test('with unsupported function', () => {
    try {
      valueToData({ key: { functions: [() => undefined] } });
      throw new Error('Expect Error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot('[Error: Unsupported value of type function]');
    }
  });
});

describe('stringifyResponseBody', () => {
  test('without data', () => {
    const body = new PassThrough();

    const request = {} as ServerRequest;
    const response = { body } as unknown as Response;

    expect(stringifyResponseBody(request, response)).toBe(response);
  });

  test('without given accept attribute', () => {
    const data = {};

    const request = { attributes: {} } as ServerRequest;
    const response = {} as Response;

    try {
      stringifyResponseBody(request, response, undefined, data);
      throw new Error('Expect Error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(
        '[Error: Use createAcceptNegotiationMiddleware to assign request.attributes.accept.]',
      );
    }
  });

  test('with missing encoder', () => {
    const data = {};

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;
    const response = {} as Response;

    try {
      stringifyResponseBody(request, response, undefined, data);
      throw new Error('Expect Error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot('[Error: Missing encoder]');
    }
  });

  test('with data', () => {
    const data = {
      key1: 'value',
      key2: 2,
      key3: true,
      key4: null,
      key5: ['value', 2, true, null],
      key6: {
        key1: 'value',
        key2: 2,
        key3: true,
        key4: null,
        key5: ['value', 2, true, null],
      },
    };

    const body = new PassThrough();

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;
    const response = { body } as unknown as Response;

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      { name: 'encode', parameters: [data, 'application/json', { request }], return: JSON.stringify(data) },
    ]);

    expect(stringifyResponseBody(request, response, encoder, data)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(encoderMocks.length).toBe(0);
  });

  test('with data, but with decode error', () => {
    const error = new EncodeError('something went wrong');

    const data = {
      key1: 'value',
    };

    const body = new PassThrough();

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;
    const response = { body } as unknown as Response;

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      { name: 'encode', parameters: [data, 'application/json', { request }], error },
    ]);

    try {
      stringifyResponseBody(request, response, encoder, data);
      throw new Error('Expect Error');
    } catch (e) {
      expect(e).toBe(error);
    }

    expect(encoderMocks.length).toBe(0);
  });
});
