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
      name?: string;
      description?: string | null;
      segment_scope?: "contact" | "event";
      filter_definition?: Record<string, unknown>;
    };

    const savedSegment = await services.savedSegments.updateSavedSegment({
      id,
      name: body.name,
      description: body.description,
      segment_scope: body.segment_scope,
      filter_definition: body.filter_definition,
    });

    return NextResponse.json(savedSegment);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const services = await createMarketingServerServices();
    await services.savedSegments.deleteSavedSegment(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
