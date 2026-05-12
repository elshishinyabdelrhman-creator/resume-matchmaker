"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Lightbulb,
  ListChecks,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";

import { runAtsSimulator, type AtsSimulatorState } from "@/app/actions/ats-simulator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
const initial: AtsSimulatorState = {};

type ResumeOption = { id: string; file_name: string };

export function AtsSimulator({ resumes }: { resumes: ResumeOption[] }) {
  const [state, formAction, pending] = useActionState(runAtsSimulator, initial);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.result]);

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-border/80 shadow-md">
        <div
          className="h-1 w-full bg-gradient-to-r from-amber-400 via-primary to-emerald-500"
          aria-hidden
        />
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">ATS simulator</CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Gauge className="size-3.5" />
              0–100 match
            </Badge>
          </div>
          <CardDescription>
            Heuristic pass that estimates parser-friendly overlap: important keywords from the job,
            section structure, length, and bullet formatting. Tune with a real ATS vendor when you
            need production-grade scoring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sim-resume">Resume</Label>
              <select
                id="sim-resume"
                name="resumeId"
                required
                defaultValue={resumes[0]?.id ?? ""}
                className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {resumes.length === 0 ? (
                  <option value="">Upload a resume first</option>
                ) : (
                  resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.file_name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sim-jd">Job description</Label>
              <textarea
                id="sim-jd"
                name="jobDescription"
                required
                minLength={80}
                rows={10}
                placeholder="Paste the full posting: responsibilities, requirements, and tools."
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[200px] w-full rounded-md border px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              />
              <p className="text-xs text-muted-foreground">
                Minimum 80 characters. Longer postings produce better keyword maps.
              </p>
            </div>
            {state.error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={pending || resumes.length === 0}
              className="h-11 gap-2 sm:w-auto sm:min-w-52"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Running simulation…
                </>
              ) : (
                <>
                  <Target className="size-4" />
                  Run ATS simulation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {state.result ? (
        <div ref={resultsRef} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
            <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Match score</CardTitle>
                <CardDescription>{state.result.resumeFileName}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 pb-6">
                <ScoreRing value={state.result.overall} />
                <div className="w-full space-y-3 text-sm">
                  <BreakdownRow
                    label="Keyword fit"
                    value={state.result.breakdown.keywordCoverage}
                    hint="Broad + weighted key terms from the JD"
                  />
                  <BreakdownRow
                    label="Key terms"
                    value={state.result.breakdown.keyTermCoverage}
                    hint="Long tokens & bigrams"
                  />
                  <BreakdownRow label="Sections" value={state.result.breakdown.sectionPresence} />
                  <BreakdownRow label="Length fit" value={state.result.breakdown.lengthFit} />
                  <BreakdownRow label="Formatting" value={state.result.breakdown.formatHints} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                    <CardTitle className="text-base">Missing keywords</CardTitle>
                  </div>
                  <CardDescription>
                    Terms inferred from the job text that we did not confidently find in your
                    resume. Add only what is truthful.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {state.result.missingKeywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nothing obvious missing—nice overlap.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {state.result.missingKeywords.map((kw, i) => (
                        <Badge
                          key={`${kw}-${i}`}
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/5 text-amber-950 dark:text-amber-100"
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-base">Matched keywords</CardTitle>
                  </div>
                  <CardDescription>Signals already present in your resume text.</CardDescription>
                </CardHeader>
                <CardContent>
                  {state.result.matchedKeywords.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No strong matches yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {state.result.matchedKeywords.map((kw, i) => (
                        <Badge key={`${kw}-${i}`} variant="secondary" className="font-normal">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-4 text-primary" />
                  <CardTitle className="text-base">Suggestions</CardTitle>
                </div>
                <CardDescription>Concrete edits ranked for ATS alignment.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {state.result.suggestions.map((s) => (
                    <li key={s} className="flex gap-2">
                      <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="size-4 text-primary" />
                  <CardTitle className="text-base">Improvement tips</CardTitle>
                </div>
                <CardDescription>Strategy notes beyond single keywords.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {state.result.improvementTips.map((t) => (
                    <li key={t} className="flex gap-2">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary/80" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const hue = clamped >= 72 ? 150 : clamped >= 48 ? 45 : 25;

  return (
    <div
      className="relative flex size-40 items-center justify-center"
      role="img"
      aria-label={`ATS match score ${clamped} percent`}
    >
      <div
        className="absolute inset-0 rounded-full p-1"
        style={{
          background: `conic-gradient(hsl(${hue} 85% 42%) ${clamped * 3.6}deg, hsl(var(--muted)) 0deg)`,
        }}
      />
      <div className="relative flex size-[5.5rem] flex-col items-center justify-center rounded-full bg-card text-center shadow-inner ring-1 ring-border">
        <span className="text-3xl font-semibold tracking-tight text-foreground">{clamped}</span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
