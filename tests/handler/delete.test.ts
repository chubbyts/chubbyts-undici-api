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
    let encodedOutputData = '';

    const request = {
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const responseBody = new PassThrough();

    const response = { body: responseBody } as unknown as Response;

    const model: Model = {
      id: '93cf0de1-e83e-4f68-800d-835e055a6fe8',
      createdAt: new Date('2022-06-11T12:36:26.012Z'),
      updatedAt: new Date('2022-06-11T12:36:44.372Z'),
    };

    const findById: FindById = jest.fn(async (id: string): Promise<Model> => {
      return model;
    });

    const remove: Remove = jest.fn(async (givenModel: Model) => {
      expect(givenModel).toBe(model);
    });

    const responseFactory: ResponseFactory = jest.fn((givenStatus: number, givenReasonPhrase?: string) => {
      expect(givenStatus).toMatchInlineSnapshot(`204`);
      expect(givenReasonPhrase).toMatchInlineSnapshot(`undefined`);

      return response;
    });

    const deleteHandler = createDeleteHandler(findById, remove, responseFactory);

    expect(await deleteHandler(request)).toEqual(response);

    expect(await getStream(response.body)).toBe(encodedOutputData);

    expect(findById).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(responseFactory).toHaveBeenCalledTimes(1);
  });

  test('not found', async () => {
    const request = {
      attributes: { accept: 'application/json' },
    } as unknown as ServerRequest;

    const findById: FindById = jest.fn(async (id: string): Promise<undefined> => {
      return undefined;
    });

    const remove: Remove = jest.fn();

    const responseFactory: ResponseFactory = jest.fn();

    const deleteHandler = createDeleteHandler(findById, remove, responseFactory);

    try {
      await deleteHandler(request);
      fail('Expect fail');
    } catch (e) {
      expect(e).toMatchInlineSnapshot(`
        Object {
          "_httpError": "NotFound",
          "detail": "There is no entry with id undefined",
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
