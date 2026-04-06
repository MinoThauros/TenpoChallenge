'use client';

import { ArrowDownAZ } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type CampaignSortOrder = 'latest' | 'oldest';

type CampaignSortProps = {
  value: CampaignSortOrder;
  onChange: (value: CampaignSortOrder) => void;
};

export function CampaignSort({ value, onChange }: CampaignSortProps) {
  return (
    <div className='flex items-center gap-2'>
      <ArrowDownAZ className='size-4 text-muted-foreground' />
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as CampaignSortOrder)}>
        <SelectTrigger className='w-[180px] bg-card'>
          <SelectValue placeholder='Sort' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='latest'>Newest first</SelectItem>
          <SelectItem value='oldest'>Oldest first</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
