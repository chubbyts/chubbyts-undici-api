import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { describe, expect, test } from 'vitest';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createContentTypeNegotiationMiddleware } from '../../src/middleware/content-type-negotiation-middleware';

describe('content-type-negotiation-middleware', () => {
  describe('createContentTypeNegotiationMiddleware', () => {
    test('successfully', async () => {
      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });

      const response = new Response();

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          callback: async (givenRequest: ServerRequest) => {
            expect(givenRequest.attributes).toMatchInlineSnapshot(`
              {
                "contentType": "application/json",
              }
            `);

            return response;
          },
        },
      ]);

      const [contentTypeNegotiator, contentTypeNegotiatorMocks] = useObjectMock<Negotiator>([
        {
          name: 'negotiate',
          parameters: ['application/json'],
          return: { value: 'application/json', attributes: { q: '1.0' } },
        },
      ]);

      const contentTypeNegotiationMiddleware = createContentTypeNegotiationMiddleware(contentTypeNegotiator);

      expect(await contentTypeNegotiationMiddleware(serverRequest, handler)).toBe(response);

      expect(handlerMocks.length).toBe(0);
      expect(contentTypeNegotiatorMocks.length).toBe(0);
    });

    test('no negotiated value', async () => {
      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'POST',
        headers: { 'content-type': 'application/xml, application/x-yaml' },
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([]);

      const [contentTypeNegotiator, contentTypeNegotiatorMocks] = useObjectMock<Negotiator>([
        {
          name: 'negotiate',
          parameters: ['application/xml, application/x-yaml'],
          return: undefined,
        },
        {
          name: 'supportedValues',
          value: ['application/json', 'application/x-something'],
        },
      ]);

      const contentTypeNegotiationMiddleware = createContentTypeNegotiationMiddleware(contentTypeNegotiator);

      try {
        await contentTypeNegotiationMiddleware(serverRequest, handler);
        throw new Error('Expect Error');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "UnsupportedMediaType",
            "detail": "Allowed content-types: "application/json", "application/x-something"",
            "status": 415,
            "supportedValues": [
              "application/json",
              "application/x-something",
            ],
            "title": "Unsupported Media Type",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.16",
          }
        `);
      }

      expect(handlerMocks.length).toBe(0);
      expect(contentTypeNegotiatorMocks.length).toBe(0);
    });

    test('no header', async () => {
      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'POST',
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([]);

      const [contentTypeNegotiator, contentTypeNegotiatorMocks] = useObjectMock<Negotiator>([
        {
          name: 'supportedValues',
          value: ['application/json', 'application/x-something'],
        },
      ]);

      const contentTypeNegotiationMiddleware = createContentTypeNegotiationMiddleware(contentTypeNegotiator);

      try {
        await contentTypeNegotiationMiddleware(serverRequest, handler);
        throw new Error('Expect Error');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "UnsupportedMediaType",
            "detail": "Missing content-type: "application/json", "application/x-something"",
            "status": 415,
            "supportedValues": [
              "application/json",
              "application/x-something",
            ],
            "title": "Unsupported Media Type",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.16",
          }
        `);
      }

      expect(handlerMocks.length).toBe(0);
      expect(contentTypeNegotiatorMocks.length).toBe(0);
    });
  });
});
