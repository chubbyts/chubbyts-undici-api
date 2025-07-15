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
import { createCreateHandler } from '../../src/handler/create';
import { type EnrichModel, stringSchema, createEnrichedModelSchema } from '../../src/model';
import type { PersistModel } from '../../src/repository';
import { streamToString } from '../../src/stream';

describe('createCreateHandler', () => {
  const inputModelSchema = z.object({ name: stringSchema });
  const enrichedModelSchema = createEnrichedModelSchema(inputModelSchema);

  test('successfully', async () => {
    const newName = 'name1';

    const inputData = { name: newName };
    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { accept: 'application/json', contentType: 'application/json' },
      body: requestBody,
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([
      {
        callback: async (givenModel) => {
          expect(givenModel).toEqual({
            id: expect.any(String),
            createdAt: expect.any(Date),
            name: newName,
          });

          return givenModel;
        },
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [201],
        return: response,
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData, givenContentType) => {
          expect(givenData).toEqual({
            id: expect.any(String),
            createdAt: expect.any(String),
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
            id: expect.any(String),
            createdAt: expect.any(Date),
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

    const createHandler = createCreateHandler(
      decoder,
      inputModelSchema,
      persistModel,
      responseFactory,
      enrichedModelSchema,
      encoder,
      enrichModel,
    );

    expect(await createHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      name: newName,
      _embedded: {
        key: 'value',
      },
    });

    expect(decoderMocks.length).toBe(0);
    expect(persistModelMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
    expect(enrichModelMocks.length).toBe(0);
  });

  test('successfully without enrich model', async () => {
    const newName = 'name1';

    const inputData = { name: newName };
    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { accept: 'application/json', contentType: 'application/json' },
      body: requestBody,
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([
      {
        callback: async (givenModel) => {
          expect(givenModel).toEqual({
            id: expect.any(String),
            createdAt: expect.any(Date),
            name: newName,
          });

          return givenModel;
        },
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [201],
        return: response,
      },
    ]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([
      {
        name: 'encode',
        callback: (givenData, givenContentType) => {
          expect(givenData).toEqual({
            id: expect.any(String),
            createdAt: expect.any(String),
            name: newName,
          });

          expect(givenContentType).toBe('application/json');

          return JSON.stringify(givenData);
        },
      },
    ]);

    const createHandler = createCreateHandler(
      decoder,
      inputModelSchema,
      persistModel,
      responseFactory,
      enrichedModelSchema,
      encoder,
    );

    expect(await createHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await streamToString(response.body))).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      name: newName,
    });

    expect(decoderMocks.length).toBe(0);
    expect(persistModelMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });

  test('could not parse', async () => {
    const inputData = { key: 'value' };
    const encodedInputData = JSON.stringify(inputData);

    const requestBody = new PassThrough();
    requestBody.write(encodedInputData);
    requestBody.end();

    const request = {
      attributes: { contentType: 'application/json' },
      body: requestBody,
    } as unknown as ServerRequest;

    const [decoder, decoderMocks] = useObjectMock<Decoder>([
      { name: 'decode', parameters: [encodedInputData, 'application/json', { request }], return: inputData },
    ]);

    const [persistModel, persistModelMocks] = useFunctionMock<PersistModel<typeof inputModelSchema>>([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

    const createHandler = createCreateHandler(
      decoder,
      inputModelSchema,
      persistModel,
      responseFactory,
      enrichedModelSchema,
      encoder,
    );

    try {
      await createHandler(request);
      throw new Error('Expect Error');
    } catch (e) {
      expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "BadRequest",
          "invalidParameters": [
            {
              "context": {
                "code": "invalid_type",
                "expected": "string",
              },
              "name": "name",
              "reason": "Invalid input: expected string, received undefined",
            },
          ],
          "status": 400,
          "title": "Bad Request",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
        }
      `);
    }

    expect(decoderMocks.length).toBe(0);
    expect(persistModelMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
    expect(encoderMocks.length).toBe(0);
  });
});
