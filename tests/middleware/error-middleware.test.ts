import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import {
  createImateapot,
  createInternalServerError,
  createMethodNotAllowed,
  createServiceUnavailable,
  HttpError,
} from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { LogFn, Logger, NamedLogFn } from '@chubbyts/chubbyts-log-types/dist/log';
import { describe, expect, test } from '@jest/globals';
import { PassThrough } from 'stream';
import { createErrorMiddleware, MapToHttpError } from '../../src/middleware/error-middleware';

describe('createErrorMiddleware', () => {
  test('no error, minimal', async () => {
    const request = {} as ServerRequest;
    const response = {} as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`{}`);

      return response;
    });

    const responseFactory: ResponseFactory = jest.fn();

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder);

    expect(await errorMiddleware(request, handler)).toBe(response);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });

  test('no error, maximal', async () => {
    const request = {} as ServerRequest;
    const response = {} as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`{}`);

      return response;
    });

    const responseFactory: ResponseFactory = jest.fn();

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const mapTohttpError: MapToHttpError = jest.fn();

    const logger: Logger = {} as Logger;

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder, mapTohttpError, true, logger);

    expect(await errorMiddleware(request, handler)).toBe(response);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });

  test('error, minimal', async () => {
    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`
        {
          "attributes": {
            "accept": "application/json",
          },
        }
      `);

      throw new Error('something went wrong');
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string): Response => {
      expect(givenStatus).toMatchInlineSnapshot(`500`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toMatchInlineSnapshot(`
        {
          "status": 500,
          "title": "Internal Server Error",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1",
        }
      `);
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      return '';
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('http client error, minimal', async () => {
    const httpError = createMethodNotAllowed({
      title: 'Method Not Allowed',
      detail: 'Some detail about the error',
    });

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`
        {
          "attributes": {
            "accept": "application/json",
          },
        }
      `);

      throw httpError;
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string): Response => {
      expect(givenStatus).toMatchInlineSnapshot(`405`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({ ...httpError });
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      return '';
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('http server error, minimal', async () => {
    const httpError = createInternalServerError({
      detail: 'Some detail about the error',
    });

    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`
        {
          "attributes": {
            "accept": "application/json",
          },
        }
      `);

      throw httpError;
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string): Response => {
      expect(givenStatus).toMatchInlineSnapshot(`500`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toMatchInlineSnapshot(`
        {
          "status": 500,
          "title": "Internal Server Error",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1",
        }
      `);
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      return '';
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('error to http client error, maximal', async () => {
    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`
        {
          "attributes": {
            "accept": "application/json",
          },
        }
      `);

      throw new Error('something went wrong');
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string): Response => {
      expect(givenStatus).toMatchInlineSnapshot(`418`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toMatchInlineSnapshot(`
        {
          "_httpError": "Imateapot",
          "detail": "teapod....",
          "status": 418,
          "title": "I'm a teapot",
          "type": "https://datatracker.ietf.org/doc/html/rfc2324#section-2.3.2",
        }
      `);
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      return '';
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const mapToHttpError: MapToHttpError = jest.fn((e: unknown): HttpError => {
      return createImateapot({ detail: 'teapod....' });
    });

    const info: NamedLogFn = jest.fn((givenMessage: string, givenContext: Record<string, unknown>): void => {
      expect(givenMessage).toMatchInlineSnapshot(`"Http Error"`);
      expect({ ...givenContext }).toMatchInlineSnapshot(`
        {
          "_httpError": "Imateapot",
          "detail": "teapod....",
          "status": 418,
          "title": "I'm a teapot",
          "type": "https://datatracker.ietf.org/doc/html/rfc2324#section-2.3.2",
        }
      `);
    });

    const logger: Logger = {
      info,
    } as Logger;

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder, mapToHttpError, true, logger);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('error to http server error, maximal', async () => {
    const request = { attributes: { accept: 'application/json' } } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`
        {
          "attributes": {
            "accept": "application/json",
          },
        }
      `);

      throw new Error('something went wrong');
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string): Response => {
      expect(givenStatus).toMatchInlineSnapshot(`503`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect({ ...(givenData as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "ServiceUnavailable",
          "detail": "Something went wrong",
          "status": 503,
          "title": "Service Unavailable",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.4",
        }
      `);
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      return '';
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const mapToHttpError: MapToHttpError = jest.fn((e: unknown): HttpError => {
      return createServiceUnavailable({
        detail: 'Something went wrong',
      });
    });

    const error: NamedLogFn = jest.fn((givenMessage: string, givenContext: Record<string, unknown>): void => {
      expect(givenMessage).toMatchInlineSnapshot(`"Http Error"`);
      expect({ ...(givenContext as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "ServiceUnavailable",
          "detail": "Something went wrong",
          "status": 503,
          "title": "Service Unavailable",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.4",
        }
      `);
    });

    const logger: Logger = {
      error,
    } as Logger;

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder, mapToHttpError, true, logger);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('error throw another error, maximal', async () => {
    const request = {
      attributes: { accept: 'application/json', clientIp: '172.16.0.2', requestId: '1149831cb8ea26571b8318dc74fa0659' },
    } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`
        {
          "attributes": {
            "accept": "application/json",
            "clientIp": "172.16.0.2",
            "requestId": "1149831cb8ea26571b8318dc74fa0659",
          },
        }
      `);

      throw new Error('something went wrong');
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string): Response => {
      expect(givenStatus).toMatchInlineSnapshot(`500`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toHaveProperty('error');

      // @ts-ignore
      delete givenData.error.stack;

      expect({ ...(givenData as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "InternalServerError",
          "error": {
            "message": "Another error",
            "name": "Error",
          },
          "status": 500,
          "title": "Internal Server Error",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1",
        }
      `);
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      return '';
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const mapToHttpError: MapToHttpError = jest.fn((e: unknown): HttpError => {
      throw new Error('Another error');
    });

    const error: NamedLogFn = jest.fn((givenMessage: string, givenContext: Record<string, unknown>): void => {
      expect(givenMessage).toMatchInlineSnapshot(`"Http Error"`);

      expect(givenContext).toHaveProperty('error');

      // @ts-ignore
      delete givenContext.error.stack;

      expect({ ...(givenContext as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "InternalServerError",
          "clientIp": "172.16.0.2",
          "error": {
            "message": "Another error",
            "name": "Error",
          },
          "requestId": "1149831cb8ea26571b8318dc74fa0659",
          "status": 500,
          "title": "Internal Server Error",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1",
          "unknownAttribute": undefined,
        }
      `);
    });

    const logger: Logger = {
      error,
    } as Logger;

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder, mapToHttpError, true, logger, [
      'clientIp',
      'requestId',
      'unknownAttribute',
    ]);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });
});
