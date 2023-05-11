import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { Negotiator } from '@chubbyts/chubbyts-negotiation/dist/negotiation';
import { describe, expect, test } from '@jest/globals';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { createContentTypeNegotiationMiddleware } from '../../src/middleware/content-type-negotiation-middleware';

describe('createContentTypeNegotiationMiddleware', () => {
  test('successfully', async () => {
    const request = { headers: { 'content-type': ['application/json'] } } as unknown as ServerRequest;
    const response = {} as Response;

    const [handler, handlerMocks] = useFunctionMock<Handler>([
      {
        callback: async (givenRequest: ServerRequest) => {
          expect(givenRequest).toMatchInlineSnapshot(`
            {
              "attributes": {
                "contentType": "application/json",
              },
              "headers": {
                "content-type": [
                  "application/json",
                ],
              },
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

    expect(await contentTypeNegotiationMiddleware(request, handler)).toBe(response);

    expect(handlerMocks.length).toBe(0);
    expect(contentTypeNegotiatorMocks.length).toBe(0);
  });

  test('no negotiated value', async () => {
    const request = {
      headers: { 'content-type': ['application/xml', 'application/x-yaml'] },
    } as unknown as ServerRequest;

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    const [contentTypeNegotiator, contentTypeNegotiatorMocks] = useObjectMock<Negotiator>([
      {
        name: 'negotiate',
        parameters: ['application/xml,application/x-yaml'],
        return: undefined,
      },
      {
        name: 'supportedValues',
        value: ['application/json', 'application/x-something'],
      },
    ]);

    const contentTypeNegotiationMiddleware = createContentTypeNegotiationMiddleware(contentTypeNegotiator);

    try {
      await contentTypeNegotiationMiddleware(request, handler);
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
    const request = { headers: {} } as unknown as ServerRequest;

    const [handler, handlerMocks] = useFunctionMock<Handler>([]);

    const [contentTypeNegotiator, contentTypeNegotiatorMocks] = useObjectMock<Negotiator>([
      {
        name: 'supportedValues',
        value: ['application/json', 'application/x-something'],
      },
    ]);

    const contentTypeNegotiationMiddleware = createContentTypeNegotiationMiddleware(contentTypeNegotiator);

    try {
      await contentTypeNegotiationMiddleware(request, handler);
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
