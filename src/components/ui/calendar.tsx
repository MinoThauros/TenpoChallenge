'use client';

import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { DayPicker, type DropdownProps } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function CalendarDropdown({ options, value, onChange, 'aria-label': ariaLabel }: DropdownProps) {
  const selected = options?.find((o) => o.value === value);

  return (
    <Select
      value={String(value)}
      onValueChange={(val) => {
        const syntheticEvent = {
          target: { value: val },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange?.(syntheticEvent);
      }}
    >
      <SelectTrigger
        className='h-8 gap-1 border-input text-sm font-medium focus:ring-0 focus:ring-offset-0'
        aria-label={ariaLabel}
      >
        <SelectValue>{selected?.label}</SelectValue>
      </SelectTrigger>
      <SelectContent className='z-[70] max-h-60'>
        {options?.map((option) => (
          <SelectItem
            key={option.value}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-4', className)}
      classNames={{
        months: 'relative flex flex-col sm:flex-row gap-4',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center h-10',
        caption_label: 'text-sm font-medium text-foreground',
        dropdowns: 'flex items-center gap-2',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'absolute left-2 top-1 z-10 rounded-sm'
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'absolute right-2 top-1 z-10 rounded-sm'
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-muted-foreground w-9 font-medium text-xs text-center',
        week: 'flex w-full mt-1',
        day: 'p-0.5 text-center',
        day_button: cn(
          // Base
          'inline-flex items-center justify-center h-9 w-9 rounded-sm text-sm font-normal',
          'transition-colors cursor-pointer',
          // Hover - uses secondary (Day cream) per DS
          'hover:bg-secondary hover:text-secondary-foreground',
          // Focus - uses ring (orange) per DS
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        ),
        range_start: '[&>button]:rounded-l-sm [&>button]:rounded-r-none',
        range_end: '[&>button]:rounded-r-sm [&>button]:rounded-l-none',
        range_middle: '[&>button]:bg-primary/20 [&>button]:text-foreground [&>button]:rounded-none',
        // Selected - primary green background
        selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:opacity-90',
        // Today - ring indicator (doesn't conflict with selected since selected overrides button bg)
        today: '[&>button]:ring-1 [&>button]:ring-primary/50',
        outside: 'text-muted-foreground/40',
        disabled: 'text-muted-foreground/30 pointer-events-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeftIcon : ChevronRightIcon;
          return <Icon className='size-4' />;
        },
        Dropdown: CalendarDropdown,
      }}
      {...props}
    />
  );
}

Calendar.displayName = 'Calendar';

export { Calendar };
