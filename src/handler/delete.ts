import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { FindById, Remove } from '../repository';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { stringifyResponseBody } from '../response';

export const createDeleteHandler = (findById: FindById, remove: Remove, responseFactory: ResponseFactory): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const id = request.attributes.id as string;
    const model = await findById(id);

    if (!model) {
      throw createNotFound({ detail: `There is no entry with id ${id}` });
    }

    await remove(model);

    return stringifyResponseBody(request, responseFactory(204));
  };
};
