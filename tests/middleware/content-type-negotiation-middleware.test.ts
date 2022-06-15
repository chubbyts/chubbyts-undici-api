import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { NegotiatedValue, Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { describe, expect, test } from '@jest/globals';
import { createContentTypeNegotiationMiddleware } from '../../src/middleware/content-type-negotiation-middleware';

describe('createContentTypeNegotiationMiddleware', () => {
  test('successfully', async () => {
    const request = { headers: { 'content-type': ['application/json'] } } as unknown as ServerRequest;
    const response = {} as Response;

    const handler: Handler = jest.fn(async (givenRequest: ServerRequest) => {
      expect(givenRequest).toMatchInlineSnapshot(`
        Object {
          "attributes": Object {
            "contentType": "application/json",
          },
          "headers": Object {
            "content-type": Array [
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

    const contentTypeNegotiator: Negotiator = {
      negotiate,
      supportedValues: ['application/json'],
    };

    const contentTypeNegotiationMiddleware = createContentTypeNegotiationMiddleware(contentTypeNegotiator);

    expect(await contentTypeNegotiationMiddleware(request, handler)).toBe(response);

    expect(negotiate).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('no negotiated value', async () => {
    const request = {
      headers: { 'content-type': ['application/xml', 'application/x-yaml'] },
    } as unknown as ServerRequest;
    const handler: Handler = jest.fn();

    const negotiate: Negotiator['negotiate'] = jest.fn((givenHeader): NegotiatedValue | undefined => {
      expect(givenHeader).toMatchInlineSnapshot(`"application/xml,application/x-yaml"`);

      return undefined;
    });

    const contentTypeNegotiator: Negotiator = {
      negotiate,
      supportedValues: ['application/json', 'application/x-something'],
    };

    const contentTypeNegotiationMiddleware = createContentTypeNegotiationMiddleware(contentTypeNegotiator);

    try {
      await contentTypeNegotiationMiddleware(request, handler);
      fail('Expect Error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
        Object {
          "_httpError": "UnsupportedMediaType",
          "detail": "Allowed content-types: \\"application/json\\", \\"application/x-something\\"",
          "status": 415,
          "supportedValues": Array [
            "application/json",
            "application/x-something",
          ],
          "title": "Unsupported Media Type",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.16",
        }
      `);
    }

    expect(negotiate).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(0);
  });

  test('no header', async () => {
    const request = { headers: {} } as unknown as ServerRequest;
    const handler: Handler = jest.fn();

    const negotiate: Negotiator['negotiate'] = jest.fn((givenHeader): NegotiatedValue | undefined => {
      expect(givenHeader).toMatchInlineSnapshot(`"application/json"`);

      return undefined;
    });

    const contentTypeNegotiator: Negotiator = {
      negotiate,
      supportedValues: ['application/json', 'application/x-something'],
    };

    const contentTypeNegotiationMiddleware = createContentTypeNegotiationMiddleware(contentTypeNegotiator);

    try {
      await contentTypeNegotiationMiddleware(request, handler);
      fail('Expect Error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
        Object {
          "_httpError": "UnsupportedMediaType",
          "detail": "Missing content-type: \\"application/json\\", \\"application/x-something\\"",
          "status": 415,
          "supportedValues": Array [
            "application/json",
            "application/x-something",
          ],
          "title": "Unsupported Media Type",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.16",
        }
      `);
    }

    expect(negotiate).toHaveBeenCalledTimes(0);
    expect(handler).toHaveBeenCalledTimes(0);
  });
});
