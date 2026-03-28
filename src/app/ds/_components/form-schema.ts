import * as z from 'zod';

export const formSchema = z.object({
  childName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  age: z.string().min(1, 'Please select an age group'),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms'),
});

export type FormValues = z.infer<typeof formSchema>
