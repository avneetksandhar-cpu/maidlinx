export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

const COMMON_CLOSEOUT: ChecklistItem[] = [
  { id: "photos_before", label: "Before photos captured", completed: false },
  { id: "photos_after", label: "After photos captured", completed: false },
  { id: "final", label: "Final walkthrough complete", completed: false },
];

const RESIDENTIAL_CHECKLIST: ChecklistItem[] = [
  { id: "supplies", label: "Supplies loaded and ready", completed: false },
  { id: "kitchen", label: "Kitchen cleaned", completed: false },
  { id: "bathrooms", label: "Bathrooms sanitized", completed: false },
  { id: "bedrooms", label: "Bedrooms and living areas done", completed: false },
  { id: "floors", label: "Floors vacuumed and mopped", completed: false },
  { id: "trash", label: "Trash removed and surfaces wiped", completed: false },
  ...COMMON_CLOSEOUT,
];

const DEEP_CHECKLIST: ChecklistItem[] = [
  { id: "supplies", label: "Supplies loaded and ready", completed: false },
  { id: "kitchen_deep", label: "Kitchen deep-cleaned (appliances, cabinets)", completed: false },
  { id: "bathrooms_deep", label: "Bathrooms deep-cleaned (grout, fixtures)", completed: false },
  { id: "baseboards", label: "Baseboards, vents, and details dusted", completed: false },
  { id: "bedrooms", label: "Bedrooms and living areas done", completed: false },
  { id: "floors", label: "Floors vacuumed and mopped", completed: false },
  { id: "trash", label: "Trash removed and surfaces wiped", completed: false },
  ...COMMON_CLOSEOUT,
];

const MOVE_CHECKLIST: ChecklistItem[] = [
  { id: "supplies", label: "Supplies loaded and ready", completed: false },
  { id: "empty_spaces", label: "All rooms emptied and wiped down", completed: false },
  { id: "kitchen", label: "Kitchen cabinets, drawers, appliances cleaned", completed: false },
  { id: "bathrooms", label: "Bathrooms sanitized including fixtures", completed: false },
  { id: "closets", label: "Closets and storage wiped", completed: false },
  { id: "floors", label: "Floors vacuumed and mopped", completed: false },
  { id: "trash", label: "Trash and debris removed", completed: false },
  ...COMMON_CLOSEOUT,
];

const AIRBNB_CHECKLIST: ChecklistItem[] = [
  { id: "supplies", label: "Supplies loaded and ready", completed: false },
  { id: "linen", label: "Beds remade with clean linens", completed: false },
  { id: "bathrooms", label: "Bathrooms reset with fresh towels", completed: false },
  { id: "kitchen", label: "Kitchen reset and dishes done", completed: false },
  { id: "floors", label: "Floors vacuumed and mopped", completed: false },
  { id: "trash", label: "Trash removed and inventory checked", completed: false },
  { id: "amenities", label: "Guest amenities restocked", completed: false },
  ...COMMON_CLOSEOUT,
];

const OFFICE_CHECKLIST: ChecklistItem[] = [
  { id: "supplies", label: "Supplies loaded and ready", completed: false },
  { id: "desks", label: "Desks and common surfaces wiped", completed: false },
  { id: "bathrooms", label: "Restrooms sanitized and restocked", completed: false },
  { id: "kitchen", label: "Break room / kitchen cleaned", completed: false },
  { id: "floors", label: "Floors vacuumed and mopped", completed: false },
  { id: "trash", label: "Trash and recycling emptied", completed: false },
  ...COMMON_CLOSEOUT,
];

const POST_CONSTRUCTION_CHECKLIST: ChecklistItem[] = [
  { id: "supplies", label: "Supplies and dust gear ready", completed: false },
  { id: "dust", label: "Construction dust removed from surfaces", completed: false },
  { id: "windows", label: "Windows, tracks, and frames cleaned", completed: false },
  { id: "fixtures", label: "Fixtures and hardware wiped", completed: false },
  { id: "floors", label: "Floors detailed (vacuum + mop / polish)", completed: false },
  { id: "debris", label: "Debris and leftover materials removed", completed: false },
  ...COMMON_CLOSEOUT,
];

const EVENT_CHECKLIST: ChecklistItem[] = [
  { id: "supplies", label: "Supplies loaded and ready", completed: false },
  { id: "floors", label: "Floors cleaned and spot-treated", completed: false },
  { id: "surfaces", label: "Tables, chairs, and surfaces wiped", completed: false },
  { id: "bathrooms", label: "Restrooms sanitized", completed: false },
  { id: "trash", label: "Trash and recycling cleared", completed: false },
  { id: "reset", label: "Space reset to agreed layout", completed: false },
  ...COMMON_CLOSEOUT,
];

/** @deprecated Prefer getChecklistForService */
export const DEFAULT_JOB_CHECKLIST: ChecklistItem[] = RESIDENTIAL_CHECKLIST.map((item) => ({
  ...item,
}));

export function getChecklistForService(serviceType: string): ChecklistItem[] {
  const source = (() => {
    switch (serviceType) {
      case "deep":
        return DEEP_CHECKLIST;
      case "move_in":
      case "move_out":
        return MOVE_CHECKLIST;
      case "airbnb_turnover":
        return AIRBNB_CHECKLIST;
      case "office":
        return OFFICE_CHECKLIST;
      case "post_construction":
        return POST_CONSTRUCTION_CHECKLIST;
      case "event_venue":
        return EVENT_CHECKLIST;
      case "standard":
      default:
        return RESIDENTIAL_CHECKLIST;
    }
  })();

  return source.map((item) => ({ ...item }));
}

export function parseChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    return getChecklistForService("standard");
  }

  return value.map((item) => {
    const record = item as Record<string, unknown>;
    return {
      id: String(record.id),
      label: String(record.label),
      completed: Boolean(record.completed),
    };
  });
}

export function checklistProgress(items: ChecklistItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter((item) => item.completed).length / items.length) * 100);
}
