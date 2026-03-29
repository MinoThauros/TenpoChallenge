import { NextRequest, NextResponse } from "next/server";
import { createMarketingServerServices, toMarketingErrorResponse } from "@/server/marketing/service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await createMarketingServerServices();
    const body = (await request.json()) as {
      file_name?: string;
      source_provider?: string;
      status?: string;
      total_rows?: number;
      imported_rows?: number;
      merged_rows?: number;
      invalid_rows?: number;
      error_message?: string | null;
      completed_at?: string | null;
    };

    const batch = await services.imports.updateBatch({
      id,
      ...body,
    });

    return NextResponse.json(batch);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await createMarketingServerServices();
    await services.imports.deleteBatch(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
