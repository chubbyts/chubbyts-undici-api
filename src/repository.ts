import type { ModelList, Model, InputModel, InputModelList } from './model.js';

export type ResolveModelList<IM extends InputModel> = (inputList: InputModelList) => Promise<ModelList<IM>>;
export type FindModelById<IM extends InputModel> = (id: string) => Promise<Model<IM> | undefined>;

export type PersistModel<IM extends InputModel> = (model: Model<IM>) => Promise<Model<IM>>;
export type RemoveModel<IM extends InputModel> = (model: Model<IM>) => Promise<void>;

/////

// @deprecated use FindModelById
export type FindById<IM extends InputModel> = FindModelById<IM>;

// @deprecated use FindModelById
export type FindOneById<IM extends InputModel> = FindModelById<IM>;

// @deprecated use ResolveModelList
export type ResolveList<IM extends InputModel> = ResolveModelList<IM>;

// @deprecated use PersistModel
export type Persist<IM extends InputModel> = PersistModel<IM>;

// @deprecated use RemoveModel
export type Remove<IM extends InputModel> = RemoveModel<IM>;
