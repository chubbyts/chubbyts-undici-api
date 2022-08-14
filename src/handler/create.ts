import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { ZodType } from 'zod';
import { Persist } from '../repository';
import { v4 as uuid } from 'uuid';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { parseRequestBody } from '../request';
import { stringifyResponseBody, valueToData } from '../response';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters';
import { EnrichModel } from '../model';

export const createCreateHandler = (
  decoder: Decoder,
  inputSchema: ZodType,
  persist: Persist,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
  enrichModel: EnrichModel = (model) => model,
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
      outputSchema.parse(valueToData(enrichModel(model, { request }))),
    );
  };
};
