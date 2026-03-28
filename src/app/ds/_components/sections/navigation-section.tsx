import { Separator } from '@/components/ui/separator';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command';

export function NavigationSection() {
  return (
    <>
      <section id='navigation'>
        <h2 className='font-display text-h2 mb-8 text-primary'>Navigation</h2>
        <p className='text-body1 text-muted-foreground mb-8'>Components for navigating through content and pages.</p>
      </section>

      {/* Pagination */}
      <section id='pagination'>
        <h3 className='text-h4 mb-8'>Pagination</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Navigate through paginated content • Active page uses primary color
        </p>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href='#' />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href='#'>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href='#' isActive>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href='#'>3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href='#'>10</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href='#' />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </section>

      <Separator />

      {/* Breadcrumb */}
      <section id='breadcrumb'>
        <h3 className='text-h4 mb-8'>Breadcrumb</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Navigation hierarchy • Current page is not clickable
        </p>

        <div className='space-y-4'>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='#'>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='#'>Camps</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Soccer Skills</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='#'>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='#'>Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href='#'>Profile</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </section>

      <Separator />

      {/* Command */}
      <section id='command'>
        <h3 className='text-h4 mb-8'>Command</h3>

        <p className='text-caption text-muted-foreground mb-6'>
          Command palette for quick actions • Press ⌘K to open (demo below)
        </p>

        <div className='max-w-md'>
          <Command className='rounded-lg border shadow-sm'>
            <CommandInput placeholder='Search camps, sports, locations...' />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading='Suggested'>
                <CommandItem>
                  <span>Soccer Skills Camp</span>
                  <CommandShortcut>Ages 8-10</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <span>Basketball Basics</span>
                  <CommandShortcut>Ages 11-13</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <span>Multi-Sport Adventure</span>
                  <CommandShortcut>Ages 5-7</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading='Quick Actions'>
                <CommandItem>
                  <span>Register for Camp</span>
                </CommandItem>
                <CommandItem>
                  <span>View Schedule</span>
                </CommandItem>
                <CommandItem>
                  <span>Contact Support</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </section>
    </>
  );
}
