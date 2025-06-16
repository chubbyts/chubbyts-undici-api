import type { List, Model } from './model.js';

export type ResolveModelList<C> = (list: List<C>) => Promise<List<C>>;
export type FindModelById<C> = (id: string) => Promise<Model<C> | undefined>;

export type PersistModel<C> = (model: Model<C>) => Promise<Model<C>>;
export type RemoveModel<C> = (model: Model<C>) => Promise<void>;

// @deprecated use FindModelById
export type FindById<C> = FindModelById<C>;
// @deprecated use FindModelById
export type FindOneById<C> = FindModelById<C>;
// @deprecated use ResolveModelList
export type ResolveList<C> = ResolveModelList<C>;
// @deprecated use PersistModel
export type Persist<C> = PersistModel<C>;
// @deprecated use RemoveModel
export type Remove<C> = RemoveModel<C>;
