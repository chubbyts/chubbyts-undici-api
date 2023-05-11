import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { ServerRequest, Response } from '@chubbyts/chubbyts-http-types/dist/message';
import type { Middleware } from '@chubbyts/chubbyts-http-types/dist/middleware';
import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { createNotAcceptable } from '@chubbyts/chubbyts-http-error/dist/http-error';

export const createAcceptNegotiationMiddleware = (acceptNegotiator: Negotiator): Middleware => {
  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    if (typeof request.headers['accept'] === 'undefined') {
      const supportedValues = acceptNegotiator.supportedValues;

      throw createNotAcceptable({
        detail: `Missing accept: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    const negotiatedValue = acceptNegotiator.negotiate(request.headers['accept'].join(','));

    if (!negotiatedValue) {
      const supportedValues = acceptNegotiator.supportedValues;

      throw createNotAcceptable({
        detail: `Allowed accepts: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    return handler({
      ...request,
      attributes: { ...request.attributes, accept: negotiatedValue.value },
    });
  };
};
