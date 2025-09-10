import { STATUS_CODES } from 'node:http';
import { createBadRequest } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import type { Handler, Response, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { parse } from 'qs';
import type { ResolveModelList } from '../repository.js';
import { createResponseWithData, valueToData } from '../response.js';
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
  enrichedModelListSchema: EnrichedModelListSchema<IMS, IMLS, EMS, EMLS>,
  encoder: Encoder,
  enrichModelList: EnrichModelList<IMS, IMLS, EMS, EMLS> = async (list) => list,
): Handler => {
  return async (serverRequest: ServerRequest): Promise<Response> => {
    const search = parse(new URL(serverRequest.url).search.substring(1));

    const inputListResult = inputModelListSchema.safeParse(search);

    if (!inputListResult.success) {
      throw createBadRequest({ invalidParameters: zodToInvalidParameters(inputListResult.error) });
    }

    return createResponseWithData(
      serverRequest,
      encoder,
      valueToData(
        enrichedModelListSchema.parse(
          await enrichModelList(await resolveModelList(inputListResult.data), { serverRequest }),
        ),
      ),
      200,
      STATUS_CODES[200],
    );
  };
};
