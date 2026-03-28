'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';

export function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(undefined);

  // Format date consistently to avoid hydration mismatch
  const formatDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className='space-y-4'>
      <div>
        <p className='text-caption text-muted-foreground mb-4'>Click a date to select</p>
        <Calendar
          mode='single'
          selected={date}
          onSelect={setDate}
          className='rounded-lg border bg-card'
        />
      </div>
      {date && (
        <p className='text-body2 text-muted-foreground'>
          Selected: <span className='text-foreground font-medium'>{formatDate(date)}</span>
        </p>
      )}
    </div>
  );
}
