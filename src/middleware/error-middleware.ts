import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { ServerRequest, Response } from '@chubbyts/chubbyts-http-types/dist/message';
import { createInternalServerError, HttpError, isHttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { LogLevel, Logger, createLogger } from '@chubbyts/chubbyts-log-types/dist/log';
import { throwableToError } from '@chubbyts/chubbyts-throwable-to-error/dist/throwable-to-error';
import { stringifyResponseBody, valueToData } from '../response';
import { Middleware } from '@chubbyts/chubbyts-http-types/dist/middleware';

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

export const createErrorMiddleware = (
  responseFactory: ResponseFactory,
  encoder: Encoder,
  mapToHttpError: MapToHttpError = (e: unknown) => {
    throw e;
  },
  debug: boolean = false,
  logger: Logger = createLogger(),
  loggableAttributeNames: Array<string> = [],
): Middleware => {
  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    try {
      return await handler(request);
    } catch (e) {
      const httpError = eToHttpError(e, mapToHttpError);
      const isClientError = httpError.status < 500;

      logger[isClientError ? LogLevel.INFO : LogLevel.ERROR]('Http Error', {
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
