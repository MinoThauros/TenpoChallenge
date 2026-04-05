import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { requireAuthenticatedAppUser } from '@/server/auth/user';
import { MarketingV2Dashboard } from './_components/marketing-v2-dashboard';

export default async function MarketingV2Page() {
  const user = await requireAuthenticatedAppUser('/marketing-v2');

  if (!user.academyId) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16'>
          <Alert variant='warning'>
            <AlertTitle>Account is missing academy access</AlertTitle>
            <AlertDescription>
              Your Supabase user is signed in, but the JWT does not include an <code>academy_id</code> value in <code>app_metadata</code>. The marketing API depends on that claim for RLS.
            </AlertDescription>
          </Alert>
          <div className='flex gap-3'>
            <Button asChild variant='outline'>
              <Link href='/'>Back home</Link>
            </Button>
            <form action='/auth/sign-out' method='post'>
              <Button type='submit' variant='outline'>
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <MarketingV2Dashboard />;
}
