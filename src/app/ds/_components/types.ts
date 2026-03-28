import type { UseFormReturn } from 'react-hook-form';
import type { FormValues } from './form-schema';

// Navigation types
export interface NavItem {
  id: string
  title: string
}

export interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

// Sidebar Nav
export interface SidebarNavProps {
  activeSection: string
  onNavigate?: () => void
}

// Color Swatch
export interface ColorSwatchProps {
  name: string
  className: string
  textClass: string
}

// Form Validation Section
export interface FormValidationShowcaseProps {
  form: UseFormReturn<FormValues>
  onSubmit: (values: FormValues) => void
}

// Forms Section (parent)
export interface FormsSectionProps {
  form: UseFormReturn<FormValues>
  onSubmit: (values: FormValues) => void
}
