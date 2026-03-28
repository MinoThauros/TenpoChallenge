'use client';

import { useState } from 'react';
import { type DateRange } from 'react-day-picker';
import { Label } from '@/components/ui/label';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { TimePicker, TimeRangePicker } from '@/components/ui/time-picker';

export function DateTimePickersShowcase() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [singleTime, setSingleTime] = useState<string>();
  const [startTime, setStartTime] = useState<string>();
  const [endTime, setEndTime] = useState<string>();

  return (
    <section id='date-time-pickers'>
      <h3 className='text-h4 mb-8'>Date & Time Pickers</h3>

      <p className='text-caption text-muted-foreground mb-6'>
        Specialized date and time selection components
      </p>

      <div className='grid md:grid-cols-2 gap-8'>
        {/* Date Range Picker */}
        <div className='space-y-4'>
          <p className='text-caption text-muted-foreground'>Date Range Picker</p>
          <div className='space-y-1.5'>
            <Label>Select Date Range</Label>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder='Pick a date range'
            />
          </div>
          <p className='text-caption text-muted-foreground'>
            {dateRange?.from && dateRange?.to
              ? `Selected: ${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
              : 'No range selected'}
          </p>
        </div>

        {/* Time Picker */}
        <div className='space-y-4'>
          <p className='text-caption text-muted-foreground'>Time Picker</p>
          <div className='space-y-1.5'>
            <Label>Select Time</Label>
            <TimePicker
              value={singleTime}
              onChange={setSingleTime}
              placeholder='Pick a time'
            />
          </div>
          <p className='text-caption text-muted-foreground'>
            {singleTime ? `Selected: ${singleTime}` : 'No time selected'}
          </p>
        </div>

        {/* Time Range Picker */}
        <div className='space-y-4 md:col-span-2'>
          <p className='text-caption text-muted-foreground'>Time Range Picker</p>
          <div className='space-y-1.5 max-w-md'>
            <Label>Session Hours</Label>
            <TimeRangePicker
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
            />
          </div>
          <p className='text-caption text-muted-foreground'>
            {startTime && endTime
              ? `Selected: ${startTime} - ${endTime}`
              : 'No time range selected'}
          </p>
        </div>
      </div>
    </section>
  );
}
