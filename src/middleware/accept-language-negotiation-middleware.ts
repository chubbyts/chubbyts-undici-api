import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { ServerRequest, Response } from '@chubbyts/chubbyts-http-types/dist/message';
import type { Middleware } from '@chubbyts/chubbyts-http-types/dist/middleware';
import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { createNotAcceptable } from '@chubbyts/chubbyts-http-error/dist/http-error';

export const createAcceptLanguageNegotiationMiddleware = (acceptLanguageNegotiator: Negotiator): Middleware => {
  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    if (typeof request.headers['accept-language'] === 'undefined') {
      const supportedValues = acceptLanguageNegotiator.supportedValues;

      throw createNotAcceptable({
        detail: `Missing accept-language: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    const negotiatedValue = acceptLanguageNegotiator.negotiate(request.headers['accept-language'].join(','));

    if (!negotiatedValue) {
      const supportedValues = acceptLanguageNegotiator.supportedValues;

      throw createNotAcceptable({
        detail: `Allowed accept-languages: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    return handler({
      ...request,
      attributes: { ...request.attributes, 'accept-language': negotiatedValue.value },
    });
  };
};
