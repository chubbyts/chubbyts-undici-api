# Typed

The idea of the `createTypedHandler` is to provide a generic solution for typed request / response handlers for [@chubbyts/chubbyts-undici-server][1].
This one is meant to be used if you don't like the crud handlers provided by this library or you want/need more control.

## Usage

```ts
import { STATUS_CODES } from 'node:http';
import type { Decoder } from '@chubbyts/chubbyts-decode-encode/dist/decoder';
import type { Encoder } from '@chubbyts/chubbyts-decode-encode/dist/encoder';
import type { Handler } from '@chubbyts/chubbyts-undici-server/dist/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { createNotFound } from '@chubbyts/chubbyts-http-error/dist/http-error';
import { createTypedHandler } from '@chubbyts/chubbyts-undici-api/dist/typed';
import type {
  EnrichedModel,
  EnrichedModelList,
  EnrichedModelListSchema,
  EnrichedModelSchema,
  InputModel,
  InputModelList,
  Model,
  ModelList,
} from '@chubbyts/chubbyts-undici-api/dist/model';
import {
  createEnrichedModelListSchema,
  createEnrichedModelSchema,
  dateSchema,
  numberSchema,
  sortSchema,
  stringSchema,
} from '@chubbyts/chubbyts-undici-api/dist/model';

const inputVaccinationSchema = z.object({ name: stringSchema });

type InputVaccinationSchema = typeof inputVaccinationSchema;

export type Vaccination = Model<InputVaccinationSchema>;

type EnrichedVaccinationSchema = EnrichedModelSchema<InputVaccinationSchema>;

const enrichedVaccinationSchema: EnrichedVaccinationSchema = createEnrichedModelSchema(inputVaccinationSchema);

export type EnrichedVaccination = EnrichedModel<InputVaccinationSchema>;

const inputPetSchema = z
  .object({
    name: stringSchema,
    tag: stringSchema.optional(),
    vaccinations: z.array(
      z
        .object({
          id: stringSchema,
          injectedAt: dateSchema,
        })
        .strict(),
    ),
  })
  .strict();

type InputPetSchema = typeof inputPetSchema;

export type InputPet = InputModel<InputPetSchema>;

const inputPetListSchema = z
  .object({
    offset: numberSchema.default(0),
    limit: numberSchema.default(20),
    filters: z.object({ name: stringSchema.optional() }).strict().default({}),
    sort: z.object({ name: sortSchema }).strict().default({}),
  })
  .strict();

type InputPetListSchema = typeof inputPetListSchema;

export type InputPetList = InputModelList<InputPetListSchema>;

export type Pet = Model<InputPetSchema>;

export type PetList = ModelList<InputPetSchema, InputPetListSchema>;

const embeddedPetSchema = z
  .object({
    vaccinations: z.array(enrichedVaccinationSchema.optional()),
  })
  .strict()
  .optional();

type EmbeddedPetSchema = typeof embeddedPetSchema;

type EnrichedPetSchema = EnrichedModelSchema<InputPetSchema>;

const enrichedPetSchema: EnrichedPetSchema = createEnrichedModelSchema(inputPetSchema, embeddedPetSchema);

export type EnrichedPet = EnrichedModel<InputPetSchema, EmbeddedPetSchema>;

type EnrichedPetListSchema = EnrichedModelListSchema<InputPetSchema, InputPetListSchema, EmbeddedPetSchema>;

const enrichedPetListSchema: EnrichedPetListSchema = createEnrichedModelListSchema(
  inputPetSchema,
  inputPetListSchema,
  embeddedPetSchema,
);

export type EnrichedPetList = EnrichedModelList<InputPetSchema, InputPetListSchema, EmbeddedPetSchema>;

const createUpdateInputSchema = <InputSchema extends z.ZodObject>(
  inputSchema: InputSchema,
): z.ZodObject<
  {
    id: z.ZodOptional<z.ZodUnknown>;
    createdAt: z.ZodOptional<z.ZodUnknown>;
    updatedAt: z.ZodOptional<z.ZodUnknown>;
    _embedded: z.ZodOptional<z.ZodUnknown>;
    _links: z.ZodOptional<z.ZodUnknown>;
  } & InputSchema['shape']
> =>
  z.object({
    id: z.unknown().optional(),
    createdAt: z.unknown().optional(),
    updatedAt: z.unknown().optional(),
    _embedded: z.unknown().optional(),
    _links: z.unknown().optional(),
    ...inputSchema.shape,
  });

export type EnrichPet = (pet: Pet) => Promise<EnrichedPet>;
export type EnrichPetList = (petList: PetList) => Promise<EnrichedPetList>;
export type FindPetById = (id: string) => Promise<Pet | undefined>;
export type PersistPet = (pet: Pet) => Promise<Pet>;
export type RemovePet = (pet: Pet) => Promise<void>;
export type ResolvePetList = (inputPetList: InputPetList) => Promise<PetList>;

export const createPetListHandler = (
  resolvePetList: ResolvePetList,
  enrichPetList: EnrichPetList,
  encoder: Encoder,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: z.object({ accept: z.string() }),
      query: inputPetListSchema,
      headers: undefined,
      body: undefined,
    },
    response: {
      headers: undefined,
      body: enrichedPetListSchema,
    },
    handler: async (request) => {
      const petList = await resolvePetList(request.query);

      const enrichedPetList = await enrichPetList(petList);

      return {
        status: 200,
        statusText: STATUS_CODES[200],
        headers: undefined,
        body: enrichedPetList,
      };
    },
    decoder: undefined,
    encoder,
  });
};

export const createPetCreateHandler = (
  decoder: Decoder,
  persistPet: PersistPet,
  enrichPet: EnrichPet,
  encoder: Encoder,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: z.object({ contentType: z.string(), accept: z.string() }),
      query: undefined,
      headers: undefined,
      body: inputPetSchema,
    },
    response: {
      headers: undefined,
      body: enrichedPetSchema,
    },
    handler: async (request) => {
      const persistedPet = await persistPet({
        id: uuid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...request.body,
      });

      const enrichedPet = await enrichPet(persistedPet);

      return {
        status: 201,
        statusText: STATUS_CODES[201],
        headers: undefined,
        body: enrichedPet,
      };
    },
    decoder,
    encoder,
  });
};

export const createPetReadHandler = (findPetById: FindPetById, enrichPet: EnrichPet, encoder: Encoder): Handler => {
  return createTypedHandler({
    request: {
      attributes: z.object({ id: z.string(), accept: z.string() }),
      query: undefined,
      headers: undefined,
      body: undefined,
    },
    response: {
      headers: undefined,
      body: enrichedPetSchema,
    },
    handler: async (request) => {
      const pet = await findPetById(request.attributes.id);

      if (!pet) {
        throw createNotFound({ detail: `There is no pet with id "${request.attributes.id}"` });
      }

      const enrichedPet = await enrichPet(pet);

      return {
        status: 200,
        statusText: STATUS_CODES[200],
        headers: undefined,
        body: enrichedPet,
      };
    },
    decoder: undefined,
    encoder,
  });
};

export const createPetUpdateHandler = (
  decoder: Decoder,
  findPetById: FindPetById,
  persistPet: PersistPet,
  enrichPet: EnrichPet,
  encoder: Encoder,
): Handler => {
  return createTypedHandler({
    request: {
      attributes: z.object({ id: z.string(), contentType: z.string(), accept: z.string() }),
      query: undefined,
      headers: undefined,
      body: createUpdateInputSchema(inputPetSchema),
    },
    response: {
      headers: undefined,
      body: enrichedPetSchema,
    },
    handler: async (request) => {
      const pet = await findPetById(request.attributes.id);

      if (!pet) {
        throw createNotFound({ detail: `There is no pet with id "${request.attributes.id}"` });
      }

      const { id: _, createdAt: __, updatedAt: ___, _embedded: ____, _links: _____, ...input } = request.body;

      const persistedPet = await persistPet({
        id: pet.id,
        createdAt: pet.createdAt,
        updatedAt: new Date(),
        ...input,
      });

      const enrichedPet = await enrichPet(persistedPet);

      return {
        status: 200,
        statusText: STATUS_CODES[200],
        headers: undefined,
        body: enrichedPet,
      };
    },
    decoder,
    encoder,
  });
};

export const createPetDeleteHandler = (findPetById: FindPetById, removePet: RemovePet): Handler => {
  return createTypedHandler({
    request: {
      attributes: z.object({ id: z.string(), accept: z.string() }),
      query: undefined,
      headers: undefined,
      body: undefined,
    },
    response: {
      headers: undefined,
      body: undefined,
    },
    handler: async (request) => {
      const pet = await findPetById(request.attributes.id);

      if (!pet) {
        throw createNotFound({ detail: `There is no pet with id "${request.attributes.id}"` });
      }

      await removePet(pet);

      return {
        status: 204,
        statusText: STATUS_CODES[204],
        headers: undefined,
        body: undefined,
      };
    },
    decoder: undefined,
    encoder: undefined,
  });
};
```






[1]: https://www.npmjs.com/package/@chubbyts/chubbyts-undici-server
