export const APPLICATION_STATUSES = [
  "draft",
  "tailored",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "closed",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Kanban columns → DB status when a card is dropped. */
export const KANBAN_COLUMN_TO_STATUS = {
  applied: "applied",
  interview: "interviewing",
  offer: "offer",
  rejected: "rejected",
} as const satisfies Record<string, ApplicationStatus>;

export type KanbanColumnId = keyof typeof KANBAN_COLUMN_TO_STATUS;

export function statusBelongsToKanbanColumn(
  status: string,
  columnId: KanbanColumnId,
): boolean {
  if (columnId === "applied")
    return status === "draft" || status === "tailored" || status === "applied";
  if (columnId === "interview") return status === "interviewing";
  if (columnId === "offer") return status === "offer";
  return status === "rejected" || status === "closed";
}

export function kanbanColumnForStatus(status: string): KanbanColumnId {
  if (status === "draft" || status === "tailored" || status === "applied") return "applied";
  if (status === "interviewing") return "interview";
  if (status === "offer") return "offer";
  return "rejected";
}
