import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { ZodType } from 'zod';
import { FindById, Persist } from '../repository';
import { createBadRequest, createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { parseRequestBody } from '../request';
import { stringifyResponseBody } from '../response';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters';

export const createUpdateHandler = (
  findById: FindById,
  decoder: Decoder,
  inputSchema: ZodType,
  persist: Persist,
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

    const result = inputSchema.safeParse(await parseRequestBody(decoder, request));

    if (!result.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(result.error) });
    }

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      outputSchema.parse(await persist({ ...model, updatedAt: new Date(), ...result.data })),
    );
  };
};
