import { Separator } from '@/components/ui/separator';
import { TypographyShowcase, ColorsShowcase } from '../subsections';

export function BasicSection() {
  return (
    <>
      <section id='basic'>
        <h2 className='font-display text-h2 mb-8 text-primary'>Basic</h2>
        <p className='text-body1 text-muted-foreground mb-8'>Foundational elements: typography and color palette.</p>
      </section>

      <TypographyShowcase />

      <Separator />

      <ColorsShowcase />
    </>
  );
}
