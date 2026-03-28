'use client';

import PhoneInputBase from 'react-phone-number-input';
import type { Country, Value } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PhoneInputProps {
  value?: Value | string;
  onChange: (value: Value | undefined) => void;
  defaultCountry?: Country;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface CountrySelectProps {
  value?: Country;
  onChange: (value: Country) => void;
  options: Array<{ value?: Country; label: string; divider?: boolean }>;
  disabled?: boolean;
}

function CountrySelect({
  value,
  onChange,
  options,
  disabled,
}: CountrySelectProps) {
  const selectedOption = options.find((opt) => opt.value === value);
  const Flag = value ? flags[value] : null;

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as Country)}
      disabled={disabled}
    >
      <SelectTrigger className='h-full border-0 shadow-none rounded-none rounded-l-sm pl-3 pr-1 focus-visible:ring-0 focus-visible:border-0 gap-1'>
        <SelectValue>
          {Flag && (
            <span className='size-4 overflow-hidden'>
              <Flag title={selectedOption?.label ?? ''} />
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className='max-h-[300px]'>
        {options
          .filter((opt) => !opt.divider && opt.value)
          .map((opt) => {
            const CountryFlag = opt.value ? flags[opt.value] : null;
            return (
              <SelectItem key={opt.value} value={opt.value!}>
                <span className='flex items-center gap-2'>
                  {CountryFlag && (
                    <span className='size-4 overflow-hidden'>
                      <CountryFlag title={opt.label} />
                    </span>
                  )}
                  <span>{opt.label}</span>
                </span>
              </SelectItem>
            );
          })}
      </SelectContent>
    </Select>
  );
}

function PhoneInput({
  value,
  onChange,
  defaultCountry = 'US',
  placeholder = 'Phone number',
  disabled,
  className,
}: PhoneInputProps) {
  return (
    <PhoneInputBase
      international
      countryCallingCodeEditable={false}
      defaultCountry={defaultCountry}
      value={value as Value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      countrySelectComponent={CountrySelect}
      className={cn(
        'phone-input-wrapper flex h-9 w-full rounded-sm border border-input bg-transparent text-base shadow-xs md:text-sm',
        'focus-within:border-primary focus-within:ring-primary/20 focus-within:ring-[3px]',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className
      )}
      numberInputProps={{
        className: cn(
          'flex-1 bg-transparent px-3 py-1 outline-none placeholder:text-muted-foreground'
        ),
      }}
    />
  );
}

export { PhoneInput };
export type { PhoneInputProps };
