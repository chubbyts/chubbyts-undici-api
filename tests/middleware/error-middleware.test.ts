import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
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
    const httpError: HttpError = {
      type: 'https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.6',
      status: 405,
      title: 'Method Not Allowed',
      detail: 'Some detail about the error',
      _httpError: 'MethodNotAllowed',
    };

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
      expect(givenData).toEqual(httpError);
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
    const httpError: HttpError = {
      type: 'https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1',
      status: 500,
      title: 'Internal Server Error',
      detail: 'Some detail about the error',
      _httpError: 'InternalServerError',
    };

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
      return {
        type: 'https://datatracker.ietf.org/doc/html/rfc2324#section-2.3.2',
        status: 418,
        title: "I'm a teapot",
        detail: 'teapod....',
        _httpError: 'Imateapot',
      };
    });

    const info: NamedLogFn = jest.fn((givenMessage: string, context: Record<string, unknown>): void => {
      expect(givenMessage).toMatchInlineSnapshot(`"Http Error"`);
      expect(context).toMatchInlineSnapshot(`
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
      expect(givenData).toMatchInlineSnapshot(`
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
      return {
        type: 'https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.4',
        status: 503,
        title: 'Service Unavailable',
        detail: 'Something went wrong',
        _httpError: 'ServiceUnavailable',
      };
    });

    const error: NamedLogFn = jest.fn((givenMessage: string, context: Record<string, unknown>): void => {
      expect(givenMessage).toMatchInlineSnapshot(`"Http Error"`);
      expect(context).toMatchInlineSnapshot(`
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
      expect(givenData).toHaveProperty('error');

      // @ts-ignore
      delete givenData.error.stack;

      expect(givenData).toMatchInlineSnapshot(`
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

    const error: NamedLogFn = jest.fn((givenMessage: string, context: Record<string, unknown>): void => {
      expect(givenMessage).toMatchInlineSnapshot(`"Http Error"`);

      expect(context).toHaveProperty('error');

      // @ts-ignore
      delete context.error.stack;

      expect(context).toMatchInlineSnapshot(`
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
});
