import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { NegotiatedValue, Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { describe, expect, test } from '@jest/globals';
import { createAcceptLanguageNegotiationMiddleware } from '../../src/middleware/accept-language-negotiation-middleware';

describe('createAcceptLanguageNegotiationMiddleware', () => {
  test('successfully', async () => {
    const request = { headers: { 'accept-language': ['en'] } } as unknown as ServerRequest;
    const response = {} as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`
        Object {
          "attributes": Object {
            "accept-language": "en",
          },
          "headers": Object {
            "accept-language": Array [
              "en",
            ],
          },
        }
      `);

      return response;
    });

    const negotiate: Negotiator['negotiate'] = jest.fn((givenHeader): NegotiatedValue | undefined => {
      expect(givenHeader).toMatchInlineSnapshot(`"en"`);

      return { value: 'en', attributes: { q: '1.0' } };
    });

    const acceptLanguageNegotiator: Negotiator = {
      negotiate,
      supportedValues: ['en'],
    };

    const acceptLanguageNegotiationMiddleware = createAcceptLanguageNegotiationMiddleware(acceptLanguageNegotiator);

    expect(await acceptLanguageNegotiationMiddleware(request, handler)).toBe(response);

    expect(negotiate).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('no negotiated value', async () => {
    const request = { headers: { 'accept-language': ['en'] } } as unknown as ServerRequest;
    const handler: Handler = jest.fn();

    const negotiate: Negotiator['negotiate'] = jest.fn((givenHeader): NegotiatedValue | undefined => {
      expect(givenHeader).toMatchInlineSnapshot(`"en"`);

      return undefined;
    });

    const acceptLanguageNegotiator: Negotiator = {
      negotiate,
      supportedValues: ['en'],
    };

    const acceptLanguageNegotiationMiddleware = createAcceptLanguageNegotiationMiddleware(acceptLanguageNegotiator);

    try {
      await acceptLanguageNegotiationMiddleware(request, handler);
      fail('Expect Error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
        Object {
          "_httpError": "NotAcceptable",
          "detail": "Allowed accept-language: \\"en\\"",
          "status": 406,
          "supportedValues": Array [
            "en",
          ],
          "title": "Not Acceptable",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.7",
        }
      `);
    }

    expect(negotiate).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(0);
  });
});
