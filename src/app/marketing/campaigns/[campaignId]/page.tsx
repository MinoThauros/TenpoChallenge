import { notFound } from "next/navigation";
import { CampaignEditorPage } from "./campaign-editor-page";
import { createMarketingServerServices } from "@/server/marketing/service";
import { requireAuthenticatedAppUser } from "@/server/auth/user";
import type {
  MarketingCampaignDispatchState,
  MarketingDispatchRecipientActivity,
  Page,
} from "@/lib/marketing-services";

type CampaignPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

export default async function Page({ params }: CampaignPageProps) {
  const { campaignId } = await params;
  const user = await requireAuthenticatedAppUser(`/marketing/campaigns/${campaignId}`);

  if (!user.academyId) {
    notFound();
  }

  const services = await createMarketingServerServices();
  const emptyDispatchStates: Page<MarketingCampaignDispatchState> = {
    data: [],
    count: 0,
    page: 1,
    pageSize: 25,
  };
  const emptyRecipientActivity: Page<MarketingDispatchRecipientActivity> = {
    data: [],
    count: 0,
    page: 1,
    pageSize: 100,
  };

  const campaign = await services.campaigns.getCampaign({
    id: campaignId,
    academyId: user.academyId,
  }).catch(() => null);

  if (!campaign) {
    notFound();
  }

  const [dispatchStates, recipientActivity] = await Promise.all([
    services.dispatches.listDispatchStates({
      academyId: user.academyId,
      campaignId,
      page: 1,
      pageSize: 25,
    }).catch(() => emptyDispatchStates),
    services.dispatches.listRecipientActivity({
      academyId: user.academyId,
      campaignId,
      page: 1,
      pageSize: 100,
    }).catch(() => emptyRecipientActivity),
  ]);

  return (
    <CampaignEditorPage
      initialCampaign={campaign}
      initialDispatchStates={dispatchStates}
      initialRecipientActivity={recipientActivity}
    />
  );
}
