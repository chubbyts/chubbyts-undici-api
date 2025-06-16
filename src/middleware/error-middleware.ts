import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { ServerRequest, Response, Uri } from '@chubbyts/chubbyts-http-types/dist/message';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { createInternalServerError, isHttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Logger } from '@chubbyts/chubbyts-log-types/dist/log';
import { createLogger } from '@chubbyts/chubbyts-log-types/dist/log';
import { throwableToError } from '@chubbyts/chubbyts-throwable-to-error/dist/throwable-to-error';
import type { Middleware } from '@chubbyts/chubbyts-http-types/dist/middleware';
import { stringify } from 'qs';
import { stringifyResponseBody, valueToData } from '../response.js';

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

const resolvePathQueryFragment = (uri: Uri): string => {
  const query = stringify(uri.query);

  return [uri.path, query ? `?${query}` : '', uri.fragment ? `#${uri.fragment}` : ''].join('');
};

export const createErrorMiddleware = (
  responseFactory: ResponseFactory,
  encoder: Encoder,
  mapToHttpError: MapToHttpError = (e: unknown) => {
    throw e;
  },
  debug = false,
  logger: Logger = createLogger(),
  loggableAttributeNames: Array<string> = [],
): Middleware => {
  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    try {
      return await handler(request);
    } catch (e) {
      const httpError = eToHttpError(e, mapToHttpError);
      const isClientError = httpError.status < 500;

      logger[isClientError ? 'info' : 'error']('Http Error', {
        method: request.method,
        pathQueryFragment: resolvePathQueryFragment(request.uri),
        ...Object.fromEntries(loggableAttributeNames.map((name) => [name, request.attributes[name] ?? undefined])),
        ...httpError,
      });

      return stringifyResponseBody(
        request,
        responseFactory(httpError.status),
        encoder,
        valueToData(
          isClientError || debug
            ? httpError
            : { type: httpError.type, status: httpError.status, title: httpError.title },
        ),
      );
    }
  };
};
