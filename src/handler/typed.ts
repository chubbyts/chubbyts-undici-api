import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Handler, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response } from '@chubbyts/chubbyts-undici-server/dist/server';
import { parse } from 'qs';
import type { z } from 'zod';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters.js';
import { valueToData } from '../response.js';
import type { AnyZodObject } from '../model.js';

type HeadersSchema = z.ZodObject<{ [key: string]: z.ZodString }>;

type ContentTypeAttributesSchema = z.ZodObject<{
  contentType: z.ZodString;
}>;

type AcceptAttributesSchema = z.ZodObject<{
  accept: z.ZodString;
}>;

type ContentTypeAndAcceptAttributesSchema = z.ZodObject<{
  contentType: z.ZodString;
  accept: z.ZodString;
}>;

type RequestSchema<
  RequestAttributesSchema extends AnyZodObject,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
> = {
  attributes: RequestAttributesSchema;
  headers?: RequestHeadersSchema;
  query?: RequestQuerySchema;
};

type RequestWithBodySchema<
  RequestAttributesSchema extends AnyZodObject,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
  RequestBodySchema extends AnyZodObject,
> = RequestSchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema> & {
  body: RequestBodySchema;
};

type ResponseSchema<ResponseHeadersSchema extends HeadersSchema | undefined> = {
  headers?: ResponseHeadersSchema;
};

type ResponseWithBodySchema<
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends AnyZodObject,
> = ResponseSchema<ResponseHeadersSchema> & {
  body: ResponseBodySchema;
};

type HandlerRequest<
  RequestAttributesSchema extends AnyZodObject,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
> = {
  attributes: z.output<RequestAttributesSchema>;
  headers: z.output<RequestHeadersSchema>;
  query: z.output<RequestQuerySchema>;
};

type HandlerRequestWithBody<
  RequestAttributesSchema extends AnyZodObject,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
  RequestBodySchema extends AnyZodObject,
> = HandlerRequest<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema> & {
  body: z.output<RequestBodySchema>;
};

type HandlerResponseBase<ResponseHeadersSchema extends HeadersSchema | undefined> = {
  status: number;
  statusText?: string;
  headers?: z.output<ResponseHeadersSchema>;
};

type HandlerResponseWithBody<ResponseHeadersSchema extends HeadersSchema | undefined, ResponseBody> = Promise<
  HandlerResponseBase<ResponseHeadersSchema> & { body: ResponseBody }
>;

type HandlerResponse<ResponseHeadersSchema extends HeadersSchema | undefined, ResponseBody> = [ResponseBody] extends [
  undefined,
]
  ? Promise<HandlerResponseBase<ResponseHeadersSchema>>
  : HandlerResponseWithBody<ResponseHeadersSchema, ResponseBody>;

type WithRequestAndResponse<
  RequestAttributesSchema extends ContentTypeAndAcceptAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
  RequestBodySchema extends AnyZodObject,
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends AnyZodObject,
> = {
  request: RequestWithBodySchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema, RequestBodySchema>;
  response: ResponseWithBodySchema<ResponseHeadersSchema, ResponseBodySchema>;
  handler: (
    request: HandlerRequestWithBody<
      RequestAttributesSchema,
      RequestHeadersSchema,
      RequestQuerySchema,
      RequestBodySchema
    >,
  ) => HandlerResponseWithBody<ResponseHeadersSchema, z.output<ResponseBodySchema>>;
  decoder: Decoder;
  encoder: Encoder;
};

type WithRequestOnly<
  RequestAttributesSchema extends ContentTypeAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
  RequestBodySchema extends AnyZodObject,
  ResponseHeadersSchema extends HeadersSchema | undefined,
> = {
  request: RequestWithBodySchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema, RequestBodySchema>;
  response: ResponseSchema<ResponseHeadersSchema>;
  handler: (
    request: HandlerRequestWithBody<
      RequestAttributesSchema,
      RequestHeadersSchema,
      RequestQuerySchema,
      RequestBodySchema
    >,
  ) => HandlerResponse<ResponseHeadersSchema, undefined>;
  decoder: Decoder;
};

type WithResponseOnly<
  RequestAttributesSchema extends AcceptAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends AnyZodObject,
> = {
  request: RequestSchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema>;
  response: ResponseWithBodySchema<ResponseHeadersSchema, ResponseBodySchema>;
  handler: (
    request: HandlerRequest<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema>,
  ) => HandlerResponseWithBody<ResponseHeadersSchema, z.output<ResponseBodySchema>>;
  encoder: Encoder;
};

type WithNeither<
  RequestAttributesSchema extends AnyZodObject,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined,
> = {
  request: RequestSchema<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema>;
  response: ResponseSchema<ResponseHeadersSchema>;
  handler: (
    request: HandlerRequest<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema>,
  ) => HandlerResponse<ResponseHeadersSchema, undefined>;
};

export type TypedHandlerConfig<
  RequestAttributesSchema extends AnyZodObject | undefined,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
  RequestBodySchema extends AnyZodObject | undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends AnyZodObject | undefined,
> = RequestAttributesSchema extends ContentTypeAndAcceptAttributesSchema
  ? RequestBodySchema extends AnyZodObject
    ? ResponseBodySchema extends AnyZodObject
      ? WithRequestAndResponse<
          RequestAttributesSchema,
          RequestHeadersSchema,
          RequestQuerySchema,
          RequestBodySchema,
          ResponseHeadersSchema,
          ResponseBodySchema
        >
      : never
    : never
  : RequestAttributesSchema extends ContentTypeAttributesSchema
    ? RequestBodySchema extends AnyZodObject
      ? ResponseBodySchema extends undefined
        ? WithRequestOnly<
            RequestAttributesSchema,
            RequestHeadersSchema,
            RequestQuerySchema,
            RequestBodySchema,
            ResponseHeadersSchema
          >
        : never
      : never
    : RequestAttributesSchema extends AcceptAttributesSchema
      ? RequestBodySchema extends undefined
        ? ResponseBodySchema extends AnyZodObject
          ? WithResponseOnly<
              RequestAttributesSchema,
              RequestHeadersSchema,
              RequestQuerySchema,
              ResponseHeadersSchema,
              ResponseBodySchema
            >
          : never
        : never
      : RequestAttributesSchema extends AnyZodObject
        ? RequestBodySchema extends undefined
          ? ResponseBodySchema extends undefined
            ? WithNeither<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema, ResponseHeadersSchema>
            : never
          : never
        : never;

export function createTypedHandler<
  RequestAttributesSchema extends ContentTypeAndAcceptAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined = undefined,
  RequestQuerySchema extends AnyZodObject | undefined = undefined,
  RequestBodySchema extends AnyZodObject = AnyZodObject,
  ResponseHeadersSchema extends HeadersSchema | undefined = undefined,
  ResponseBodySchema extends AnyZodObject = AnyZodObject,
>(
  _: WithRequestAndResponse<
    RequestAttributesSchema,
    RequestHeadersSchema,
    RequestQuerySchema,
    RequestBodySchema,
    ResponseHeadersSchema,
    ResponseBodySchema
  >,
): Handler;
export function createTypedHandler<
  RequestAttributesSchema extends ContentTypeAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined = undefined,
  RequestQuerySchema extends AnyZodObject | undefined = undefined,
  RequestBodySchema extends AnyZodObject = AnyZodObject,
  ResponseHeadersSchema extends HeadersSchema | undefined = undefined,
>(
  _: WithRequestOnly<
    RequestAttributesSchema,
    RequestHeadersSchema,
    RequestQuerySchema,
    RequestBodySchema,
    ResponseHeadersSchema
  >,
): Handler;
export function createTypedHandler<
  RequestAttributesSchema extends AcceptAttributesSchema,
  RequestHeadersSchema extends HeadersSchema | undefined = undefined,
  RequestQuerySchema extends AnyZodObject | undefined = undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined = undefined,
  ResponseBodySchema extends AnyZodObject = AnyZodObject,
>(
  _: WithResponseOnly<
    RequestAttributesSchema,
    RequestHeadersSchema,
    RequestQuerySchema,
    ResponseHeadersSchema,
    ResponseBodySchema
  >,
): Handler;
export function createTypedHandler<
  RequestAttributesSchema extends AnyZodObject,
  RequestHeadersSchema extends HeadersSchema | undefined = undefined,
  RequestQuerySchema extends AnyZodObject | undefined = undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined = undefined,
>(_: WithNeither<RequestAttributesSchema, RequestHeadersSchema, RequestQuerySchema, ResponseHeadersSchema>): Handler;
export function createTypedHandler<
  RequestAttributesSchema extends AnyZodObject,
  RequestHeadersSchema extends HeadersSchema | undefined,
  RequestQuerySchema extends AnyZodObject | undefined,
  RequestBodySchema extends AnyZodObject | undefined,
  ResponseHeadersSchema extends HeadersSchema | undefined,
  ResponseBodySchema extends AnyZodObject | undefined,
>(
  _: TypedHandlerConfig<
    RequestAttributesSchema,
    RequestHeadersSchema,
    RequestQuerySchema,
    RequestBodySchema,
    ResponseHeadersSchema,
    ResponseBodySchema
  >,
): Handler {
  const resolveRequestHeaders = (
    serverRequest: ServerRequest,
    request: { attributes: AnyZodObject; headers?: HeadersSchema },
  ): z.output<RequestHeadersSchema> => {
    if (undefined === request.headers) {
      return {} as z.output<RequestHeadersSchema>;
    }

    const requestHeadersResult = request.headers.safeParse(Object.fromEntries(serverRequest.headers.entries()));

    if (!requestHeadersResult.success) {
      throw createBadRequest({
        invalidParameters: zodToInvalidParameters(requestHeadersResult.error),
        context: 'headers',
      });
    }

    return requestHeadersResult.data as z.output<RequestHeadersSchema>;
  };

  const resolveRequestQuery = (
    serverRequest: ServerRequest,
    request: { attributes: AnyZodObject; query?: AnyZodObject },
  ): z.output<RequestQuerySchema> => {
    if (undefined === request.query) {
      return {} as z.output<RequestQuerySchema>;
    }

    const requestQueryResult = request.query.safeParse(parse(new URL(serverRequest.url).search.substring(1)));

    if (!requestQueryResult.success) {
      throw createBadRequest({
        invalidParameters: zodToInvalidParameters(requestQueryResult.error),
        context: 'query',
      });
    }

    return requestQueryResult.data as z.output<RequestQuerySchema>;
  };

  const resolveRequestBody = async (
    serverRequest: ServerRequest,
    decoder: Decoder,
    contentType: string,
    body: NonNullable<RequestBodySchema>,
  ): Promise<z.output<NonNullable<RequestBodySchema>>> => {
    const requestBodyResult = body.safeParse(decoder.decode(await serverRequest.text(), contentType));

    if (!requestBodyResult.success) {
      throw createBadRequest({
        invalidParameters: zodToInvalidParameters(requestBodyResult.error),
        context: 'body',
      });
    }

    return requestBodyResult.data as z.output<NonNullable<RequestBodySchema>>;
  };

  return async (serverRequest: ServerRequest): Promise<Response> => {
    if (
      'decoder' in _ &&
      undefined !== _.decoder &&
      'body' in _.request &&
      undefined !== _.request.body &&
      'encoder' in _ &&
      undefined !== _.encoder &&
      'body' in _.response &&
      undefined !== _.response.body
    ) {
      const config = _ as WithRequestAndResponse<
        ContentTypeAndAcceptAttributesSchema,
        RequestHeadersSchema,
        RequestQuerySchema,
        NonNullable<RequestBodySchema>,
        ResponseHeadersSchema,
        NonNullable<ResponseBodySchema>
      >;
      const requestAttributes = config.request.attributes.parse(serverRequest.attributes);

      const typedResponse = await config.handler({
        attributes: requestAttributes,
        headers: resolveRequestHeaders(serverRequest, config.request),
        query: resolveRequestQuery(serverRequest, config.request),
        body: await resolveRequestBody(
          serverRequest,
          config.decoder,
          requestAttributes.contentType,
          config.request.body,
        ),
      });

      return new Response(
        config.encoder.encode(valueToData(config.response.body.parse(typedResponse.body)), requestAttributes.accept),
        {
          status: typedResponse.status,
          statusText: typedResponse.statusText,
          headers: {
            'content-type': requestAttributes.accept,
            ...(config.response.headers ? config.response.headers.parse(typedResponse.headers) : {}),
          },
        },
      );
    }

    if ('decoder' in _ && undefined !== _.decoder && 'body' in _.request && undefined !== _.request.body) {
      const config = _ as WithRequestOnly<
        ContentTypeAttributesSchema,
        RequestHeadersSchema,
        RequestQuerySchema,
        NonNullable<RequestBodySchema>,
        ResponseHeadersSchema
      >;

      const requestAttributes = config.request.attributes.parse(serverRequest.attributes);

      const typedResponse = await config.handler({
        attributes: requestAttributes,
        headers: resolveRequestHeaders(serverRequest, config.request),
        query: resolveRequestQuery(serverRequest, config.request),
        body: await resolveRequestBody(
          serverRequest,
          config.decoder,
          requestAttributes.contentType,
          config.request.body,
        ),
      });

      return new Response(null, {
        status: typedResponse.status,
        statusText: typedResponse.statusText,
        headers: {
          ...(config.response.headers ? config.response.headers.parse(typedResponse.headers) : {}),
        },
      });
    }

    if ('encoder' in _ && undefined !== _.encoder && 'body' in _.response && undefined !== _.response.body) {
      const config = _ as WithResponseOnly<
        AcceptAttributesSchema,
        RequestHeadersSchema,
        RequestQuerySchema,
        ResponseHeadersSchema,
        NonNullable<ResponseBodySchema>
      >;

      const requestAttributes = config.request.attributes.parse(serverRequest.attributes);

      const typedResponse = await config.handler({
        attributes: requestAttributes,
        headers: resolveRequestHeaders(serverRequest, config.request),
        query: resolveRequestQuery(serverRequest, config.request),
      });

      return new Response(
        config.encoder.encode(valueToData(config.response.body.parse(typedResponse.body)), requestAttributes.accept),
        {
          status: typedResponse.status,
          statusText: typedResponse.statusText,
          headers: {
            'content-type': requestAttributes.accept,
            ...(config.response.headers ? config.response.headers.parse(typedResponse.headers) : {}),
          },
        },
      );
    }

    const config = _ as WithNeither<AnyZodObject, RequestHeadersSchema, RequestQuerySchema, ResponseHeadersSchema>;

    const requestAttributes = config.request.attributes.parse(serverRequest.attributes);

    const typedResponse = await config.handler({
      attributes: requestAttributes,
      headers: resolveRequestHeaders(serverRequest, config.request),
      query: resolveRequestQuery(serverRequest, config.request),
    });

    return new Response(null, {
      status: typedResponse.status,
      statusText: typedResponse.statusText,
      headers: {
        ...(config.response.headers ? config.response.headers.parse(typedResponse.headers) : {}),
      },
    });
  };
}
