import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { v4 as uuid } from 'uuid';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import type { PersistModel } from '../repository.js';
import { parseRequestBody } from '../request.js';
import { stringifyResponseBody, valueToData } from '../response.js';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters.js';
import type { EmbeddedSchema, EnrichedModelSchema, EnrichModel, InputModelSchema, Model } from '../model.js';

export const createCreateHandler = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  decoder: Decoder,
  inputModelSchema: IMS,
  persistModel: PersistModel<IMS>,
  responseFactory: ResponseFactory,
  enrichedModelSchema: EnrichedModelSchema<IMS, EMS>,
  encoder: Encoder,
  enrichModel: EnrichModel<IMS, EMS> = async (model) => model,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const inputModelResult = inputModelSchema.safeParse(await parseRequestBody(decoder, request));

    if (!inputModelResult.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(inputModelResult.error) });
    }

    return stringifyResponseBody(
      request,
      responseFactory(201),
      encoder,
      valueToData(
        enrichedModelSchema.parse(
          await enrichModel(
            await persistModel({ id: uuid(), createdAt: new Date(), ...inputModelResult.data } as Model<IMS>),
            { request },
          ),
        ),
      ),
    );
  };
};
