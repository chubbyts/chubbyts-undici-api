import { PassThrough } from 'stream';
import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from 'vitest';
import { ZodError } from 'zod';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { createListHandler } from '../../src/handler/list';
import type { EnrichedModelListSchema, EnrichModelList, InputModelListSchema, ModelList } from '../../src/model';
import { streamToString } from '../../src/stream';
import type { ResolveModelList } from '../../src/repository';

describe('createListHandler', () => {
  test('successfully', async () => {
    const query: ModelList<{ name: string }> = {
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

    const [inputModelListSchema, inputModelListSchemaMocks] = useObjectMock<InputModelListSchema>([
      {
        name: 'safeParse',
        parameters: [query],
        return: {
          success: true,
          data: { ...query },
        },
      },
    ]);

    const [resolveModelList, resolveModelListMocks] = useFunctionMock<ResolveModelList<{ name: string }>>([
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

    const [enrichedModelListSchema, enrichedModelListSchemaMocks] = useObjectMock<
      EnrichedModelListSchema<{ name: string }>
    >([
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

    const [enrichList, enrichModelListMocks] = useFunctionMock<EnrichModelList<{ name: string }>>([
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
      inputModelListSchema,
      resolveModelList,
      responseFactory,
      enrichedModelListSchema,
      encoder,
      enrichList,
    );

    expect(await listHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual({
      ...query,
      _embedded: {
        key: 'value',
      },
    });

    expect(inputModelListSchemaMocks.length).toBe(0);
    expect(resolveModelListMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(enrichedModelListSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(enrichModelListMocks.length).toBe(0);
  });

  test('successfully without enrichList', async () => {
    const query: ModelList<{ name: string }> = {
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

    const [inputModelListSchema, inputModelListSchemaMocks] = useObjectMock<InputModelListSchema>([
      {
        name: 'safeParse',
        parameters: [query],
        return: {
          success: true,
          data: { ...query },
        },
      },
    ]);

    const [resolveModelList, resolveModelListMocks] = useFunctionMock<ResolveModelList<{ name: string }>>([
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

    const [enrichedModelListSchema, enrichedModelListSchemaMocks] = useObjectMock<
      EnrichedModelListSchema<{ name: string }>
    >([
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
      inputModelListSchema,
      resolveModelList,
      responseFactory,
      enrichedModelListSchema,
      encoder,
    );

    expect(await listHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual(query);

    expect(inputModelListSchemaMocks.length).toBe(0);
    expect(resolveModelListMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(enrichedModelListSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('could not parse', async () => {
    const query = { filters: { key: 'value' } };
    const request = {
      uri: { query },
    } as unknown as ServerRequest;

    const [inputModelListSchema, inputModelListSchemaMocks] = useObjectMock<InputModelListSchema>([
      {
        name: 'safeParse',
        parameters: [query],
        return: {
          success: false,
          error: new ZodError([{ code: 'custom', message: 'Invalid length', path: ['path', 0, 'field'] }]),
        },
      },
    ]);

    const [resolveModelList, resolveModelListMocks] = useFunctionMock<ResolveModelList<{ name: string }>>([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [enrichedModelListSchema, enrichedModelListSchemaMocks] = useObjectMock<
      EnrichedModelListSchema<{ name: string }>
    >([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const listHandler = createListHandler<{ name: string }>(
      inputModelListSchema,
      resolveModelList,
      responseFactory,
      enrichedModelListSchema,
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

    expect(inputModelListSchemaMocks.length).toBe(0);
    expect(resolveModelListMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(enrichedModelListSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });
});
