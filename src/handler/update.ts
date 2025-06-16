import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { ZodType } from 'zod';
import { createBadRequest, createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { z } from 'zod';
import type { FindModelById, PersistModel } from '../repository.js';
import { parseRequestBody } from '../request.js';
import { stringifyResponseBody, valueToData } from '../response.js';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters.js';
import type { EnrichModel, EnrichedModel } from '../model.js';

const attributesSchema = z.object({ id: z.string() });

export const createUpdateHandler = <C>(
  findModelById: FindModelById<C>,
  decoder: Decoder,
  modelRequestSchema: ZodType,
  persistModel: PersistModel<C>,
  responseFactory: ResponseFactory,
  modelResponseSchema: ZodType,
  encoder: Encoder,
  enrichModel: EnrichModel<C> = async (model) => model,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const id = attributesSchema.parse(request.attributes).id;
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
    } = (await parseRequestBody(decoder, request)) as unknown as EnrichedModel<C>;

    const modelRequestResult = modelRequestSchema.safeParse(rest);

    if (!modelRequestResult.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(modelRequestResult.error) });
    }

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      modelResponseSchema.parse(
        valueToData(
          await enrichModel(await persistModel({ ...model, updatedAt: new Date(), ...modelRequestResult.data }), {
            request,
          }),
        ),
      ),
    );
  };
};
