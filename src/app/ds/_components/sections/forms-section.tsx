import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FormElementsShowcase, CalendarDemo, DateTimePickersShowcase, FormValidationShowcase } from '../subsections';
import type { FormsSectionProps } from '../types';

export function FormsSection({ form, onSubmit }: FormsSectionProps) {
  return (
    <>
      <section id='forms'>
        <h2 className='font-display text-h2 mb-8 text-primary'>Forms</h2>
        <p className='text-body1 text-muted-foreground mb-8'>Input components for data entry and form handling.</p>
      </section>

      <FormElementsShowcase />

      <Separator />

      {/* Slider */}
      <section id='slider'>
        <h3 className='text-h4 mb-8'>Slider</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Range inputs • Horizontal and vertical orientations • Single and range values
        </p>

        <div className='grid md:grid-cols-2 gap-8'>
          {/* Horizontal Sliders */}
          <div className='space-y-8'>
            <p className='text-caption text-muted-foreground'>Horizontal (default)</p>
            <div className='space-y-4'>
              <Label>Price Range (dual handles)</Label>
              <Slider defaultValue={[100, 400]} max={500} step={10} />
              <div className='flex justify-between text-caption text-muted-foreground'>
                <span>$0</span>
                <span>$500</span>
              </div>
            </div>
            <div className='space-y-4'>
              <Label>Single Value</Label>
              <Slider defaultValue={[50]} max={100} step={1} />
            </div>
            <div className='space-y-4'>
              <Label>Disabled</Label>
              <Slider defaultValue={[30]} max={100} disabled />
            </div>
          </div>

          {/* Vertical Sliders */}
          <div className='space-y-4'>
            <p className='text-caption text-muted-foreground'>Vertical orientation</p>
            <div className='flex items-end gap-8 h-44'>
              <div className='text-center'>
                <Slider defaultValue={[70]} max={100} orientation='vertical' />
                <p className='text-caption text-muted-foreground mt-2'>Single</p>
              </div>
              <div className='text-center'>
                <Slider defaultValue={[30, 70]} max={100} orientation='vertical' />
                <p className='text-caption text-muted-foreground mt-2'>Range</p>
              </div>
              <div className='text-center'>
                <Slider defaultValue={[50]} max={100} orientation='vertical' disabled />
                <p className='text-caption text-muted-foreground mt-2'>Disabled</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Calendar */}
      <section id='calendar'>
        <h3 className='text-h4 mb-8'>Calendar</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Date picker • Selected date uses primary (Pitch Green) • Hover uses secondary (Day cream) • Today highlighted
        </p>

        <div className='flex flex-wrap gap-8'>
          <CalendarDemo />
        </div>
      </section>

      <Separator />

      <DateTimePickersShowcase />

      <Separator />

      <FormValidationShowcase form={form} onSubmit={onSubmit} />
    </>
  );
}
