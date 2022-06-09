import { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import * as getStream from 'get-stream';

export const parseRequestBody = async (decoder: Decoder, request: ServerRequest): Promise<Data> => {
  const contentType = request.attributes.contentType as string | undefined;

  if (!contentType) {
    throw new Error(`Use createContentTypeNegotiationMiddleware to assign request.attributes.contentType.`);
  }

  const encodedBody = await getStream(request.body);

  return decoder.decode(encodedBody, contentType);
};
