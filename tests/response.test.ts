import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { EncodeError, Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { describe, expect, test } from '@jest/globals';
import { PassThrough } from 'stream';
import { ZodError } from 'zod';
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
      valueToData({ key: { errors: [new ZodError([{ code: 'custom', message: 'test', path: ['field'] }])] } });
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: Unsupported value of type ZodError]`);
    }
  });

  test('with unsupported function', () => {
    try {
      valueToData({ key: { functions: [() => {}] } });
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: Unsupported value of type function]`);
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
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(
        `[Error: Use createAcceptNegotiationMiddleware to assign request.attributes.accept.]`,
      );
    }
  });

  test('with missing encoder', () => {
    const data = {};

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;
    const response = {} as Response;

    try {
      stringifyResponseBody(request, response, undefined, data);
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: Missing encoder]`);
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

    const encode: Encoder['encode'] = jest.fn(
      (givenData: Data, givenContentType: string, givenContext?: Record<string, unknown>): string => {
        expect(givenData).toMatchInlineSnapshot(`
          {
            "key1": "value",
            "key2": 2,
            "key3": true,
            "key4": null,
            "key5": [
              "value",
              2,
              true,
              null,
            ],
            "key6": {
              "key1": "value",
              "key2": 2,
              "key3": true,
              "key4": null,
              "key5": [
                "value",
                2,
                true,
                null,
              ],
            },
          }
        `);
        expect(givenContentType).toBe('application/json');
        expect(givenContext).toEqual({ request });

        return JSON.stringify(givenData);
      },
    );

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    expect(stringifyResponseBody(request, response, encoder, data)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('with data, but with decode error', () => {
    const data = {
      key1: 'value',
    };

    const body = new PassThrough();

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;
    const response = { body } as unknown as Response;

    const encode: Encoder['encode'] = jest.fn(
      (givenData: Data, givenContentType: string, givenContext?: Record<string, unknown>): string => {
        expect(givenData).toMatchInlineSnapshot(`
          {
            "key1": "value",
          }
        `);
        expect(givenContentType).toBe('application/json');
        expect(givenContext).toEqual({ request });

        throw new EncodeError('something went wrong');
      },
    );

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    try {
      stringifyResponseBody(request, response, encoder, data);
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: something went wrong]`);
    }

    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('with data, but with unknown error', () => {
    const error = new Error('something went wrong');

    const data = {
      key1: 'value',
    };

    const body = new PassThrough();

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;
    const response = { body } as unknown as Response;

    const encode: Encoder['encode'] = jest.fn(
      (givenData: Data, givenContentType: string, givenContext?: Record<string, unknown>): string => {
        expect(givenData).toMatchInlineSnapshot(`
          {
            "key1": "value",
          }
        `);
        expect(givenContentType).toBe('application/json');
        expect(givenContext).toEqual({ request });

        throw error;
      },
    );

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    try {
      stringifyResponseBody(request, response, encoder, data);
      fail('Expect error');
    } catch (e) {
      expect(e).toBe(error);
    }

    expect(encode).toHaveBeenCalledTimes(1);
  });
});
