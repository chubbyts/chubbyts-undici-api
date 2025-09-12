import { STATUS_CODES } from 'node:http';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import { z } from 'zod';
import type { Handler, Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { createResponseWithData, valueToData } from '../response.js';
import type { FindModelById } from '../repository.js';
import type { EmbeddedSchema, EnrichedModelSchema, EnrichModel, InputModelSchema } from '../model.js';

const attributesSchema = z.object({ id: z.string() });

export const createReadHandler = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  findModelById: FindModelById<IMS>,
  enrichedModelSchema: EnrichedModelSchema<IMS, EMS>,
  encoder: Encoder,
  enrichModel: EnrichModel<IMS, EMS> = async (model) => model,
): Handler => {
  return async (serverRequest: ServerRequest): Promise<Response> => {
    const id = attributesSchema.parse(serverRequest.attributes).id;
    const model = await findModelById(id);

    if (!model) {
      throw createNotFound({ detail: `There is no entry with id "${id}"` });
    }

    return createResponseWithData(
      serverRequest,
      encoder,
      valueToData(enrichedModelSchema.parse(await enrichModel(model, { serverRequest }))),
      200,
      STATUS_CODES[200],
    );
  };
};
