import type { Stream } from 'stream';

export const streamToString = async (stream: Stream): Promise<string> => {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line functional/no-let
    let data = '';

    stream.on('data', (chunk) => (data += chunk));
    stream.on('end', () => resolve(data));
    stream.on('error', reject);
  });
};
