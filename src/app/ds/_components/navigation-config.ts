import type { NavSection } from './types';

export const navigation: NavSection[] = [
  {
    id: 'basic',
    title: 'Basic',
    items: [
      { id: 'typography', title: 'Typography' },
      { id: 'colors', title: 'Colors' },
    ],
  },
  {
    id: 'styling',
    title: 'Styling',
    items: [
      { id: 'border-radius', title: 'Border Radius' },
      { id: 'spacing', title: 'Spacing Scale' },
      { id: 'separator', title: 'Separator' },
    ],
  },
  {
    id: 'actions',
    title: 'Actions',
    items: [
      { id: 'buttons', title: 'Buttons' },
      { id: 'badges', title: 'Badges' },
    ],
  },
  {
    id: 'forms',
    title: 'Forms',
    items: [
      { id: 'form-elements', title: 'Form Elements' },
      { id: 'slider', title: 'Slider' },
      { id: 'calendar', title: 'Calendar' },
      { id: 'date-time-pickers', title: 'Date & Time Pickers' },
      { id: 'form-validation', title: 'Form Validation' },
    ],
  },
  {
    id: 'data-display',
    title: 'Data Display',
    items: [
      { id: 'cards', title: 'Cards' },
      { id: 'table', title: 'Table' },
      { id: 'tabs', title: 'Tabs' },
      { id: 'accordion', title: 'Accordion' },
      { id: 'avatars', title: 'Avatars' },
      { id: 'progress', title: 'Progress' },
      { id: 'skeleton', title: 'Skeleton' },
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    items: [
      { id: 'pagination', title: 'Pagination' },
      { id: 'breadcrumb', title: 'Breadcrumb' },
      { id: 'command', title: 'Command' },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    items: [
      { id: 'alerts', title: 'Alerts' },
      { id: 'toast', title: 'Toast' },
    ],
  },
  {
    id: 'overlays',
    title: 'Overlays',
    items: [
      { id: 'dialogs', title: 'Dialogs' },
      { id: 'alert-dialog', title: 'Alert Dialog' },
      { id: 'sheet', title: 'Sheet' },
      { id: 'dropdown-menu', title: 'Dropdown Menu' },
      { id: 'tooltip', title: 'Tooltip' },
      { id: 'popover', title: 'Popover' },
    ],
  },
];

// Get all section IDs for scroll tracking
export const allSectionIds = navigation.flatMap(section => [
  section.id,
  ...section.items.map(item => item.id),
]);
