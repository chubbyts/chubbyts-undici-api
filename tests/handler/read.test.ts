import { PassThrough } from 'stream';
import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from 'vitest';
import type { ZodType } from 'zod';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { createReadHandler } from '../../src/handler/read';
import type { EnrichModel, Model } from '../../src/model';
import type { FindOneById } from '../../src/repository';
import { streamToString } from '../../src/stream';

describe('createReadHandler', () => {
  test('successfully', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const createdAt = new Date('2022-06-11T12:36:26.012Z');
    const updatedAt = new Date('2022-06-11T12:36:26.012Z');
    const name = 'name1';

    const model: Model<{ name: string }> = {
      id,
      createdAt,
      updatedAt,
      name,
    };

    const modelResponse = {
      ...model,
      createdAt: model.createdAt.toJSON(),
      updatedAt: model.createdAt.toJSON(),
    };

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [findOneById, findOneByIdMocks] = useFunctionMock<FindOneById<{ name: string }>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
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
        callback: (givenData: Record<string, string>) => {
          expect(givenData).toEqual({
            ...modelResponse,
            _embedded: {
              key: 'value',
            },
          });

          return givenData;
        },
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData: Data, givenContentType: string): string => {
          expect(givenData).toEqual({
            ...modelResponse,
            _embedded: {
              key: 'value',
            },
          });

          expect(givenContentType).toBe('application/json');

          return JSON.stringify(givenData);
        },
      },
    ]);

    const [enrichModel, enrichModelMocks] = useFunctionMock<EnrichModel<{ name: string }>>([
      {
        callback: async <C>(givenModel: Model<C>, givenContext: { [key: string]: unknown }) => {
          expect(givenModel).toEqual(model);

          expect(givenContext).toEqual({ request });

          return {
            ...givenModel,
            _embedded: { key: 'value' },
          };
        },
      },
    ]);

    const readHandler = createReadHandler<{ name: string }>(
      findOneById,
      responseFactory,
      outputSchema,
      encoder,
      enrichModel,
    );

    expect(await readHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual({
      ...modelResponse,
      _embedded: {
        key: 'value',
      },
    });

    expect(findOneByIdMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(enrichModelMocks.length).toBe(0);
  });

  test('successfully without enrich model', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const createdAt = new Date('2022-06-11T12:36:26.012Z');
    const updatedAt = new Date('2022-06-11T12:36:26.012Z');
    const name = 'name1';

    const model: Model<{ name: string }> = {
      id,
      createdAt,
      updatedAt,
      name,
    };

    const modelResponse = {
      ...model,
      createdAt: model.createdAt.toJSON(),
      updatedAt: model.createdAt.toJSON(),
    };

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [findOneById, findOneByIdMocks] = useFunctionMock<FindOneById<{ name: string }>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
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
        callback: (givenData: Record<string, string>) => {
          expect(givenData).toEqual(modelResponse);

          return givenData;
        },
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData: Data, givenContentType: string): string => {
          expect(givenData).toEqual(modelResponse);

          expect(givenContentType).toBe('application/json');

          return JSON.stringify(givenData);
        },
      },
    ]);

    const readHandler = createReadHandler<{ name: string }>(findOneById, responseFactory, outputSchema, encoder);

    expect(await readHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual(modelResponse);

    expect(findOneByIdMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('not found', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const [findOneById, findOneByIdMocks] = useFunctionMock<FindOneById<{ name: string }>>([
      {
        parameters: [id],
        return: Promise.resolve(undefined),
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [outputSchema, outputSchemaMocks] = useObjectMock<ZodType>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const readHandler = createReadHandler<{ name: string }>(findOneById, responseFactory, outputSchema, encoder);

    try {
      await readHandler(request);
      throw new Error('Expect fail');
    } catch (e) {
      expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "NotFound",
          "detail": "There is no entry with id "93cf0de1-e83e-4f68-800d-835e055a6fe8"",
          "status": 404,
          "title": "Not Found",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
        }
      `);
    }

    expect(findOneByIdMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });
});
