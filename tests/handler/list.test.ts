import { PassThrough } from 'stream';
import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { createListHandler } from '../../src/handler/list';
import {
  createEnrichedModelListSchema,
  numberSchema,
  sortSchema,
  stringSchema,
  type EnrichedModelList,
  type EnrichModelList,
  type InputModelList,
  type ModelList,
} from '../../src/model';
import { streamToString } from '../../src/stream';
import type { ResolveModelList } from '../../src/repository';

describe('createListHandler', () => {
  const inputModelSchema = z.object({ name: stringSchema }).strict();
  const inputModelListSchema = z
    .object({
      offset: numberSchema.default(0),
      limit: numberSchema.default(20),
      filters: z.object({ name: stringSchema.optional() }).strict().default({}),
      sort: z.object({ name: sortSchema }).strict().default({}),
    })
    .strict();

  const enrichedModelListSchema = createEnrichedModelListSchema(inputModelSchema, inputModelListSchema);

  test('successfully', async () => {
    const query: Partial<InputModelList<typeof inputModelListSchema>> = {
      filters: { name: 'test' },
    };

    const inputModelList: InputModelList<typeof inputModelListSchema> = {
      offset: 0,
      limit: 20,
      filters: {},
      sort: {},
      ...query,
    };

    const modelList: ModelList<typeof inputModelSchema, typeof inputModelListSchema> = {
      ...inputModelList,
      count: 0,
      items: [],
    };

    const enrichedModelList: EnrichedModelList<typeof inputModelSchema, typeof inputModelListSchema> = {
      ...modelList,
      _embedded: {
        key: 'value',
      },
    };

    const request = {
      uri: { query },
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [resolveModelList, resolveModelListMocks] = useFunctionMock<
      ResolveModelList<typeof inputModelSchema, typeof inputModelListSchema>
    >([
      {
        parameters: [inputModelList],
        return: Promise.resolve(modelList),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [200],
        return: response,
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        parameters: [enrichedModelList as unknown as Data, 'application/json', { request }],
        return: JSON.stringify(enrichedModelList),
      },
    ]);

    const [enrichList, enrichModelListMocks] = useFunctionMock<
      EnrichModelList<typeof inputModelSchema, typeof inputModelListSchema>
    >([
      {
        parameters: [modelList, { request }],
        return: Promise.resolve(enrichedModelList),
      },
    ]);

    const listHandler = createListHandler(
      inputModelListSchema,
      resolveModelList,
      responseFactory,
      enrichedModelListSchema,
      encoder,
      enrichList,
    );

    expect(await listHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual(enrichedModelList);

    expect(resolveModelListMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(enrichModelListMocks.length).toBe(0);
  });

  test('successfully without enrichList', async () => {
    const query: Partial<InputModelList<typeof inputModelListSchema>> = {
      filters: { name: 'test' },
    };

    const inputModelList: InputModelList<typeof inputModelListSchema> = {
      offset: 0,
      limit: 20,
      filters: {},
      sort: {},
      ...query,
    };

    const modelList: ModelList<typeof inputModelSchema, typeof inputModelListSchema> = {
      ...inputModelList,
      count: 0,
      items: [],
    };

    const request = {
      uri: { query },
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [resolveModelList, resolveModelListMocks] = useFunctionMock<
      ResolveModelList<typeof inputModelSchema, typeof inputModelListSchema>
    >([
      {
        parameters: [inputModelList],
        return: Promise.resolve(modelList),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [200],
        return: response,
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        parameters: [modelList as unknown as Data, 'application/json', { request }],
        return: JSON.stringify(modelList),
      },
    ]);

    const listHandler = createListHandler(
      inputModelListSchema,
      resolveModelList,
      responseFactory,
      enrichedModelListSchema,
      encoder,
    );

    expect(await listHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual(modelList);

    expect(resolveModelListMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('could not parse', async () => {
    const query = { filters: { key: 'value' } };
    const request = {
      uri: { query },
    } as unknown as ServerRequest;

    const [resolveModelList, resolveModelListMocks] = useFunctionMock<
      ResolveModelList<typeof inputModelSchema, typeof inputModelListSchema>
    >([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const listHandler = createListHandler(
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
                "code": "unrecognized_keys",
                "keys": [
                  "key",
                ],
              },
              "name": "filters",
              "reason": "Unrecognized key: "key"",
            },
          ],
          "status": 400,
          "title": "Bad Request",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
        }
      `);
    }

    expect(resolveModelListMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });
});
