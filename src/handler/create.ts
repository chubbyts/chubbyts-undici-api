import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { v4 as uuid } from 'uuid';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { PersistModel } from '../repository.js';
import { parseRequestBody } from '../request.js';
import { stringifyResponseBody, valueToData } from '../response.js';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters.js';
import type { EnrichedModelSchema, EnrichModel, InputModel, InputModelSchema, Model } from '../model.js';

export const createCreateHandler = <IM extends InputModel>(
  decoder: Decoder,
  inputModelSchema: InputModelSchema<IM>,
  persistModel: PersistModel<IM>,
  responseFactory: ResponseFactory,
  enrichedModelSchema: EnrichedModelSchema<IM>,
  encoder: Encoder,
  enrichModel: EnrichModel<IM> = async (model) => model,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const inputModelResult = inputModelSchema.safeParse(await parseRequestBody(decoder, request));

    if (!inputModelResult.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(inputModelResult.error) });
    }

    const model = await persistModel({ id: uuid(), createdAt: new Date(), ...inputModelResult.data } as Model<IM>);

    return stringifyResponseBody(
      request,
      responseFactory(201),
      encoder,
      valueToData(enrichedModelSchema.parse(await enrichModel(model, { request }))),
    );
  };
};
