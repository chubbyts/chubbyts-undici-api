import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { ServerRequest, Response } from '@chubbyts/chubbyts-http-types/dist/message';
import { Middleware } from '@chubbyts/chubbyts-http-types/dist/middleware';
import { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { createUnsupportedMediaType } from '@chubbyts/chubbyts-http-error/dist/http-error';

export const createContentTypeNegotiationMiddleware = (contentTypeNegotiator: Negotiator): Middleware => {
  return async (request: ServerRequest, handler: Handler): Promise<Response> => {
    if (typeof request.headers['content-type'] === 'undefined') {
      throw createUnsupportedMediaType({
        detail: `Missing content-type: "${contentTypeNegotiator.supportedValues.join('", "')}"`,
        supportedValues: contentTypeNegotiator.supportedValues,
      });
    }

    const negotiatedValue = contentTypeNegotiator.negotiate(request.headers['content-type'].join(','));
    if (!negotiatedValue) {
      throw createUnsupportedMediaType({
        detail: `Allowed content-types: "${contentTypeNegotiator.supportedValues.join('", "')}"`,
        supportedValues: contentTypeNegotiator.supportedValues,
      });
    }

    return handler({
      ...request,
      attributes: { ...request.attributes, contentType: negotiatedValue.value },
    });
  };
};
