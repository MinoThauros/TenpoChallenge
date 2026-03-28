import { cn } from '@/lib/utils';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

export function WarningIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={cn('size-5', className)}
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      {...props}
    >
      <path
        d='M10 7V10.5M10 13.5V13M8.66 3.5L2.1 15A1.5 1.5 0 003.44 17.25H16.56A1.5 1.5 0 0017.9 15L11.34 3.5A1.5 1.5 0 008.66 3.5Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export function SuccessIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={cn('size-5', className)}
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      {...props}
    >
      <circle cx='10' cy='10' r='7.5' stroke='currentColor' strokeWidth='1.5' />
      <path
        d='M6.5 10L9 12.5L13.5 7.5'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

export function ErrorIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={cn('size-5', className)}
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      {...props}
    >
      <circle cx='10' cy='10' r='7.5' stroke='currentColor' strokeWidth='1.5' />
      <path
        d='M10 6.5V10.5M10 13.5V13'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}

export function InfoIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={cn('size-5', className)}
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      {...props}
    >
      <circle cx='10' cy='10' r='7.5' stroke='currentColor' strokeWidth='1.5' />
      <path
        d='M10 9V14M10 6.5V7'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}

export function LoadingIcon({ className, ...props }: IconProps) {
  return (
    <svg
      className={cn('size-5 animate-spin', className)}
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      {...props}
    >
      <circle
        cx='10'
        cy='10'
        r='7.5'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeOpacity='0.25'
      />
      <path
        d='M10 2.5A7.5 7.5 0 0117.5 10'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </svg>
  );
}
