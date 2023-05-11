import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { ZodType } from 'zod';
import { v4 as uuid } from 'uuid';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Persist } from '../repository';
import { parseRequestBody } from '../request';
import { stringifyResponseBody, valueToData } from '../response';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters';
import type { EnrichModel } from '../model';

export const createCreateHandler = <C>(
  decoder: Decoder,
  inputSchema: ZodType,
  persist: Persist<C>,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
  enrichModel: EnrichModel<C> = async (model) => model,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const result = inputSchema.safeParse(await parseRequestBody(decoder, request));

    if (!result.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(result.error) });
    }

    const model = await persist({ id: uuid(), createdAt: new Date(), ...result.data });

    return stringifyResponseBody(
      request,
      responseFactory(201),
      encoder,
      outputSchema.parse(valueToData(await enrichModel(model, { request }))),
    );
  };
};
