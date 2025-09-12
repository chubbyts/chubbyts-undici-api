import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { createNotAcceptable } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { Handler, Middleware, Response } from '@chubbyts/chubbyts-undici-server/dist/server';

export const createAcceptLanguageNegotiationMiddleware = (acceptLanguageNegotiator: Negotiator): Middleware => {
  return async (serverRequest: ServerRequest, handler: Handler): Promise<Response> => {
    const acceptLanguageHeader = serverRequest.headers.get('accept-language');

    if (acceptLanguageHeader == null) {
      const supportedValues = acceptLanguageNegotiator.supportedValues;

      throw createNotAcceptable({
        detail: `Missing accept-language: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    const negotiatedValue = acceptLanguageNegotiator.negotiate(acceptLanguageHeader);

    if (!negotiatedValue) {
      const supportedValues = acceptLanguageNegotiator.supportedValues;

      throw createNotAcceptable({
        detail: `Allowed accept-languages: "${supportedValues.join('", "')}"`,
        supportedValues,
      });
    }

    return handler(
      new ServerRequest(serverRequest, {
        attributes: { ...serverRequest.attributes, acceptLanguage: negotiatedValue.value },
      }),
    );
  };
};
