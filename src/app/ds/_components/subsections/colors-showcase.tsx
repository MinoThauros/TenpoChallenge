import { ColorSwatch } from '../color-swatch';

export function ColorsShowcase() {
  return (
    <section id='colors'>
      <h3 className='text-h4 mb-8'>Colors</h3>

      {/* Core */}
      <div className='mb-8'>
        <p className='text-subtitle2 font-medium mb-2'>Core — Page structure</p>
        <p className='text-caption text-muted-foreground mb-4'>Base colors for layouts and surfaces</p>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <ColorSwatch name='background' className='bg-background border' textClass='text-foreground' />
          <ColorSwatch name='foreground' className='bg-foreground' textClass='text-background' />
          <ColorSwatch name='card' className='bg-card border' textClass='text-card-foreground' />
          <ColorSwatch name='muted' className='bg-muted' textClass='text-muted-foreground' />
        </div>
      </div>

      {/* Actions */}
      <div className='mb-8'>
        <p className='text-subtitle2 font-medium mb-2'>Actions — Buttons & interactive</p>
        <p className='text-caption text-muted-foreground mb-4'>Primary for main CTA, Secondary/Tertiary for supporting actions</p>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <ColorSwatch name='primary' className='bg-primary' textClass='text-primary-foreground' />
          <ColorSwatch name='secondary' className='bg-secondary' textClass='text-secondary-foreground' />
          <ColorSwatch name='tertiary' className='bg-tertiary' textClass='text-tertiary-foreground' />
          <ColorSwatch name='destructive' className='bg-destructive' textClass='text-destructive-foreground' />
        </div>
      </div>

      {/* Accents */}
      <div className='mb-8'>
        <p className='text-subtitle2 font-medium mb-2'>Accents — Highlights & emphasis</p>
        <p className='text-caption text-muted-foreground mb-4'>Bold colors for emphasis, tags, badges, or decorative elements</p>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <ColorSwatch name='accent' className='bg-accent' textClass='text-accent-foreground' />
          <ColorSwatch name='accent-2' className='bg-accent-2' textClass='text-accent-2-foreground' />
        </div>
      </div>

      {/* Status */}
      <div className='mb-8'>
        <p className='text-subtitle2 font-medium mb-2'>Status — Feedback & alerts</p>
        <p className='text-caption text-muted-foreground mb-4'>Icons use main color, backgrounds use muted variant</p>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <ColorSwatch name='success' className='bg-success' textClass='text-white' />
          <ColorSwatch name='success-muted' className='bg-success-muted' textClass='text-success-foreground' />
          <ColorSwatch name='warning' className='bg-warning' textClass='text-white' />
          <ColorSwatch name='warning-muted' className='bg-warning-muted' textClass='text-warning-foreground' />
          <ColorSwatch name='error' className='bg-error' textClass='text-white' />
          <ColorSwatch name='error-muted' className='bg-error-muted' textClass='text-error-foreground' />
          <ColorSwatch name='info' className='bg-info' textClass='text-white' />
          <ColorSwatch name='info-muted' className='bg-info-muted' textClass='text-info-foreground' />
        </div>
      </div>

      {/* Brand Aliases */}
      <div>
        <p className='text-subtitle2 font-medium mb-2'>Brand Aliases — Raw palette</p>
        <p className='text-caption text-muted-foreground mb-4'>Direct brand colors (prefer semantic tokens above)</p>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <ColorSwatch name='pitch-green' className='bg-pitch-green' textClass='text-white' />
          <ColorSwatch name='obsidian' className='bg-obsidian' textClass='text-white' />
          <ColorSwatch name='chalk' className='bg-chalk' textClass='text-obsidian' />
          <ColorSwatch name='sand' className='bg-sand' textClass='text-white' />
          <ColorSwatch name='wet-sand' className='bg-wet-sand' textClass='text-white' />
          <ColorSwatch name='steel' className='bg-steel' textClass='text-obsidian' />
          <ColorSwatch name='mist' className='bg-mist' textClass='text-obsidian' />
          <ColorSwatch name='vapor' className='bg-vapor' textClass='text-obsidian' />
          <ColorSwatch name='cloud' className='bg-cloud' textClass='text-obsidian' />
          <ColorSwatch name='day' className='bg-day' textClass='text-obsidian' />
          <ColorSwatch name='midnight' className='bg-midnight' textClass='text-white' />
          <ColorSwatch name='carbon' className='bg-carbon' textClass='text-white' />
        </div>
      </div>
    </section>
  );
}
