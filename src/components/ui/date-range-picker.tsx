'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { type DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { formatDateRange } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  numberOfMonths?: number;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Select dates',
  disabled = false,
  className,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const displayValue = React.useMemo(() => {
    if (value?.from && value?.to) {
      return formatDateRange(value.from, value.to);
    }
    if (value?.from) {
      return `${value.from.toLocaleDateString()} – ...`;
    }
    return null;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
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
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='range'
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={numberOfMonths}
          disabled={{ before: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}
