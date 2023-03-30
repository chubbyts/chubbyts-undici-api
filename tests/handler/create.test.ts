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
import { createCreateHandler } from '../../src/handler/create';
import { EnrichModel, Model } from '../../src/model';
import { Persist } from '../../src/repository';

describe('createCreateHandler', () => {
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
        success: true,
        data: { ...givenData },
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const persist: Persist<Model> = jest.fn(async <M>(model: M): Promise<M> => {
      expect(model).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        name: newName,
      });

      return model;
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toBe(201);
      expect(givenReasonPhrase).toBeUndefined();

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        name: newName,
        _embedded: { key: 'value' },
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
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

    const enrichModel: EnrichModel<Model> = jest.fn(
      async <M>(givenModel: M, givenContext: { [key: string]: unknown }) => {
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
    );

    const createHandler = createCreateHandler<Model>(
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
      enrichModel,
    );

    expect(await createHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      name: newName,
      _embedded: {
        key: 'value',
      },
    });

    expect(decode).toHaveBeenCalledTimes(1);
    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
    expect(enrichModel).toHaveBeenCalledTimes(1);
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
        success: true,
        data: { ...givenData },
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const persist: Persist<Model> = jest.fn(async <M>(model: M): Promise<M> => {
      expect(model).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        name: newName,
      });

      return model;
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toBe(201);
      expect(givenReasonPhrase).toBeUndefined();

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        name: newName,
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        name: newName,
      });

      expect(givenContentType).toBe('application/json');

      return JSON.stringify(givenData);
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const createHandler = createCreateHandler<Model>(
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    expect(await createHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual({
      id: expect.any(String),
      createdAt: expect.any(String),
      name: newName,
    });

    expect(decode).toHaveBeenCalledTimes(1);
    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
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

    const persist: Persist<Model> = jest.fn();

    const responseFactory: ResponseFactory = jest.fn();

    const parse: ZodType['parse'] = jest.fn();

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const createHandler = createCreateHandler<Model>(
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
    );

    try {
      await createHandler(request);
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

    expect(decode).toHaveBeenCalledTimes(1);
    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(0);
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(parse).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });
});
