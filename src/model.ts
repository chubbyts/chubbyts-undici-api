export type Model = {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type List = {
  offset: number;
  limit: number;
  filters: Record<string, unknown>;
  sort: Record<string, string>;
  items: Array<Model>;
  count: number;
};
