"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  GraduationCap,
  Loader2,
  Sparkles,
  UploadCloud,
  Wand2,
} from "lucide-react";

import {
  uploadResume,
  type ResumePreviewPayload,
  type ResumeUploadState,
} from "@/app/actions/resume";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const initial: ResumeUploadState = {};

type ResumeUploadZoneProps = {
  /** Called after a successful upload + parse so parents can refresh server data (e.g. resume pickers). */
  onUploadSuccess?: () => void;
};

export function ResumeUploadZone({ onUploadSuccess }: ResumeUploadZoneProps) {
  const [resetKey, setResetKey] = useState(0);

  return (
    <ResumeUploadInner
      key={resetKey}
      onUploadAnother={() => {
        setResetKey((k) => k + 1);
      }}
      onUploadSuccess={onUploadSuccess}
    />
  );
}

function ResumeUploadInner({
  onUploadAnother,
  onUploadSuccess,
}: {
  onUploadAnother: () => void;
  onUploadSuccess?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(uploadResume, initial);

  useEffect(() => {
    if (state.ok && onUploadSuccess) {
      onUploadSuccess();
    }
  }, [state.ok, onUploadSuccess]);

  const assignFile = useCallback((file: File | undefined) => {
    if (!file || !inputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    inputRef.current.files = dt.files;
    setFileLabel(file.name);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      assignFile(file);
    },
    [assignFile],
  );

  const preview = state.ok && state.preview ? state.preview : null;

  return (
    <div className="space-y-8">
      {preview ? (
        <ResumePreviewCard preview={preview} onUploadAnother={onUploadAnother} />
      ) : null}

      <form action={formAction} className="space-y-5">
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (e.currentTarget.contains(e.relatedTarget as Node)) return;
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={cn(
            "group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/8 shadow-[0_0_0_1px_var(--color-ring)]"
              : "border-muted-foreground/20 bg-gradient-to-b from-muted/40 to-background hover:border-primary/35 hover:shadow-sm",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            aria-hidden
            style={{
              background:
                "radial-gradient(600px 200px at 50% -40%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 70%)",
            }}
          />
          <label
            htmlFor="resume-file"
            className="relative flex cursor-pointer flex-col items-center gap-4 px-6 py-12 text-center"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner ring-1 ring-primary/15">
              <UploadCloud className="size-7" aria-hidden />
            </span>
            <div className="space-y-1">
              <p className="text-base font-semibold tracking-tight">
                Drop your resume here
              </p>
              <p className="text-sm text-muted-foreground">
                PDF or DOCX · up to 8MB · parsed on the server
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary">PDF</Badge>
              <Badge variant="secondary">DOCX</Badge>
              <Badge variant="outline" className="text-muted-foreground">
                Private storage
              </Badge>
            </div>
            <input
              ref={inputRef}
              id="resume-file"
              name="file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFileLabel(f?.name ?? null);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="pointer-events-auto mt-1"
              onClick={(e) => {
                e.preventDefault();
                inputRef.current?.click();
              }}
            >
              Browse files
            </Button>
            {fileLabel ? (
              <p className="pointer-events-none text-xs font-medium text-muted-foreground">
                Selected: <span className="text-foreground">{fileLabel}</span>
              </p>
            ) : (
              <p className="pointer-events-none text-xs text-muted-foreground">
                We extract text with pdf.js & mammoth, then structure with AI when configured.
              </p>
            )}
          </label>
        </div>

        {state.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full gap-2 sm:w-auto sm:min-w-44"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Parsing & saving…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Upload & parse
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

function ResumePreviewCard({
  preview,
  onUploadAnother,
}: {
  preview: ResumePreviewPayload;
  onUploadAnother: () => void;
}) {
  const [tab, setTab] = useState<"parsed" | "raw">("parsed");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-md ring-1 ring-foreground/5">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/12 to-transparent"
        aria-hidden
      />
      <div className="relative space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <CheckCircle2 className="size-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upload complete</p>
              <h2 className="text-lg font-semibold tracking-tight">{preview.fileName}</h2>
              <p className="text-sm text-muted-foreground">
                {preview.wordCount.toLocaleString()} words parsed · ID{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">{preview.resumeId.slice(0, 8)}…</code>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={onUploadAnother} className="shrink-0">
            Upload another
          </Button>
        </div>

        <div className="flex gap-2 rounded-xl border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setTab("parsed")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === "parsed"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Wand2 className="size-4" />
            Structured preview
          </button>
          <button
            type="button"
            onClick={() => setTab("raw")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === "raw"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <FileText className="size-4" />
            Raw text
          </button>
        </div>

        {tab === "parsed" ? (
          <StructuredResumeView data={preview.structured} />
        ) : (
          <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border bg-muted/20 p-4">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {preview.excerpt || "No text extracted."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

function StructuredResumeView({ data }: { data: ResumePreviewPayload["structured"] }) {
  const hasCore =
    Boolean(data.headline || data.summary || data.contact?.email || data.contact?.phone);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-xl border border-border bg-background/80 p-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" />
          Profile
        </div>
        {data.headline ? (
          <p className="text-base font-semibold leading-snug">{data.headline}</p>
        ) : null}
        {data.summary ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{data.summary}</p>
        ) : null}
        {!hasCore ? (
          <p className="text-sm text-muted-foreground">
            No headline/summary detected—try enabling an AI key for richer structuring.
          </p>
        ) : null}
        {data.contact ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {data.contact.email ? <li>{data.contact.email}</li> : null}
            {data.contact.phone ? <li>{data.contact.phone}</li> : null}
            {data.contact.location ? <li>{data.contact.location}</li> : null}
            {data.contact.links?.length ? (
              <li className="break-all">{data.contact.links.join(" · ")}</li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-background/80 p-4 shadow-xs">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Wand2 className="size-4 text-primary" />
          Skills
        </div>
        {data.skills?.length ? (
          <div className="flex flex-wrap gap-2">
            {data.skills.map((skill, i) => (
              <Badge key={`${skill}-${i}`} variant="secondary" className="font-normal">
                {skill}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No skills extracted yet.</p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-background/80 p-4 shadow-xs lg:col-span-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="size-4 text-primary" />
          Experience
        </div>
        {data.experience?.length ? (
          <ul className="space-y-4">
            {data.experience.map((item, idx) => (
              <li key={`${item.role}-${idx}`} className="rounded-lg border border-border/70 bg-muted/15 p-3">
                <p className="font-medium">{item.role}</p>
                <p className="text-sm text-muted-foreground">
                  {[item.company, item.location, item.dates].filter(Boolean).join(" · ")}
                </p>
                {item.highlights?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {item.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No experience blocks parsed.</p>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-background/80 p-4 shadow-xs lg:col-span-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GraduationCap className="size-4 text-primary" />
          Education
        </div>
        {data.education?.length ? (
          <ul className="space-y-3">
            {data.education.map((edu, idx) => (
              <li key={`${edu.institution}-${idx}`} className="text-sm">
                <p className="font-medium">{edu.institution}</p>
                <p className="text-muted-foreground">
                  {[edu.degree, edu.dates].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No education entries parsed.</p>
        )}
      </div>
    </div>
  );
}
