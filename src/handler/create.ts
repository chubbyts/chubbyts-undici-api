import { STATUS_CODES } from 'node:http';
import { v4 as uuid } from 'uuid';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import type { Handler, Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { PersistModel } from '../repository.js';
import { parseRequestBody } from '../request.js';
import { createResponseWithData, valueToData } from '../response.js';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters.js';
import type { EmbeddedSchema, EnrichedModelSchema, EnrichModel, InputModelSchema, Model } from '../model.js';

export const createCreateHandler = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  decoder: Decoder,
  inputModelSchema: IMS,
  persistModel: PersistModel<IMS>,
  enrichedModelSchema: EnrichedModelSchema<IMS, EMS>,
  encoder: Encoder,
  enrichModel: EnrichModel<IMS, EMS> = async (model) => model,
): Handler => {
  return async (serverRequest: ServerRequest): Promise<Response> => {
    const inputModelResult = inputModelSchema.safeParse(await parseRequestBody(decoder, serverRequest));

    if (!inputModelResult.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(inputModelResult.error) });
    }

    return createResponseWithData(
      serverRequest,
      encoder,
      valueToData(
        enrichedModelSchema.parse(
          await enrichModel(
            await persistModel({ id: uuid(), createdAt: new Date(), ...inputModelResult.data } as Model<IMS>),
            { serverRequest },
          ),
        ),
      ),
      201,
      STATUS_CODES[201],
    );
  };
};
