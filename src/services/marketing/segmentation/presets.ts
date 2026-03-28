import type {
  ContactEventSegmentFilters,
  ContactSegmentFilters,
  SegmentPreset,
} from "../types";

export const CONTACT_SEGMENT_PRESETS: SegmentPreset<ContactSegmentFilters>[] = [
  {
    id: "all-marketable-contacts",
    label: "All marketable contacts",
    description: "Every contact that is currently eligible to receive marketing email.",
    filters: {
      isSuppressed: false,
    },
  },
  {
    id: "imported-contacts",
    label: "Imported contacts",
    description: "Contacts brought in from an external mailing list or CSV import.",
    filters: {
      createdVia: ["import"],
      isSuppressed: false,
    },
  },
  {
    id: "paid-families",
    label: "Paid families",
    description: "Contacts linked to at least one athlete with a successful transaction.",
    filters: {
      paidEver: true,
      isSuppressed: false,
    },
  },
  {
    id: "registered-never-paid",
    label: "Registered but never paid",
    description: "Contacts linked to families that showed intent but have not converted yet.",
    filters: {
      registeredButNeverPaid: true,
      isSuppressed: false,
    },
  },
  {
    id: "lapsed-families",
    label: "Lapsed families",
    description: "Contacts with prior registration history but no recent registration activity.",
    filters: {
      inactiveForDays: 180,
      isSuppressed: false,
    },
  },
];

export const CONTACT_EVENT_SEGMENT_PRESETS: SegmentPreset<ContactEventSegmentFilters>[] =
  [
    {
      id: "event-attendees",
      label: "Event attendees",
      description: "Contacts tied to athletes who attended the selected event.",
      filters: {
        attendedOnly: true,
        isSuppressed: false,
      },
    },
    {
      id: "event-waitlist",
      label: "Event waitlist",
      description: "Contacts tied to athletes who are currently waitlisted for an event.",
      filters: {
        waitlistedOnly: true,
        isSuppressed: false,
      },
    },
    {
      id: "event-registered-unpaid",
      label: "Event registered but unpaid",
      description: "Contacts tied to athletes who registered for an event but never paid.",
      filters: {
        registeredButUnpaid: true,
        isSuppressed: false,
      },
    },
  ];
