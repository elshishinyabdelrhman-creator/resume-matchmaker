"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { extractTextFromPDFAction } from "@/app/actions";
import { optimizeResume } from '@/app/actions/optimize-resume';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** UI state for the results tab (maps `keywordGaps` from the action to `gaps`). */
type TailorResultView = {
  tailoredResume: string;
  atsScore: number;
  gaps: string[];
  strengths: string[];
  improvements: string[];
};

export default function DashboardContent() {
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [parsingPdf, setParsingPdf] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<TailorResultView | null>(null);
  const [activeTab, setActiveTab] = useState("input");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadResumePdf = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Please upload a PDF file only");
      return;
    }

    setFileName(file.name);
    setParsingPdf(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const extracted = await extractTextFromPDFAction(formData);
      if (!extracted.ok) {
        toast.error(extracted.error);
        setResumeText("");
        return;
      }
      setResumeText(extracted.text);
      toast.success(
        `✅ Extracted ${extracted.text.length} characters successfully!`,
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to read PDF";
      toast.error(message);
      setResumeText("");
    } finally {
      setParsingPdf(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadResumePdf(file);
    } finally {
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadResumePdf(file);
  };

  const handleOptimize = async () => {
    console.log("Current values:", {
      resumeText: resumeText?.length,
      company,
      jobTitle,
      jobDescription: jobDescription?.length,
    });

    if (!resumeText || resumeText.trim().length < 100) {
      toast.error("Please paste your resume text (minimum 100 characters)");
      return;
    }
    const resume = resumeText.trim();
    const companyTrimmed = company?.trim() ?? "";
    if (!companyTrimmed) {
      toast.error("Please enter the Company name");
      return;
    }
    const titleTrimmed = jobTitle?.trim() ?? "";
    if (!titleTrimmed) {
      toast.error("Please enter the Job Title");
      return;
    }
    const jd = jobDescription?.trim() ?? "";
    if (!jd || jd.length < 50) {
      toast.error("Please paste the full Job Description");
      return;
    }

    setOptimizing(true);
    const formData = new FormData();
    formData.append("resumeText", resume);
    formData.append("company", companyTrimmed);
    formData.append("jobTitle", titleTrimmed);
    formData.append("jobDescription", jd);

    try {
      const data = await optimizeResume(formData);
      setResult({
        tailoredResume: data.tailoredResume,
        atsScore: data.atsScore,
        gaps: data.keywordGaps,
        strengths: data.strengths,
        improvements: data.improvements,
      });
      setActiveTab("results");
      toast.success(`✅ Tailored successfully! ATS Score: ${data.atsScore}%`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to optimize resume";
      toast.error(message);
    } finally {
      setOptimizing(false);
    }
  };

  const isLoading = optimizing;

  return (
    <div className="min-h-full rounded-2xl border border-border bg-zinc-950 p-6 text-zinc-100 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Resume Matchmaker</h1>
          <p className="mt-2 text-zinc-400">AI that makes you the perfect candidate</p>
        </div>

        <div className="mb-8 flex border-b border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("input")}
            className={`border-b-2 px-6 py-3 font-medium transition-all ${
              activeTab === "input"
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            1. Input
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("results")}
            disabled={!result}
            className={`border-b-2 px-6 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
              activeTab === "results"
                ? "border-blue-500 text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            2. Results
          </button>
        </div>

        {activeTab === "input" ? (
            <div className="mx-auto max-w-4xl">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle>Application details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>1. Upload Resume (PDF) - Optional</Label>
                    <div
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={cn(
                        "mt-2 cursor-pointer rounded-2xl border-2 border-dashed border-zinc-700 p-10 text-center transition hover:border-blue-500",
                        isDragging && "border-blue-500 bg-blue-500/5",
                      )}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      {parsingPdf ? (
                        <Loader2
                          className="mx-auto mb-3 size-12 animate-spin text-zinc-500"
                          aria-hidden
                        />
                      ) : (
                        <Upload className="mx-auto mb-3 size-12 text-zinc-500" aria-hidden />
                      )}
                      <p className="font-medium">{fileName || "Click to upload PDF"}</p>
                      <p className="text-sm text-zinc-500">
                        We&apos;ll try to extract text automatically
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-lg font-medium">
                      2. Paste your resume text here{" "}
                      <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      rows={16}
                      className="mt-2 min-h-[300px] resize-y border-zinc-700 bg-zinc-950 font-mono text-sm"
                      placeholder="Copy everything from your resume (Ctrl+A → Ctrl+C) and paste here..."
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      💡 Tip: Open your resume → Select all (Ctrl+A) → Copy → Paste here
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. OpenAI"
                        className="border-zinc-700 bg-zinc-950"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Job title</Label>
                      <Input
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. AI Engineer"
                        className="border-zinc-800 bg-zinc-950"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Job description</Label>
                    <Textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the full job description..."
                      rows={14}
                      className="border-zinc-800 bg-zinc-950"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => void handleOptimize()}
                    disabled={isLoading}
                    className="!bg-gradient-to-r !from-blue-600 !to-purple-600 w-full py-6 text-lg font-semibold !text-white shadow-lg hover:!from-blue-700 hover:!to-purple-700 disabled:!opacity-70"
                  >
                    {isLoading ? (
                      <>
                        AI is tailoring your resume...{" "}
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" aria-hidden />
                      </>
                    ) : (
                      "✨ Generate Tailored Resume"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
        ) : null}

        {activeTab === "results" && result ? (
          <div className="mx-auto max-w-4xl">
            <Card className="border-zinc-800 bg-zinc-900">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>✅ Tailored Resume Ready</span>
                  <span className="font-mono text-2xl text-emerald-400">
                    {result.atsScore}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[600px] overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-6">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {result.tailoredResume}
                  </pre>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    type="button"
                    className="flex-1 py-6 text-lg"
                    onClick={() => {
                      const blob = new Blob([result.tailoredResume], {
                        type: "text/markdown",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${company.trim() || "resume"}-tailored.md`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    📥 Download Markdown
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 py-6 text-lg"
                    onClick={() => window.location.reload()}
                  >
                    Start New Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
