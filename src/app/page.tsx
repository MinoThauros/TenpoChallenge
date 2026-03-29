import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Palette, Code, Layers } from 'lucide-react';
import { getOptionalAuthenticatedAppUser } from '@/server/auth/user';

export default async function Home() {
  const user = await getOptionalAuthenticatedAppUser();

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b'>
        <div className='max-w-5xl mx-auto px-6 py-4 flex items-center justify-between'>
          <Image
            src='/images/logo/wordmark/wordmark-pitch-green.svg'
            alt='Tenpo'
            width={100}
            height={35}
          />
          <div className='flex items-center gap-3'>
            <Badge variant='secondary'>
              {user ? 'Signed in' : 'Hackathon UI Kit'}
            </Badge>
            {user ? (
              <form action='/auth/sign-out' method='post'>
                <Button size='sm' variant='outline' type='submit'>
                  Sign out
                </Button>
              </form>
            ) : (
              <Button asChild size='sm' variant='outline'>
                <Link href='/auth/sign-in'>Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className='max-w-5xl mx-auto px-6 pt-20 pb-16'>
        <div className='max-w-2xl'>
          <h1 className='text-h3 text-foreground'>
            Build with the{' '}
            <span className='font-display'>Tenpo Design System.</span>
          </h1>
          <p className='mt-4 text-body1 text-muted-foreground max-w-lg'>
            A complete UI kit with 40+ production-ready components built on Radix UI, Tailwind CSS 4, and React 19. Skip the boilerplate and start building.
          </p>
          <div className='mt-8 flex gap-3'>
            <Button asChild size='lg'>
              <Link href='/ds'>
                Explore Components <ArrowRight className='ml-2 size-4' />
              </Link>
            </Button>
            <Button asChild size='lg' variant='outline'>
              <Link href='/marketing'>
                Open Marketing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className='max-w-5xl mx-auto px-6 pb-20'>
        <div className='grid gap-6 md:grid-cols-3'>
          <Card>
            <CardContent className='pt-6'>
              <Palette className='size-8 text-primary mb-3' />
              <h3 className='text-h6 mb-2'>Design Tokens</h3>
              <p className='text-body2 text-muted-foreground'>
                Colors, typography, spacing, and border radius — all defined as CSS variables in Tailwind 4.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <Layers className='size-8 text-primary mb-3' />
              <h3 className='text-h6 mb-2'>40+ Components</h3>
              <p className='text-body2 text-muted-foreground'>
                Buttons, forms, dialogs, tables, date pickers, and more. All accessible and composable.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <Code className='size-8 text-primary mb-3' />
              <h3 className='text-h6 mb-2'>Easy to Use</h3>
              <p className='text-body2 text-muted-foreground'>
                Import from <code className='text-caption bg-muted px-1.5 py-0.5 rounded-sm'>@/components/ui</code> and you&apos;re ready to go.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Getting Started */}
      <section className='border-t'>
        <div className='max-w-5xl mx-auto px-6 py-16'>
          <h2 className='text-h5 mb-6'>Getting Started</h2>
          <div className='space-y-4'>
            <div className='bg-muted rounded-lg p-4'>
              <p className='text-caption text-muted-foreground mb-1'>1. Install dependencies</p>
              <code className='text-body2 font-mono'>yarn install</code>
            </div>
            <div className='bg-muted rounded-lg p-4'>
              <p className='text-caption text-muted-foreground mb-1'>2. Start dev server</p>
              <code className='text-body2 font-mono'>yarn dev</code>
            </div>
            <div className='bg-muted rounded-lg p-4'>
              <p className='text-caption text-muted-foreground mb-1'>3. Import a component</p>
              <code className='text-body2 font-mono'>{"import { Button } from '@/components/ui/button';"}</code>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t'>
        <div className='max-w-5xl mx-auto px-6 py-8'>
          <p className='text-caption text-muted-foreground text-center'>
            Tenpo UI Kit — Built with Next.js, Radix UI, and Tailwind CSS 4
          </p>
        </div>
      </footer>
    </div>
  );
}
