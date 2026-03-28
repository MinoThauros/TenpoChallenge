'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PasswordInput } from '@/components/ui/password-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { SearchInput } from '@/components/ui/search-input';

export function FormElementsShowcase() {
  const [phoneValue, setPhoneValue] = useState<string | undefined>();
  const [searchValue, setSearchValue] = useState('');

  return (
    <section id='form-elements'>
      <h3 className='text-h4 mb-8'>Form Elements</h3>

      <div className='grid md:grid-cols-2 gap-8'>
        {/* Text Inputs */}
        <div className='space-y-4'>
          <p className='text-caption text-muted-foreground'>Text Inputs</p>
          <div className='space-y-1.5'>
            <Label htmlFor='input-demo'>Input</Label>
            <Input id='input-demo' placeholder='Enter your name...' />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='textarea-demo'>Textarea</Label>
            <Textarea id='textarea-demo' placeholder='Write a message...' />
          </div>
          <div className='space-y-1.5'>
            <Label>Disabled Input</Label>
            <Input disabled placeholder='Disabled' />
          </div>
        </div>

        {/* Specialized Inputs */}
        <div className='space-y-4'>
          <p className='text-caption text-muted-foreground'>Specialized Inputs</p>
          <div className='space-y-1.5'>
            <Label htmlFor='password-demo'>Password Input</Label>
            <PasswordInput id='password-demo' placeholder='Enter password...' />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='search-demo'>Search Input</Label>
            <SearchInput
              id='search-demo'
              placeholder='Search camps...'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <div className='space-y-1.5'>
            <Label>Phone Input</Label>
            <PhoneInput
              value={phoneValue}
              onChange={setPhoneValue}
              placeholder='Phone number'
            />
          </div>
        </div>

        {/* Select */}
        <div className='space-y-4'>
          <p className='text-caption text-muted-foreground'>Select / Dropdown</p>
          <div className='space-y-1.5'>
            <Label>Default size</Label>
            <Select>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Select a camp type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='day'>Day Camp</SelectItem>
                <SelectItem value='overnight'>Overnight Camp</SelectItem>
                <SelectItem value='weekend'>Weekend Camp</SelectItem>
                <SelectItem value='week'>Week-long Camp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <Label>Small size (size=&quot;sm&quot;)</Label>
            <Select defaultValue='8-10'>
              <SelectTrigger className='w-full' size='sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='5-7'>5-7 years</SelectItem>
                <SelectItem value='8-10'>8-10 years</SelectItem>
                <SelectItem value='11-13'>11-13 years</SelectItem>
                <SelectItem value='14+'>14+ years</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1.5'>
            <Label>Disabled</Label>
            <Select disabled>
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Disabled select' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='option'>Option</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Checkboxes */}
        <div className='space-y-4'>
          <p className='text-caption text-muted-foreground'>Checkboxes</p>
          <div className='space-y-3'>
            <div className='flex items-center gap-2'>
              <Checkbox id='terms' />
              <Label htmlFor='terms' className='font-normal'>Accept terms and conditions</Label>
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox id='newsletter' defaultChecked />
              <Label htmlFor='newsletter' className='font-normal'>Subscribe to newsletter</Label>
            </div>
            <div className='flex items-center gap-2'>
              <Checkbox id='disabled-check' disabled />
              <Label htmlFor='disabled-check' className='font-normal'>Disabled checkbox</Label>
            </div>
          </div>
        </div>

        {/* Radio Buttons */}
        <div className='space-y-4'>
          <p className='text-caption text-muted-foreground'>Radio Buttons</p>
          <RadioGroup defaultValue='option-1'>
            <div className='flex items-center gap-2'>
              <RadioGroupItem value='option-1' id='option-1' />
              <Label htmlFor='option-1' className='font-normal'>Morning session (9am-12pm)</Label>
            </div>
            <div className='flex items-center gap-2'>
              <RadioGroupItem value='option-2' id='option-2' />
              <Label htmlFor='option-2' className='font-normal'>Afternoon session (1pm-4pm)</Label>
            </div>
            <div className='flex items-center gap-2'>
              <RadioGroupItem value='option-3' id='option-3' />
              <Label htmlFor='option-3' className='font-normal'>Full day (9am-4pm)</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Switches */}
        <div className='space-y-4'>
          <p className='text-caption text-muted-foreground'>Switches</p>
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <Switch id='notifications' />
              <Label htmlFor='notifications' className='font-normal'>Email notifications</Label>
            </div>
            <div className='flex items-center gap-3'>
              <Switch id='marketing' defaultChecked />
              <Label htmlFor='marketing' className='font-normal'>Marketing emails</Label>
            </div>
            <div className='flex items-center gap-3'>
              <Switch id='disabled-switch' disabled />
              <Label htmlFor='disabled-switch' className='font-normal'>Disabled switch</Label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
