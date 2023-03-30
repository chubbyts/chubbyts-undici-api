import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { ZodType } from 'zod';
import { ResolveList } from '../repository';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { stringifyResponseBody, valueToData } from '../response';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters';
import { EnrichList } from '../model';

export const createListHandler = <C>(
  inputSchema: ZodType,
  resolveList: ResolveList<C>,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
  enrichList: EnrichList<C> = async (list) => list,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const result = inputSchema.safeParse(request.uri.query);

    if (!result.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(result.error) });
    }

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      outputSchema.parse(valueToData(await enrichList(await resolveList(result.data), { request }))),
    );
  };
};
