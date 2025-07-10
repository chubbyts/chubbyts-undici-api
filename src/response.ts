import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { isObject, isArray, isBoolean, isNumber, isString } from '@chubbyts/chubbyts-decode-encode/dist';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { EncodeError } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { isHttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';

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

export const stringifyResponseBody = (
  request: ServerRequest,
  response: Response,
  encoder?: Encoder,
  data?: Data,
): Response => {
  if (!data) {
    response.body.end();

    return response;
  }

  const accept = request.attributes.accept as string | undefined;

  if (!accept) {
    throw new Error('Use createAcceptNegotiationMiddleware to assign request.attributes.accept.');
  }

  if (!encoder) {
    throw new Error('Missing encoder');
  }

  response.body.end(encoder.encode(data, accept, { request }));

  return { ...response, headers: { ...response.headers, 'content-type': [accept] } };
};
