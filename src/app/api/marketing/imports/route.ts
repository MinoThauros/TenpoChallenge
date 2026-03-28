import { NextRequest, NextResponse } from "next/server";
import { createMarketingServerServices, getMarketingServerContext } from "@/server/marketing/service";

export async function GET() {
  const services = createMarketingServerServices();
  const { academyId } = getMarketingServerContext();

  const imports = await services.imports.listImportBatches({
    academyId,
    page: 1,
    pageSize: 20,
  });

  return NextResponse.json(imports);
}

export async function POST(request: NextRequest) {
  const services = createMarketingServerServices();
  const { academyId, userId } = getMarketingServerContext();
  const body = (await request.json()) as {
    file_name: string;
    source_provider: "csv" | "mailchimp" | "mailerlite" | "constant_contact" | "other";
    total_rows: number;
    merged_rows?: number;
    invalid_rows?: number;
  };

  const batch = await services.imports.createBatch({
    academy_id: academyId,
    uploaded_by_user_id: userId,
    file_name: body.file_name,
    source_provider: body.source_provider,
    total_rows: body.total_rows,
  });

  const mergedRows = body.merged_rows ?? Math.max(1, Math.round(body.total_rows * 0.12));
  const invalidRows = body.invalid_rows ?? Math.max(0, Math.round(body.total_rows * 0.03));
  const importedRows = Math.max(body.total_rows - mergedRows - invalidRows, 0);

  const completed = await services.imports.markCompleted({
    id: batch.id,
    imported_rows: importedRows,
    merged_rows: mergedRows,
    invalid_rows: invalidRows,
  });

  return NextResponse.json(completed, { status: 201 });
}
