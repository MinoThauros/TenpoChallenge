'use client';

import { CalendarDays } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type CampaignDateFilterValue = 'all' | 'last-7-days' | 'last-30-days' | 'this-year';

type CampaignDateFilterProps = {
  value: CampaignDateFilterValue;
  onChange: (value: CampaignDateFilterValue) => void;
};

export function CampaignDateFilter({ value, onChange }: CampaignDateFilterProps) {
  return (
    <div className='flex items-center gap-2'>
      <CalendarDays className='size-4 text-muted-foreground' />
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as CampaignDateFilterValue)}>
        <SelectTrigger className='w-[170px] bg-card'>
          <SelectValue placeholder='When' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>Any time</SelectItem>
          <SelectItem value='last-7-days'>Last 7 days</SelectItem>
          <SelectItem value='last-30-days'>Last 30 days</SelectItem>
          <SelectItem value='this-year'>This year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
