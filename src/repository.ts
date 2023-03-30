import { List, Model } from './model';

export type ResolveList<C> = (list: List<Model<C>>) => Promise<List<Model<C>>>;
export type FindById<C> = (id: string) => Promise<Model<C> | undefined>;
export type Persist<C> = (model: Model<C>) => Promise<Model<C>>;
export type Remove<C> = (model: Model<C>) => Promise<void>;
