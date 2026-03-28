import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ToastShowcase } from '../subsections';

export function FeedbackSection() {
  return (
    <>
      <section id='feedback'>
        <h2 className='font-display text-h2 mb-8 text-primary'>Feedback</h2>
        <p className='text-body1 text-muted-foreground mb-8'>Components for user notifications and status messages.</p>
      </section>

      {/* Alerts */}
      <section id='alerts'>
        <h3 className='text-h4 mb-8'>Alerts</h3>

        <p className='text-caption text-muted-foreground mb-4'>
          Icon left • Title + Description (80% opacity) • No visible border
        </p>

        <div className='grid md:grid-cols-2 gap-4'>
          <Alert variant='warning'>
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>Only 3 spots remaining for this camp.</AlertDescription>
          </Alert>

          <Alert variant='success'>
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>Your registration has been confirmed.</AlertDescription>
          </Alert>

          <Alert variant='error'>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>Something went wrong. Please try again.</AlertDescription>
          </Alert>

          <Alert variant='info'>
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>Registration opens on Monday at 9am.</AlertDescription>
          </Alert>
        </div>
      </section>

      <Separator />

      <ToastShowcase />
    </>
  );
}
