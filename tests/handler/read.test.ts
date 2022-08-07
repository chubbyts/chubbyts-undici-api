import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from '@jest/globals';
import * as getStream from 'get-stream';
import { PassThrough } from 'stream';
import { ZodType } from 'zod';
import { createReadHandler } from '../../src/handler/read';
import { EnrichModel, Model } from '../../src/model';
import { FindById } from '../../src/repository';

describe('createReadHandler', () => {
  test('successfully', async () => {
    let encodedOutputData = '';

    const request = {
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const model: Model & { name: string } = {
      id: '93cf0de1-e83e-4f68-800d-835e055a6fe8',
      createdAt: new Date('2022-06-11T12:36:26.012Z'),
      name: 'name1',
    };

    const findById: FindById = jest.fn(async (id: string): Promise<Model> => {
      return model;
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toMatchInlineSnapshot(`200`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
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

    const readHandler = createReadHandler(findById, responseFactory, outputSchema, encoder, enrichModel);

    expect(await readHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(await getStream(response.body)).toBe(encodedOutputData);

    expect(findById).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
    expect(enrichModel).toHaveBeenCalledTimes(1);
  });

  test('successfully without enrich model', async () => {
    let encodedOutputData = '';

    const request = {
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const model: Model & { name: string } = {
      id: '93cf0de1-e83e-4f68-800d-835e055a6fe8',
      createdAt: new Date('2022-06-11T12:36:26.012Z'),
      name: 'name1',
    };

    const findById: FindById = jest.fn(async (id: string): Promise<Model> => {
      return model;
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toMatchInlineSnapshot(`200`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
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

    const readHandler = createReadHandler(findById, responseFactory, outputSchema, encoder);

    expect(await readHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(await getStream(response.body)).toBe(encodedOutputData);

    expect(findById).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('not found', async () => {
    const request = {
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const findById: FindById = jest.fn(async (id: string): Promise<undefined> => {
      return undefined;
    });

    const responseFactory: ResponseFactory = jest.fn();

    const parse: ZodType['parse'] = jest.fn();

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const readHandler = createReadHandler(findById, responseFactory, outputSchema, encoder);

    try {
      await readHandler(request);
      fail('Expect fail');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
        Object {
          "_httpError": "NotFound",
          "detail": "There is no entry with id undefined",
          "status": 404,
          "title": "Not Found",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
        }
      `);
    }

    expect(findById).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(parse).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });
});
