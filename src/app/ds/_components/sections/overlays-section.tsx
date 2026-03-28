import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, MoreHorizontal, Info } from 'lucide-react';
import { DialogsShowcase, SheetShowcase } from '../subsections';

export function OverlaysSection() {
  return (
    <>
      <section id='overlays'>
        <h2 className='font-display text-h2 mb-8 text-primary'>Overlays</h2>
        <p className='text-body1 text-muted-foreground mb-8'>Modal dialogs, sheets, and popup components.</p>
      </section>

      <DialogsShowcase />

      <Separator />

      {/* Alert Dialog */}
      <section id='alert-dialog'>
        <h3 className='text-h4 mb-8'>Alert Dialog</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Confirmation dialogs for destructive actions
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='destructive'>Cancel Registration</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove your child from Soccer Skills Camp. Your spot will be released and you&apos;ll receive a full refund within 5-7 business days.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Registration</AlertDialogCancel>
              <AlertDialogAction>Yes, Cancel</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <Separator />

      <SheetShowcase />

      <Separator />

      {/* Dropdown Menu */}
      <section id='dropdown-menu'>
        <h3 className='text-h4 mb-8'>Dropdown Menu</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Menu items support default and destructive variants
        </p>

        <div className='flex flex-wrap gap-4'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='secondary'>
                Open Menu <ChevronDown className='ml-2 size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant='destructive'>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </section>

      <Separator />

      {/* Tooltip */}
      <section id='tooltip'>
        <h3 className='text-h4 mb-8'>Tooltip</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Side positions: top (default), right, bottom, left
        </p>

        <div className='flex flex-wrap items-center gap-4'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='secondary'>Top (default)</Button>
            </TooltipTrigger>
            <TooltipContent side='top'>
              Tooltip on top
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='secondary'>Right</Button>
            </TooltipTrigger>
            <TooltipContent side='right'>
              Tooltip on right
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='secondary'>Bottom</Button>
            </TooltipTrigger>
            <TooltipContent side='bottom'>
              Tooltip on bottom
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='secondary'>Left</Button>
            </TooltipTrigger>
            <TooltipContent side='left'>
              Tooltip on left
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon'>
                <Info className='size-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              More information here
            </TooltipContent>
          </Tooltip>
        </div>
      </section>

      <Separator />

      {/* Popover */}
      <section id='popover'>
        <h3 className='text-h4 mb-8'>Popover</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Side positions and alignment options
        </p>

        <div className='space-y-6'>
          <div>
            <p className='text-caption text-muted-foreground mb-4'>Side positions</p>
            <div className='flex flex-wrap gap-4'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='secondary'>Bottom (default)</Button>
                </PopoverTrigger>
                <PopoverContent side='bottom'>
                  <p className='text-sm'>Popover on bottom</p>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='secondary'>Top</Button>
                </PopoverTrigger>
                <PopoverContent side='top'>
                  <p className='text-sm'>Popover on top</p>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='secondary'>Right</Button>
                </PopoverTrigger>
                <PopoverContent side='right'>
                  <p className='text-sm'>Popover on right</p>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='secondary'>Left</Button>
                </PopoverTrigger>
                <PopoverContent side='left'>
                  <p className='text-sm'>Popover on left</p>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <p className='text-caption text-muted-foreground mb-4'>Alignment options</p>
            <div className='flex flex-wrap gap-4'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='tertiary'>align=&quot;start&quot;</Button>
                </PopoverTrigger>
                <PopoverContent align='start'>
                  <p className='text-sm'>Aligned to start</p>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='tertiary'>align=&quot;center&quot;</Button>
                </PopoverTrigger>
                <PopoverContent align='center'>
                  <p className='text-sm'>Aligned to center</p>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='tertiary'>align=&quot;end&quot;</Button>
                </PopoverTrigger>
                <PopoverContent align='end'>
                  <p className='text-sm'>Aligned to end</p>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <p className='text-caption text-muted-foreground mb-4'>With content</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button>Camp Details</Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className='space-y-2'>
                  <h4 className='font-medium'>Soccer Skills Camp</h4>
                  <p className='text-sm text-muted-foreground/80'>
                    Runs Monday through Friday, 9am-4pm. Lunch is provided.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </section>
    </>
  );
}
