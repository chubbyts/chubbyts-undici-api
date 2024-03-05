import { isArray, isBoolean, isNull, isNumber, isObject, isString } from '@chubbyts/chubbyts-decode-encode/dist';
import { ZodError } from 'zod';

type InvalidParameter = {
  name: string;
  reason: string;
  [key: string]: unknown;
};

const resolveName = (path: Array<number | string>): string => {
  return path
    .map((pathPart, i) => {
      return i > 0 ? `[${pathPart}]` : pathPart;
    })
    .join('');
};

const filterContext = (rest: unknown): unknown => {
  if (isObject(rest)) {
    return Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, filterContext(value)]));
  }

  if (isArray(rest)) {
    return rest.map((value) => filterContext(value));
  }

  if (isNull(rest) || isBoolean(rest) || isNumber(rest) || isString(rest)) {
    return rest;
  }

  if (rest instanceof ZodError) {
    return zodToInvalidParameters(rest);
  }

  if (rest instanceof Date) {
    return rest.toJSON();
  }

  return '**filtered**';
};

export const zodToInvalidParameters = (zodError: ZodError): Array<InvalidParameter> => {
  return zodError.errors.map((error) => {
    const { path, message, ...context } = error;

    return {
      name: resolveName(path),
      reason: message,
      context: filterContext(context),
    };
  });
};
