import { NextRequest, NextResponse } from "next/server";
import { createMarketingServerServices, toMarketingErrorResponse } from "@/server/marketing/service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await createMarketingServerServices();
    await services.suppressions.deleteSuppression(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
