import type { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';
import type { UnknownKeysParam, ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

type ObjectSchema<Output> = ZodObject<ZodRawShape, UnknownKeysParam, ZodTypeAny, Output, Record<string, unknown>>;

export type Embedded = {
  _embedded?: {
    [key: string]: unknown;
  };
};

export type Link = {
  href: string;
  templated?: boolean;
  [key: string]: unknown;
};

export type Links = {
  _links?: {
    [key: string]: Link;
  };
};

export type InputModel = { [key: string]: unknown };

export type InputModelSchema<IM extends InputModel> = ObjectSchema<IM>;

export type Model<IM extends InputModel> = {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
} & {
  [key in keyof IM]: IM[key];
};

export type ModelSchema<IM extends InputModel> = ObjectSchema<Model<IM>>;

export type EnrichedModel<IM extends InputModel> = Model<IM> & Embedded & Links;

export type EnrichedModelSchema<IM extends InputModel> = ObjectSchema<EnrichedModel<IM>>;

export type EnrichModel<IM extends InputModel> = (
  model: Model<IM>,
  context: { request: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedModel<IM>>;

export type InputModelList = {
  offset: number;
  limit: number;
  filters: { [key: string]: unknown };
  sort: { [key: string]: 'asc' | 'desc' };
  count: number;
};

export type InputModelListSchema = ObjectSchema<InputModelList>;

export type ModelList<IM extends InputModel> = InputModelList & {
  items: Array<Model<IM>>;
};

export type ModelListSchema<IM extends InputModel> = ObjectSchema<ModelList<IM>>;

export type EnrichedModelList<IM extends InputModel> = InputModelList & {
  items: Array<EnrichedModel<IM>>;
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
