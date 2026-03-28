export interface MarketingDatabaseError {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
}

export interface MarketingDatabaseResult<T> {
  data: T | null;
  error: MarketingDatabaseError | null;
  count?: number | null;
}

export interface MarketingDatabaseClient {
  from(relation: string): any;
}

export class MarketingServiceError extends Error {
  constructor(
    message: string,
    public readonly causeDetails?: MarketingDatabaseError | null,
  ) {
    super(message);
    this.name = "MarketingServiceError";
  }
}

export function unwrapRows<T>(
  result: MarketingDatabaseResult<T[]>,
  context: string,
): T[] {
  if (result.error) {
    throw new MarketingServiceError(context, result.error);
  }

  return result.data ?? [];
}

export function unwrapRow<T>(
  result: MarketingDatabaseResult<T>,
  context: string,
): T {
  if (result.error) {
    throw new MarketingServiceError(context, result.error);
  }

  if (!result.data) {
    throw new MarketingServiceError(`${context}: expected a row but received none.`);
  }

  return result.data;
}

export function buildPage(page = 1, pageSize = 25) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(pageSize, 100));

  return {
    page: safePage,
    pageSize: safePageSize,
    from: (safePage - 1) * safePageSize,
    to: safePage * safePageSize - 1,
  };
}
