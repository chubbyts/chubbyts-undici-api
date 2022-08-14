import { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { ZodType } from 'zod';
import { FindById, Persist } from '../repository';
import { createBadRequest, createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { parseRequestBody } from '../request';
import { stringifyResponseBody, valueToData } from '../response';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters';
import { EnrichModel, EnrichedModel } from '../model';

export const createUpdateHandler = (
  findById: FindById,
  decoder: Decoder,
  inputSchema: ZodType,
  persist: Persist,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
  enrichModel: EnrichModel = (model) => model,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const id = request.attributes.id as string;
    const existingModel = await findById(id);

    if (!existingModel) {
      throw createNotFound({ detail: `There is no entry with id ${id}` });
    }

    const {
      id: _,
      createdAt: __,
      updatedAt: ___,
      _embedded: ____,
      _links: _____,
      ...rest
    } = (await parseRequestBody(decoder, request)) as unknown as EnrichedModel;

    const result = inputSchema.safeParse(rest);

    if (!result.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(result.error) });
    }

    const model = await persist({ ...existingModel, updatedAt: new Date(), ...result.data });

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      outputSchema.parse(valueToData(enrichModel(model, { request }))),
    );
  };
};
