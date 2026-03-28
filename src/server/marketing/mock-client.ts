import type {
  MarketingContactEventSegmentFact,
  MarketingContactSegmentFact,
  MarketingDatabaseClient,
  MarketingDatabaseError,
  MarketingDatabaseResult,
} from "@/services/marketing";
import { getMarketingMockState, type MarketingMockState } from "./mock-state";

type TableRow = Record<string, unknown>;

type RelationName =
  | keyof MarketingMockState
  | "v_marketing_contact_segment_facts"
  | "v_marketing_contact_event_segment_facts";

type OrderBy = {
  column: string;
  ascending: boolean;
  nullsFirst?: boolean;
};

function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function asRecord(row: TableRow) {
  return row;
}

function formatLabel(input: string) {
  return input
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getViewRows(relation: RelationName, state: MarketingMockState): TableRow[] {
  if (relation === "v_marketing_contact_segment_facts") {
    return buildContactSegmentFacts(state) as unknown as TableRow[];
  }

  if (relation === "v_marketing_contact_event_segment_facts") {
    return buildContactEventSegmentFacts(state) as unknown as TableRow[];
  }

  return (state[relation] ?? []) as unknown as TableRow[];
}

function buildContactSegmentFacts(
  state: MarketingMockState,
): MarketingContactSegmentFact[] {
  return state.marketing_contacts.map((contact) => {
    const links = state.marketing_contact_athletes.filter(
      (link) =>
        link.academy_id === contact.academy_id
        && link.marketing_contact_id === contact.id,
    );
    const athleteIds = links.map((link) => link.athlete_id);
    const registrations = state.marketing_registrations.filter(
      (registration) =>
        registration.academy_id === contact.academy_id
        && athleteIds.includes(registration.athlete_id),
    );
    const transactions = state.marketing_successful_transactions.filter(
      (transaction) =>
        transaction.academy_id === contact.academy_id
        && athleteIds.includes(transaction.athlete_id),
    );
    const suppression = state.marketing_suppressions.find(
      (item) =>
        item.academy_id === contact.academy_id
        && item.normalized_email === contact.normalized_email,
    );

    const registeredAtValues = registrations
      .map((registration) => registration.registered_at)
      .filter(Boolean) as string[];
    const paidAtValues = transactions.map((transaction) => transaction.paid_at);
    const lastRegisteredAt =
      registeredAtValues.sort((a, b) => b.localeCompare(a))[0] ?? null;
    const firstRegisteredAt =
      registeredAtValues.sort((a, b) => a.localeCompare(b))[0] ?? null;
    const lastPaidAt = paidAtValues.sort((a, b) => b.localeCompare(a))[0] ?? null;

    const registeredEver = registrations.length > 0;
    const paidEver = transactions.length > 0;
    const lastRegisteredDate = lastRegisteredAt ? new Date(lastRegisteredAt) : null;
    const now = new Date();
    const daysSinceLastRegistered = lastRegisteredDate
      ? Math.floor(
        (now.getTime() - lastRegisteredDate.getTime()) / (1000 * 60 * 60 * 24),
      )
      : null;

    return {
      academy_id: contact.academy_id,
      marketing_contact_id: contact.id,
      email: contact.email,
      normalized_email: contact.normalized_email,
      first_name: contact.first_name,
      last_name: contact.last_name,
      created_via: contact.created_via,
      import_batch_id: contact.import_batch_id,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      athlete_count: athleteIds.length,
      has_linked_athlete: athleteIds.length > 0,
      has_multiple_athletes: athleteIds.length > 1,
      total_registrations: registrations.length,
      total_successful_transactions: transactions.length,
      waitlisted_registrations_count: registrations.filter(
        (registration) => registration.registration_status === "waitlisted",
      ).length,
      canceled_registrations_count: registrations.filter(
        (registration) => registration.registration_status === "canceled",
      ).length,
      refunded_registrations_count: registrations.filter(
        (registration) => registration.registration_status === "refunded",
      ).length,
      attended_registrations_count: registrations.filter(
        (registration) => registration.attendance_status === "attended",
      ).length,
      registered_ever: registeredEver,
      paid_ever: paidEver,
      registered_but_never_paid: registeredEver && !paidEver,
      first_registered_at: firstRegisteredAt,
      last_registered_at: lastRegisteredAt,
      last_paid_at: lastPaidAt,
      registered_in_last_30d:
        daysSinceLastRegistered !== null && daysSinceLastRegistered <= 30,
      registered_in_last_60d:
        daysSinceLastRegistered !== null && daysSinceLastRegistered <= 60,
      registered_in_last_90d:
        daysSinceLastRegistered !== null && daysSinceLastRegistered <= 90,
      inactive_90d:
        daysSinceLastRegistered !== null && registeredEver && daysSinceLastRegistered > 90,
      inactive_180d:
        daysSinceLastRegistered !== null && registeredEver && daysSinceLastRegistered > 180,
      is_suppressed: Boolean(suppression),
      suppression_reason: suppression?.reason ?? null,
    };
  });
}

function buildContactEventSegmentFacts(
  state: MarketingMockState,
): MarketingContactEventSegmentFact[] {
  const rows: MarketingContactEventSegmentFact[] = [];

  for (const contact of state.marketing_contacts) {
    const links = state.marketing_contact_athletes.filter(
      (link) =>
        link.academy_id === contact.academy_id
        && link.marketing_contact_id === contact.id,
    );
    const athleteIds = links.map((link) => link.athlete_id);
    const eventIds = new Set<string>();

    for (const registration of state.marketing_registrations) {
      if (
        registration.academy_id === contact.academy_id
        && athleteIds.includes(registration.athlete_id)
      ) {
        eventIds.add(registration.event_id);
      }
    }

    for (const transaction of state.marketing_successful_transactions) {
      if (
        transaction.academy_id === contact.academy_id
        && athleteIds.includes(transaction.athlete_id)
      ) {
        eventIds.add(transaction.event_id);
      }
    }

    for (const eventId of eventIds) {
      const event = state.marketing_events.find(
        (item) =>
          item.academy_id === contact.academy_id && item.event_id === eventId,
      );

      if (!event) {
        continue;
      }

      const registrations = state.marketing_registrations.filter(
        (registration) =>
          registration.academy_id === contact.academy_id
          && athleteIds.includes(registration.athlete_id)
          && registration.event_id === eventId,
      );
      const transactions = state.marketing_successful_transactions.filter(
        (transaction) =>
          transaction.academy_id === contact.academy_id
          && athleteIds.includes(transaction.athlete_id)
          && transaction.event_id === eventId,
      );
      const suppression = state.marketing_suppressions.find(
        (item) =>
          item.academy_id === contact.academy_id
          && item.normalized_email === contact.normalized_email,
      );

      const registeredAtValues = registrations
        .map((registration) => registration.registered_at)
        .filter(Boolean) as string[];
      const paidAtValues = transactions.map((transaction) => transaction.paid_at);

      rows.push({
        academy_id: contact.academy_id,
        marketing_contact_id: contact.id,
        email: contact.email,
        normalized_email: contact.normalized_email,
        first_name: contact.first_name,
        last_name: contact.last_name,
        event_id: event.event_id,
        season_id: event.season_id,
        event_name: event.name,
        event_type: event.event_type,
        starts_at: event.starts_at,
        ends_at: event.ends_at,
        total_registrations: registrations.length,
        total_successful_transactions: transactions.length,
        waitlisted_registrations_count: registrations.filter(
          (registration) => registration.registration_status === "waitlisted",
        ).length,
        canceled_registrations_count: registrations.filter(
          (registration) => registration.registration_status === "canceled",
        ).length,
        refunded_registrations_count: registrations.filter(
          (registration) => registration.registration_status === "refunded",
        ).length,
        attended_registrations_count: registrations.filter(
          (registration) => registration.attendance_status === "attended",
        ).length,
        has_registration: registrations.length > 0,
        has_successful_transaction: transactions.length > 0,
        registered_but_unpaid: registrations.length > 0 && transactions.length === 0,
        first_registered_at:
          registeredAtValues.sort((a, b) => a.localeCompare(b))[0] ?? null,
        last_registered_at:
          registeredAtValues.sort((a, b) => b.localeCompare(a))[0] ?? null,
        last_paid_at: paidAtValues.sort((a, b) => b.localeCompare(a))[0] ?? null,
        is_suppressed: Boolean(suppression),
        suppression_reason: suppression?.reason ?? null,
      });
    }
  }

  return rows;
}

function cloneRow<T>(row: T): T {
  return JSON.parse(JSON.stringify(row)) as T;
}

class MockQueryBuilder {
  private filters: Array<(row: TableRow) => boolean> = [];
  private orderBy: OrderBy[] = [];
  private rangeStart: number | null = null;
  private rangeEnd: number | null = null;
  private selectRequested = false;
  private singleRequested = false;
  private exactCountRequested = false;
  private operation: "select" | "insert" | "upsert" | "update" | "delete" = "select";
  private payload: TableRow[] = [];
  private updatePayload: Record<string, unknown> = {};
  private onConflict: string[] = [];

  constructor(
    private readonly relation: RelationName,
    private readonly state: MarketingMockState,
  ) {}

  select(_columns = "*", options?: { count?: string }) {
    this.selectRequested = true;
    this.exactCountRequested = options?.count === "exact";
    return this;
  }

  insert(payload: TableRow | TableRow[]) {
    this.operation = "insert";
    this.payload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  upsert(payload: TableRow | TableRow[], options?: { onConflict?: string }) {
    this.operation = "upsert";
    this.payload = Array.isArray(payload) ? payload : [payload];
    this.onConflict = options?.onConflict?.split(",").map((value) => value.trim()) ?? [];
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.operation = "update";
    this.updatePayload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => asRecord(row)[column] === value);
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(asRecord(row)[column]));
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push((row) => (asRecord(row)[column] as string | number) > (value as string | number));
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push((row) => (asRecord(row)[column] as string | number) >= (value as string | number));
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push((row) => (asRecord(row)[column] as string | number) < (value as string | number));
    return this;
  }

  or(expression: string) {
    const conditions = expression.split(",");
    this.filters.push((row) => {
      const record = asRecord(row);
      return conditions.some((condition) => {
        const [field, operator, rawValue] = condition.split(".");
        const value = rawValue?.replace(/%/g, "").toLowerCase();

        if (operator !== "ilike" || !field || !value) {
          return false;
        }

        return String(record[field] ?? "").toLowerCase().includes(value);
      });
    });
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orderBy.push({
      column,
      ascending: options?.ascending ?? true,
      nullsFirst: options?.nullsFirst,
    });
    return this;
  }

  range(from: number, to: number) {
    this.rangeStart = from;
    this.rangeEnd = to;
    return this;
  }

  single() {
    this.singleRequested = true;
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((value: MarketingDatabaseResult<unknown>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<MarketingDatabaseResult<unknown>> {
    try {
      switch (this.operation) {
        case "select":
          return this.executeSelect();
        case "insert":
          return this.executeInsert();
        case "upsert":
          return this.executeUpsert();
        case "update":
          return this.executeUpdate();
        case "delete":
          return this.executeDelete();
      }
    } catch (error) {
      const dbError: MarketingDatabaseError = {
        message: error instanceof Error ? error.message : "Unknown mock DB error.",
      };

      return {
        data: null,
        error: dbError,
      };
    }
  }

  private getRows() {
    const rows = getViewRows(this.relation, this.state);
    return rows.map((row) => cloneRow(row));
  }

  private applyFilters(rows: TableRow[]) {
    return this.filters.reduce(
      (currentRows, predicate) => currentRows.filter((row) => predicate(row)),
      rows,
    );
  }

  private applyOrder(rows: TableRow[]) {
    if (!this.orderBy.length) {
      return rows;
    }

    return [...rows].sort((left, right) => {
      for (const order of this.orderBy) {
        const a = asRecord(left)[order.column];
        const b = asRecord(right)[order.column];

        if (a == null && b == null) {
          continue;
        }

        if (a == null || b == null) {
          const nullsFirst = order.nullsFirst ?? false;
          if (a == null) {
            return nullsFirst ? -1 : 1;
          }

          return nullsFirst ? 1 : -1;
        }

        if (a === b) {
          continue;
        }

        const comparison = String(a).localeCompare(String(b));
        return order.ascending ? comparison : comparison * -1;
      }

      return 0;
    });
  }

  private applyRange(rows: TableRow[]) {
    if (this.rangeStart === null || this.rangeEnd === null) {
      return rows;
    }

    return rows.slice(this.rangeStart, this.rangeEnd + 1);
  }

  private executeSelect(): MarketingDatabaseResult<unknown> {
    const filtered = this.applyFilters(this.getRows());
    const ordered = this.applyOrder(filtered);
    const ranged = this.applyRange(ordered);

    return {
      data: this.singleRequested ? ranged[0] ?? null : ranged,
      error: null,
      count: this.exactCountRequested ? filtered.length : null,
    };
  }

  private mutateTableRows(mutator: (rows: TableRow[]) => TableRow[]) {
    if (
      this.relation === "v_marketing_contact_segment_facts"
      || this.relation === "v_marketing_contact_event_segment_facts"
    ) {
      throw new Error(`Cannot mutate view relation ${this.relation}.`);
    }

    const relation = this.relation as keyof MarketingMockState;
    this.state[relation] = mutator(
      this.state[relation] as unknown as TableRow[],
    ) as never;
  }

  private materializeDefaults(row: TableRow) {
    const base = { ...row } as Record<string, unknown>;
    const now = nowIso();

    switch (this.relation) {
      case "marketing_contacts":
        base.id ??= crypto.randomUUID();
        if (typeof base.email === "string") {
          base.normalized_email = normalizeEmail(base.email);
        }
        base.created_at ??= now;
        base.updated_at = now;
        break;
      case "marketing_suppressions":
        base.id ??= crypto.randomUUID();
        if (typeof base.email === "string") {
          base.normalized_email = normalizeEmail(base.email);
        }
        base.created_at ??= now;
        break;
      case "marketing_campaigns":
        base.id ??= crypto.randomUUID();
        base.status ??= "draft";
        base.audience_definition ??= {};
        base.body_html ??= "";
        base.created_at ??= now;
        base.updated_at = now;
        break;
      case "marketing_import_batches":
        base.id ??= crypto.randomUUID();
        base.status ??= "processing";
        base.source_provider ??= "csv";
        base.total_rows ??= 0;
        base.imported_rows ??= 0;
        base.merged_rows ??= 0;
        base.invalid_rows ??= 0;
        base.created_at ??= now;
        base.updated_at = now;
        break;
      case "marketing_saved_segments":
        base.id ??= crypto.randomUUID();
        base.created_at ??= now;
        base.updated_at = now;
        break;
      case "marketing_events":
      case "marketing_registrations":
        base.created_at ??= now;
        base.updated_at = now;
        break;
      case "marketing_successful_transactions":
      case "marketing_contact_athletes":
        base.created_at ??= now;
        break;
    }

    return base;
  }

  private executeInsert(): MarketingDatabaseResult<unknown> {
    const inserted = this.payload.map((row) => this.materializeDefaults(row));
    this.mutateTableRows((rows) => [...rows, ...inserted]);

    return {
      data: this.selectRequested ? (this.singleRequested ? inserted[0] ?? null : inserted) : null,
      error: null,
    };
  }

  private executeUpsert(): MarketingDatabaseResult<unknown> {
    const rows = this.getRows();
    const updatedRows: TableRow[] = [];
    const relation = this.relation as keyof MarketingMockState;

    for (const payloadRow of this.payload) {
      const prepared = this.materializeDefaults(payloadRow);
      const existingIndex = rows.findIndex((row) =>
        this.onConflict.every(
          (column) => asRecord(row)[column] === prepared[column],
        ),
      );

      if (existingIndex >= 0) {
        const merged = this.materializeDefaults({
          ...rows[existingIndex],
          ...Object.fromEntries(
            Object.entries(prepared).filter(([, value]) => value !== undefined),
          ),
        });
        rows[existingIndex] = merged;
        updatedRows.push(merged);
      } else {
        rows.push(prepared);
        updatedRows.push(prepared);
      }
    }

    this.state[relation] = rows as never;

    return {
      data: this.selectRequested ? (this.singleRequested ? updatedRows[0] ?? null : updatedRows) : null,
      error: null,
    };
  }

  private executeUpdate(): MarketingDatabaseResult<unknown> {
    const relation = this.relation as keyof MarketingMockState;
    const rows = this.getRows();
    const filteredPayload = Object.fromEntries(
      Object.entries(this.updatePayload).filter(([, value]) => value !== undefined),
    );
    const updated: TableRow[] = [];

    const nextRows = rows.map((row) => {
      if (!this.applyFilters([row]).length) {
        return row;
      }

      const merged = this.materializeDefaults({
        ...row,
        ...filteredPayload,
      });

      updated.push(merged);
      return merged;
    });

    this.state[relation] = nextRows as never;

    return {
      data: this.selectRequested ? (this.singleRequested ? updated[0] ?? null : updated) : null,
      error: null,
    };
  }

  private executeDelete(): MarketingDatabaseResult<unknown> {
    const relation = this.relation as keyof MarketingMockState;
    const rows = this.getRows();
    const remaining = rows.filter((row) => !this.applyFilters([row]).length);
    this.state[relation] = remaining as never;

    return {
      data: null,
      error: null,
    };
  }
}

export function createMarketingMockClient(): MarketingDatabaseClient {
  const state = getMarketingMockState();

  return {
    from(relation: string) {
      return new MockQueryBuilder(relation as RelationName, state);
    },
  };
}

export function createMarketingMockMetadata() {
  const state = getMarketingMockState();
  const seasons = Array.from(
    new Set(state.marketing_events.map((event) => event.season_id).filter(Boolean)),
  ).map((seasonId) => ({
    id: seasonId!,
    label: formatLabel(seasonId!),
  }));

  return {
    seasons,
  };
}
