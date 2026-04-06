import { notFound } from 'next/navigation';
import { requireAuthenticatedAppUser } from '@/server/auth/user';
import { MarketingV2CampaignPage } from '../../_components/marketing-v2-campaign-page';

type MarketingV2CampaignRouteProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

export default async function MarketingV2CampaignRoute({
  params,
}: MarketingV2CampaignRouteProps) {
  const { campaignId } = await params;
  const user = await requireAuthenticatedAppUser(`/marketing-v2/campaigns/${campaignId}`);

  if (!user.academyId) {
    notFound();
  }

  return <MarketingV2CampaignPage campaignId={campaignId} />;
}

