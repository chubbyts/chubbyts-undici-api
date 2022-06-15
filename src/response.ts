import { Data, isArray, isBoolean, isNumber, isString } from '@chubbyts/chubbyts-decode-encode/dist';
import { Encoder, EncodeError } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { isObject } from '@chubbyts/chubbyts-decode-encode/dist';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ZodError } from 'zod';

const valueToData = (value: unknown): Data => {
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([_, subValue]) => subValue !== undefined)
        .map(([subKey, subValue]) => [subKey, valueToData(subValue)]),
    );
  } else if (isArray(value)) {
    return value.filter((subValue) => subValue !== undefined).map(valueToData);
  } else if (isString(value) || isNumber(value) || isBoolean(value) || value === null) {
    return value;
  } else if (value instanceof Date) {
    return value.toJSON();
  } else if (value instanceof ZodError) {
    return valueToData(value.errors);
  }

  throw new EncodeError(
    `Unsupported value of type ${typeof value === 'object' ? value.constructor.name : typeof value}`,
  );
};

export const stringifyResponseBody = (
  request: ServerRequest,
  response: Response,
  encoder?: Encoder,
  data?: unknown,
): Response => {
  if (!data) {
    response.body.end();

    return response;
  }

  const accept = request.attributes.accept as string | undefined;

  if (!accept) {
    throw new Error(`Use createAcceptNegotiationMiddleware to assign request.attributes.accept.`);
  }

  if (!encoder) {
    throw new Error('Missing encoder');
  }

  response.body.end(encoder.encode(valueToData(data), accept));

  return { ...response, headers: { ...response.headers, 'content-type': [accept] } };
};
