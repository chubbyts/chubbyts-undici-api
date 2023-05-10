import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { describe, expect, test } from '@jest/globals';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { createAcceptLanguageNegotiationMiddleware } from '../../src/middleware/accept-language-negotiation-middleware';

describe('createAcceptLanguageNegotiationMiddleware', () => {
  test('successfully', async () => {
    const request = { headers: { 'accept-language': ['en'] } } as unknown as ServerRequest;
    const response = {} as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        callback: async (givenRequest: ServerRequest) => {
          expect(givenRequest).toMatchInlineSnapshot(`
            {
              "attributes": {
                "accept-language": "en",
              },
              "headers": {
                "accept-language": [
                  "en",
                ],
              },
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

    expect(await acceptLanguageNegotiationMiddleware(request, handler)).toBe(response);

    expect(handlerMocks.length).toBe(0);
    expect(acceptLanguageNegotiatorMocks.length).toBe(0);
  });

  test('no negotiated value', async () => {
    const request = { headers: { 'accept-language': ['de', 'fr'] } } as unknown as ServerRequest;

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    const [acceptLanguageNegotiator, acceptLanguageNegotiatorMocks] = useObjectMock<Negotiator>([
      {
        name: 'negotiate',
        parameters: ['de,fr'],
        return: undefined,
      },
      {
        name: 'supportedValues',
        value: ['en', 'jp'],
      },
    ]);

    const acceptLanguageNegotiationMiddleware = createAcceptLanguageNegotiationMiddleware(acceptLanguageNegotiator);

    try {
      await acceptLanguageNegotiationMiddleware(request, handler);
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
    const request = { headers: {} } as unknown as ServerRequest;

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    const [acceptLanguageNegotiator, acceptLanguageNegotiatorMocks] = useObjectMock<Negotiator>([
      {
        name: 'supportedValues',
        value: ['en', 'jp'],
      },
    ]);

    const acceptLanguageNegotiationMiddleware = createAcceptLanguageNegotiationMiddleware(acceptLanguageNegotiator);

    try {
      await acceptLanguageNegotiationMiddleware(request, handler);
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
