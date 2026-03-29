import {
  buildPage,
  ensureSuccess,
  unwrapRow,
  unwrapRows,
} from "../client";
import type { MarketingDatabaseClient } from "../client";
import type {
  CompleteMarketingImportBatchInput,
  CreateMarketingImportBatchInput,
  FailMarketingImportBatchInput,
  ListMarketingImportBatchesInput,
  MarketingImportBatch,
  Page,
} from "../types";

export function createMarketingImportsService(client: MarketingDatabaseClient) {
  return {
    async listImportBatches(
      input: ListMarketingImportBatchesInput,
    ): Promise<Page<MarketingImportBatch>> {
      const page = buildPage(input.page, input.pageSize);
      const result = await client
        .from("marketing_import_batches")
        .select("*", { count: "exact" })
        .eq("academy_id", input.academyId)
        .order("created_at", { ascending: false })
        .range(page.from, page.to);

      return {
        data: unwrapRows<MarketingImportBatch>(
          result,
          "Failed to load marketing import batches.",
        ),
        count: result.count ?? null,
        page: page.page,
        pageSize: page.pageSize,
      };
    },

    async createBatch(
      input: CreateMarketingImportBatchInput,
    ): Promise<MarketingImportBatch> {
      const result = await client
        .from("marketing_import_batches")
        .insert({
          academy_id: input.academy_id,
          uploaded_by_user_id: input.uploaded_by_user_id ?? null,
          source_provider: input.source_provider ?? "csv",
          file_name: input.file_name,
          total_rows: input.total_rows ?? 0,
        })
        .select("*")
        .single();

      return unwrapRow<MarketingImportBatch>(
        result,
        "Failed to create marketing import batch.",
      );
    },

    async markCompleted(
      input: CompleteMarketingImportBatchInput,
    ): Promise<MarketingImportBatch> {
      const result = await client
        .from("marketing_import_batches")
        .update({
          status: "completed",
          imported_rows: input.imported_rows,
          merged_rows: input.merged_rows ?? 0,
          invalid_rows: input.invalid_rows ?? 0,
          completed_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select("*")
        .single();

      return unwrapRow<MarketingImportBatch>(
        result,
        "Failed to complete marketing import batch.",
      );
    },

    async markFailed(
      input: FailMarketingImportBatchInput,
    ): Promise<MarketingImportBatch> {
      const result = await client
        .from("marketing_import_batches")
        .update({
          status: "failed",
          error_message: input.error_message,
        })
        .eq("id", input.id)
        .select("*")
        .single();

      return unwrapRow<MarketingImportBatch>(
        result,
        "Failed to mark marketing import batch as failed.",
      );
    },

    async updateBatch(input: {
      id: string;
      file_name?: string;
      source_provider?: string;
      status?: string;
      total_rows?: number;
      imported_rows?: number;
      merged_rows?: number;
      invalid_rows?: number;
      error_message?: string | null;
      completed_at?: string | null;
    }): Promise<MarketingImportBatch> {
      const result = await client
        .from("marketing_import_batches")
        .update({
          file_name: input.file_name,
          source_provider: input.source_provider,
          status: input.status,
          total_rows: input.total_rows,
          imported_rows: input.imported_rows,
          merged_rows: input.merged_rows,
          invalid_rows: input.invalid_rows,
          error_message: input.error_message,
          completed_at: input.completed_at,
        })
        .eq("id", input.id)
        .select("*")
        .single();

      return unwrapRow(result, "Failed to update marketing import batch.");
    },

    async deleteBatch(id: string): Promise<void> {
      const result = await client
        .from("marketing_import_batches")
        .delete()
        .eq("id", id);

      ensureSuccess(result, "Failed to delete marketing import batch.");
    },
  };
}
