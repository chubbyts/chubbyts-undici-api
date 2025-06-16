import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { z } from 'zod';
import type { FindModelById, RemoveModel } from '../repository.js';
import { stringifyResponseBody } from '../response.js';

const attributesSchema = z.object({ id: z.string() });

export const createDeleteHandler = <C>(
  findModelById: FindModelById<C>,
  removeModel: RemoveModel<C>,
  responseFactory: ResponseFactory,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const id = attributesSchema.parse(request.attributes).id;
    const model = await findModelById(id);

    if (!model) {
      throw createNotFound({ detail: `There is no entry with id "${id}"` });
    }

    await removeModel(model);

    return stringifyResponseBody(request, responseFactory(204));
  };
};
