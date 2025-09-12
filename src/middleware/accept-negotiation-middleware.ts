import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { createNotAcceptable } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { Handler, Middleware, Response } from '@chubbyts/chubbyts-undici-server/dist/server';

export const createAcceptNegotiationMiddleware = (acceptNegotiator: Negotiator): Middleware => {
  return async (serverRequest: ServerRequest, handler: Handler): Promise<Response> => {
    const acceptHeader = serverRequest.headers.get('accept');

    if (acceptHeader === null) {
      const supportedValues = acceptNegotiator.supportedValues;

      throw createNotAcceptable({
        detail: `Missing accept: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    const negotiatedValue = acceptNegotiator.negotiate(acceptHeader);

    if (!negotiatedValue) {
      const supportedValues = acceptNegotiator.supportedValues;

      throw createNotAcceptable({
        detail: `Allowed accepts: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    return handler(
      new ServerRequest(serverRequest, {
        attributes: { ...serverRequest.attributes, accept: negotiatedValue.value },
      }),
    );
  };
};
