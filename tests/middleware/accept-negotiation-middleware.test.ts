import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { NegotiatedValue, Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { describe, expect, test } from '@jest/globals';
import { createAcceptNegotiationMiddleware } from '../../src/middleware/accept-negotiation-middleware';

describe('createAcceptNegotiationMiddleware', () => {
  test('successfully', async () => {
    const request = { headers: { accept: ['application/json'] } } as unknown as ServerRequest;
    const response = {} as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`
        Object {
          "attributes": Object {
            "accept": "application/json",
          },
          "headers": Object {
            "accept": Array [
              "application/json",
            ],
          },
        }
      `);

      return response;
    });

    const negotiate: Negotiator['negotiate'] = jest.fn((givenHeader): NegotiatedValue | undefined => {
      expect(givenHeader).toMatchInlineSnapshot(`"application/json"`);

      return { value: 'application/json', attributes: { q: '1.0' } };
    });

    const acceptNegotiator: Negotiator = {
      negotiate,
      supportedValues: ['application/json'],
    };

    const acceptNegotiationMiddleware = createAcceptNegotiationMiddleware(acceptNegotiator);

    expect(await acceptNegotiationMiddleware(request, handler)).toBe(response);

    expect(negotiate).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('no negotiated value', async () => {
    const request = { headers: { accept: ['application/json'] } } as unknown as ServerRequest;
    const handler: Handler = jest.fn();

    const negotiate: Negotiator['negotiate'] = jest.fn((givenHeader): NegotiatedValue | undefined => {
      expect(givenHeader).toMatchInlineSnapshot(`"application/json"`);

      return undefined;
    });

    const acceptNegotiator: Negotiator = {
      negotiate,
      supportedValues: ['application/json'],
    };

    const acceptNegotiationMiddleware = createAcceptNegotiationMiddleware(acceptNegotiator);

    try {
      await acceptNegotiationMiddleware(request, handler);
      fail('Expect Error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
        Object {
          "_httpError": "NotAcceptable",
          "detail": "Allowed accept: \\"application/json\\"",
          "status": 406,
          "supportedValues": Array [
            "application/json",
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
