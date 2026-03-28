import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { FormValidationShowcaseProps } from '../types';

export function FormValidationShowcase({ form, onSubmit }: FormValidationShowcaseProps) {
  return (
    <section id='form-validation'>
      <h3 className='text-h4 mb-8'>Form with Validation</h3>

      <p className='text-caption text-muted-foreground mb-6'>
        React Hook Form + Zod validation • Try submitting empty
      </p>

      <div className='max-w-md'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='childName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Child&apos;s Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter child's name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name that will appear on their camp badge.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Email</FormLabel>
                  <FormControl>
                    <Input placeholder='parent@example.com' {...field} />
                  </FormControl>
                  <FormDescription>
                    We&apos;ll send confirmation and updates here.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='age'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age Group</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Select age group' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='5-7'>5-7 years</SelectItem>
                      <SelectItem value='8-10'>8-10 years</SelectItem>
                      <SelectItem value='11-13'>11-13 years</SelectItem>
                      <SelectItem value='14+'>14+ years</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='terms'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>
                      Accept terms and conditions
                    </FormLabel>
                    <FormDescription>
                      You agree to our Terms of Service and Privacy Policy.
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <Button type='submit'>Register</Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
