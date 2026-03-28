import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CardsShowcase, TableShowcase } from '../subsections';

export function DataDisplaySection() {
  return (
    <>
      <section id='data-display'>
        <h2 className='font-display text-h2 mb-8 text-primary'>Data Display</h2>
        <p className='text-body1 text-muted-foreground mb-8'>Components for presenting information and content.</p>
      </section>

      <CardsShowcase />

      <Separator />

      <TableShowcase />

      <Separator />

      {/* Tabs */}
      <section id='tabs'>
        <h3 className='text-h4 mb-8'>Tabs</h3>

        <Tabs defaultValue='overview' className='w-full'>
          <TabsList>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='schedule'>Schedule</TabsTrigger>
            <TabsTrigger value='pricing'>Pricing</TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='mt-4'>
            <div className='bg-card rounded-lg p-6 border'>
              <p className='text-body1'>Welcome to the camp overview. Here you&apos;ll find all the essential information about what makes our programs special.</p>
            </div>
          </TabsContent>
          <TabsContent value='schedule' className='mt-4'>
            <div className='bg-card rounded-lg p-6 border'>
              <p className='text-body1'>View the daily schedule, activity timings, and important dates for upcoming sessions.</p>
            </div>
          </TabsContent>
          <TabsContent value='pricing' className='mt-4'>
            <div className='bg-card rounded-lg p-6 border'>
              <p className='text-body1'>Check our competitive pricing options, discounts for siblings, and early bird specials.</p>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <Separator />

      {/* Accordion */}
      <section id='accordion'>
        <h3 className='text-h4 mb-8'>Accordion</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Collapsible content sections • Great for FAQs
        </p>

        <Accordion type='single' collapsible className='max-w-lg'>
          <AccordionItem value='item-1'>
            <AccordionTrigger>What ages are your camps for?</AccordionTrigger>
            <AccordionContent>
              Our camps are designed for children ages 5-14. We group participants by age to ensure appropriate skill levels and social dynamics.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-2'>
            <AccordionTrigger>What should my child bring?</AccordionTrigger>
            <AccordionContent>
              Please bring a water bottle, sunscreen, comfortable athletic clothing, and appropriate footwear. Lunch is provided for full-day camps.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-3'>
            <AccordionTrigger>What is your refund policy?</AccordionTrigger>
            <AccordionContent>
              Full refunds are available up to 14 days before camp starts. Within 14 days, we offer a 50% refund or credit toward a future camp.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='item-4'>
            <AccordionTrigger>Do you offer sibling discounts?</AccordionTrigger>
            <AccordionContent>
              Yes! We offer 10% off for the second sibling and 15% off for additional siblings registered for the same camp session.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      <Separator />

      {/* Avatars */}
      <section id='avatars'>
        <h3 className='text-h4 mb-8'>Avatars</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          All sizes: sm, md, lg, xl • With image and fallback
        </p>

        <div className='space-y-6'>
          <div>
            <p className='text-caption text-muted-foreground mb-4'>Size variants with image</p>
            <div className='flex items-end gap-6'>
              <div className='text-center'>
                <Avatar size='sm'>
                  <AvatarImage src='https://github.com/shadcn.png' alt='User' />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <p className='text-caption text-muted-foreground mt-2'>sm</p>
              </div>
              <div className='text-center'>
                <Avatar size='md'>
                  <AvatarImage src='https://github.com/shadcn.png' alt='User' />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <p className='text-caption text-muted-foreground mt-2'>md</p>
              </div>
              <div className='text-center'>
                <Avatar size='lg'>
                  <AvatarImage src='https://github.com/shadcn.png' alt='User' />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <p className='text-caption text-muted-foreground mt-2'>lg</p>
              </div>
              <div className='text-center'>
                <Avatar size='xl'>
                  <AvatarImage src='https://github.com/shadcn.png' alt='User' />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <p className='text-caption text-muted-foreground mt-2'>xl</p>
              </div>
            </div>
          </div>

          <div>
            <p className='text-caption text-muted-foreground mb-4'>Fallback variants (no image)</p>
            <div className='flex items-end gap-6'>
              <div className='text-center'>
                <Avatar size='sm'>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <p className='text-caption text-muted-foreground mt-2'>sm</p>
              </div>
              <div className='text-center'>
                <Avatar size='md'>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <p className='text-caption text-muted-foreground mt-2'>md</p>
              </div>
              <div className='text-center'>
                <Avatar size='lg'>
                  <AvatarFallback>AB</AvatarFallback>
                </Avatar>
                <p className='text-caption text-muted-foreground mt-2'>lg</p>
              </div>
              <div className='text-center'>
                <Avatar size='xl'>
                  <AvatarFallback>CD</AvatarFallback>
                </Avatar>
                <p className='text-caption text-muted-foreground mt-2'>xl</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Progress */}
      <section id='progress'>
        <h3 className='text-h4 mb-8'>Progress</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Visual progress indicators • Uses primary color
        </p>

        <div className='space-y-6 max-w-md'>
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Profile completion</span>
              <span className='text-muted-foreground'>25%</span>
            </div>
            <Progress value={25} />
          </div>
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Registration steps</span>
              <span className='text-muted-foreground'>60%</span>
            </div>
            <Progress value={60} />
          </div>
          <div className='space-y-2'>
            <div className='flex justify-between text-sm'>
              <span>Camp capacity</span>
              <span className='text-muted-foreground'>90%</span>
            </div>
            <Progress value={90} />
          </div>
        </div>
      </section>

      <Separator />

      {/* Skeleton */}
      <section id='skeleton'>
        <h3 className='text-h4 mb-8'>Skeleton</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Loading placeholders
        </p>

        <div className='flex items-center gap-4'>
          <Skeleton className='h-12 w-12 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-[200px]' />
            <Skeleton className='h-4 w-[160px]' />
          </div>
        </div>

        <div className='mt-6 space-y-3'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
        </div>
      </section>

    </>
  );
}
