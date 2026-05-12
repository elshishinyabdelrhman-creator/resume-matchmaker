"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { OptimizeResumeResult } from "@/app/actions/optimize-resume";
import { optimizeResume } from "@/app/actions/optimize-resume";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function DashboardContent() {
  const [resumeText, setResumeText] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResumeResult | null>(null);

  const handleOptimize = async () => {
    if (!resumeText.trim()) {
      toast.error("Please paste your resume text");
      return;
    }
    if (!company.trim()) {
      toast.error("Company name required");
      return;
    }
    if (!jobTitle.trim()) {
      toast.error("Job title required");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Job description required");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("resumeText", resumeText);
    formData.append("company", company);
    formData.append("jobTitle", jobTitle);
    formData.append("jobDescription", jobDescription);

    try {
      const data = await optimizeResume(formData);
      setResult(data);
      toast.success(`Success! ATS Score: ${data.atsScore}%`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to optimize";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-4xl font-bold">Resume Matchmaker</h1>
        <p className="mb-8 text-zinc-400">
          AI that makes your resume the perfect fit
        </p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle>New Application</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="space-y-2">
                <Label>Paste Resume Text *</Label>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  rows={12}
                  placeholder="Paste your full resume here..."
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>
              <div className="space-y-2">
                <Label>Job Description *</Label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={10}
                  placeholder="Paste the full job description..."
                  className="border-zinc-700 bg-zinc-950"
                />
              </div>

              <Button
                type="button"
                onClick={() => void handleOptimize()}
                disabled={isLoading}
                className="w-full py-7 text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2
                      className="mr-2 inline size-5 animate-spin"
                      aria-hidden
                    />
                    Generating…
                  </>
                ) : (
                  "✨ Generate Tailored Resume"
                )}
              </Button>
            </CardContent>
          </Card>

          {result ? (
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-emerald-400">Tailored Resume</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded border border-zinc-800 bg-black p-6 text-sm">
                  {result.tailoredResume}
                </pre>
                <Button
                  type="button"
                  className="mt-6 w-full py-6"
                  onClick={() => {
                    const blob = new Blob([result.tailoredResume], {
                      type: "text/markdown",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${company.trim() || "resume"}-tailored-resume.md`;
                    a.style.display = "none";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download Resume
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
