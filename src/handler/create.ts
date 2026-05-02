import { STATUS_CODES } from 'node:http';
import { v4 } from 'uuid';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import { z } from 'zod';
import type { PersistModel } from '../repository.js';
import type { EmbeddedSchema, EnrichedModel, EnrichedModelSchema, EnrichModel, InputModelSchema } from '../model.js';
import { createTypedHandler } from './typed.js';

export const createCreateHandler = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  decoder: Decoder,
  inputModelSchema: IMS,
  persistModel: PersistModel<IMS>,
  enrichedModelSchema: EnrichedModelSchema<IMS, EMS>,
  encoder: Encoder,
  enrichModel: EnrichModel<IMS, EMS> = async (model) => model as EnrichedModel<IMS, EMS>,
  uuid: () => string = v4,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: z.object({ contentType: z.string(), accept: z.string() }),
      body: inputModelSchema,
    },
    response: {
      body: enrichedModelSchema,
    },
    handler: async ({ body }) => {
      const persistedModel = await persistModel({ ...body, id: uuid(), createdAt: new Date(), updatedAt: undefined });
      const enrichedModel = await enrichModel(persistedModel);

      return {
        status: 201,
        statusText: STATUS_CODES[201],
        body: enrichedModel,
      };
    },
    decoder,
    encoder,
  });
};
