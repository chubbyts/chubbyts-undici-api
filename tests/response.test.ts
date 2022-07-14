import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { EncodeError, Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { isHttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { describe, expect, test } from '@jest/globals';
import { PassThrough } from 'stream';
import { ZodError } from 'zod';
import { stringifyResponseBody } from '../src/response';

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

  test('with unsupported: object of A', () => {
    class A {}

    const data = new A();

    const body = new PassThrough();

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;
    const response = { body } as unknown as Response;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    try {
      stringifyResponseBody(request, response, encoder, data);
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: Unsupported value of type A]`);
    }

    expect(encode).toHaveBeenCalledTimes(0);
  });

  test('with unsupported: function', () => {
    const data = () => undefined;

    const body = new PassThrough();

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;
    const response = { body } as unknown as Response;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    try {
      stringifyResponseBody(request, response, encoder, data);
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`[Error: Unsupported value of type function]`);
    }

    expect(encode).toHaveBeenCalledTimes(0);
  });

  test('with data', () => {
    const data = {
      key1: 'value',
      key2: 2,
      key3: true,
      key4: null,
      key5: undefined,
      key6: new Date('2022-06-09T19:43:12.326Z'),
      key7: new ZodError([{ code: 'custom', message: 'test', path: ['field'] }]),
      key8: [
        'value',
        2,
        true,
        null,
        undefined,
        new Date('2022-06-09T19:43:12.326Z'),
        new ZodError([{ code: 'custom', message: 'test', path: ['field'] }]),
      ],
      key9: {
        key1: 'value',
        key2: 2,
        key3: true,
        key4: null,
        key5: undefined,
        key6: new Date('2022-06-09T19:43:12.326Z'),
        key7: new ZodError([{ code: 'custom', message: 'test', path: ['field'] }]),
        key8: [
          'value',
          2,
          true,
          null,
          undefined,
          new Date('2022-06-09T19:43:12.326Z'),
          new ZodError([{ code: 'custom', message: 'test', path: ['field'] }]),
        ],
      },
    };

    const body = new PassThrough();

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;
    const response = { body } as unknown as Response;

    const encode: Encoder['encode'] = jest.fn(
      (givenData: Data, givenContentType: string, givenContext?: Record<string, unknown>): string => {
        expect(givenData).toMatchInlineSnapshot(`
            Object {
              "key1": "value",
              "key2": 2,
              "key3": true,
              "key4": null,
              "key6": "2022-06-09T19:43:12.326Z",
              "key7": Array [
                Object {
                  "code": "custom",
                  "message": "test",
                  "path": Array [
                    "field",
                  ],
                },
              ],
              "key8": Array [
                "value",
                2,
                true,
                null,
                "2022-06-09T19:43:12.326Z",
                Array [
                  Object {
                    "code": "custom",
                    "message": "test",
                    "path": Array [
                      "field",
                    ],
                  },
                ],
              ],
              "key9": Object {
                "key1": "value",
                "key2": 2,
                "key3": true,
                "key4": null,
                "key6": "2022-06-09T19:43:12.326Z",
                "key7": Array [
                  Object {
                    "code": "custom",
                    "message": "test",
                    "path": Array [
                      "field",
                    ],
                  },
                ],
                "key8": Array [
                  "value",
                  2,
                  true,
                  null,
                  "2022-06-09T19:43:12.326Z",
                  Array [
                    Object {
                      "code": "custom",
                      "message": "test",
                      "path": Array [
                        "field",
                      ],
                    },
                  ],
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
            Object {
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
            Object {
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
