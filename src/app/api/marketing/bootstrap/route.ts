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

    const [savedSegments, campaigns, imports, metadata] = await Promise.all([
      services.savedSegments.listSavedSegments(academyId),
      services.campaigns.listCampaigns({ academyId, page: 1, pageSize: 20 }),
      services.imports.listImportBatches({ academyId, page: 1, pageSize: 20 }),
      services.segmentation.getAudienceMetadata(academyId),
    ]);

    return NextResponse.json({
      contactPresets: services.segmentation.listContactPresets(),
      eventPresets: services.segmentation.listContactEventPresets(),
      savedSegments,
      campaigns,
      imports,
      metadata,
    });
  } catch (error) {
    return toMarketingErrorResponse(error);
  }
}
