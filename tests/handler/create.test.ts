import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
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
    const inputData = { name: 'name1' };
    const encodedInputData = JSON.stringify(inputData);

    let encodedOutputData = '';

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
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

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

    const persist: Persist = jest.fn(async (model: Model): Promise<Model> => {
      expect(model).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        name: 'name1',
      });

      return model;
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toMatchInlineSnapshot(`201`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        name: 'name1',
        _embedded: { key: 'value' },
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        name: 'name1',
        _embedded: { key: 'value' },
      });

      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      encodedOutputData = JSON.stringify(givenData);

      return encodedOutputData;
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const enrichModel: EnrichModel = jest.fn((givenModel: Model, { request: givenRequest }) => {
      expect(givenModel).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        name: 'name1',
      });

      expect(givenRequest).toEqual(request);

      return {
        ...givenModel,
        _embedded: { key: 'value' },
      };
    });

    const createHandler = createCreateHandler(
      decoder,
      inputSchema,
      persist,
      responseFactory,
      outputSchema,
      encoder,
      enrichModel,
    );

    expect(await createHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(await getStream(response.body)).toBe(encodedOutputData);

    expect(decode).toHaveBeenCalledTimes(1);
    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
    expect(enrichModel).toHaveBeenCalledTimes(1);
  });

  test('successfully without enrich model', async () => {
    const inputData = { name: 'name1' };
    const encodedInputData = JSON.stringify(inputData);

    let encodedOutputData = '';

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
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

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

    const persist: Persist = jest.fn(async (model: Model): Promise<Model> => {
      expect(model).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        name: 'name1',
      });

      return model;
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toMatchInlineSnapshot(`201`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        name: 'name1',
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(String),
        name: 'name1',
      });

      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

      encodedOutputData = JSON.stringify(givenData);

      return encodedOutputData;
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const createHandler = createCreateHandler(decoder, inputSchema, persist, responseFactory, outputSchema, encoder);

    expect(await createHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(await getStream(response.body)).toBe(encodedOutputData);

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
      expect(givenContentType).toMatchInlineSnapshot(`"application/json"`);

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

    const persist: Persist = jest.fn();

    const responseFactory: ResponseFactory = jest.fn();

    const parse: ZodType['parse'] = jest.fn();

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const createHandler = createCreateHandler(decoder, inputSchema, persist, responseFactory, outputSchema, encoder);

    try {
      await createHandler(request);
      fail('Expect error');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
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
