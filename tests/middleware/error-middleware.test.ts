import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import {
  createImateapot,
  createInternalServerError,
  createMethodNotAllowed,
  createServiceUnavailable,
} from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Logger } from '@chubbyts/chubbyts-log-types/dist/log';
import { describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { MapToHttpError } from '../../src/middleware/error-middleware';
import { createErrorMiddleware } from '../../src/middleware/error-middleware';

describe('error-middleware', () => {
  describe('createErrorMiddleware', () => {
    test('no error, minimal', async () => {
      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
      });

      const response = new Response();

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          parameters: [serverRequest],
          return: Promise.resolve(response),
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const errorMiddleware = createErrorMiddleware(encoder);

      expect(await errorMiddleware(serverRequest, handler)).toBe(response);

      expect(handlerMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('no error, maximal', async () => {
      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
      });

      const response = new Response();

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          parameters: [serverRequest],
          return: Promise.resolve(response),
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const [mapTohttpError, mapTohttpErrorMocks] = useFunctionMock<MapToHttpError>([]);

      const logger: Logger = {} as Logger;

      const errorMiddleware = createErrorMiddleware(encoder, mapTohttpError, true, logger);

      expect(await errorMiddleware(serverRequest, handler)).toBe(response);

      expect(handlerMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
      expect(mapTohttpErrorMocks.length).toBe(0);
    });

    test('error, minimal', async () => {
      const error = new Error('something went wrong');

      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
        attributes: { accept: 'application/json' },
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          parameters: [serverRequest],
          error,
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          parameters: [
            {
              status: 500,
              title: 'Internal Server Error',
              type: 'https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1',
            },
            'application/json',
            { serverRequest },
          ],
          return: JSON.stringify({
            status: 500,
            title: 'Internal Server Error',
            type: 'https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1',
          }),
        },
      ]);

      const errorMiddleware = createErrorMiddleware(encoder);

      const response = await errorMiddleware(serverRequest, handler);

      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Internal Server Error');
      expect(Object.fromEntries([...response.headers.entries()])).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toMatchInlineSnapshot(`
        {
          "status": 500,
          "title": "Internal Server Error",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1",
        }
      `);

      expect(handlerMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('http client error, minimal', async () => {
      const httpError = createMethodNotAllowed({
        title: 'Method Not Allowed',
        detail: 'Some detail about the error',
      });

      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
        attributes: { accept: 'application/json' },
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          parameters: [serverRequest],
          error: httpError,
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          parameters: [{ ...httpError } as Data, 'application/json', { serverRequest }],
          return: JSON.stringify({ ...httpError }),
        },
      ]);

      const errorMiddleware = createErrorMiddleware(encoder);

      const response = await errorMiddleware(serverRequest, handler);

      expect(response.status).toBe(405);
      expect(response.statusText).toBe('Method Not Allowed');
      expect(Object.fromEntries([...response.headers.entries()])).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toEqual({ ...httpError });

      expect(handlerMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('http server error, minimal', async () => {
      const httpError = createInternalServerError({
        detail: 'Some detail about the error',
      });

      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
        attributes: { accept: 'application/json' },
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          parameters: [serverRequest],
          error: httpError,
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          parameters: [
            { type: httpError.type, status: httpError.status, title: httpError.title },
            'application/json',
            { serverRequest },
          ],
          return: JSON.stringify({ type: httpError.type, status: httpError.status, title: httpError.title }),
        },
      ]);

      const errorMiddleware = createErrorMiddleware(encoder);

      const response = await errorMiddleware(serverRequest, handler);

      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Internal Server Error');
      expect(Object.fromEntries([...response.headers.entries()])).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toEqual({ type: httpError.type, status: httpError.status, title: httpError.title });

      expect(handlerMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('error to http client error, maximal', async () => {
      const error = new Error('something went wrong');
      const httpError = createImateapot({ detail: 'teapod....' });

      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
        attributes: { accept: 'application/json' },
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          parameters: [serverRequest],
          error,
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          parameters: [{ ...httpError } as Data, 'application/json', { serverRequest }],
          return: JSON.stringify({ ...httpError }),
        },
      ]);

      const [mapToHttpError, mapToHttpErrorMocks] = useFunctionMock<MapToHttpError>([
        { parameters: [error], return: httpError },
      ]);

      const [logger, loggerMocks] = useObjectMock<Logger>([
        {
          name: 'info',
          callback: (givenMessage: string, givenContext: Record<string, unknown>): void => {
            expect(givenMessage).toMatchInlineSnapshot('"Http Error"');
            expect({ ...givenContext }).toMatchInlineSnapshot(`
              {
                "_httpError": "Imateapot",
                "detail": "teapod....",
                "method": "GET",
                "pathnameSearch": "/path/to/route",
                "status": 418,
                "title": "I'm a teapot",
                "type": "https://datatracker.ietf.org/doc/html/rfc2324#section-2.3.2",
              }
            `);
          },
        },
      ]);

      const errorMiddleware = createErrorMiddleware(encoder, mapToHttpError, true, logger);

      const response = await errorMiddleware(serverRequest, handler);

      expect(response.status).toBe(418);
      expect(response.statusText).toBe("I'm a Teapot");
      expect(Object.fromEntries([...response.headers.entries()])).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toEqual({ ...httpError });

      expect(handlerMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
      expect(mapToHttpErrorMocks.length).toBe(0);
      expect(loggerMocks.length).toBe(0);
    });

    test('error to http server error, maximal', async () => {
      const error = new Error('something went wrong');

      const httpError = createServiceUnavailable({
        detail: 'Something went wrong',
      });

      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
        attributes: { accept: 'application/json' },
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          parameters: [serverRequest],
          error,
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          parameters: [{ ...httpError } as Data, 'application/json', { serverRequest }],
          return: JSON.stringify({ ...httpError }),
        },
      ]);

      const [mapToHttpError, mapToHttpErrorMocks] = useFunctionMock<MapToHttpError>([
        {
          parameters: [error],
          return: httpError,
        },
      ]);

      const [logger, loggerMocks] = useObjectMock<Logger>([
        {
          name: 'error',
          callback: (givenMessage: string, givenContext: Record<string, unknown>): void => {
            expect(givenMessage).toMatchInlineSnapshot('"Http Error"');
            expect({ ...(givenContext as HttpError) }).toMatchInlineSnapshot(`
              {
                "_httpError": "ServiceUnavailable",
                "detail": "Something went wrong",
                "method": "GET",
                "pathnameSearch": "/path/to/route",
                "status": 503,
                "title": "Service Unavailable",
                "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.4",
              }
            `);
          },
        },
      ]);

      const errorMiddleware = createErrorMiddleware(encoder, mapToHttpError, true, logger);

      const response = await errorMiddleware(serverRequest, handler);

      expect(response.status).toBe(503);
      expect(response.statusText).toBe('Service Unavailable');
      expect(Object.fromEntries([...response.headers.entries()])).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toEqual({ ...httpError });

      expect(handlerMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
      expect(mapToHttpErrorMocks.length).toBe(0);
      expect(loggerMocks.length).toBe(0);
    });

    test('error throw another error, maximal', async () => {
      const error = new Error('something went wrong');

      const serverRequest = new ServerRequest('https://example.com/path/to/route?key1%5Bkey11%5D=value11', {
        method: 'GET',
        attributes: {
          accept: 'application/json',
          clientIp: '172.16.0.2',
          requestId: '1149831cb8ea26571b8318dc74fa0659',
        },
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          parameters: [serverRequest],
          error,
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          callback: (givenData, givenContentType, givenContext) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line functional/immutable-data
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
            expect(givenContentType).toBe('application/json');
            expect(givenContext).toEqual({ serverRequest });

            return JSON.stringify(givenData);
          },
        },
      ]);

      const [mapToHttpError, mapToHttpErrorMocks] = useFunctionMock<MapToHttpError>([
        {
          parameters: [error],
          error: new Error('Another error'),
        },
      ]);

      const [logger, loggerMocks] = useObjectMock<Logger>([
        {
          name: 'error',
          callback: (givenMessage: string, givenContext: Record<string, unknown>): void => {
            expect(givenMessage).toMatchInlineSnapshot('"Http Error"');

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // eslint-disable-next-line functional/immutable-data
            delete givenContext.error.stack;

            expect({ ...(givenContext as HttpError) }).toMatchInlineSnapshot(`
              {
                "_httpError": "InternalServerError",
                "clientIp": "172.16.0.2",
                "error": {
                  "message": "Another error",
                  "name": "Error",
                },
                "method": "GET",
                "pathnameSearch": "/path/to/route?key1%5Bkey11%5D=value11",
                "requestId": "1149831cb8ea26571b8318dc74fa0659",
                "status": 500,
                "title": "Internal Server Error",
                "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1",
                "unknownAttribute": undefined,
              }
            `);
          },
        },
      ]);

      const errorMiddleware = createErrorMiddleware(encoder, mapToHttpError, true, logger, [
        'clientIp',
        'requestId',
        'unknownAttribute',
      ]);

      const response = await errorMiddleware(serverRequest, handler);

      expect(response.status).toBe(500);
      expect(response.statusText).toBe('Internal Server Error');
      expect(Object.fromEntries([...response.headers.entries()])).toMatchInlineSnapshot(`
        {
          "content-type": "application/json",
        }
      `);

      expect(await response.json()).toMatchInlineSnapshot(`
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

      expect(handlerMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
      expect(mapToHttpErrorMocks.length).toBe(0);
      expect(loggerMocks.length).toBe(0);
    });
  });
});
