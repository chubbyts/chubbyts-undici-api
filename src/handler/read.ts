import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { FindById } from '../repository';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { stringifyResponseBody } from '../response';
import { ZodType } from 'zod';

export const createReadHandler = (
  findById: FindById,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const id = request.attributes.id as string;
    const model = await findById(id);

    if (!model) {
      throw createNotFound({ detail: `There is no entry with id ${id}` });
    }

    return stringifyResponseBody(request, responseFactory(200), encoder, outputSchema.parse(model));
  };
};
