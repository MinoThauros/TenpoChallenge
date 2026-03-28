import { MarketingDashboard } from "./_components/marketing-dashboard";

type MarketingPageProps = {
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function MarketingPage({ searchParams }: MarketingPageProps) {
  const params = await searchParams;
  const initialTab = params.tab ?? "campaigns";

  return <MarketingDashboard initialTab={initialTab} />;
}
