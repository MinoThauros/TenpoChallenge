import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function DialogsShowcase() {
  return (
    <section id='dialogs'>
      <h3 className='text-h4 mb-8'>Dialogs</h3>

      <p className='text-caption text-muted-foreground mb-6'>
        Cancel + Continue button patterns • Click to open
      </p>

      <div className='flex flex-wrap gap-4'>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Registration</DialogTitle>
              <DialogDescription>
                You are about to register for Soccer Skills Camp. This will reserve your spot and send a confirmation email.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant='secondary'>Cancel</Button>
              <Button>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant='secondary'>Dialog with Form</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='space-y-1.5'>
                <Label htmlFor='name'>Name</Label>
                <Input id='name' defaultValue='John Doe' />
              </div>
              <div className='space-y-1.5'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' defaultValue='john@example.com' />
              </div>
            </div>
            <DialogFooter>
              <Button variant='secondary'>Cancel</Button>
              <Button>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
