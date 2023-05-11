import { PassThrough } from 'stream';
import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import {
  createImateapot,
  createInternalServerError,
  createMethodNotAllowed,
  createServiceUnavailable,
} from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest, Uri } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { Logger } from '@chubbyts/chubbyts-log-types/dist/log';
import { describe, expect, test } from '@jest/globals';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import type { MapToHttpError } from '../../src/middleware/error-middleware';
import { createErrorMiddleware } from '../../src/middleware/error-middleware';

describe('createErrorMiddleware', () => {
  test('no error, minimal', async () => {
    const request = {
      method: 'GET',
      uri: { path: '/path/to/route' } as unknown as Uri,
    } as ServerRequest;
    const response = {} as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [request],
        return: Promise.resolve(response),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder);

    expect(await errorMiddleware(request, handler)).toBe(response);

    expect(handlerMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('no error, maximal', async () => {
    const request = {
      method: 'GET',
      uri: { path: '/path/to/route' } as unknown as Uri,
    } as ServerRequest;

    const response = {} as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [request],
        return: Promise.resolve(response),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const [mapTohttpError, mapTohttpErrorMocks] = useFunctionMock<MapToHttpError>([]);

    const logger: Logger = {} as Logger;

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder, mapTohttpError, true, logger);

    expect(await errorMiddleware(request, handler)).toBe(response);

    expect(handlerMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(mapTohttpErrorMocks.length).toBe(0);
  });

  test('error, minimal', async () => {
    const error = new Error('something went wrong');

    const request = {
      method: 'GET',
      uri: { path: '/path/to/route' } as unknown as Uri,
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [request],
        error,
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      { parameters: [500], return: response },
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
          { request },
        ],
        return: '',
      },
    ]);

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handlerMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('http client error, minimal', async () => {
    const httpError = createMethodNotAllowed({
      title: 'Method Not Allowed',
      detail: 'Some detail about the error',
    });

    const request = {
      method: 'GET',
      uri: { path: '/path/to/route' } as unknown as Uri,
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [request],
        error: httpError,
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      { parameters: [405], return: response },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        parameters: [{ ...httpError } as Data, 'application/json', { request }],
        return: '',
      },
    ]);

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handlerMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('http server error, minimal', async () => {
    const httpError = createInternalServerError({
      detail: 'Some detail about the error',
    });

    const request = {
      method: 'GET',
      uri: { path: '/path/to/route' } as unknown as Uri,
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [request],
        error: httpError,
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      { parameters: [500], return: response },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData, givenContentType, givenContext) => {
          expect(givenData).toMatchInlineSnapshot(`
            {
              "status": 500,
              "title": "Internal Server Error",
              "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.1",
            }
          `);
          expect(givenContentType).toBe('application/json');
          expect(givenContext).toEqual({ request });

          return '';
        },
      },
    ]);

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handlerMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('error to http client error, maximal', async () => {
    const error = new Error('something went wrong');

    const request = {
      method: 'GET',
      uri: { path: '/path/to/route' } as unknown as Uri,
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [request],
        error,
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      { parameters: [418], return: response },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData, givenContentType, givenContext) => {
          expect(givenData).toMatchInlineSnapshot(`
            {
              "_httpError": "Imateapot",
              "detail": "teapod....",
              "status": 418,
              "title": "I'm a teapot",
              "type": "https://datatracker.ietf.org/doc/html/rfc2324#section-2.3.2",
            }
          `);
          expect(givenContentType).toBe('application/json');
          expect(givenContext).toEqual({ request });

          return '';
        },
      },
    ]);

    const [mapToHttpError, mapToHttpErrorMocks] = useFunctionMock<MapToHttpError>([
      { parameters: [error], return: createImateapot({ detail: 'teapod....' }) },
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
              "pathQueryFragment": "/path/to/route",
              "status": 418,
              "title": "I'm a teapot",
              "type": "https://datatracker.ietf.org/doc/html/rfc2324#section-2.3.2",
            }
          `);
        },
      },
    ]);

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder, mapToHttpError, true, logger);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handlerMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(mapToHttpErrorMocks.length).toBe(0);
    expect(loggerMocks.length).toBe(0);
  });

  test('error to http server error, maximal', async () => {
    const error = new Error('something went wrong');

    const request = {
      method: 'GET',
      uri: { path: '/path/to/route' } as unknown as Uri,
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [request],
        error,
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      { parameters: [503], return: response },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData, givenContentType, givenContext) => {
          expect(givenData).toMatchInlineSnapshot(`
            {
              "_httpError": "ServiceUnavailable",
              "detail": "Something went wrong",
              "status": 503,
              "title": "Service Unavailable",
              "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.4",
            }
          `);
          expect(givenContentType).toBe('application/json');
          expect(givenContext).toEqual({ request });

          return '';
        },
      },
    ]);

    const [mapToHttpError, mapToHttpErrorMocks] = useFunctionMock<MapToHttpError>([
      {
        parameters: [error],
        return: createServiceUnavailable({
          detail: 'Something went wrong',
        }),
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
              "pathQueryFragment": "/path/to/route",
              "status": 503,
              "title": "Service Unavailable",
              "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.5.4",
            }
          `);
        },
      },
    ]);

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder, mapToHttpError, true, logger);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handlerMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(mapToHttpErrorMocks.length).toBe(0);
    expect(loggerMocks.length).toBe(0);
  });

  test('error throw another error, maximal', async () => {
    const error = new Error('something went wrong');

    const request = {
      method: 'GET',
      uri: { path: '/path/to/route', query: { key1: { key11: 'value11' } }, fragment: '1234' } as unknown as Uri,
      attributes: { accept: 'application/json', clientIp: '172.16.0.2', requestId: '1149831cb8ea26571b8318dc74fa0659' },
    } as unknown as ServerRequest;

    const body = new PassThrough();
    const response = { body } as unknown as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        parameters: [request],
        error,
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      { parameters: [500], return: response },
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
          expect(givenContext).toEqual({ request });

          return '';
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
              "pathQueryFragment": "/path/to/route?key1%5Bkey11%5D=value11#1234",
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

    const errorMiddleware = createErrorMiddleware(responseFactory, encoder, mapToHttpError, true, logger, [
      'clientIp',
      'requestId',
      'unknownAttribute',
    ]);

    expect(await errorMiddleware(request, handler)).toEqual({
      ...response,
      headers: { 'content-type': ['application/json'] },
    });

    expect(handlerMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(mapToHttpErrorMocks.length).toBe(0);
    expect(loggerMocks.length).toBe(0);
  });
});
