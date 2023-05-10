import { PassThrough } from 'stream';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from '@jest/globals';
import * as getStream from 'get-stream';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { createDeleteHandler } from '../../src/handler/delete';
import type { FindById, Remove } from '../../src/repository';

describe('createDeleteHandler', () => {
  test('successfully', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';
    const encodedOutputData = '';

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();
    responseBody.write(encodedOutputData);

    const response = { body: responseBody } as unknown as Response;

    const [findById, findByIdMocks] = useFunctionMock<FindById<{ name: string }>>([
      {
        parameters: [id],
        return: Promise.resolve({
          id,
          createdAt: new Date('2022-06-11T12:36:26.012Z'),
          updatedAt: new Date('2022-06-11T12:36:44.372Z'),
          name: 'test',
        }),
      },
    ]);

    const [remove, removeMocks] = useFunctionMock<Remove<{ name: string }>>([
      {
        callback: async <M>(givenModel: M) => {
          expect(givenModel).toEqual({
            id: expect.any(String),
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            name: 'test',
          });
        },
      },
    ]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([
      {
        parameters: [204],
        return: response,
      },
    ]);

    const deleteHandler = createDeleteHandler<{ name: string }>(findById, remove, responseFactory);

    expect(await deleteHandler(request)).toEqual(response);

    expect(await getStream(response.body)).toBe(encodedOutputData);

    expect(findByIdMocks.length).toBe(0);
    expect(removeMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
  });

  test('not found', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const [findById, findByIdMocks] = useFunctionMock<FindById<{ name: string }>>([
      {
        parameters: [id],
        return: Promise.resolve(undefined),
      },
    ]);

    const [remove, removeMocks] = useFunctionMock<Remove<{ name: string }>>([]);

    const [responseFactory, responseFactoryMocks] = useFunctionMock<ResponseFactory>([]);

    const deleteHandler = createDeleteHandler<{ name: string }>(findById, remove, responseFactory);

    try {
      await deleteHandler(request);
      fail('Expect fail');
    } catch (e) {
      expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
        {
          "_httpError": "NotFound",
          "detail": "There is no entry with id "93cf0de1-e83e-4f68-800d-835e055a6fe8"",
          "status": 404,
          "title": "Not Found",
          "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
        }
      `);
    }

    expect(findByIdMocks.length).toBe(0);
    expect(removeMocks.length).toBe(0);
    expect(responseFactoryMocks.length).toBe(0);
  });
});
