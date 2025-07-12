import type { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import { z } from 'zod';

type MakeOptional<S> = S extends z.ZodTypeAny ? z.ZodOptional<S> : never;
type AddDefault<S extends z.ZodTypeAny> = S | z.ZodDefault<S>;

type ZodSchemaTypeFromType<T> = AddDefault<
  T extends string
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
                      ? z.ZodArray<ZodSchemaTypeFromType<U>>
                      : T extends readonly [unknown, ...unknown[]]
                        ? z.ZodTuple<
                            Extract<{ [K in keyof T]: ZodSchemaTypeFromType<T[K]> }, [z.ZodTypeAny, ...z.ZodTypeAny[]]>
                          >
                        : T extends Map<infer K, infer V>
                          ? z.ZodMap<ZodSchemaTypeFromType<K>, ZodSchemaTypeFromType<V>>
                          : T extends Set<infer U>
                            ? z.ZodSet<ZodSchemaTypeFromType<U>>
                            : T extends Promise<infer U>
                              ? z.ZodPromise<ZodSchemaTypeFromType<U>>
                              : T extends (...args: infer A) => infer R
                                ? z.ZodFunction<
                                    z.ZodTuple<
                                      Extract<
                                        { [K in keyof A]: ZodSchemaTypeFromType<A[K]> },
                                        [z.ZodTypeAny, ...z.ZodTypeAny[]]
                                      >
                                    >,
                                    ZodSchemaTypeFromType<R>
                                  >
                                : T extends object
                                  ? z.ZodObject<
                                      {
                                        [K in keyof T]-?: Extract<
                                          undefined extends T[K]
                                            ? MakeOptional<ZodSchemaTypeFromType<Exclude<T[K], undefined>>>
                                            : ZodSchemaTypeFromType<T[K]>,
                                          z.ZodTypeAny
                                        >;
                                      },
                                      z.UnknownKeysParam,
                                      z.ZodTypeAny,
                                      T
                                    >
                                  : z.ZodAny
>;

export const stringSchema = z.string().min(1);
export const numberSchema = z.coerce.number();
export const dateSchema = z.coerce.date();

export type InputModel = { [key: string]: unknown };

export type InputModelSchema<IM extends InputModel> = ZodSchemaTypeFromType<IM>;

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

export type ModelSchema<IM extends InputModel> = ZodSchemaTypeFromType<Model<IM>>;

export type Embedded = {
  _embedded?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
};

export type Link = {
  name?: string;
  href: string;
  templated?: boolean;
};

export type Links = {
  _links?: {
    [key: string]: Array<Link> | Link | undefined;
  };
};

export type EnrichedModel<IM extends InputModel> = Model<IM> & Embedded & Links;

export type EnrichedModelSchema<IM extends InputModel> = ZodSchemaTypeFromType<EnrichedModel<IM>>;

export type EnrichModel<IM extends InputModel> = (
  model: Model<IM>,
  context: { request: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedModel<IM>>;

export const sortSchema = z.enum(['asc', 'desc']);

export type Sort = z.infer<typeof sortSchema>;

export type InputModelList = {
  offset: number;
  limit: number;
  filters: object;
  sort: object;
};

export type InputModelListSchema = ZodSchemaTypeFromType<InputModelList>;

export type ModelList<IM extends InputModel> = InputModelList & {
  items: Array<Model<IM>>;
  count: number;
};

export type ModelListSchema<IM extends InputModel> = ZodSchemaTypeFromType<ModelList<IM>>;

export type EnrichedModelList<IM extends InputModel> = InputModelList & {
  items: Array<EnrichedModel<IM>>;
  count: number;
} & Embedded &
  Links;

export type EnrichedModelListSchema<IM extends InputModel> = ZodSchemaTypeFromType<EnrichedModelList<IM>>;

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
