import { Separator } from '@/components/ui/separator';

export function StylingSection() {
  return (
    <>
      <section id='styling'>
        <h2 className='font-display text-h2 mb-8 text-primary'>Styling</h2>
        <p className='text-body1 text-muted-foreground mb-8'>Border radius, spacing, and visual treatment conventions.</p>
      </section>

      {/* Border Radius */}
      <section id='border-radius'>
        <h3 className='text-h4 mb-8'>Border Radius</h3>

        <div className='flex flex-wrap gap-6'>
          <div className='text-center'>
            <div className='w-24 h-24 bg-primary rounded-sm' />
            <p className='text-caption mt-2'>sm (12px)</p>
          </div>
          <div className='text-center'>
            <div className='w-24 h-24 bg-primary rounded-md' />
            <p className='text-caption mt-2'>md (24px)</p>
          </div>
          <div className='text-center'>
            <div className='w-24 h-24 bg-primary rounded-lg' />
            <p className='text-caption mt-2'>lg (32px)</p>
          </div>
          <div className='text-center'>
            <div className='w-24 h-24 bg-primary rounded-xl' />
            <p className='text-caption mt-2'>xl (36px)</p>
          </div>
          <div className='text-center'>
            <div className='w-24 h-24 bg-primary rounded-full' />
            <p className='text-caption mt-2'>full</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Spacing */}
      <section id='spacing'>
        <h3 className='text-h4 mb-8'>Spacing Scale</h3>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
          <div className='text-center'>
            <div className='bg-primary p-2 inline-block'><div className='bg-primary-foreground w-6 h-6' /></div>
            <p className='text-caption text-muted-foreground mt-2'>p-2 (8px)</p>
          </div>
          <div className='text-center'>
            <div className='bg-primary p-4 inline-block'><div className='bg-primary-foreground w-6 h-6' /></div>
            <p className='text-caption text-muted-foreground mt-2'>p-4 (16px)</p>
          </div>
          <div className='text-center'>
            <div className='bg-primary p-6 inline-block'><div className='bg-primary-foreground w-6 h-6' /></div>
            <p className='text-caption text-muted-foreground mt-2'>p-6 (24px)</p>
          </div>
          <div className='text-center'>
            <div className='bg-primary p-8 inline-block'><div className='bg-primary-foreground w-6 h-6' /></div>
            <p className='text-caption text-muted-foreground mt-2'>p-8 (32px)</p>
          </div>
          <div className='text-center'>
            <div className='bg-primary p-10 inline-block'><div className='bg-primary-foreground w-6 h-6' /></div>
            <p className='text-caption text-muted-foreground mt-2'>p-10 (40px)</p>
          </div>
          <div className='text-center'>
            <div className='bg-primary p-12 inline-block'><div className='bg-primary-foreground w-6 h-6' /></div>
            <p className='text-caption text-muted-foreground mt-2'>p-12 (48px)</p>
          </div>
          <div className='text-center'>
            <div className='bg-primary p-14 inline-block'><div className='bg-primary-foreground w-6 h-6' /></div>
            <p className='text-caption text-muted-foreground mt-2'>p-14 (56px)</p>
          </div>
          <div className='text-center'>
            <div className='bg-primary p-16 inline-block'><div className='bg-primary-foreground w-6 h-6' /></div>
            <p className='text-caption text-muted-foreground mt-2'>p-16 (64px)</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Separator */}
      <section id='separator'>
        <h3 className='text-h4 mb-8'>Separator</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Visual dividers • Horizontal (default) and vertical orientations
        </p>

        <div className='space-y-8'>
          <div>
            <p className='text-caption text-muted-foreground mb-4'>Horizontal (default)</p>
            <div className='space-y-4'>
              <p className='text-sm'>Content above</p>
              <Separator />
              <p className='text-sm'>Content below</p>
            </div>
          </div>

          <div>
            <p className='text-caption text-muted-foreground mb-4'>Vertical</p>
            <div className='flex items-center h-8 gap-4'>
              <span className='text-sm'>Item 1</span>
              <Separator orientation='vertical' />
              <span className='text-sm'>Item 2</span>
              <Separator orientation='vertical' />
              <span className='text-sm'>Item 3</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
