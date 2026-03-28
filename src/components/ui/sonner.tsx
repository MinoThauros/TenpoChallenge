'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { SuccessIcon, ErrorIcon, WarningIcon, InfoIcon, LoadingIcon } from '@/components/icons';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme='light'
      position='bottom-right'
      duration={4000}
      icons={{
        success: <SuccessIcon />,
        error: <ErrorIcon />,
        warning: <WarningIcon />,
        info: <InfoIcon />,
        loading: <LoadingIcon />,
      }}
      toastOptions={{
        classNames: {
          toast: '!gap-4 !p-4 !rounded-lg !shadow-lg !border-0 !bg-card !text-card-foreground',
          title: '!font-medium',
          description: '!text-sm !opacity-80',
          icon: '!m-0 !shrink-0',
          success: '!bg-success-muted !text-success-foreground [&_[data-icon]]:!text-success',
          error: '!bg-error-muted !text-error-foreground [&_[data-icon]]:!text-error',
          warning: '!bg-warning-muted !text-warning-foreground [&_[data-icon]]:!text-warning',
          info: '!bg-info-muted !text-info-foreground [&_[data-icon]]:!text-info',
          loading: '!bg-muted !text-muted-foreground [&_[data-icon]]:!text-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
