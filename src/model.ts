import type { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { z } from 'zod';

type MakeOptional<S> = S extends z.ZodTypeAny ? z.ZodOptional<S> : never;

type ZodSchemaFromType<T> = T extends string
  ? z.ZodString
  : T extends number
    ? z.ZodNumber
    : T extends boolean
      ? z.ZodBoolean
      : T extends bigint
        ? z.ZodBigInt
        : T extends symbol
          ? z.ZodSymbol
          : T extends Date
            ? z.ZodDate
            : T extends undefined
              ? z.ZodUndefined
              : T extends null
                ? z.ZodNull
                : T extends never
                  ? z.ZodNever
                  : T extends Array<infer U>
                    ? z.ZodArray<ZodSchemaFromType<U>>
                    : T extends readonly [unknown, ...unknown[]]
                      ? z.ZodTuple<
                          Extract<{ [K in keyof T]: ZodSchemaFromType<T[K]> }, [z.ZodTypeAny, ...z.ZodTypeAny[]]>
                        >
                      : T extends Map<infer K, infer V>
                        ? z.ZodMap<ZodSchemaFromType<K>, ZodSchemaFromType<V>>
                        : T extends Set<infer U>
                          ? z.ZodSet<ZodSchemaFromType<U>>
                          : T extends Promise<infer U>
                            ? z.ZodPromise<ZodSchemaFromType<U>>
                            : T extends (...args: infer A) => infer R
                              ? z.ZodFunction<
                                  z.ZodTuple<
                                    Extract<
                                      { [K in keyof A]: ZodSchemaFromType<A[K]> },
                                      [z.ZodTypeAny, ...z.ZodTypeAny[]]
                                    >
                                  >,
                                  ZodSchemaFromType<R>
                                >
                              : T extends object
                                ? z.ZodObject<
                                    {
                                      [K in keyof T]-?: Extract<
                                        undefined extends T[K]
                                          ? MakeOptional<ZodSchemaFromType<Exclude<T[K], undefined>>>
                                          : ZodSchemaFromType<T[K]>,
                                        z.ZodTypeAny
                                      >;
                                    },
                                    z.UnknownKeysParam,
                                    z.ZodTypeAny,
                                    T
                                  >
                                : z.ZodAny;

export const stringSchema = z.string().min(1);

export const numberSchema = z.preprocess((input) => {
  if (typeof input === 'string') {
    const number = parseInt(input, 10);

    return Number.isNaN(number) ? input : number;
  }

  return input;
}, z.number());

export const dateSchema = z.preprocess((input) => {
  if (typeof input === 'string' || typeof input === 'number') {
    const date = new Date(input);

    return Number.isNaN(date.valueOf()) ? input : date;
  }

  return input;
}, z.date());

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

export type InputModelSchema<IM extends InputModel> = ZodSchemaFromType<IM>;

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

export type ModelSchema<IM extends InputModel> = ZodSchemaFromType<Model<IM>>;

export type EnrichedModel<IM extends InputModel> = Model<IM> & Embedded & Links;

export type EnrichedModelSchema<IM extends InputModel> = ZodSchemaFromType<EnrichedModel<IM>>;

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

export type InputModelListSchema = ZodSchemaFromType<InputModelList>;

export type ModelList<IM extends InputModel> = InputModelList & {
  items: Array<Model<IM>>;
  count: number;
};

export type ModelListSchema<IM extends InputModel> = ZodSchemaFromType<ModelList<IM>>;

export type EnrichedModelList<IM extends InputModel> = InputModelList & {
  items: Array<EnrichedModel<IM>>;
  count: number;
} & Embedded &
  Links;

export type EnrichedModelListSchema<IM extends InputModel> = ZodSchemaFromType<EnrichedModelList<IM>>;

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
