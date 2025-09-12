import { STATUS_CODES } from 'node:http';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { createInternalServerError, isHttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { Logger } from '@chubbyts/chubbyts-log-types/dist/log';
import { createLogger } from '@chubbyts/chubbyts-log-types/dist/log';
import { throwableToError } from '@chubbyts/chubbyts-throwable-to-error/dist/throwable-to-error';
import type { Handler, Middleware, ServerRequest, Response } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createResponseWithData, valueToData } from '../response.js';

export type MapToHttpError = (e: unknown) => HttpError;

const eToHttpError = (e: unknown, mapToHttpError: MapToHttpError): HttpError => {
  if (isHttpError(e)) {
    return e;
  }

  try {
    return mapToHttpError(e);
  } catch (me) {
    const error = throwableToError(me);

    return createInternalServerError({ error: { name: error.name, message: error.message, stack: error.stack } });
  }
};

const resolvePathnameSearch = (url: URL): string => `${url.pathname}${url.search}`;

export const createErrorMiddleware = (
  encoder: Encoder,
  mapToHttpError: MapToHttpError = (e: unknown) => {
    throw e;
  },
  debug = false,
  logger: Logger = createLogger(),
  loggableAttributeNames: Array<string> = [],
): Middleware => {
  return async (serverRequest: ServerRequest, handler: Handler): Promise<Response> => {
    try {
      return await handler(serverRequest);
    } catch (e) {
      const httpError = eToHttpError(e, mapToHttpError);
      const isClientError = httpError.status < 500;

      logger[isClientError ? 'info' : 'error']('Http Error', {
        method: serverRequest.method,
        pathnameSearch: resolvePathnameSearch(new URL(serverRequest.url)),
        ...Object.fromEntries(
          loggableAttributeNames.map((name) => [name, serverRequest.attributes[name] ?? undefined]),
        ),
        ...httpError,
      });

      return createResponseWithData(
        serverRequest,
        encoder,
        valueToData(
          isClientError || debug
            ? httpError
            : { type: httpError.type, status: httpError.status, title: httpError.title },
        ),
        httpError.status,
        STATUS_CODES[httpError.status],
      );
    }
  };
};
