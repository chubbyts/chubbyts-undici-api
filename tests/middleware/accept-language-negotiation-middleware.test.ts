import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { describe, expect, test } from 'vitest';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createAcceptLanguageNegotiationMiddleware } from '../../src/middleware/accept-language-negotiation-middleware';

describe('accept-language-negotiation-middleware', () => {
  describe('createAcceptLanguageNegotiationMiddleware', () => {
    test('successfully', async () => {
      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
        headers: { 'accept-language': 'en' },
      });

      const response = new Response();

      const [handler, handlerMocks] = useFunctionMock<Handler>([
        {
          callback: async (givenRequest: ServerRequest) => {
            expect(givenRequest.attributes).toMatchInlineSnapshot(`
              {
                "acceptLanguage": "en",
              }
            `);

            return response;
          },
        },
      ]);

      const [acceptLanguageNegotiator, acceptLanguageNegotiatorMocks] = useObjectMock<Negotiator>([
        {
          name: 'negotiate',
          parameters: ['en'],
          return: { value: 'en', attributes: { q: '1.0' } },
        },
      ]);

      const acceptLanguageNegotiationMiddleware = createAcceptLanguageNegotiationMiddleware(acceptLanguageNegotiator);

      expect(await acceptLanguageNegotiationMiddleware(serverRequest, handler)).toBe(response);

      expect(handlerMocks.length).toBe(0);
      expect(acceptLanguageNegotiatorMocks.length).toBe(0);
    });

    test('no negotiated value', async () => {
      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
        headers: { 'accept-language': 'de, fr' },
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([]);

      const [acceptLanguageNegotiator, acceptLanguageNegotiatorMocks] = useObjectMock<Negotiator>([
        {
          name: 'negotiate',
          parameters: ['de, fr'],
          return: undefined,
        },
        {
          name: 'supportedValues',
          value: ['en', 'jp'],
        },
      ]);

      const acceptLanguageNegotiationMiddleware = createAcceptLanguageNegotiationMiddleware(acceptLanguageNegotiator);

      try {
        await acceptLanguageNegotiationMiddleware(serverRequest, handler);
        throw new Error('Expect Error');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "NotAcceptable",
            "detail": "Allowed accept-languages: "en", "jp"",
            "status": 406,
            "supportedValues": [
              "en",
              "jp",
            ],
            "title": "Not Acceptable",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.7",
          }
        `);
      }

      expect(handlerMocks.length).toBe(0);
      expect(acceptLanguageNegotiatorMocks.length).toBe(0);
    });

    test('missing header', async () => {
      const serverRequest = new ServerRequest('https://example.com/path/to/route', {
        method: 'GET',
      });

      const [handler, handlerMocks] = useFunctionMock<Handler>([]);

      const [acceptLanguageNegotiator, acceptLanguageNegotiatorMocks] = useObjectMock<Negotiator>([
        {
          name: 'supportedValues',
          value: ['en', 'jp'],
        },
      ]);

      const acceptLanguageNegotiationMiddleware = createAcceptLanguageNegotiationMiddleware(acceptLanguageNegotiator);

      try {
        await acceptLanguageNegotiationMiddleware(serverRequest, handler);
        throw new Error('Expect Error');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "NotAcceptable",
            "detail": "Missing accept-language: "en", "jp"",
            "status": 406,
            "supportedValues": [
              "en",
              "jp",
            ],
            "title": "Not Acceptable",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.7",
          }
        `);
      }

      expect(handlerMocks.length).toBe(0);
      expect(acceptLanguageNegotiatorMocks.length).toBe(0);
    });
  });
});
