import { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
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
        {
          "attributes": {
            "accept": "application/json",
          },
          "headers": {
            "accept": [
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
    const request = { headers: { accept: ['application/xml', 'application/x-yaml'] } } as unknown as ServerRequest;
    const handler: Handler = jest.fn();

    const negotiate: Negotiator['negotiate'] = jest.fn((givenHeader): NegotiatedValue | undefined => {
      expect(givenHeader).toMatchInlineSnapshot(`"application/xml,application/x-yaml"`);

      return undefined;
    });

    const acceptNegotiator: Negotiator = {
      negotiate,
      supportedValues: ['application/json', 'application/x-something'],
    };

    const acceptNegotiationMiddleware = createAcceptNegotiationMiddleware(acceptNegotiator);

    try {
      await acceptNegotiationMiddleware(request, handler);
      fail('Expect Error');
    } catch (e) {
      expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "NotAcceptable",
          "detail": "Allowed accepts: "application/json", "application/x-something"",
          "status": 406,
          "supportedValues": [
            "application/json",
            "application/x-something",
          ],
          "title": "Not Acceptable",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.7",
        }
      `);
    }

    expect(negotiate).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(0);
  });

  test('missing header', async () => {
    const request = { headers: {} } as unknown as ServerRequest;
    const handler: Handler = jest.fn();

    const negotiate: Negotiator['negotiate'] = jest.fn((givenHeader): NegotiatedValue | undefined => {
      expect(givenHeader).toMatchInlineSnapshot(`"application/json"`);

      return undefined;
    });

    const acceptNegotiator: Negotiator = {
      negotiate,
      supportedValues: ['application/json', 'application/x-something'],
    };

    const acceptNegotiationMiddleware = createAcceptNegotiationMiddleware(acceptNegotiator);

    try {
      await acceptNegotiationMiddleware(request, handler);
      fail('Expect Error');
    } catch (e) {
      expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "NotAcceptable",
          "detail": "Missing accept: "application/json", "application/x-something"",
          "status": 406,
          "supportedValues": [
            "application/json",
            "application/x-something",
          ],
          "title": "Not Acceptable",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.7",
        }
      `);
    }

    expect(negotiate).toHaveBeenCalledTimes(0);
    expect(handler).toHaveBeenCalledTimes(0);
  });
});
