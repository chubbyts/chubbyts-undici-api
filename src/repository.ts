import { List, Model } from './model';

export type ResolveList<M extends Model> = (list: List<M>) => Promise<List<M>>;
export type FindById<M extends Model> = (id: string) => Promise<M | undefined>;
export type Persist<M extends Model> = (model: M) => Promise<M>;
export type Remove<M extends Model> = (model: M) => Promise<void>;
