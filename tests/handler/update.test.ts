import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from '@jest/globals';
import * as getStream from 'get-stream';
import { PassThrough } from 'stream';
import { ZodError, ZodType } from 'zod';
import { createUpdateHandler } from '../../src/handler/update';
import { EnrichModel, Model } from '../../src/model';
import { FindById, Persist } from '../../src/repository';

describe('createUpdateHandler', () => {
  test('successfully', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const createdAt = new Date('2022-06-11T12:36:26.012Z');
    const updatedAt = new Date('2022-06-11T12:36:26.012Z');
    const name = 'name1';

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

    const findById: FindById<{ name: string }> = jest.fn(async (givenId: string): Promise<Model<{ name: string }>> => {
      expect(givenId).toBe(id);

      return {
        id,
        createdAt,
        updatedAt,
        name,
      };
    });

    const decode: Decoder['decode'] = jest.fn((givenEncodedData: string, givenContentType: string): Data => {
      expect(givenEncodedData).toBe(encodedInputData);
      expect(givenContentType).toBe('application/json');

      return inputData;
    });

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    const safeParse: ZodType['safeParse'] = jest.fn((givenData: Record<string, string>) => {
      const { id: _, createdAt: __, updatedAt: ___, _embedded: ____, _links: _____, ...rest } = inputData;

      expect(givenData).toEqual(rest);

      return {
        success: true,
        data: { ...givenData },
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const persist: Persist<{ name: string }> = jest.fn(
      async (givenModel: Model<{ name: string }>): Promise<Model<{ name: string }>> => {
        expect(givenModel).toEqual({
          id,
          createdAt,
          updatedAt: expect.any(Date),
          name: newName,
        });

        return givenModel;
      },
    );

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toBe(200);
      expect(givenReasonPhrase).toBeUndefined();

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        updatedAt: expect.any(String),
        name: newName,
        _embedded: { key: 'value' },
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        updatedAt: expect.any(String),
        name: newName,
        _embedded: { key: 'value' },
      });

      expect(givenContentType).toBe('application/json');

      return JSON.stringify(givenData);
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const enrichModel: EnrichModel<{ name: string }> = jest.fn(
      async <C>(givenModel: Model<C>, givenContext: { [key: string]: unknown }) => {
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
    );

    const updateHandler = createUpdateHandler<{ name: string }>(
      findById,
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

    expect(findById).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(1);
    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
    expect(enrichModel).toHaveBeenCalledTimes(1);
  });

  test('successfully without enrich model', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const createdAt = new Date('2022-06-11T12:36:26.012Z');
    const updatedAt = new Date('2022-06-11T12:36:26.012Z');
    const name = 'name1';
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

    const findById: FindById<{ name: string }> = jest.fn(async (givenId: string): Promise<Model<{ name: string }>> => {
      expect(givenId).toBe(id);

      return {
        id,
        createdAt,
        updatedAt,
        name,
      };
    });

    const decode: Decoder['decode'] = jest.fn((givenEncodedData: string, givenContentType: string): Data => {
      expect(givenEncodedData).toBe(encodedInputData);
      expect(givenContentType).toBe('application/json');

      return inputData;
    });

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    const safeParse: ZodType['safeParse'] = jest.fn((givenData: Record<string, string>) => {
      const { id: _, createdAt: __, updatedAt: ___, _embedded: ____, _links: _____, ...rest } = inputData;

      expect(givenData).toEqual(rest);

      return {
        success: true,
        data: { ...givenData },
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const persist: Persist<{ name: string }> = jest.fn(
      async (givenModel: Model<{ name: string }>): Promise<Model<{ name: string }>> => {
        expect(givenModel).toEqual({
          id,
          createdAt,
          updatedAt: expect.any(Date),
          name: newName,
        });

        return givenModel;
      },
    );

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toBe(200);
      expect(givenReasonPhrase).toBeUndefined();

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        updatedAt: expect.any(String),
        name: newName,
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        updatedAt: expect.any(String),
        name: newName,
      });

      expect(givenContentType).toBe('application/json');

      return JSON.stringify(givenData);
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const updateHandler = createUpdateHandler<{ name: string }>(
      findById,
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

    expect(findById).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(1);
    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('not found', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

    const request = {
      attributes: { id },
    } as unknown as ServerRequest;

    const findById: FindById<{ name: string }> = jest.fn(async (givenId: string): Promise<undefined> => {
      expect(givenId).toBe(id);

      return undefined;
    });

    const decode: Decoder['decode'] = jest.fn();

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    const safeParse: ZodType['safeParse'] = jest.fn();

    const inputSchema: ZodType = { safeParse } as ZodType;

    const persist: Persist<{}> = jest.fn();

    const responseFactory: ResponseFactory = jest.fn();

    const parse: ZodType['parse'] = jest.fn();

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const updateHandler = createUpdateHandler<{}>(
      findById,
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

    expect(findById).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(0);
    expect(safeParse).toHaveBeenCalledTimes(0);
    expect(persist).toHaveBeenCalledTimes(0);
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(parse).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });

  test('could not parse', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const name = 'name1';
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

    const findById: FindById<{ name: string }> = jest.fn(async (givenId: string): Promise<Model<{ name: string }>> => {
      expect(givenId).toBe(id);

      return {
        id,
        createdAt: new Date('2022-06-11T12:36:26.012Z'),
        name,
      };
    });

    const decode: Decoder['decode'] = jest.fn((givenEncodedData: string, givenContentType: string): Data => {
      expect(givenEncodedData).toBe(encodedInputData);
      expect(givenContentType).toBe('application/json');

      return inputData;
    });

    const decoder: Decoder = {
      decode,
      contentTypes: ['application/json'],
    };

    const safeParse: ZodType['safeParse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual(inputData);

      return {
        success: false,
        error: new ZodError([{ code: 'custom', message: 'Invalid length', path: ['path', 0, 'field'] }]),
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const persist: Persist<{}> = jest.fn();

    const responseFactory: ResponseFactory = jest.fn();

    const parse: ZodType['parse'] = jest.fn();

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const updateHandler = createUpdateHandler<{}>(
      findById,
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    try {
      await updateHandler(request);
      fail('Expect error');
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

    expect(findById).toHaveBeenCalledTimes(1);
    expect(decode).toHaveBeenCalledTimes(1);
    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(0);
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(parse).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });
});
