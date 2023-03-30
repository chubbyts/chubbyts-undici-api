import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
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
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const createdAt = new Date('2022-06-11T12:36:26.012Z');
    const name = 'name1';

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const findById: FindById<{ name: string }> = jest.fn(async (givenId: string): Promise<Model<{ name: string }>> => {
      expect(givenId).toBe(id);

      return {
        id,
        createdAt,
        name,
      };
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toBe(200);
      expect(givenReasonPhrase).toBeUndefined();

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        name,
        _embedded: {
          key: 'value',
        },
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        name,
        _embedded: {
          key: 'value',
        },
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
          id: expect.any(String),
          createdAt: expect.any(Date),
          name,
        });

        expect(givenContext).toEqual({ request });

        return {
          ...givenModel,
          _embedded: { key: 'value' },
        };
      },
    );

    const readHandler = createReadHandler<{ name: string }>(
      findById,
      responseFactory,
      outputSchema,
      encoder,
      enrichModel,
    );

    expect(await readHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual({
      id,
      createdAt: createdAt.toJSON(),
      name,
      _embedded: {
        key: 'value',
      },
    });

    expect(findById).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
    expect(enrichModel).toHaveBeenCalledTimes(1);
  });

  test('successfully without enrich model', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const createdAt = new Date('2022-06-11T12:36:26.012Z');
    const name = 'name1';

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const findById: FindById<{ name: string }> = jest.fn(async (givenId: string): Promise<Model<{ name: string }>> => {
      expect(givenId).toBe(id);

      return {
        id,
        createdAt,
        name,
      };
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toBe(200);
      expect(givenReasonPhrase).toBeUndefined();

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        name,
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        id,
        createdAt: createdAt.toJSON(),
        name,
      });

      expect(givenContentType).toBe('application/json');

      return JSON.stringify(givenData);
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const readHandler = createReadHandler<{ name: string }>(findById, responseFactory, outputSchema, encoder);

    expect(await readHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual({
      id,
      createdAt: createdAt.toJSON(),
      name,
    });

    expect(findById).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('not found', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const findById: FindById<{}> = jest.fn(async (givenId: string): Promise<undefined> => {
      expect(givenId).toBe(id);

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

    const readHandler = createReadHandler<{}>(findById, responseFactory, outputSchema, encoder);

    try {
      await readHandler(request);
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
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(parse).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });
});
