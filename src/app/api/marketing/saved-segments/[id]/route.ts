import { NextRequest, NextResponse } from "next/server";
import { createMarketingServerServices } from "@/server/marketing/service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const services = createMarketingServerServices();
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
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const services = createMarketingServerServices();
  await services.savedSegments.deleteSavedSegment(id);

  return NextResponse.json({ ok: true });
}
