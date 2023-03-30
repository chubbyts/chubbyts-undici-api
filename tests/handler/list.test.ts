import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from '@jest/globals';
import * as getStream from 'get-stream';
import { PassThrough } from 'stream';
import { ZodError, ZodType } from 'zod';
import { createListHandler } from '../../src/handler/list';
import { EnrichList, List, Model } from '../../src/model';
import { ResolveList } from '../../src/repository';

describe('createListHandler', () => {
  test('successfully', async () => {
    const query = { filters: { key: 'value' } };

    const request = {
      uri: { query },
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const safeParse: ZodType['safeParse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toBe(query);

      return {
        success: true,
        data: { ...givenData },
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const resolveList: ResolveList<Model> = jest.fn(async <M extends Model>(givenList: List<M>): Promise<List<M>> => {
      expect(givenList).toEqual(query);

      return {
        ...givenList,
        items: [],
        count: 0,
      };
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toBe(200);
      expect(givenReasonPhrase).toBeUndefined();

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        _embedded: {
          key: 'value',
        },
        count: 0,
        filters: query.filters,
        items: [],
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        _embedded: {
          key: 'value',
        },
        count: 0,
        filters: query.filters,
        items: [],
      });

      expect(givenContentType).toBe('application/json');

      return JSON.stringify(givenData);
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const enrichList: EnrichList<Model> = jest.fn(async <L>(givenList: L, givenContext: { [key: string]: unknown }) => {
      expect(givenList).toEqual({
        count: 0,
        filters: query.filters,
        items: [],
      });

      expect(givenContext).toEqual({ request });

      return {
        ...givenList,
        _embedded: { key: 'value' },
      };
    });

    const listHandler = createListHandler<Model>(
      inputSchema,
      resolveList,
      responseFactory,
      outputSchema,
      encoder,
      enrichList,
    );

    expect(await listHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual({
      _embedded: {
        key: 'value',
      },
      count: 0,
      filters: query.filters,
      items: [],
    });

    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(resolveList).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
    expect(enrichList).toHaveBeenCalledTimes(1);
  });

  test('successfully without enrichList', async () => {
    const query = { filters: { key: 'value' } };

    const request = {
      uri: { query },
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const safeParse: ZodType['safeParse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toBe(query);

      return {
        success: true,
        data: { ...givenData },
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const resolveList: ResolveList<Model> = jest.fn(async <M extends Model>(givenList: List<M>): Promise<List<M>> => {
      expect(givenList).toEqual(query);

      return {
        ...givenList,
        items: [],
        count: 0,
      };
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toBe(200);
      expect(givenReasonPhrase).toBeUndefined();

      return response;
    });

    const parse: ZodType['parse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toEqual({
        count: 0,
        filters: query.filters,
        items: [],
      });

      return givenData;
    });

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn((givenData: Data, givenContentType: string): string => {
      expect(givenData).toEqual({
        count: 0,
        filters: query.filters,
        items: [],
      });

      expect(givenContentType).toBe('application/json');

      return JSON.stringify(givenData);
    });

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const listHandler = createListHandler<Model>(inputSchema, resolveList, responseFactory, outputSchema, encoder);

    expect(await listHandler(request)).toEqual({ ...response, headers: { 'content-type': ['application/json'] } });

    expect(JSON.parse(await getStream(response.body))).toEqual({
      count: 0,
      filters: query.filters,
      items: [],
    });

    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(resolveList).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(encode).toHaveBeenCalledTimes(1);
  });

  test('could not parse', async () => {
    const query = { filters: { key: 'value' } };
    const request = {
      uri: { query },
    } as unknown as ServerRequest;

    const safeParse: ZodType['safeParse'] = jest.fn((givenData: Record<string, string>) => {
      expect(givenData).toBe(query);

      return {
        success: false,
        error: new ZodError([{ code: 'custom', message: 'Invalid length', path: ['path', 0, 'field'] }]),
      };
    });

    const inputSchema: ZodType = { safeParse } as ZodType;

    const resolveList: ResolveList<Model> = jest.fn();

    const responseFactory: ResponseFactory = jest.fn();

    const parse: ZodType['parse'] = jest.fn();

    const outputSchema: ZodType = { parse } as ZodType;

    const encode: Encoder['encode'] = jest.fn();

    const encoder: Encoder = {
      encode,
      contentTypes: ['application/json'],
    };

    const listHandler = createListHandler<Model>(inputSchema, resolveList, responseFactory, outputSchema, encoder);

    try {
      await listHandler(request);
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

    expect(safeParse).toHaveBeenCalledTimes(1);
    expect(resolveList).toHaveBeenCalledTimes(0);
    expect(responseFactory).toHaveBeenCalledTimes(0);
    expect(parse).toHaveBeenCalledTimes(0);
    expect(encode).toHaveBeenCalledTimes(0);
  });
});
