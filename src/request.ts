import type { Data } from '@chubbyts/chubbyts-decode-encode/dist/data';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import type { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { streamToString } from './stream.js';

export const parseRequestBody = async (decoder: Decoder, request: ServerRequest): Promise<Data> => {
  const contentType = request.attributes.contentType as string | undefined;

  if (!contentType) {
    throw new Error('Use createContentTypeNegotiationMiddleware to assign request.attributes.contentType.');
  }

  const encodedBody = await streamToString(request.body);

  return decoder.decode(encodedBody, contentType, { request });
};
