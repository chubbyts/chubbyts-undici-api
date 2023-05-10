import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import type { ZodType } from 'zod';
import { createBadRequest, createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { FindById, Persist } from '../repository';
import { parseRequestBody } from '../request';
import { stringifyResponseBody, valueToData } from '../response';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters';
import type { EnrichModel, EnrichedModel } from '../model';

export const createUpdateHandler = <C>(
  findById: FindById<C>,
  decoder: Decoder,
  inputSchema: ZodType,
  persist: Persist<C>,
  responseFactory: ResponseFactory,
  outputSchema: ZodType,
  encoder: Encoder,
  enrichModel: EnrichModel<C> = async (model) => model,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const id = request.attributes.id as string;
    const existingModel = await findById(id);

    if (!existingModel) {
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

    const result = inputSchema.safeParse(rest);

    if (!result.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(result.error) });
    }

    const model = await persist({ ...existingModel, updatedAt: new Date(), ...result.data });

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      outputSchema.parse(valueToData(await enrichModel(model, { request }))),
    );
  };
};
