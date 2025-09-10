import type { Data } from '@chubbyts/chubbyts-decode-encode/dist/data';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder/decoder';
import type { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';

export const parseRequestBody = async (
  decoder: Decoder,
  serverRequest: ServerRequest<{ contentType?: string }>,
): Promise<Data> => {
  const { contentType } = serverRequest.attributes;

  if (!contentType) {
    throw new Error('Use createContentTypeNegotiationMiddleware to assign request.attributes.contentType.');
  }

  return decoder.decode(await serverRequest.text(), contentType, { serverRequest });
};
