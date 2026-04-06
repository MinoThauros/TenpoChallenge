'use client';

import { SearchInput } from '@/components/ui/search-input';

type CampaignSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CampaignSearch({ value, onChange }: CampaignSearchProps) {
  return (
    <SearchInput
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onClear={() => onChange('')}
      placeholder='Search by campaign name'
      className='max-w-md [&_[data-slot=input]]:bg-card'
    />
  );
}
