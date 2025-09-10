import type { Data } from '@chubbyts/chubbyts-decode-encode/dist/data';
import { isObject, isArray, isBoolean, isNumber, isString } from '@chubbyts/chubbyts-decode-encode/dist/data';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import { EncodeError } from '@chubbyts/chubbyts-decode-encode/dist/encoder/encoder';
import { isHttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { Response } from '@chubbyts/chubbyts-undici-server/dist/server';

export const valueToData = (value: unknown): Data => {
  if (value instanceof Date) {
    return value.toJSON();
  } else if (isHttpError(value)) {
    return valueToData({ ...value });
  } else if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([_, subValue]) => subValue !== undefined)
        .map(([subKey, subValue]) => [subKey, valueToData(subValue)]),
    );
  } else if (isArray(value)) {
    return value.filter((subValue) => subValue !== undefined).map(valueToData);
  } else if (isString(value) || isNumber(value) || isBoolean(value) || value === null) {
    return value;
  }

  throw new EncodeError(
    `Unsupported value of type ${typeof value === 'object' ? value.constructor.name : typeof value}`,
  );
};

export const createResponseWithData = (
  serverRequest: ServerRequest<{ accept?: string }>,
  encoder: Encoder,
  data: Data,
  status: number,
  statusText: string | undefined,
): Response => {
  const { accept } = serverRequest.attributes;

  if (!accept) {
    throw new Error('Use createAcceptNegotiationMiddleware to assign request.attributes.accept.');
  }

  return new Response(encoder.encode(data, accept, { serverRequest }), {
    status: status,
    statusText: statusText,
    headers: {
      'content-type': accept,
    },
  });
};
