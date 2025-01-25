import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { ZodType } from 'zod';
import { z } from 'zod';
import { stringifyResponseBody, valueToData } from '../response';
import type { FindModelById } from '../repository';
import type { EnrichModel } from '../model';

const attributesSchema = z.object({ id: z.string() });

export const createReadHandler = <C>(
  findModelById: FindModelById<C>,
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

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      modelResponseSchema.parse(valueToData(await enrichModel(model, { request }))),
    );
  };
};
