import type { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { UnknownKeysParam, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';
import { z } from 'zod';

type ObjectSchema<Output> = ZodObject<ZodRawShape, UnknownKeysParam, ZodTypeAny, Output, Record<string, unknown>>;

export const stringSchema = z.string().min(1);

export const numberSchema = z.union([
  z
    .string()
    .refine((number) => !Number.isNaN(parseInt(number, 10)))
    .transform((number) => parseInt(number, 10)),
  z.number(),
]);

export const dateSchema = z.union([
  z
    .string()
    .refine((date) => !Number.isNaN(new Date(date).valueOf()))
    .transform((date) => new Date(date)),
  z
    .number()
    .refine((date) => !Number.isNaN(new Date(date).valueOf()))
    .transform((date) => new Date(date)),
  z.date(),
]) as z.ZodType<Date>;

export const sortSchema = z.enum(['asc', 'desc']);

export type Sort = z.infer<typeof sortSchema>;

export const embeddedSchema = z
  .object({
    _embedded: z.record(stringSchema, stringSchema).optional(),
  })
  .strict();

export type Embedded = z.infer<typeof embeddedSchema>;

export const linkSchema = z.intersection(
  z.object({
    href: stringSchema,
    templated: z.boolean().optional(),
  }),
  z.record(stringSchema, z.unknown()),
);

export type Link = z.infer<typeof linkSchema>;

export const linksSchema = z
  .object({
    _links: z.record(stringSchema, linkSchema).optional(),
  })
  .strict();

export type Links = z.infer<typeof linksSchema>;

export type InputModel = { [key: string]: unknown };

export type InputModelSchema<IM extends InputModel> = ObjectSchema<IM>;

export const baseModelSchema = z
  .object({
    id: stringSchema,
    createdAt: dateSchema,
    updatedAt: dateSchema.optional(),
  })
  .strict();

export type BaseModel = z.infer<typeof baseModelSchema>;

export type Model<IM extends InputModel> = BaseModel & {
  [key in keyof IM]: IM[key];
};

export type ModelSchema<IM extends InputModel> = ObjectSchema<Model<IM>>;

export type EnrichedModel<IM extends InputModel> = Model<IM> & Embedded & Links;

export type EnrichedModelSchema<IM extends InputModel> = ObjectSchema<EnrichedModel<IM>>;

export type EnrichModel<IM extends InputModel> = (
  model: Model<IM>,
  context: { request: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedModel<IM>>;

export const baseInputModelListSchema = z
  .object({
    offset: numberSchema.default(0),
    limit: numberSchema.default(20),
  })
  .strict();

type BaseInputModelList = z.infer<typeof baseInputModelListSchema>;

export type InputModelList = BaseInputModelList & {
  filters: { [key: string]: unknown };
  sort: { [key: string]: Sort };
};

export type InputModelListSchema = ObjectSchema<InputModelList>;

export type ModelList<IM extends InputModel> = InputModelList & {
  items: Array<Model<IM>>;
  count: number;
};

export type ModelListSchema<IM extends InputModel> = ObjectSchema<ModelList<IM>>;

export type EnrichedModelList<IM extends InputModel> = InputModelList & {
  items: Array<EnrichedModel<IM>>;
  count: number;
} & Embedded &
  Links;

export type EnrichedModelListSchema<IM extends InputModel> = ObjectSchema<EnrichedModelList<IM>>;

export type EnrichModelList<IM extends InputModel> = (
  list: ModelList<IM>,
  context: { request: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedModelList<IM>>;

/////

// @deprecated use ModelList
export type List<IM extends InputModel> = ModelList<IM>;

// @deprecated use EnrichedModelList
export type EnrichedList<IM extends InputModel> = EnrichedModelList<IM>;

// @deprecated use EnrichModelList
export type EnrichList<IM extends InputModel> = EnrichModelList<IM>;
