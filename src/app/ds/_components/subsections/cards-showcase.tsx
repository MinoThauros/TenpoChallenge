import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';

export function CardsShowcase() {
  return (
    <section id='cards'>
      <h3 className='text-h4 mb-8'>Cards</h3>

      <div className='space-y-8'>
        {/* Basic Cards */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>Basic card variants</p>
          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {/* Basic Card */}
            <Card>
              <CardHeader>
                <CardTitle>Soccer Skills Camp</CardTitle>
                <CardDescription>Build fundamental soccer techniques in a fun environment.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  <p><span className='text-muted-foreground'>Ages:</span> 8-10 years</p>
                  <p><span className='text-muted-foreground'>Price:</span> $299</p>
                </div>
              </CardContent>
              <CardFooter className='gap-3'>
                <Button variant='secondary' className='flex-1'>Learn More</Button>
                <Button className='flex-1'>Register</Button>
              </CardFooter>
            </Card>

            {/* Interactive Card */}
            <Card interactive>
              <CardHeader>
                <CardTitle>Basketball Basics</CardTitle>
                <CardDescription>Master dribbling, shooting, and teamwork skills.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>Hover to see interactive effect</p>
              </CardContent>
              <CardFooter>
                <Button className='w-full'>View Details</Button>
              </CardFooter>
            </Card>

            {/* Card with CardAction */}
            <Card>
              <CardHeader>
                <CardTitle>Tennis Fundamentals</CardTitle>
                <CardDescription>Learn proper form and game strategy.</CardDescription>
                <CardAction>
                  <Button variant='ghost' size='icon'>
                    <MoreHorizontal />
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className='space-y-2 text-sm'>
                  <p><span className='text-muted-foreground'>Ages:</span> 10-14 years</p>
                  <p><span className='text-muted-foreground'>Price:</span> $449</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rounded Variants */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>Rounded variants (sm, md, lg, xl)</p>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Card rounded='sm' padding='sm'>
              <CardContent className='text-center'>
                <p className='text-sm font-medium'>rounded=&quot;sm&quot;</p>
              </CardContent>
            </Card>
            <Card rounded='md' padding='sm'>
              <CardContent className='text-center'>
                <p className='text-sm font-medium'>rounded=&quot;md&quot;</p>
              </CardContent>
            </Card>
            <Card rounded='lg' padding='sm'>
              <CardContent className='text-center'>
                <p className='text-sm font-medium'>rounded=&quot;lg&quot;</p>
              </CardContent>
            </Card>
            <Card rounded='xl' padding='sm'>
              <CardContent className='text-center'>
                <p className='text-sm font-medium'>rounded=&quot;xl&quot;</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Padding Variants */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>Padding variants (none, sm, md, lg)</p>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Card padding='none'>
              <div className='p-4 text-center'>
                <p className='text-sm font-medium'>padding=&quot;none&quot;</p>
              </div>
            </Card>
            <Card padding='sm'>
              <CardContent className='text-center'>
                <p className='text-sm font-medium'>padding=&quot;sm&quot;</p>
              </CardContent>
            </Card>
            <Card padding='md'>
              <CardContent className='text-center'>
                <p className='text-sm font-medium'>padding=&quot;md&quot;</p>
              </CardContent>
            </Card>
            <Card padding='lg'>
              <CardContent className='text-center'>
                <p className='text-sm font-medium'>padding=&quot;lg&quot;</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
