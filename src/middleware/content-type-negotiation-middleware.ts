import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { ServerRequest, Response } from '@chubbyts/chubbyts-http-types/dist/message';
import type { Middleware } from '@chubbyts/chubbyts-http-types/dist/middleware';
import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { createUnsupportedMediaType } from '@chubbyts/chubbyts-http-error/dist/http-error';

export const createContentTypeNegotiationMiddleware = (contentTypeNegotiator: Negotiator): Middleware => {
  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    if (typeof request.headers['content-type'] === 'undefined') {
      const supportedValues = contentTypeNegotiator.supportedValues;

      throw createUnsupportedMediaType({
        detail: `Missing content-type: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    const negotiatedValue = contentTypeNegotiator.negotiate(request.headers['content-type'].join(','));

    if (!negotiatedValue) {
      const supportedValues = contentTypeNegotiator.supportedValues;

      throw createUnsupportedMediaType({
        detail: `Allowed content-types: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    return handler({
      ...request,
      attributes: { ...request.attributes, contentType: negotiatedValue.value },
    });
  };
};
