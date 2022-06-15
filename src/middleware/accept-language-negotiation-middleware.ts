import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { ServerRequest, Response } from '@chubbyts/chubbyts-http-types/dist/message';
import { Middleware } from '@chubbyts/chubbyts-http-types/dist/middleware';
import { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { createNotAcceptable } from '@chubbyts/chubbyts-http-error/dist/http-error';

export const createAcceptLanguageNegotiationMiddleware = (acceptLanguageNegotiator: Negotiator): Middleware => {
  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    if (typeof request.headers['accept-language'] === 'undefined') {
      throw createNotAcceptable({
        detail: `Missing accept-language: "${acceptLanguageNegotiator.supportedValues.join('", "')}"`,
        supportedValues: acceptLanguageNegotiator.supportedValues,
      });
    }

    const negotiatedValue = acceptLanguageNegotiator.negotiate(request.headers['accept-language'].join(','));
    if (!negotiatedValue) {
      throw createNotAcceptable({
        detail: `Allowed accept-languages: "${acceptLanguageNegotiator.supportedValues.join('", "')}"`,
        supportedValues: acceptLanguageNegotiator.supportedValues,
      });
    }

    return handler({
      ...request,
      attributes: { ...request.attributes, 'accept-language': negotiatedValue.value },
    });
  };
};
