import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';

interface CardProps extends React.ComponentProps<'div'> {
  /** Apply interactive hover styles (lift, shadow intensification, border highlight) */
  interactive?: boolean;
  /** Render as child element (for Link, button, etc.) - defaults padding to 'none' to avoid conflicts */
  asChild?: boolean;
  /** Border radius size (default: 'md') */
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
  /** Padding and gap size (default: 'md', or 'none' when asChild is true) */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const roundedStyles = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
} as const;

const paddingStyles = {
  none: '',
  sm: 'flex flex-col gap-4 py-4',
  md: 'flex flex-col gap-6 py-6',
  lg: 'flex flex-col gap-8 py-8',
} as const;

function Card({ className, interactive, asChild, rounded = 'md', padding, ...props }: CardProps) {
  const Comp = asChild ? Slot : 'div';
  // Smart default: 'none' when asChild (polymorphic), 'md' otherwise
  const resolvedPadding = padding ?? (asChild ? 'none' : 'md');

  return (
    <Comp
      data-slot='card'
      className={cn(
        'border border-steel/20 bg-card shadow-sm shadow-black/5',
        roundedStyles[rounded],
        paddingStyles[resolvedPadding],
        interactive && 'card-hover',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-title'
      className={cn('text-h5 font-medium', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-description'
      className={cn('text-muted-foreground/80 text-sm', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-action'
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-content'
      className={cn('px-6', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-footer'
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
