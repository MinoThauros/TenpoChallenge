import { NextRequest, NextResponse } from "next/server";
import {
  createMarketingServerServices,
  getMarketingServerContext,
  toMarketingErrorResponse,
} from "@/server/marketing/service";

export async function GET(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId } = await getMarketingServerContext(request);
    const savedSegments = await services.savedSegments.listSavedSegments(academyId);

    return NextResponse.json(savedSegments);
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const services = await createMarketingServerServices();
    const { academyId, userId } = await getMarketingServerContext(request);
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
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
