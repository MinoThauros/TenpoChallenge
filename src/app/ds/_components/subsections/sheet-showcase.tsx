import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function SheetShowcase() {
  return (
    <section id='sheet'>
      <h3 className='text-h4 mb-8'>Sheet</h3>

      <p className='text-caption text-muted-foreground mb-6'>
        Slide-out panels • Sides: top, right, bottom, left • Sizes: sm, md, lg, xl, 2xl, 3xl, full
      </p>

      <div className='space-y-6'>
        {/* Side Variants */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>Side variants</p>
          <div className='flex flex-wrap gap-4'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='secondary'>Right (default)</Button>
              </SheetTrigger>
              <SheetContent side='right'>
                <SheetHeader>
                  <SheetTitle>Right Sheet</SheetTitle>
                  <SheetDescription>Default side position.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant='secondary'>Left</Button>
              </SheetTrigger>
              <SheetContent side='left'>
                <SheetHeader>
                  <SheetTitle>Left Sheet</SheetTitle>
                  <SheetDescription>Navigation menus often use left side.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant='secondary'>Top</Button>
              </SheetTrigger>
              <SheetContent side='top'>
                <SheetHeader>
                  <SheetTitle>Top Sheet</SheetTitle>
                  <SheetDescription>Slides down from the top.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant='secondary'>Bottom</Button>
              </SheetTrigger>
              <SheetContent side='bottom'>
                <SheetHeader>
                  <SheetTitle>Bottom Sheet</SheetTitle>
                  <SheetDescription>Great for mobile actions.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Size Variants */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>Size variants (right/left sides)</p>
          <div className='flex flex-wrap gap-4'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='tertiary'>sm (default)</Button>
              </SheetTrigger>
              <SheetContent size='sm'>
                <SheetHeader>
                  <SheetTitle>Small Sheet</SheetTitle>
                  <SheetDescription>size=&quot;sm&quot; (max-w-sm)</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant='tertiary'>md</Button>
              </SheetTrigger>
              <SheetContent size='md'>
                <SheetHeader>
                  <SheetTitle>Medium Sheet</SheetTitle>
                  <SheetDescription>size=&quot;md&quot; (max-w-md)</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant='tertiary'>lg</Button>
              </SheetTrigger>
              <SheetContent size='lg'>
                <SheetHeader>
                  <SheetTitle>Large Sheet</SheetTitle>
                  <SheetDescription>size=&quot;lg&quot; (max-w-lg)</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant='tertiary'>xl</Button>
              </SheetTrigger>
              <SheetContent size='xl'>
                <SheetHeader>
                  <SheetTitle>Extra Large Sheet</SheetTitle>
                  <SheetDescription>size=&quot;xl&quot; (max-w-xl)</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Full Example */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>Full example with form</p>
          <Sheet>
            <SheetTrigger asChild>
              <Button>Open Filters</Button>
            </SheetTrigger>
            <SheetContent size='md'>
              <SheetHeader>
                <SheetTitle>Camp Filters</SheetTitle>
                <SheetDescription>
                  Narrow down camps by age, location, and type.
                </SheetDescription>
              </SheetHeader>
              <div className='py-4 space-y-4'>
                <div className='space-y-1.5'>
                  <Label>Age Group</Label>
                  <Select>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select age' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='5-7'>5-7 years</SelectItem>
                      <SelectItem value='8-10'>8-10 years</SelectItem>
                      <SelectItem value='11-13'>11-13 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter>
                <Button variant='secondary'>Reset</Button>
                <Button>Apply Filters</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </section>
  );
}
