import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Menu, Trash2 } from 'lucide-react';

export function ButtonsShowcase() {
  return (
    <section id='buttons'>
      <h3 className='text-h4 mb-8'>Buttons</h3>

      <p className='text-caption text-muted-foreground mb-4'>
        Hover: 90% opacity • Focus: orange ring • Pill shape
      </p>

      <div className='space-y-8'>
        {/* All Variants */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>All variants</p>
          <div className='flex flex-wrap items-center gap-4'>
            <Button>Default</Button>
            <Button variant='secondary'>Secondary</Button>
            <Button variant='tertiary'>Tertiary</Button>
            <Button variant='destructive'>Destructive</Button>
            <Button variant='ghost'>Ghost</Button>
            <Button variant='link'>Link</Button>
          </div>
        </div>

        {/* All Sizes */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>All sizes (sm, default, lg)</p>
          <div className='flex flex-wrap items-center gap-4'>
            <Button size='sm'>Small</Button>
            <Button>Default</Button>
            <Button size='lg'>Large</Button>
          </div>
        </div>

        {/* Icon Sizes */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>Icon sizes (icon-sm, icon, icon-lg)</p>
          <div className='flex flex-wrap items-center gap-4'>
            <Button size='icon-sm'><Menu /></Button>
            <Button size='icon'><Menu /></Button>
            <Button size='icon-lg'><Menu /></Button>
            <Button variant='secondary' size='icon-sm'><Menu /></Button>
            <Button variant='secondary' size='icon'><Menu /></Button>
            <Button variant='secondary' size='icon-lg'><Menu /></Button>
          </div>
        </div>

        {/* With Icons */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>With icons</p>
          <div className='flex flex-wrap gap-4'>
            <Button>
              <ChevronLeft /> Back
            </Button>
            <Button variant='secondary'>
              Next <ChevronRight />
            </Button>
            <Button variant='destructive'>
              <Trash2 /> Delete
            </Button>
          </div>
        </div>

        {/* Disabled States */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>Disabled states</p>
          <div className='flex flex-wrap items-center gap-4'>
            <Button disabled>Default</Button>
            <Button variant='secondary' disabled>Secondary</Button>
            <Button variant='tertiary' disabled>Tertiary</Button>
            <Button variant='destructive' disabled>Destructive</Button>
            <Button variant='ghost' disabled>Ghost</Button>
            <Button variant='link' disabled>Link</Button>
          </div>
        </div>

        {/* Full Width */}
        <div>
          <p className='text-caption text-muted-foreground mb-4'>Full width</p>
          <div className='max-w-xs space-y-2'>
            <Button className='w-full'>Full Width Button</Button>
            <Button variant='secondary' className='w-full'>Full Width Secondary</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
