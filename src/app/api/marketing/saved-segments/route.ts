import { NextRequest, NextResponse } from "next/server";
import { createMarketingServerServices, getMarketingServerContext } from "@/server/marketing/service";

export async function GET() {
  const services = createMarketingServerServices();
  const { academyId } = getMarketingServerContext();
  const savedSegments = await services.savedSegments.listSavedSegments(academyId);

  return NextResponse.json(savedSegments);
}

export async function POST(request: NextRequest) {
  const services = createMarketingServerServices();
  const { academyId, userId } = getMarketingServerContext();
  const body = (await request.json()) as {
    name: string;
    description?: string | null;
    segment_scope: "contact" | "event";
    filter_definition: Record<string, unknown>;
  };

  const savedSegment = await services.savedSegments.createSavedSegment({
    academy_id: academyId,
    name: body.name,
    description: body.description,
    segment_scope: body.segment_scope,
    filter_definition: body.filter_definition,
    created_by_user_id: userId,
  });

  return NextResponse.json(savedSegment, { status: 201 });
}
