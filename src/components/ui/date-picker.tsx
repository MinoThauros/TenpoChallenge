'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import type { Matcher } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Custom display formatter. Defaults to "MMM d, yyyy" (e.g. "Mar 19, 2026"). */
  formatDisplay?: (date: Date) => string;
  /** Dates to disable in the calendar. Passed directly to react-day-picker's `disabled` prop. */
  disabledDates?: Matcher | Matcher[];
  /** Month to show when the calendar opens and no value is set. */
  defaultMonth?: Date;
  /** Caption layout for the calendar. Use 'dropdown' for year/month selectors. */
  captionLayout?: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
  /** Earliest selectable year (used with captionLayout='dropdown'). */
  fromYear?: number;
  /** Latest selectable year (used with captionLayout='dropdown'). */
  toYear?: number;
  /** Additional className for the popover content (e.g. z-index overrides in modals). */
  popoverContentClassName?: string;
}

const defaultFormat = (date: Date) => formatDate(date, 'MMM d, yyyy');

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  className,
  formatDisplay = defaultFormat,
  disabledDates,
  defaultMonth,
  captionLayout,
  fromYear,
  toYear,
  popoverContentClassName,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const displayValue = value ? formatDisplay(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          disabled={disabled}
          className={cn(
            'w-full justify-start border border-input bg-transparent text-left font-normal shadow-xs hover:bg-transparent',
            !displayValue && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className='size-4 text-muted-foreground' strokeWidth={1.5} />
          {displayValue || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-auto p-0', popoverContentClassName)} align='start'>
        <Calendar
          mode='single'
          defaultMonth={value ?? defaultMonth}
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
          disabled={disabledDates}
          captionLayout={captionLayout}
          fromYear={fromYear}
          toYear={toYear}
        />
      </PopoverContent>
    </Popover>
  );
}
