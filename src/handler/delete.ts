import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { FindOneById, Remove } from '../repository';
import { stringifyResponseBody } from '../response';

export const createDeleteHandler = <C>(
  findOneById: FindOneById<C>,
  remove: Remove<C>,
  responseFactory: ResponseFactory,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const id = request.attributes.id as string;
    const model = await findOneById(id);

    if (!model) {
      throw createNotFound({ detail: `There is no entry with id "${id}"` });
    }

    await remove(model);

    return stringifyResponseBody(request, responseFactory(204));
  };
};
