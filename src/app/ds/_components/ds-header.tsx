import Image from 'next/image';

export function DSHeader() {
  return (
    <header>
      <Image
        src='/images/logo/wordmark/wordmark-pitch-green.svg'
        alt='Tenpo'
        width={200}
        height={70}
        className='mb-2'
      />
      <p className='text-h5 text-muted-foreground mt-2'>Design System Demo</p>
    </header>
  );
}
