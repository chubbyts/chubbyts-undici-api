import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import { describe, expect, test } from 'vitest';
import { useObjectMock } from '@chubbyts/chubbyts-function-mock/dist/object-mock';
import { useFunctionMock } from '@chubbyts/chubbyts-function-mock/dist/function-mock';
import { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { stringify } from 'qs';
import type { HttpError } from '@chubbyts/chubbyts-http-error/dist/http-error';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Data } from '@chubbyts/chubbyts-decode-encode/dist';
import { z } from 'zod';
import { valueToData } from '../../src/response';
import type {
  EnrichedPet,
  EnrichedVaccination,
  EnrichPetList,
  InputPetList,
  Pet,
  PetList,
  ResolvePetList,
  Vaccination,
  EnrichedPetList,
  PersistPet,
  EnrichPet,
  InputPet,
  FindPetById,
  RemovePet,
} from '../../sample/pet';
import {
  createPetCreateHandler,
  createPetDeleteHandler,
  createPetListHandler,
  createPetReadHandler,
  createPetUpdateHandler,
} from '../../sample/pet';
import { createTypedHandler } from '../../src/handler/typed';

const vaccination: Vaccination = {
  id: 'd986f88b-a4d6-4a81-a249-c145fdf847e9',
  createdAt: new Date('2025-10-10T12:00:00Z'),
  updatedAt: new Date('2025-10-10T12:15:00Z'),
  name: 'Rabbies',
};

const enrichedVaccination: EnrichedVaccination = vaccination;

const inputPet: InputPet = {
  name: 'Blacky',
  tag: '123-456-789',
  vaccinations: [{ id: vaccination.id, injectedAt: new Date('2025-10-25T15:00:00Z') }],
};

const createPet = (id: string): Pet => ({
  id,
  createdAt: new Date('2025-10-25T12:00:00Z'),
  updatedAt: new Date('2025-10-25T15:00:00Z'),
  ...inputPet,
});

const createEnrichedPet = (pet: Pet): EnrichedPet => ({
  ...pet,
  _embedded: {
    vaccinations: [enrichedVaccination],
  },
  _links: {
    read: {
      href: `/api/pet/${pet.id}`,
      attributes: {
        method: 'GET',
      },
    },
    update: {
      href: `/api/pet/${pet.id}`,
      attributes: {
        method: 'PUT',
      },
    },
    delete: {
      href: `/api/pet/${pet.id}`,
      attributes: {
        method: 'DELETE',
      },
    },
  },
});

describe('createTypedHandler', () => {
  describe('createPetListHandler', () => {
    test('missing attribute', async () => {
      const [resolvePetList, resolvePetListMocks] = useFunctionMock<ResolvePetList>([]);
      const [enrichPetList, enrichPetListMocks] = useFunctionMock<EnrichPetList>([]);
      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const handler = createPetListHandler(resolvePetList, enrichPetList, encoder);

      try {
        await handler(
          new ServerRequest('https://example.com/api/pet', {
            method: 'GET',
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "accept"
              ],
              "message": "Invalid input: expected string, received undefined"
            }
          ]]
        `);
      }

      expect(resolvePetListMocks.length).toBe(0);
      expect(enrichPetListMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('invalid query', async () => {
      const [resolvePetList, resolvePetListMocks] = useFunctionMock<ResolvePetList>([]);
      const [enrichPetList, enrichPetListMocks] = useFunctionMock<EnrichPetList>([]);
      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const handler = createPetListHandler(resolvePetList, enrichPetList, encoder);

      try {
        await handler(
          new ServerRequest('https://example.com/api/pet?offset=test', {
            method: 'GET',
            attributes: {
              accept: 'application/json',
            },
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "BadRequest",
            "context": "query",
            "invalidParameters": [
              {
                "context": {
                  "code": "invalid_type",
                  "expected": "number",
                  "received": "NaN",
                },
                "name": "offset",
                "reason": "Invalid input: expected number, received NaN",
              },
            ],
            "status": 400,
            "title": "Bad Request",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
          }
        `);
      }

      expect(resolvePetListMocks.length).toBe(0);
      expect(enrichPetListMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('success without query', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');
      const enrichedPet = createEnrichedPet(pet);

      const inputPetList: InputPetList = { offset: 0, limit: 20, filters: {}, sort: {} };

      const petList: PetList = {
        ...inputPetList,
        items: [pet],
        count: 1,
      };

      const enrichedPetList: EnrichedPetList = {
        ...inputPetList,
        items: [enrichedPet],
        count: 1,
        _links: {
          list: {
            href: '/api/pet',
            attributes: {
              method: 'GET',
            },
          },
          create: {
            href: '/api/pet',
            attributes: {
              method: 'POST',
            },
          },
        },
      };

      const [resolvePetList, resolvePetListMocks] = useFunctionMock<ResolvePetList>([
        { parameters: [inputPetList], return: Promise.resolve(petList) },
      ]);

      const [enrichPetList, enrichPetListMocks] = useFunctionMock<EnrichPetList>([
        { parameters: [petList], return: Promise.resolve(enrichedPetList) },
      ]);

      const responseBody = valueToData(enrichedPetList);
      const responseBodyString = JSON.stringify(responseBody);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        { name: 'encode', parameters: [responseBody, 'application/json'], return: responseBodyString },
      ]);

      const handler = createPetListHandler(resolvePetList, enrichPetList, encoder);

      const response = await handler(
        new ServerRequest('https://example.com/api/pet', {
          method: 'GET',
          attributes: {
            accept: 'application/json',
          },
        }),
      );

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(await response.json()).toEqual(responseBody);

      expect(resolvePetListMocks.length).toBe(0);
      expect(enrichPetListMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('success with query', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');
      const enrichedPet = createEnrichedPet(pet);

      const inputPetList: InputPetList = { offset: 10, limit: 10, filters: { name: pet.name }, sort: { name: 'asc' } };

      const petList: PetList = {
        ...inputPetList,
        items: [pet],
        count: 1,
      };

      const enrichedPetList: EnrichedPetList = {
        ...inputPetList,
        items: [enrichedPet],
        count: 1,
        _links: {
          list: {
            href: '/api/pet',
            attributes: {
              method: 'GET',
            },
          },
          create: {
            href: '/api/pet',
            attributes: {
              method: 'POST',
            },
          },
        },
      };

      const [resolvePetList, resolvePetListMocks] = useFunctionMock<ResolvePetList>([
        { parameters: [inputPetList], return: Promise.resolve(petList) },
      ]);

      const [enrichPetList, enrichPetListMocks] = useFunctionMock<EnrichPetList>([
        { parameters: [petList], return: Promise.resolve(enrichedPetList) },
      ]);

      const responseBody = valueToData(enrichedPetList);
      const responseBodyString = JSON.stringify(responseBody);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        { name: 'encode', parameters: [responseBody, 'application/json'], return: responseBodyString },
      ]);

      const handler = createPetListHandler(resolvePetList, enrichPetList, encoder);

      const response = await handler(
        new ServerRequest(`https://example.com/api/pet${stringify(inputPetList, { addQueryPrefix: true })}`, {
          method: 'GET',
          attributes: {
            accept: 'application/json',
          },
        }),
      );

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(await response.json()).toEqual(responseBody);

      expect(resolvePetListMocks.length).toBe(0);
      expect(enrichPetListMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });
  });

  describe('createPetCreateHandler', () => {
    test('missing attribute', async () => {
      const [decoder, decoderMocks] = useObjectMock<Decoder>([]);
      const [persistPet, persistPetMocks] = useFunctionMock<PersistPet>([]);
      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([]);
      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const handler = createPetCreateHandler(decoder, persistPet, enrichPet, encoder);

      try {
        await handler(
          new ServerRequest('https://example.com/api/pet', {
            method: 'POST',
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "contentType"
              ],
              "message": "Invalid input: expected string, received undefined"
            },
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "accept"
              ],
              "message": "Invalid input: expected string, received undefined"
            }
          ]]
        `);
      }

      expect(decoderMocks.length).toBe(0);
      expect(persistPetMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('invalid request body', async () => {
      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: ['', 'application/json'], return: {} },
      ]);

      const [persistPet, persistPetMocks] = useFunctionMock<PersistPet>([]);
      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([]);
      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const handler = createPetCreateHandler(decoder, persistPet, enrichPet, encoder);

      try {
        await handler(
          new ServerRequest('https://example.com/api/pet', {
            method: 'POST',
            attributes: {
              contentType: 'application/json',
              accept: 'application/json',
            },
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "BadRequest",
            "context": "body",
            "invalidParameters": [
              {
                "context": {
                  "code": "invalid_type",
                  "expected": "string",
                },
                "name": "name",
                "reason": "Invalid input: expected string, received undefined",
              },
              {
                "context": {
                  "code": "invalid_type",
                  "expected": "array",
                },
                "name": "vaccinations",
                "reason": "Invalid input: expected array, received undefined",
              },
            ],
            "status": 400,
            "title": "Bad Request",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
          }
        `);
      }

      expect(decoderMocks.length).toBe(0);
      expect(persistPetMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('success', async () => {
      const requestBody: Data = valueToData(inputPet);
      const requestBodyString = JSON.stringify(requestBody);

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [requestBodyString, 'application/json'], return: requestBody },
      ]);

      // eslint-disable-next-line functional/no-let
      let pet: Pet;

      // eslint-disable-next-line functional/no-let
      let enrichedPet: EnrichedPet;

      const [persistPet, persistPetMocks] = useFunctionMock<PersistPet>([
        {
          callback: async (givenPet: Pet) => {
            pet = givenPet;

            return pet;
          },
        },
      ]);

      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([
        {
          callback: async (givenPet: Pet): Promise<EnrichedPet> => {
            expect(givenPet).toBe(pet);

            enrichedPet = createEnrichedPet(pet);

            return enrichedPet;
          },
        },
      ]);

      // eslint-disable-next-line functional/no-let
      let responseBody: Data = {};

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          callback: (givenData: Data, contentType: string) => {
            responseBody = valueToData(enrichedPet);

            expect(givenData).toEqual(responseBody);
            expect(contentType).toBe('application/json');

            return JSON.stringify(responseBody);
          },
        },
      ]);

      const handler = createPetCreateHandler(decoder, persistPet, enrichPet, encoder);

      const response = await handler(
        new ServerRequest('https://example.com/api/pet', {
          method: 'POST',
          attributes: {
            contentType: 'application/json',
            accept: 'application/json',
          },
          body: requestBodyString,
        }),
      );

      expect(response.status).toBe(201);
      expect(response.statusText).toBe('Created');
      expect(await response.json()).toEqual(responseBody);

      expect(decoderMocks.length).toBe(0);
      expect(persistPetMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });
  });

  describe('createPetReadHandler', () => {
    test('missing attribute', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');

      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([]);
      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([]);
      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const handler = createPetReadHandler(findPetById, enrichPet, encoder);

      try {
        await handler(
          new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
            method: 'GET',
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "id"
              ],
              "message": "Invalid input: expected string, received undefined"
            },
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "accept"
              ],
              "message": "Invalid input: expected string, received undefined"
            }
          ]]
        `);
      }

      expect(findPetByIdMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('missing pet', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');

      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([
        { parameters: [pet.id], return: Promise.resolve(undefined) },
      ]);

      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const handler = createPetReadHandler(findPetById, enrichPet, encoder);

      try {
        await handler(
          new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
            method: 'GET',
            attributes: {
              id: pet.id,
              accept: 'application/json',
            },
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "NotFound",
            "detail": "There is no pet with id "561d9a20-5a02-44d2-ba96-18bb45067f65"",
            "status": 404,
            "title": "Not Found",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
          }
        `);
      }

      expect(findPetByIdMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('success', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');
      const enrichedPet = createEnrichedPet(pet);

      const responseBody = valueToData(enrichedPet);
      const responseBodyString = JSON.stringify(responseBody);

      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([
        { parameters: [pet.id], return: Promise.resolve(pet) },
      ]);

      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([
        { parameters: [pet], return: Promise.resolve(enrichedPet) },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        { name: 'encode', parameters: [responseBody, 'application/json'], return: responseBodyString },
      ]);

      const handler = createPetReadHandler(findPetById, enrichPet, encoder);

      const response = await handler(
        new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
          method: 'GET',
          attributes: {
            id: pet.id,
            accept: 'application/json',
          },
        }),
      );

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(await response.json()).toEqual(responseBody);

      expect(findPetByIdMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });
  });

  describe('createPetUpdateHandler', () => {
    test('missing attribute', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');

      const [decoder, decoderMocks] = useObjectMock<Decoder>([]);
      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([]);
      const [persistPet, persistPetMocks] = useFunctionMock<PersistPet>([]);
      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([]);
      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const handler = createPetUpdateHandler(decoder, findPetById, persistPet, enrichPet, encoder);

      try {
        await handler(
          new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
            method: 'PUT',
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "id"
              ],
              "message": "Invalid input: expected string, received undefined"
            },
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "contentType"
              ],
              "message": "Invalid input: expected string, received undefined"
            },
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "accept"
              ],
              "message": "Invalid input: expected string, received undefined"
            }
          ]]
        `);
      }

      expect(decoderMocks.length).toBe(0);
      expect(findPetByIdMocks.length).toBe(0);
      expect(persistPetMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('invalid request body', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: ['', 'application/json'], return: {} },
      ]);

      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([]);
      const [persistPet, persistPetMocks] = useFunctionMock<PersistPet>([]);
      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([]);
      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const handler = createPetUpdateHandler(decoder, findPetById, persistPet, enrichPet, encoder);

      try {
        await handler(
          new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
            method: 'PUT',
            attributes: {
              id: pet.id,
              contentType: 'application/json',
              accept: 'application/json',
            },
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "BadRequest",
            "context": "body",
            "invalidParameters": [
              {
                "context": {
                  "code": "invalid_type",
                  "expected": "string",
                },
                "name": "name",
                "reason": "Invalid input: expected string, received undefined",
              },
              {
                "context": {
                  "code": "invalid_type",
                  "expected": "array",
                },
                "name": "vaccinations",
                "reason": "Invalid input: expected array, received undefined",
              },
            ],
            "status": 400,
            "title": "Bad Request",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
          }
        `);
      }

      expect(decoderMocks.length).toBe(0);
      expect(findPetByIdMocks.length).toBe(0);
      expect(persistPetMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('missing pet', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');

      const requestBody: Data = valueToData(inputPet);
      const requestBodyString = JSON.stringify(requestBody);

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [requestBodyString, 'application/json'], return: requestBody },
      ]);

      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([
        { parameters: [pet.id], return: Promise.resolve(undefined) },
      ]);

      const [persistPet, persistPetMocks] = useFunctionMock<PersistPet>([]);
      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([]);
      const [encoder, encoderMocks] = useObjectMock<Encoder>([]);

      const handler = createPetUpdateHandler(decoder, findPetById, persistPet, enrichPet, encoder);

      try {
        await handler(
          new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
            method: 'PUT',
            attributes: {
              id: pet.id,
              contentType: 'application/json',
              accept: 'application/json',
            },
            body: requestBodyString,
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "NotFound",
            "detail": "There is no pet with id "561d9a20-5a02-44d2-ba96-18bb45067f65"",
            "status": 404,
            "title": "Not Found",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
          }
        `);
      }

      expect(decoderMocks.length).toBe(0);
      expect(findPetByIdMocks.length).toBe(0);
      expect(persistPetMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });

    test('success', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');

      const requestBody: Data = valueToData({
        ...inputPet,
        id: '38f98b7d-1427-4fb7-9906-a3c648ca0547',
        createdAt: new Date(),
        updatedAt: new Date(),
        _embedded: {},
        _links: {},
      });

      const requestBodyString = JSON.stringify(requestBody);

      // eslint-disable-next-line functional/no-let
      let updatedPet: Pet;

      // eslint-disable-next-line functional/no-let
      let enrichedUpdatedPet: EnrichedPet;

      // eslint-disable-next-line functional/no-let
      let responseBody: Data = {};

      const [decoder, decoderMocks] = useObjectMock<Decoder>([
        { name: 'decode', parameters: [requestBodyString, 'application/json'], return: requestBody },
      ]);

      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([
        { parameters: [pet.id], return: Promise.resolve(pet) },
      ]);

      const [persistPet, persistPetMocks] = useFunctionMock<PersistPet>([
        {
          callback: async (givenPet: Pet) => {
            updatedPet = givenPet;

            return updatedPet;
          },
        },
      ]);

      const [enrichPet, enrichPetMocks] = useFunctionMock<EnrichPet>([
        {
          callback: async (givenPet: Pet) => {
            expect(givenPet).toBe(updatedPet);

            enrichedUpdatedPet = createEnrichedPet(pet);

            return enrichedUpdatedPet;
          },
        },
      ]);

      const [encoder, encoderMocks] = useObjectMock<Encoder>([
        {
          name: 'encode',
          callback: (givenData: Data, contentType: string) => {
            responseBody = valueToData(enrichedUpdatedPet);

            expect(givenData).toEqual(responseBody);
            expect(contentType).toBe('application/json');

            return JSON.stringify(responseBody);
          },
        },
      ]);

      const handler = createPetUpdateHandler(decoder, findPetById, persistPet, enrichPet, encoder);

      const response = await handler(
        new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
          method: 'PUT',
          attributes: {
            id: pet.id,
            contentType: 'application/json',
            accept: 'application/json',
          },
          body: requestBodyString,
        }),
      );

      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(await response.json()).toEqual(responseBody);

      expect(decoderMocks.length).toBe(0);
      expect(findPetByIdMocks.length).toBe(0);
      expect(persistPetMocks.length).toBe(0);
      expect(enrichPetMocks.length).toBe(0);
      expect(encoderMocks.length).toBe(0);
    });
  });

  describe('createPetDeleteHandler', () => {
    test('missing attribute', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');

      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([]);
      const [removePet, removePetMocks] = useFunctionMock<RemovePet>([]);

      const handler = createPetDeleteHandler(findPetById, removePet);

      try {
        await handler(
          new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
            method: 'DELETE',
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect(e).toMatchInlineSnapshot(`
          [ZodError: [
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "id"
              ],
              "message": "Invalid input: expected string, received undefined"
            },
            {
              "expected": "string",
              "code": "invalid_type",
              "path": [
                "accept"
              ],
              "message": "Invalid input: expected string, received undefined"
            }
          ]]
        `);
      }

      expect(findPetByIdMocks.length).toBe(0);
      expect(removePetMocks.length).toBe(0);
    });

    test('missing pet', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');

      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([
        { parameters: [pet.id], return: Promise.resolve(undefined) },
      ]);

      const [removePet, removePetMocks] = useFunctionMock<RemovePet>([]);

      const handler = createPetDeleteHandler(findPetById, removePet);

      try {
        await handler(
          new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
            method: 'GET',
            attributes: {
              id: pet.id,
              accept: 'application/json',
            },
          }),
        );

        throw new Error('expect fail');
      } catch (e) {
        expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
          {
            "_httpError": "NotFound",
            "detail": "There is no pet with id "561d9a20-5a02-44d2-ba96-18bb45067f65"",
            "status": 404,
            "title": "Not Found",
            "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.5",
          }
        `);
      }

      expect(findPetByIdMocks.length).toBe(0);
      expect(removePetMocks.length).toBe(0);
    });

    test('success', async () => {
      const pet = createPet('561d9a20-5a02-44d2-ba96-18bb45067f65');

      const [findPetById, findPetByIdMocks] = useFunctionMock<FindPetById>([
        { parameters: [pet.id], return: Promise.resolve(pet) },
      ]);

      const [removePet, removePetMocks] = useFunctionMock<RemovePet>([
        { parameters: [pet], return: Promise.resolve() },
      ]);

      const handler = createPetDeleteHandler(findPetById, removePet);

      const response = await handler(
        new ServerRequest(`https://example.com/api/pet/${pet.id}`, {
          method: 'GET',
          attributes: {
            id: pet.id,
            accept: 'application/json',
          },
        }),
      );

      expect(response.status).toBe(204);
      expect(response.statusText).toBe('No Content');

      expect(findPetByIdMocks.length).toBe(0);
      expect(removePetMocks.length).toBe(0);
    });
  });

  describe('headers validation', () => {
    describe('request headers', () => {
      test('invalid', async () => {
        const handler = createTypedHandler({
          request: {
            attributes: z.object({}),
            query: undefined,
            headers: z.object({ 'x-custom-request': z.string() }),
            body: undefined,
          },
          response: {
            headers: undefined,
            body: undefined,
          },
          handler: async () => {
            return {
              status: 204,
              statusText: 'No Content',
              headers: undefined,
              body: undefined,
            };
          },
          decoder: undefined,
          encoder: undefined,
        });

        try {
          await handler(
            new ServerRequest('https://example.com/api/pet', {
              method: 'GET',
            }),
          );
        } catch (e) {
          expect({ ...(e as HttpError) }).toMatchInlineSnapshot(`
            {
              "_httpError": "BadRequest",
              "context": "headers",
              "invalidParameters": [
                {
                  "context": {
                    "code": "invalid_type",
                    "expected": "string",
                  },
                  "name": "x-custom-request",
                  "reason": "Invalid input: expected string, received undefined",
                },
              ],
              "status": 400,
              "title": "Bad Request",
              "type": "https://datatracker.ietf.org/doc/html/rfc2616#section-10.4.1",
            }
          `);
        }
      });

      test('valid', async () => {
        const handler = createTypedHandler({
          request: {
            attributes: z.object({}),
            query: undefined,
            headers: z.object({ 'x-custom-request': z.string() }),
            body: undefined,
          },
          response: {
            headers: undefined,
            body: undefined,
          },
          handler: async () => {
            return {
              status: 204,
              statusText: 'No Content',
              headers: undefined,
              body: undefined,
            };
          },
          decoder: undefined,
          encoder: undefined,
        });

        const response = await handler(
          new ServerRequest('https://example.com/api/pet', {
            method: 'GET',
            headers: {
              'x-custom-request': 'test',
            },
          }),
        );

        expect(response.status).toBe(204);
        expect(response.statusText).toBe('No Content');
      });
    });

    describe('response headers', () => {
      test('invalid', async () => {
        const handler = createTypedHandler({
          request: {
            attributes: z.object({}),
            query: undefined,
            headers: undefined,
            body: undefined,
          },
          response: {
            headers: z.object({ 'x-custom-response': z.string() }),
            body: undefined,
          },
          // @ts-expect-error headers are invalid by design
          handler: async () => {
            return {
              status: 204,
              statusText: 'No Content',
              headers: {},
              body: undefined,
            };
          },
          decoder: undefined,
          encoder: undefined,
        });

        try {
          await handler(
            new ServerRequest('https://example.com/api/pet', {
              method: 'GET',
            }),
          );
        } catch (e) {
          expect(e).toMatchInlineSnapshot(`
            [ZodError: [
              {
                "expected": "string",
                "code": "invalid_type",
                "path": [
                  "x-custom-response"
                ],
                "message": "Invalid input: expected string, received undefined"
              }
            ]]
          `);
        }
      });

      test('valid', async () => {
        const handler = createTypedHandler({
          request: {
            attributes: z.object({}),
            query: undefined,
            headers: undefined,
            body: undefined,
          },
          response: {
            headers: z.object({ 'x-custom-response': z.string() }),
            body: undefined,
          },
          handler: async () => {
            return {
              status: 204,
              statusText: 'No Content',
              headers: { 'x-custom-response': 'test' },
              body: undefined,
            };
          },
          decoder: undefined,
          encoder: undefined,
        });

        const response = await handler(
          new ServerRequest('https://example.com/api/pet', {
            method: 'GET',
          }),
        );

        expect(response.status).toBe(204);
        expect(response.statusText).toBe('No Content');
        expect(Object.fromEntries([...response.headers.entries()])).toMatchInlineSnapshot(`
          {
            "x-custom-response": "test",
          }
        `);
      });
    });
  });
});
