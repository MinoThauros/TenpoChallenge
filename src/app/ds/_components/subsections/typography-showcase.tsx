interface TypeStyleProps {
  label: string
  className: string
  size: string
  weight: string
  lineHeight: string
  letterSpacing?: string
  example: string
}

function TypeStyle({ label: _label, className, size, weight, lineHeight, letterSpacing, example }: TypeStyleProps) {
  return (
    <div className='space-y-2 pb-6 border-b border-border last:border-0'>
      <div className='flex items-baseline justify-between gap-4 flex-wrap'>
        <code className='text-caption text-primary bg-muted px-2 py-0.5 rounded'>{className}</code>
        <div className='flex items-center gap-4 text-caption text-muted-foreground'>
          <span>{size}</span>
          <span>•</span>
          <span>{weight}</span>
          <span>•</span>
          <span>LH {lineHeight}</span>
          {letterSpacing && (
            <>
              <span>•</span>
              <span>LS {letterSpacing}</span>
            </>
          )}
        </div>
      </div>
      <p className={className}>{example}</p>
    </div>
  );
}

export function TypographyShowcase() {
  return (
    <section id='typography'>
      <h3 className='text-h4 mb-8'>Typography</h3>

      <div className='space-y-8'>
        {/* Display Font - Seriously Nostalgic */}
        <div>
          <div className='mb-4 pb-3 border-b border-border'>
            <p className='text-subtitle1 font-medium text-foreground'>Display Font (Seriously Nostalgic)</p>
            <p className='text-caption text-muted-foreground mt-1'>Use two classes: <code className='bg-muted px-1.5 py-0.5 rounded'>font-display</code> + size class</p>
          </div>
          <div className='space-y-6'>
            <TypeStyle
              label='Display H1'
              className='font-display text-h1'
              size='96px'
              weight='400'
              lineHeight='1.1'
              example='Welcome to Tenpo'
            />
            <TypeStyle
              label='Display H2'
              className='font-display text-h2'
              size='60px'
              weight='400'
              lineHeight='1.1'
              example='Build Amazing Experiences'
            />
          </div>
        </div>

        {/* Primary Font - Host Grotesk */}
        <div>
          <div className='mb-4 pb-8 border-b border-border'>
            <p className='text-subtitle1 font-medium text-foreground'>Primary Font (Host Grotesk)</p>
            <p className='text-caption text-muted-foreground mt-1'>Use single class for each style</p>
          </div>
          
          {/* Headings */}
          <div className='space-y-6 mb-8'>
            <p className='text-overline text-muted-foreground mt-8'>Headings</p>
            <TypeStyle
              label='H1'
              className='text-h1'
              size='96px'
              weight='400'
              lineHeight='1.1'
              example='Large Heading'
            />
            <TypeStyle
              label='H2'
              className='text-h2'
              size='60px'
              weight='400'
              lineHeight='1.1'
              example='Medium Heading'
            />
            <TypeStyle
              label='H3'
              className='text-h3'
              size='48px'
              weight='400'
              lineHeight='1.2'
              example='Section Heading'
            />
            <TypeStyle
              label='H4'
              className='text-h4'
              size='34px'
              weight='400'
              lineHeight='1.2'
              example='Subsection Heading'
            />
            <TypeStyle
              label='H5'
              className='text-h5'
              size='24px'
              weight='400'
              lineHeight='1.3'
              example='Small Heading'
            />
            <TypeStyle
              label='H6'
              className='text-h6'
              size='20px'
              weight='500'
              lineHeight='1.6'
              letterSpacing='0.15px'
              example='Smallest Heading'
            />
          </div>

          {/* Subtitles */}
          <div className='space-y-6 mb-8'>
            <p className='text-overline text-muted-foreground'>Subtitles</p>
            <TypeStyle
              label='Subtitle 1'
              className='text-subtitle1'
              size='16px'
              weight='400'
              lineHeight='1.5'
              example='Section label or description'
            />
            <TypeStyle
              label='Subtitle 2'
              className='text-subtitle2'
              size='14px'
              weight='400'
              lineHeight='1.5'
              example='Smaller section label'
            />
          </div>

          {/* Body */}
          <div className='space-y-6 mb-8'>
            <p className='text-overline text-muted-foreground'>Body</p>
            <TypeStyle
              label='Body 1'
              className='text-body1'
              size='16px'
              weight='400'
              lineHeight='1.5'
              example='Regular body text for paragraphs and content. This is the default text style for longer reading.'
            />
            <TypeStyle
              label='Body 2'
              className='text-body2'
              size='14px'
              weight='400'
              lineHeight='1.43'
              letterSpacing='0.17px'
              example='Secondary body text for smaller content areas and supporting information.'
            />
          </div>

          {/* Small Text */}
          <div className='space-y-6'>
            <p className='text-overline text-muted-foreground'>Small Text</p>
            <TypeStyle
              label='Caption'
              className='text-caption'
              size='12px'
              weight='400'
              lineHeight='1.66'
              letterSpacing='0.4px'
              example='Helper text, labels, and metadata'
            />
            <TypeStyle
              label='Overline'
              className='text-overline'
              size='12px'
              weight='400'
              lineHeight='1.0'
              letterSpacing='3px'
              example='Section label (uppercase)'
            />
          </div>
        </div>
      </div>
    </section>
  );
}
