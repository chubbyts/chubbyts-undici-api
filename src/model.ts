export type Model = {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type List = {
  offset: number;
  limit: number;
  filters: Record<string, unknown>;
  items: Array<Model>;
  sort: Record<string, 'asc' | 'desc'>;
  count: number;
};
