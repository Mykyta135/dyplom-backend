export enum FilterOperator {
  EQUALS = 'eq',
  CONTAINS = 'contains',
  GT = 'gt',
  LT = 'lt',
}

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export class Criteria {
  constructor(
    public readonly filters: Filter[] = [],
    public readonly page = 1,
    public readonly limit = 10,
    public readonly sortBy?: string,
    public readonly sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {}
}
