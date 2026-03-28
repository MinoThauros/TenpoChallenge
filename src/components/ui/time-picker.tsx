'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import { generateTimeOptions, formatTimeValue } from '@/lib/date';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Minimum time (inclusive) - times before this will be disabled */
  minTime?: string;
  /** Interval between time options in minutes (default 30) */
  interval?: number;
}

const timeOptions = generateTimeOptions(30, 6, 22);

export function TimePicker({
  value,
  onChange,
  placeholder = 'Select time',
  disabled = false,
  className,
  minTime,
  interval = 30,
}: TimePickerProps) {
  // Generate options based on interval if different from default
  const options = React.useMemo(() => {
    if (interval !== 30) {
      return generateTimeOptions(interval, 6, 22);
    }
    return timeOptions;
  }, [interval]);

  // Filter options based on minTime
  const filteredOptions = React.useMemo(() => {
    if (!minTime) return options;

    const [minHour, minMinute] = minTime.split(':').map(Number);
    const minTotalMinutes = minHour * 60 + minMinute;

    return options.filter((option) => {
      const [hour, minute] = option.value.split(':').map(Number);
      const totalMinutes = hour * 60 + minute;
      return totalMinutes > minTotalMinutes;
    });
  }, [options, minTime]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)}>
        <div className='flex items-center gap-2'>
          <Clock className='size-4 text-muted-foreground' strokeWidth={1.5} />
          <SelectValue placeholder={placeholder}>
            {value ? formatTimeValue(value) : placeholder}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {filteredOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface TimeRangePickerProps {
  startTime?: string;
  endTime?: string;
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
  className,
}: TimeRangePickerProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <TimePicker
        value={startTime}
        onChange={onStartTimeChange}
        placeholder='Start'
        disabled={disabled}
      />
      <span className='text-muted-foreground'>→</span>
      <TimePicker
        value={endTime}
        onChange={onEndTimeChange}
        placeholder='End'
        disabled={disabled}
        minTime={startTime}
      />
    </div>
  );
}
