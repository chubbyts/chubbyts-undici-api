import { ServerRequest } from '@chubbyts/chubbyts-http-types/dist/message';

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

export type Model = {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
  [key: string]: any;
};

export type EnrichedModel<M extends Model> = M & Embedded & Links;

export type List<M extends Model> = {
  offset: number;
  limit: number;
  filters: { [key: string]: any };
  sort: { [key: string]: 'asc' | 'desc' };
  count: number;
  items: Array<M>;
};

export type EnrichedList<M extends Model> = List<M> & Embedded & Links;

export type EnrichModel<M extends Model> = (
  model: M,
  context: { request: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedModel<M>>;

export type EnrichList<M extends Model> = (
  list: List<M>,
  context: { request: ServerRequest; [key: string]: unknown },
) => Promise<EnrichedList<M>>;
