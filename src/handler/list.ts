import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { ZodType } from 'zod';
import { ResolveList } from '../repository';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { stringifyResponseBody } from '../response';

export const createListHandler = (
  inputSchema: ZodType,
  resolveList: ResolveList,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const result = inputSchema.safeParse(request.uri.query);

    if (!result.success) {
      throw createBadRequest({ validation: result.error });
    }

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      outputSchema.parse(await resolveList(result.data)),
    );
  };
};
