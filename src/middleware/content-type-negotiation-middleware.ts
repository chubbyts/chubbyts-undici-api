import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { createUnsupportedMediaType } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { Handler, Middleware, Response } from '@chubbyts/chubbyts-undici-server/dist/server';

export const createContentTypeNegotiationMiddleware = (contentTypeNegotiator: Negotiator): Middleware => {
  return async (serverRequest: ServerRequest, handler: Handler): Promise<Response> => {
    const contentTypeHeader = serverRequest.headers.get('content-type');

    if (contentTypeHeader === null) {
      const supportedValues = contentTypeNegotiator.supportedValues;

      throw createUnsupportedMediaType({
        detail: `Missing content-type: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    const negotiatedValue = contentTypeNegotiator.negotiate(contentTypeHeader);

    if (!negotiatedValue) {
      const supportedValues = contentTypeNegotiator.supportedValues;

      throw createUnsupportedMediaType({
        detail: `Allowed content-types: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    return handler(
      new ServerRequest(serverRequest, {
        attributes: { ...serverRequest.attributes, contentType: negotiatedValue.value },
      }),
    );
  };
};
