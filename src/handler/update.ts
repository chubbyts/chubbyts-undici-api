import { STATUS_CODES } from 'node:http';
import { createBadRequest, createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import { z } from 'zod';
import type { Handler, Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { FindModelById, PersistModel } from '../repository.js';
import { parseRequestBody } from '../request.js';
import { createResponseWithData, valueToData } from '../response.js';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters.js';
import type { EmbeddedSchema, EnrichModel, EnrichedModelSchema, InputModelSchema } from '../model.js';

const attributesSchema = z.object({ id: z.string() });

export const createUpdateHandler = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  findModelById: FindModelById<IMS>,
  decoder: Decoder,
  inputModelSchema: IMS,
  persistModel: PersistModel<IMS>,
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

    const {
      id: _,
      createdAt: __,
      updatedAt: ___,
      _embedded: ____,
      _links: _____,
      ...rest
    } = (await parseRequestBody(decoder, serverRequest)) as unknown as { [key: string]: unknown };

    const modelRequestResult = inputModelSchema.safeParse(rest);

    if (!modelRequestResult.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(modelRequestResult.error) });
    }

    return createResponseWithData(
      serverRequest,
      encoder,
      valueToData(
        enrichedModelSchema.parse(
          await enrichModel(
            await persistModel({
              id: model.id,
              createdAt: model.createdAt,
              updatedAt: new Date(),
              ...modelRequestResult.data,
            }),
            { serverRequest },
          ),
        ),
      ),
      200,
      STATUS_CODES[200],
    );
  };
};
