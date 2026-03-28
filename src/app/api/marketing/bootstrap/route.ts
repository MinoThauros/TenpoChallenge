import { NextResponse } from "next/server";
import { createMarketingServerServices, getMarketingServerContext } from "@/server/marketing/service";

export async function GET() {
  const services = createMarketingServerServices();
  const { academyId } = getMarketingServerContext();

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
}
