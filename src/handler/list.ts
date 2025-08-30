import type { Handler } from '@chubbyts/chubbyts-http-types/dist/handler';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { ResolveModelList } from '../repository.js';
import { stringifyResponseBody, valueToData } from '../response.js';
import { zodToInvalidParameters } from '../zod-to-invalid-parameters.js';
import type {
  EmbeddedSchema,
  EnrichedModelListSchema,
  EnrichModelList,
  InputModelListSchema,
  InputModelSchema,
} from '../model.js';

export const createListHandler = <
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
>(
  inputModelListSchema: IMLS,
  resolveModelList: ResolveModelList<IMS, IMLS>,
  responseFactory: ResponseFactory,
  enrichedModelListSchema: EnrichedModelListSchema<IMS, IMLS, EMS, EMLS>,
  encoder: Encoder,
  enrichModelList: EnrichModelList<IMS, IMLS, EMS, EMLS> = async (list) => list,
): Handler => {
  return async (request: ServerRequest): Promise<Response> => {
    const inputListResult = inputModelListSchema.safeParse(request.uri.query);

    if (!inputListResult.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(inputListResult.error) });
    }

    return stringifyResponseBody(
      request,
      responseFactory(200),
      encoder,
      valueToData(
        enrichedModelListSchema.parse(await enrichModelList(await resolveModelList(inputListResult.data), { request })),
      ),
    );
  };
};
