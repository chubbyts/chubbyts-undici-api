import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { z } from 'zod';
import { stringifyResponseBody, valueToData } from '../response.js';
import type { FindModelById } from '../repository.js';
import type { EmbeddedSchema, EnrichedModelSchema, EnrichModel, InputModelSchema } from '../model.js';

const attributesSchema = z.object({ id: z.string() });

export const createReadHandler = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  findModelById: FindModelById<IMS>,
  responseFactory: ResponseFactory,
  enrichedModelSchema: EnrichedModelSchema<IMS, EMS>,
  encoder: Encoder,
  enrichModel: EnrichModel<IMS, EMS> = async (model) => model,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const id = attributesSchema.parse(request.attributes).id;
    const model = await findModelById(id);

    if (!model) {
      throw createNotFound({ detail: `There is no entry with id "${id}"` });
    }

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      valueToData(enrichedModelSchema.parse(await enrichModel(model, { request }))),
    );
  };
};
