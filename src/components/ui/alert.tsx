'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { WarningIcon, SuccessIcon, ErrorIcon, InfoIcon } from '@/components/icons';

const alertVariants = cva(
  'flex items-center gap-4 p-4 rounded-lg',
  {
    variants: {
      variant: {
        warning: 'bg-warning-muted',
        success: 'bg-success-muted',
        error: 'bg-error-muted',
        info: 'bg-info-muted',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
);

const alertIconVariants = cva('shrink-0', {
  variants: {
    variant: {
      warning: 'text-warning',
      success: 'text-success',
      error: 'text-error',
      info: 'text-info',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const alertTitleVariants = cva('font-medium', {
  variants: {
    variant: {
      warning: 'text-warning-foreground',
      success: 'text-success-foreground',
      error: 'text-error-foreground',
      info: 'text-info-foreground',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const alertDescriptionVariants = cva('text-sm', {
  variants: {
    variant: {
      warning: 'text-warning-foreground/80',
      success: 'text-success-foreground/80',
      error: 'text-error-foreground/80',
      info: 'text-info-foreground/80',
    },
  },
  defaultVariants: {
    variant: 'info',
  },
});

const icons = {
  warning: WarningIcon,
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

type AlertVariant = 'warning' | 'success' | 'error' | 'info'

const AlertContext = React.createContext<{ variant: AlertVariant }>({ variant: 'info' });

function Alert({
  className,
  variant = 'info',
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  const Icon = icons[variant as AlertVariant];

  return (
    <AlertContext.Provider value={{ variant: variant as AlertVariant }}>
      <div
        data-slot='alert'
        role='alert'
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className={cn(alertIconVariants({ variant }))} />
        <div>{children}</div>
      </div>
    </AlertContext.Provider>
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  const { variant } = React.useContext(AlertContext);

  return (
    <p
      data-slot='alert-title'
      className={cn(alertTitleVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  const { variant } = React.useContext(AlertContext);

  return (
    <p
      data-slot='alert-description'
      className={cn(alertDescriptionVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
