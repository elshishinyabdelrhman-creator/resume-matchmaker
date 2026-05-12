"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { GripVertical, Loader2 } from "lucide-react";

import {
  updateApplicationNotesFromBoard,
  updateApplicationStatusFromBoard,
} from "@/app/actions/application-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type KanbanColumnId,
  statusBelongsToKanbanColumn,
} from "@/lib/constants/applications";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];

const COLUMNS: { id: KanbanColumnId; title: string; subtitle: string }[] = [
  { id: "applied", title: "Applied", subtitle: "Draft & submitted" },
  { id: "interview", title: "Interview", subtitle: "Active loops" },
  { id: "offer", title: "Offer", subtitle: "Decisions" },
  { id: "rejected", title: "Rejected", subtitle: "Closed out" },
];

export function ApplicationKanbanBoard({ applications }: { applications: ApplicationRow[] }) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const activeApp = useMemo(
    () => (activeId ? applications.find((a) => a.id === activeId) : undefined),
    [activeId, applications],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const overId = String(over.id);
    if (!overId.startsWith("col-")) return;

    const columnId = overId.replace("col-", "") as KanbanColumnId;
    const appId = String(active.id);
    const app = applications.find((a) => a.id === appId);
    if (!app) return;

    if (statusBelongsToKanbanColumn(app.status, columnId)) {
      return;
    }

    startTransition(() => {
      void (async () => {
        await updateApplicationStatusFromBoard(appId, columnId);
        router.refresh();
      })();
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "grid gap-4 md:grid-cols-2 xl:grid-cols-4",
          pending && "pointer-events-none opacity-80",
        )}
      >
        {COLUMNS.map((col) => (
          <KanbanColumn key={col.id} column={col}>
            {applications
              .filter((app) => statusBelongsToKanbanColumn(app.status, col.id))
              .map((app) => (
                <ApplicationCard key={app.id} app={app} />
              ))}
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp ? <ApplicationCardOverlay app={activeApp} /> : null}
      </DragOverlay>

      {pending ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Updating status…
        </p>
      ) : null}
    </DndContext>
  );
}

function KanbanColumn({
  column,
  children,
}: {
  column: (typeof COLUMNS)[number];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.id}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[520px] flex-col rounded-2xl border border-border/80 bg-muted/15 p-3 shadow-inner",
        isOver && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight">{column.title}</h2>
          <Badge variant="outline" className="text-[10px] font-normal">
            {column.subtitle}
          </Badge>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}

function ApplicationCard({ app }: { app: ApplicationRow }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-40")}>
      <ApplicationCardInner app={app} dragHandleProps={{ ...listeners, ...attributes }} />
    </div>
  );
}

function ApplicationCardOverlay({ app }: { app: ApplicationRow }) {
  return (
    <div className="rotate-1 cursor-grabbing shadow-lg">
      <ApplicationCardInner app={app} dragHandleProps={{}} overlay />
    </div>
  );
}

function ApplicationCardInner({
  app,
  dragHandleProps,
  overlay,
}: {
  app: ApplicationRow;
  dragHandleProps: Record<string, unknown>;
  overlay?: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(app.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [, startNoteTransition] = useTransition();

  useEffect(() => {
    setNotes(app.notes ?? "");
  }, [app.id, app.notes]);

  if (overlay) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 shadow-md">
        <p className="pr-8 text-sm font-semibold leading-snug">{app.company}</p>
        <p className="text-xs text-muted-foreground">{app.role_title}</p>
      </div>
    );
  }

  const saveNotes = () => {
    startNoteTransition(() => {
      void (async () => {
        setSaving(true);
        await updateApplicationNotesFromBoard(app.id, notes);
        setSaving(false);
        router.refresh();
      })();
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Drag to change status"
          {...dragHandleProps}
        >
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <Link
              href={`/applications/${app.id}`}
              className="text-sm font-semibold leading-snug text-foreground hover:underline"
            >
              {app.company}
            </Link>
            <p className="text-xs text-muted-foreground">{app.role_title}</p>
          </div>
          <Badge variant="secondary" className="text-[10px] capitalize">
            {app.status}
          </Badge>
          <div className="space-y-1">
            <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Recruiter, next step, links…"
              className="border-input bg-background text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border px-2 py-1.5 text-xs outline-none focus-visible:ring-2"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">{notes.length}/5000</span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                disabled={saving}
                onClick={saveNotes}
              >
                {saving ? "Saving…" : "Save notes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
