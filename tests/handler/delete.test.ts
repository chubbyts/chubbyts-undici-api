import { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { Response, ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { ResponseFactory } from '@chubbyts/chubbyts-http-types/dist/message-factory';
import { describe, expect, test } from '@jest/globals';
import * as getStream from 'get-stream';
import { PassThrough } from 'stream';
import { createDeleteHandler } from '../../src/handler/delete';
import { Model } from '../../src/model';
import { FindById, Remove } from '../../src/repository';

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

    const findById: FindById<{}> = jest.fn(async (givenId: string): Promise<Model<{}>> => {
      expect(givenId).toBe(id);

      return {
        id,
        createdAt: new Date('2022-06-11T12:36:26.012Z'),
        updatedAt: new Date('2022-06-11T12:36:44.372Z'),
      };
    });

    const remove: Remove<{}> = jest.fn(async <M>(givenModel: M) => {
      expect(givenModel).toEqual({
        id: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toBe(204);
      expect(givenReasonPhrase).toBeUndefined();

      return response;
    });

    const deleteHandler = createDeleteHandler<{}>(findById, remove, responseFactory);

    expect(await deleteHandler(request)).toEqual(response);

    expect(await getStream(response.body)).toBe(encodedOutputData);

    expect(findById).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
  });

  test('not found', async () => {
    const id = '93cf0de1-e83e-4f68-800d-835e055a6fe8';

    const request = {
      attributes: { accept: 'application/json', id },
    } as unknown as ServerRequest;

    const findById: FindById<{}> = jest.fn(async (givenId: string): Promise<undefined> => {
      expect(givenId).toBe(id);

      return undefined;
    });

    const remove: Remove<{}> = jest.fn();

    const responseFactory: ResponseFactory = jest.fn();

    const deleteHandler = createDeleteHandler<{}>(findById, remove, responseFactory);

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

    expect(findById).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(0);
    expect(responseFactory).toHaveBeenCalledTimes(0);
  });
});
