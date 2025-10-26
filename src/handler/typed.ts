import type { Handler, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { z } from 'zod';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { parse } from 'qs';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters.js';
import { valueToData } from '../response.js';

type DecoderDependsOnRequestBodySchema<TBody extends z.ZodObject | undefined> = TBody extends z.ZodObject
  ? Decoder
  : undefined;

type RequestAttributesSchemaDependsOnRequestBodySchema<
  RequestBody extends z.ZodObject | undefined,
  ResponseBody extends z.ZodObject | undefined,
> = (RequestBody extends z.ZodObject ? z.ZodObject<{ contentType: z.ZodString }> : z.ZodObject) &
  (ResponseBody extends z.ZodObject ? z.ZodObject<{ accept: z.ZodString }> : z.ZodObject);

type ZodObjectOrUndefined<S extends z.ZodObject | undefined> = S extends z.ZodObject ? z.infer<S> : undefined;

type EncoderDependsOnRequestBodySchema<TBody extends z.ZodObject | undefined> = TBody extends z.ZodObject
  ? Encoder
  : undefined;

export const createTypedHandler = <
  DependentDecoder extends DecoderDependsOnRequestBodySchema<RequestBodySchema>,
  RequestAttributesSchema extends RequestAttributesSchemaDependsOnRequestBodySchema<
    RequestBodySchema,
    ResponseBodySchema
  >,
  RequestAttributes extends z.infer<RequestAttributesSchema>,
  RequestQuerySchema extends z.ZodObject | undefined,
  RequestQuery extends ZodObjectOrUndefined<RequestQuerySchema>,
  RequestHeadersSchema extends z.ZodObject<{ [key: string]: z.ZodString }> | undefined,
  RequestHeaders extends ZodObjectOrUndefined<RequestHeadersSchema>,
  RequestBodySchema extends z.ZodObject | undefined,
  RequestBody extends ZodObjectOrUndefined<RequestBodySchema>,
  ResponseHeadersSchema extends z.ZodObject<{ [key: string]: z.ZodString }> | undefined,
  ResponseHeaders extends ZodObjectOrUndefined<ResponseHeadersSchema>,
  ResponseBodySchema extends z.ZodObject | undefined,
  ResponseBody extends ZodObjectOrUndefined<ResponseBodySchema>,
  DependentEncoder extends EncoderDependsOnRequestBodySchema<ResponseBodySchema>,
>(_: {
  request: {
    attributes: RequestAttributesSchema;
    query: RequestQuerySchema;
    headers: RequestHeadersSchema;
    body: RequestBodySchema;
  };
  response: {
    headers: ResponseHeadersSchema;
    body: ResponseBodySchema;
  };
  handler: (request: {
    attributes: RequestAttributes;
    query: RequestQuery;
    headers: RequestHeaders;
    body: RequestBody;
  }) => Promise<{
    status: number;
    statusText?: string;
    headers: ResponseHeaders;
    body: ResponseBody;
  }>;
  decoder: DependentDecoder;
  encoder: DependentEncoder;
}): Handler => {
  return async (serverRequest: ServerRequest): Promise<Response> => {
    const requestAttributes = _.request.attributes.parse(serverRequest.attributes) as RequestAttributes;

    // eslint-disable-next-line functional/no-let
    let requestQuery: RequestQuery;

    if (_.request.query) {
      const requestQueryResult = _.request.query.safeParse(
        parse(new URL(serverRequest.url).search.substring(1)),
      ) as z.ZodSafeParseResult<RequestQuery>;

      if (!requestQueryResult.success) {
        throw createBadRequest({
          invalidParameters: zodToInvalidParameters(requestQueryResult.error),
          context: 'query',
        });
      }

      requestQuery = requestQueryResult.data;
    } else {
      requestQuery = undefined as RequestQuery;
    }

    // eslint-disable-next-line functional/no-let
    let requestHeaders: RequestHeaders;

    if (_.request.headers) {
      const requestHeadersResult = _.request.headers.safeParse(
        Object.fromEntries(serverRequest.headers.entries()),
      ) as z.ZodSafeParseResult<RequestHeaders>;

      if (!requestHeadersResult.success) {
        throw createBadRequest({
          invalidParameters: zodToInvalidParameters(requestHeadersResult.error),
          context: 'headers',
        });
      }

      requestHeaders = requestHeadersResult.data;
    } else {
      requestHeaders = undefined as RequestHeaders;
    }

    // eslint-disable-next-line functional/no-let
    let requestBody: RequestBody;

    if (_.decoder && _.request.body && requestAttributes.contentType) {
      const requestBodyResult = _.request.body.safeParse(
        _.decoder.decode(await serverRequest.text(), requestAttributes.contentType as string),
      ) as z.ZodSafeParseResult<RequestBody>;

      if (!requestBodyResult.success) {
        throw createBadRequest({
          invalidParameters: zodToInvalidParameters(requestBodyResult.error),
          context: 'body',
        });
      }

      requestBody = requestBodyResult.data;
    } else {
      requestBody = undefined as RequestBody;
    }

    const typedResponse = await _.handler({
      attributes: requestAttributes,
      query: requestQuery,
      headers: requestHeaders,
      body: requestBody,
    });

    const responseHeaders = _.response.headers ? _.response.headers.parse(typedResponse.headers) : undefined;

    return new Response(
      _.encoder && _.response.body && requestAttributes.accept
        ? _.encoder.encode(valueToData(_.response.body.parse(typedResponse.body)), requestAttributes.accept as string)
        : null,
      {
        status: typedResponse.status,
        statusText: typedResponse.statusText,
        headers: {
          ...(_.encoder && _.response.body && requestAttributes.accept
            ? { 'content-type': requestAttributes.accept as string }
            : {}),
          ...(responseHeaders ? responseHeaders : {}),
        },
      },
    );
  };
};
