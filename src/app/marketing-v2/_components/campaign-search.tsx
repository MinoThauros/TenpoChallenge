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
      placeholder='Search campaigns by name'
      className='max-w-md'
    />
  );
}
