import type { ServerRequest } from '@chubbyts/chubbyts-undici-server/dist/server';
import { z } from 'zod';

export const stringSchema = z.string().min(1);
export const numberSchema = z.coerce.number();
export const dateSchema = z.coerce.date();

export const sortSchema = z.union([z.literal('asc'), z.literal('desc')]).optional();

export type SortSchema = typeof sortSchema;

type AnyNumberSchema = z.ZodNumber | z.ZodDefault<z.ZodNumber> | z.ZodCoercedNumber | z.ZodDefault<z.ZodCoercedNumber>;
type AnyDateSchema = z.ZodDate | z.ZodDefault<z.ZodDate> | z.ZodCoercedDate | z.ZodDefault<z.ZodCoercedDate>;

const embeddedSchema = z.object({}).loose().optional();

export type EmbeddedSchema = typeof embeddedSchema;

const linkSchema = z.intersection(
  z.object({
    href: z.string(),
    name: z.string().optional(),
    templated: z.boolean().optional(),
  }),
  z.record(z.string(), z.unknown()),
);

type LinkSchema = typeof linkSchema;

export type Link = z.infer<LinkSchema>;

const linksSchema = z.record(z.string(), z.union([linkSchema, z.array(linkSchema)])).optional();

type LinksSchema = typeof linksSchema;

export type InputModelSchema = z.ZodObject<z.ZodRawShape>;

export type InputModel<IMS extends InputModelSchema> = z.infer<IMS>;

export type InputModelListSchema = z.ZodObject<{
  offset: AnyNumberSchema;
  limit: AnyNumberSchema;
  filters: z.ZodObject | z.ZodDefault<z.ZodObject>;
  sort:
    | z.ZodObject<{ [key: string]: SortSchema }>
    | z.ZodDefault<z.ZodObject<{ [key: string]: SortSchema | z.ZodDefault<SortSchema> }>>;
}>;

export type InputModelList<IMLS extends InputModelListSchema> = z.infer<IMLS>;

export type ModelSchema<IMS extends InputModelSchema> = IMS &
  z.ZodObject<{
    id: z.ZodString;
    createdAt: AnyDateSchema;
    updatedAt: z.ZodOptional<AnyDateSchema>;
  }>;

export type Model<IMS extends InputModelSchema> = z.infer<ModelSchema<IMS>>;

export const createModelSchema = <IMS extends InputModelSchema>(inputModelSchema: IMS): ModelSchema<IMS> =>
  z
    .object({ ...inputModelSchema.shape, id: stringSchema, createdAt: dateSchema, updatedAt: dateSchema.optional() })
    .strict() as unknown as ModelSchema<IMS>;

export type ModelListSchema<IMS extends InputModelSchema, IMLS extends InputModelListSchema> = IMLS &
  z.ZodObject<{
    count: AnyNumberSchema;
    items: z.ZodArray<ModelSchema<IMS>>;
  }>;

export type ModelList<IMS extends InputModelSchema, IMLS extends InputModelListSchema> = z.infer<
  ModelListSchema<IMS, IMLS>
>;

export const createModelListSchema = <IMS extends InputModelSchema, IMLS extends InputModelListSchema>(
  inputModelSchema: IMS,
  inputModelListSchema: IMLS,
): ModelListSchema<IMS, IMLS> =>
  z
    .object({
      ...inputModelListSchema.shape,
      count: numberSchema,
      items: z.array(createModelSchema(inputModelSchema)),
    })
    .strict() as unknown as ModelListSchema<IMS, IMLS>;

export type EnrichedModelSchema<IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema> = IMS &
  z.ZodObject<{
    id: z.ZodString;
    createdAt: AnyDateSchema;
    updatedAt: z.ZodOptional<AnyDateSchema>;

    _embedded: EMS;
    _links: LinksSchema;
  }>;

export type EnrichedModel<IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema> = z.infer<
  EnrichedModelSchema<IMS, EMS>
>;

export const createEnrichedModelSchema = <IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema>(
  inputModelSchema: IMS,
  embeddedModelSchema: EMS = embeddedSchema as EMS,
): EnrichedModelSchema<IMS, EMS> =>
  z
    .object({
      ...createModelSchema(inputModelSchema).shape,
      _embedded: embeddedModelSchema,
      _links: linksSchema,
    })
    .strict() as EnrichedModelSchema<IMS, EMS>;

export type EnrichedModelListSchema<
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
> = IMLS &
  z.ZodObject<{
    count: AnyNumberSchema;
    items: z.ZodArray<EnrichedModelSchema<IMS, EMS>>;
    _embedded: EMLS;
    _links: LinksSchema;
  }>;

export type EnrichedModelList<
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
> = z.infer<EnrichedModelListSchema<IMS, IMLS, EMS, EMLS>>;

export const createEnrichedModelListSchema = <
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
>(
  inputModelSchema: IMS,
  inputModelListSchema: IMLS,
  embeddedModelSchema: EMS = embeddedSchema as EMS,
  embeddedModelListSchema: EMLS = embeddedSchema as EMLS,
): EnrichedModelListSchema<IMS, IMLS, EMS, EMLS> =>
  z
    .object({
      ...inputModelListSchema.shape,
      count: numberSchema,
      items: z.array(createEnrichedModelSchema(inputModelSchema, embeddedModelSchema)),
      _embedded: embeddedModelListSchema,
      _links: linksSchema,
    })
    .strict() as unknown as EnrichedModelListSchema<IMS, IMLS, EMS, EMLS>;

export type EnrichModel<IMS extends InputModelSchema, EMS extends EmbeddedSchema = EmbeddedSchema> = (
  model: Model<IMS>,
  context: { serverRequest: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedModel<IMS, EMS>>;

export type EnrichModelList<
  IMS extends InputModelSchema,
  IMLS extends InputModelListSchema,
  EMS extends EmbeddedSchema = EmbeddedSchema,
  EMLS extends EmbeddedSchema = EmbeddedSchema,
> = (
  list: ModelList<IMS, IMLS>,
  context: { serverRequest: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedModelList<IMS, IMLS, EMS, EMLS>>;
