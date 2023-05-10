import type { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';

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

export type Model<C> = {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
} & {
  [key in keyof C]: C[key];
};

export type EnrichedModel<C> = Model<C> & Embedded & Links;

export type List<C> = {
  offset: number;
  limit: number;
  filters: { [key: string]: any };
  sort: { [key: string]: 'asc' | 'desc' };
  count: number;
  items: Array<Model<C>>;
};

export type EnrichedList<C> = List<Model<C>> & Embedded & Links;

export type EnrichModel<C> = (
  model: Model<C>,
  context: { request: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedModel<Model<C>>>;

export type EnrichList<C> = (
  list: List<Model<C>>,
  context: { request: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedList<Model<C>>>;
