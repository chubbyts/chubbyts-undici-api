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
};

export type EnrichedModel = Model & Embedded & Links;

export type List = {
  offset: number;
  limit: number;
  filters: Record<string, unknown>;
  sort: Record<string, 'asc' | 'desc'>;
  count: number;
  items: Array<Model>;
};

export type EnrichedList = List & Embedded & Links;

export type EnrichModel = (model: Model, context: { request: ServerRequest; [key: string]: unknown }) => EnrichedModel;
export type EnrichList = (list: List, context: { request: ServerRequest; [key: string]: unknown }) => EnrichedList;
