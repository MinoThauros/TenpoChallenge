'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ToastShowcase() {
  return (
    <section id='toast'>
      <h3 className='text-h4 mb-8'>Toast</h3>

      <p className='text-caption text-muted-foreground mb-6'>
        Non-blocking notifications • Click buttons to trigger
      </p>

      <div className='flex flex-wrap gap-4'>
        <Button
          variant='secondary'
          onClick={() => toast('Registration saved', {
            description: 'Your progress has been saved automatically.',
          })}
        >
          Default Toast
        </Button>
        <Button
          variant='secondary'
          onClick={() => toast.success('Registration complete!', {
            description: 'You will receive a confirmation email shortly.',
          })}
        >
          Success Toast
        </Button>
        <Button
          variant='secondary'
          onClick={() => toast.error('Registration failed', {
            description: 'Please check your information and try again.',
          })}
        >
          Error Toast
        </Button>
        <Button
          variant='secondary'
          onClick={() => toast.warning('Session expiring', {
            description: 'Your session will expire in 5 minutes.',
          })}
        >
          Warning Toast
        </Button>
        <Button
          variant='secondary'
          onClick={() => toast.info('New camps available', {
            description: 'Check out our summer 2025 programs.',
          })}
        >
          Info Toast
        </Button>
        <Button
          variant='secondary'
          onClick={() => toast.promise(
            new Promise((resolve) => setTimeout(resolve, 2000)),
            {
              loading: 'Submitting registration...',
              success: 'Registration submitted!',
              error: 'Failed to submit',
            }
          )}
        >
          Promise Toast
        </Button>
      </div>
    </section>
  );
}
