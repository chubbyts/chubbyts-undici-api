import { PassThrough } from 'stream';
import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from '@jest/globals';
import * as getStream from 'get-stream';
import type { ZodType } from 'zod';
import { ZodError } from 'zod';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { createListHandler } from '../../src/handler/list';
import type { EnrichList, List } from '../../src/model';
import type { ResolveList } from '../../src/repository';

describe('createListHandler', () => {
  test('successfully', async () => {
    const query: List<{ name: string }> = {
      offset: 0,
      limit: 0,
      filters: { key: 'value' },
      sort: {},
      count: 0,
      items: [],
    };

    const request = {
      uri: { query },
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'safeParse',
        parameters: [query],
        return: {
          success: true,
          data: { ...query },
        },
      },
    ]);

    const [resolveList, resolveListMocks] = useFunctionMock<ResolveList<{ name: string }>>([
      {
        parameters: [query],
        return: Promise.resolve({
          ...query,
          items: [],
          count: 0,
        }),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [200],
        return: response,
      },
    ]);

    const [outputSchema, outputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'parse',
        parameters: [
          {
            ...query,
            _embedded: {
              key: 'value',
            },
          },
        ],
        return: {
          ...query,
          _embedded: {
            key: 'value',
          },
        },
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        parameters: [
          {
            ...query,
            _embedded: {
              key: 'value',
            },
          } as unknown as Data,
          'application/json',
          { request },
        ],
        return: JSON.stringify({
          ...query,
          _embedded: {
            key: 'value',
          },
        }),
      },
    ]);

    const [enrichList, enrichListMocks] = useFunctionMock<EnrichList<{ name: string }>>([
      {
        parameters: [query, { request }],
        return: Promise.resolve({
          ...query,
          _embedded: {
            key: 'value',
          },
        }),
      },
    ]);

    const listHandler = createListHandler<{ name: string }>(
      inputSchema,
      resolveList,
      responseFactory,
      outputSchema,
      encoder,
      enrichList,
    );

    expect(await listHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual({
      ...query,
      _embedded: {
        key: 'value',
      },
    });

    expect(inputSchemaMocks.length).toBe(0);
    expect(resolveListMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(enrichListMocks.length).toBe(0);
  });

  test('successfully without enrichList', async () => {
    const query: List<{ name: string }> = {
      offset: 0,
      limit: 0,
      filters: { key: 'value' },
      sort: {},
      count: 0,
      items: [],
    };

    const request = {
      uri: { query },
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'safeParse',
        parameters: [query],
        return: {
          success: true,
          data: { ...query },
        },
      },
    ]);

    const [resolveList, resolveListMocks] = useFunctionMock<ResolveList<{ name: string }>>([
      {
        parameters: [query],
        return: Promise.resolve({
          ...query,
          items: [],
          count: 0,
        }),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [200],
        return: response,
      },
    ]);

    const [outputSchema, outputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'parse',
        parameters: [query],
        return: query,
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        parameters: [query as unknown as Data, 'application/json', { request }],
        return: JSON.stringify(query),
      },
    ]);

    const listHandler = createListHandler<{ name: string }>(
      inputSchema,
      resolveList,
      responseFactory,
      outputSchema,
      encoder,
    );

    expect(await listHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual(query);

    expect(inputSchemaMocks.length).toBe(0);
    expect(resolveListMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('could not parse', async () => {
    const query = { filters: { key: 'value' } };
    const request = {
      uri: { query },
    } as unknown as ServerRequest;

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'safeParse',
        parameters: [query],
        return: {
          success: false,
          error: new ZodError([{ code: 'custom', message: 'Invalid length', path: ['path', 0, 'field'] }]),
        },
      },
    ]);

    const [resolveList, resolveListMocks] = useFunctionMock<ResolveList<{ name: string }>>([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [outputSchema, outputSchemaMocks] = useObjectMock<ZodType>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const listHandler = createListHandler<{ name: string }>(
      inputSchema,
      resolveList,
      responseFactory,
      outputSchema,
      encoder,
    );

    try {
      await listHandler(request);
      throw new Error('Expect Error');
    } catch (e) {
      expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "BadRequest",
          "invalidParameters": [
            {
              "context": {
                "code": "custom",
              },
              "name": "path[0][field]",
              "reason": "Invalid length",
            },
          ],
          "status": 400,
          "title": "Bad Request",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
        }
      `);
    }

    expect(inputSchemaMocks.length).toBe(0);
    expect(resolveListMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });
});
