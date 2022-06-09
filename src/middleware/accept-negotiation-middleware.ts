import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { ServerRequest, Response } from '@chubbyts/chubbyts-http-types/dist/message';
import { Middleware } from '@chubbyts/chubbyts-http-types/dist/middleware';
import { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { createNotAcceptable } from '@chubbyts/chubbyts-http-error/dist/http-error';

export const createAcceptNegotiationMiddleware = (acceptNegotiator: Negotiator): Middleware => {
  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    const negotiatedValue = acceptNegotiator.negotiate(request.headers['accept'].join(','));
    if (!negotiatedValue) {
      throw createNotAcceptable({
        detail: `Allowed accept: "${acceptNegotiator.supportedValues.join('", "')}"`,
        supportedValues: acceptNegotiator.supportedValues,
      });
    }

    return handler({
      ...request,
      attributes: { ...request.attributes, accept: negotiatedValue.value },
    });
  };
};
