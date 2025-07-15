import { PassThrough } from 'stream';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { createUpdateHandler } from '../../src/handler/update';
import { createEnrichedModelSchema, stringSchema, type EnrichModel, type Model } from '../../src/model';
import type { FindModelById, PersistModel } from '../../src/repository';
import { streamToString } from '../../src/stream';

describe('createUpdateHandler', () => {
  const inputModelSchema = z.object({ name: stringSchema });
  const enrichedModelSchema = createEnrichedModelSchema(inputModelSchema);

  test('successfully', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const createdAt = new Date('2022-06-11T12:36:26.012Z');
    const updatedAt = new Date('2022-06-11T12:36:26.012Z');
    const name = 'name1';

    const model: Model<typeof inputModelSchema> = {
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

    const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
      },
    ]);

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([
      {
        callback: async (givenModel) => {
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

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData, givenContentType): string => {
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

    const [enrichModel, enrichModelMocks] = useFunctionMock<EnrichModel<typeof inputModelSchema>>([
      {
        callback: async (givenModel, givenContext) => {
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

    const updateHandler = createUpdateHandler(
      findModelById,
      decoder,
      inputModelSchema,
      persistModel,
      responseFactory,
      enrichedModelSchema,
      encoder,
      enrichModel,
    );

    expect(await updateHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual({
      id,
      createdAt: createdAt.toJSON(),
      updatedAt: expect.any(String),
      name: newName,
      _embedded: {
        key: 'value',
      },
    });

    expect(findModelByIdMocks.length).toBe(0);
    expect(decoderMocks.length).toBe(0);
    expect(persistModelMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(enrichModelMocks.length).toBe(0);
  });

  test('successfully without enrich model', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const createdAt = new Date('2022-06-11T12:36:26.012Z');
    const updatedAt = new Date('2022-06-11T12:36:26.012Z');
    const name = 'name1';

    const model: Model<typeof inputModelSchema> = {
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

    const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
      },
    ]);

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([
      {
        callback: async (givenModel) => {
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

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData, givenContentType) => {
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

    const updateHandler = createUpdateHandler(
      findModelById,
      decoder,
      inputModelSchema,
      persistModel,
      responseFactory,
      enrichedModelSchema,
      encoder,
    );

    expect(await updateHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual({
      id,
      createdAt: createdAt.toJSON(),
      updatedAt: expect.any(String),
      name: newName,
    });

    expect(findModelByIdMocks.length).toBe(0);
    expect(decoderMocks.length).toBe(0);
    expect(persistModelMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('not found', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

    const request = {
      attributes: { id },
    } as unknown as ServerRequest;

    const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
      {
        parameters: [id],
        return: Promise.resolve(undefined),
      },
    ]);

    const [decoder, decoderMocks] = useObjectMock<Decoder>([]);

    const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const updateHandler = createUpdateHandler(
      findModelById,
      decoder,
      inputModelSchema,
      persistModel,
      responseFactory,
      enrichedModelSchema,
      encoder,
    );

    try {
      await updateHandler(request);
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

    expect(findModelByIdMocks.length).toBe(0);
    expect(decoderMocks.length).toBe(0);
    expect(persistModelMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('could not parse', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const createdAt = new Date('2022-06-11T12:36:26.012Z');
    const updatedAt = new Date('2022-06-11T12:36:26.012Z');
    const name = 'name1';

    const model: Model<typeof inputModelSchema> = {
      id,
      createdAt,
      updatedAt,
      name,
    };

    const newName = '';

    const inputData = { name: newName };
    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { contentType: 'application/json', id },
      body: requestBody,
    } as unknown as ServerRequest;

    const [findModelById, findModelByIdMocks] = useFunctionMock<FindModelById<typeof inputModelSchema>>([
      {
        parameters: [id],
        return: Promise.resolve(model),
      },
    ]);

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const updateHandler = createUpdateHandler(
      findModelById,
      decoder,
      inputModelSchema,
      persistModel,
      responseFactory,
      enrichedModelSchema,
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
                "code": "too_small",
                "inclusive": true,
                "minimum": 1,
                "origin": "string",
              },
              "name": "name",
              "reason": "Too small: expected string to have >=1 characters",
            },
          ],
          "status": 400,
          "title": "Bad Request",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
        }
      `);
    }

    expect(findModelByIdMocks.length).toBe(0);
    expect(decoderMocks.length).toBe(0);
    expect(persistModelMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });
});
