import { STATUS_CODES } from 'node:http';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { z } from 'zod';
import type { Handler, ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response } from '@chubbyts/chubbyts-undici-server/dist/server';
import type { FindModelById, RemoveModel } from '../repository.js';
import type { InputModelSchema } from '../model.js';

const attributesSchema = z.object({ id: z.string() });

export const createDeleteHandler = <IMS extends InputModelSchema>(
  findModelById: FindModelById<IMS>,
  removeModel: RemoveModel<IMS>,
): Handler => {
  return async (serverRequest: ServerRequest): Promise<Response> => {
    const id = attributesSchema.parse(serverRequest.attributes).id;
    const model = await findModelById(id);

    if (!model) {
      throw createNotFound({ detail: `There is no entry with id "${id}"` });
    }

    await removeModel(model);

    return new Response(null, { status: 204, statusText: STATUS_CODES[204] });
  };
};
