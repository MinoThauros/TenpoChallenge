import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ButtonsShowcase } from '../subsections';

export function ActionsSection() {
  return (
    <>
      <section id='actions'>
        <h2 className='font-display text-h2 mb-8 text-primary'>Actions</h2>
        <p className='text-body1 text-muted-foreground mb-8'>Interactive elements for user actions.</p>
      </section>

      <ButtonsShowcase />

      <Separator />

      {/* Badges */}
      <section id='badges'>
        <h3 className='text-h4 mb-8'>Badges</h3>

        <div className='flex flex-wrap gap-4'>
          <Badge>Default</Badge>
          <Badge variant='secondary'>Secondary</Badge>
          <Badge variant='destructive'>Destructive</Badge>
          <Badge variant='outline'>Outline</Badge>
        </div>

        <div className='flex flex-wrap gap-4 mt-4'>
          <Badge variant='success'>Success</Badge>
          <Badge variant='warning'>Warning</Badge>
          <Badge variant='error'>Error</Badge>
          <Badge variant='info'>Info</Badge>
        </div>
      </section>
    </>
  );
}
