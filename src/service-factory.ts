import type { Container } from '@chubbyts/chubbyts-dic-types/dist/container';
import { createAbstractFactory } from '@chubbyts/chubbyts-dic-config-factory/dist/dic-config-factory';
import { encoderServiceFactory } from '@chubbyts/chubbyts-decode-encode/dist/service-factory';
import type { Logger } from '@chubbyts/chubbyts-log-types/dist/log';
import {
  acceptLanguageNegotiatorServiceFactory,
  acceptNegotiatorServiceFactory,
  contentTypeNegotiatorServiceFactory,
} from '@chubbyts/chubbyts-negotiation/dist/service-factory';
import type { Middleware } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createAcceptLanguageNegotiationMiddleware } from './middleware/accept-language-negotiation-middleware.js';
import { createAcceptNegotiationMiddleware } from './middleware/accept-negotiation-middleware.js';
import { createContentTypeNegotiationMiddleware } from './middleware/content-type-negotiation-middleware.js';
import type { MapToHttpError } from './middleware/error-middleware.js';
import { createErrorMiddleware } from './middleware/error-middleware.js';

type Config = {
  debug?: boolean;
};

// a registered service wins over the shipped factory, so that any part can be replaced or shared between services

export const acceptLanguageNegotiationMiddlewareServiceFactory = createAbstractFactory(
  (container: Container, { resolveDependency }): Middleware => {
    return createAcceptLanguageNegotiationMiddleware(
      resolveDependency(container, 'acceptLanguageNegotiator', acceptLanguageNegotiatorServiceFactory),
    );
  },
);

export const acceptNegotiationMiddlewareServiceFactory = createAbstractFactory(
  (container: Container, { resolveDependency }): Middleware => {
    return createAcceptNegotiationMiddleware(
      resolveDependency(container, 'acceptNegotiator', acceptNegotiatorServiceFactory),
    );
  },
);

export const contentTypeNegotiationMiddlewareServiceFactory = createAbstractFactory(
  (container: Container, { resolveDependency }): Middleware => {
    return createContentTypeNegotiationMiddleware(
      resolveDependency(container, 'contentTypeNegotiator', contentTypeNegotiatorServiceFactory),
    );
  },
);

export const mapToHttpErrorServiceFactory = createAbstractFactory((): MapToHttpError => {
  return (e: unknown) => {
    throw e;
  };
});

export const errorMiddlewareLoggableAttributeNamesServiceFactory = createAbstractFactory((): Array<string> => {
  return [];
});

export const errorMiddlewareServiceFactory = createAbstractFactory(
  (container: Container, { resolveDependency }): Middleware => {
    const { debug = false } = container.get<Config>('config');

    return createErrorMiddleware(
      resolveDependency(container, 'encoder', encoderServiceFactory),
      resolveDependency(container, 'mapToHttpError', mapToHttpErrorServiceFactory),
      debug,
      container.has('logger') ? container.get<Logger>('logger') : undefined,
      resolveDependency(
        container,
        'errorMiddlewareLoggableAttributeNames',
        errorMiddlewareLoggableAttributeNamesServiceFactory,
      ),
    );
  },
);
