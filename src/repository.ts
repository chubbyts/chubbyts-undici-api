import { List, Model } from './model';

export type ResolveList = (list: List) => Promise<List>;
export type FindById = (id: string) => Promise<Model | undefined>;
export type Persist = (model: Model) => Promise<Model>;
export type Remove = (model: Model) => Promise<void>;
