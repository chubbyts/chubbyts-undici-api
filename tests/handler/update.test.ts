import { PassThrough } from 'stream';
import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from '@jest/globals';
import * as getStream from 'get-stream';
import type { SafeParseReturnType, ZodType } from 'zod';
import { ZodError } from 'zod';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { createUpdateHandler } from '../../src/handler/update';
import type { EnrichModel, Model } from '../../src/model';
import type { FindOneById, Persist } from '../../src/repository';

describe('createUpdateHandler', () => {
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

    const newName = 'name2';

    const inputData = {
      id,
      createdAt: createdAt.toJSON(),
      updatedAt: updatedAt.toJSON(),
      name: newName,
      _embedded: {
        key1: 'value1',
      },
      _links: {
        self: { href: '/sample/path' },
      },
    };

    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { accept: 'application/json', contentType: 'application/json', id },
      body: requestBody,
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [findOneById, findOneByIdMocks] = useFunctionMock<FindOneById<{ name: string }>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
      },
    ]);

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'safeParse',
        callback: (givenData: Record<string, string>): SafeParseReturnType<typeof givenData, typeof givenData> => {
          const { id: _, createdAt: __, updatedAt: ___, _embedded: ____, _links: _____, ...rest } = inputData;

          expect(givenData).toEqual(rest);

          return {
            success: true,
            data: { ...givenData },
          };
        },
      },
    ]);

    const [persist, persistMocks] = useFunctionMock<Persist<{ name: string }>>([
      {
        callback: async (givenModel: Model<{ name: string }>): Promise<Model<{ name: string }>> => {
          expect(givenModel).toEqual({
            id,
            createdAt,
            updatedAt: expect.any(Date),
            name: newName,
          });

          return givenModel;
        },
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
            id,
            createdAt: createdAt.toJSON(),
            updatedAt: expect.any(String),
            name: newName,
            _embedded: { key: 'value' },
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
            id,
            createdAt: createdAt.toJSON(),
            updatedAt: expect.any(String),
            name: newName,
            _embedded: { key: 'value' },
          });

          expect(givenContentType).toBe('application/json');

          return JSON.stringify(givenData);
        },
      },
    ]);

    const [enrichModel, enrichModelMocks] = useFunctionMock<EnrichModel<{ name: string }>>([
      {
        callback: async <C>(givenModel: Model<C>, givenContext: { [key: string]: unknown }) => {
          expect(givenModel).toEqual({
            id,
            createdAt,
            updatedAt: expect.any(Date),
            name: newName,
          });

          expect(givenContext).toEqual({ request });

          return {
            ...givenModel,
            _embedded: { key: 'value' },
          };
        },
      },
    ]);

    const updateHandler = createUpdateHandler<{ name: string }>(
      findOneById,
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
      enrichModel,
    );

    expect(await updateHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual({
      id,
      createdAt: createdAt.toJSON(),
      updatedAt: expect.any(String),
      name: newName,
      _embedded: {
        key: 'value',
      },
    });

    expect(findOneByIdMocks.length).toBe(0);
    expect(decoderMocks.length).toBe(0);
    expect(inputSchemaMocks.length).toBe(0);
    expect(persistMocks.length).toBe(0);
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

    const newName = 'name2';

    const inputData = {
      id,
      createdAt: createdAt.toJSON(),
      updatedAt: updatedAt.toJSON(),
      name: newName,
      _embedded: {
        key1: 'value1',
      },
      _links: {
        self: { href: '/sample/path' },
      },
    };

    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { accept: 'application/json', contentType: 'application/json', id },
      body: requestBody,
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [findOneById, findOneByIdMocks] = useFunctionMock<FindOneById<{ name: string }>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
      },
    ]);

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'safeParse',
        callback: (givenData: Record<string, string>): SafeParseReturnType<typeof givenData, typeof givenData> => {
          const { id: _, createdAt: __, updatedAt: ___, _embedded: ____, _links: _____, ...rest } = inputData;

          expect(givenData).toEqual(rest);

          return {
            success: true,
            data: { ...givenData },
          };
        },
      },
    ]);

    const [persist, persistMocks] = useFunctionMock<Persist<{ name: string }>>([
      {
        callback: async (givenModel: Model<{ name: string }>): Promise<Model<{ name: string }>> => {
          expect(givenModel).toEqual({
            id,
            createdAt,
            updatedAt: expect.any(Date),
            name: newName,
          });

          return givenModel;
        },
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
            id,
            createdAt: createdAt.toJSON(),
            updatedAt: expect.any(String),
            name: newName,
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
            id,
            createdAt: createdAt.toJSON(),
            updatedAt: expect.any(String),
            name: newName,
          });

          expect(givenContentType).toBe('application/json');

          return JSON.stringify(givenData);
        },
      },
    ]);

    const updateHandler = createUpdateHandler<{ name: string }>(
      findOneById,
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    expect(await updateHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual({
      id,
      createdAt: createdAt.toJSON(),
      updatedAt: expect.any(String),
      name: newName,
    });

    expect(findOneByIdMocks.length).toBe(0);
    expect(decoderMocks.length).toBe(0);
    expect(inputSchemaMocks.length).toBe(0);
    expect(persistMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('not found', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

    const request = {
      attributes: { id },
    } as unknown as ServerRequest;

    const [findOneById, findOneByIdMocks] = useFunctionMock<FindOneById<{ name: string }>>([
      {
        parameters: [id],
        return: Promise.resolve(undefined),
      },
    ]);

    const [decoder, decoderMocks] = useObjectMock<Decoder>([]);

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([]);

    const [persist, persistMocks] = useFunctionMock<Persist<{ name: string }>>([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [outputSchema, outputSchemaMocks] = useObjectMock<ZodType>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const updateHandler = createUpdateHandler<{ name: string }>(
      findOneById,
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    try {
      await updateHandler(request);
      fail('Expect fail');
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
    expect(decoderMocks.length).toBe(0);
    expect(inputSchemaMocks.length).toBe(0);
    expect(persistMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('could not parse', async () => {
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

    const newName = 'name2';

    const inputData = { name: newName };
    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { contentType: 'application/json', id },
      body: requestBody,
    } as unknown as ServerRequest;

    const [findOneById, findOneByIdMocks] = useFunctionMock<FindOneById<{ name: string }>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
      },
    ]);

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [inputSchema, inputSchemaMocks] = useObjectMock<ZodType>([
      {
        name: 'safeParse',
        parameters: [inputData],
        return: {
          success: false,
          error: new ZodError([{ code: 'custom', message: 'Invalid length', path: ['path', 0, 'field'] }]),
        },
      },
    ]);

    const [persist, persistMocks] = useFunctionMock<Persist<{ name: string }>>([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [outputSchema, outputSchemaMocks] = useObjectMock<ZodType>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const updateHandler = createUpdateHandler<{ name: string }>(
      findOneById,
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    try {
      await updateHandler(request);
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
              "name": "path[0].field",
              "reason": "Invalid length",
            },
          ],
          "status": 400,
          "title": "Bad Request",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
        }
      `);
    }

    expect(findOneByIdMocks.length).toBe(0);
    expect(decoderMocks.length).toBe(0);
    expect(inputSchemaMocks.length).toBe(0);
    expect(persistMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(outputSchemaMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });
});
