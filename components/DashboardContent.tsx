"use client";

import Link from "next/link";
import dynamic from 'next/dynamic';
import { useRef, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ArrowRight, Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { extractTextFromPDFAction } from "@/app/actions";
import { optimizeResume } from '@/app/actions/optimize-resume';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TailoredResumePDF = dynamic(
  () => import('@/components/TailoredResumePDF').then((mod) => mod.TailoredResumePDF),
  { ssr: false },
);

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

  const pdfFileBase =
    company
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tailored";

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-2 bg-zinc-900">
            <TabsTrigger value="input" className="data-[state=active]:bg-zinc-800">
              1. Input
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!result} className="data-[state=active]:bg-zinc-800">
              2. Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input">
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
          </TabsContent>

          <TabsContent value="results">
            {result ? (
              <div className="grid gap-8 lg:grid-cols-2">
                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="text-red-400">Original resume</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[700px] overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm">{resumeText}</pre>
                  </CardContent>
                </Card>

                <Card className="border-zinc-800 bg-zinc-900">
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-emerald-400">AI tailored resume</span>
                      <span className="font-mono text-2xl">Score: {result.atsScore}%</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[520px] overflow-auto">
                    <pre className="whitespace-pre-wrap text-sm">{result.tailoredResume}</pre>
                  </CardContent>

                  {(result.strengths.length > 0 || result.improvements.length > 0 || result.gaps.length > 0) && (
                    <CardContent className="space-y-4 border-t border-zinc-800 pt-4">
                      {result.strengths.length > 0 ? (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-emerald-400">Strengths</h4>
                          <ul className="space-y-1 text-sm text-zinc-400">
                            {result.strengths.map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {result.improvements.length > 0 ? (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-amber-400">Suggestions</h4>
                          <ul className="space-y-1 text-sm text-zinc-400">
                            {result.improvements.map((s, i) => (
                              <li key={i}>• {s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {result.gaps.length > 0 ? (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-red-400">Missing keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {result.gaps.map((gap, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-red-950/80 px-2 py-1 text-xs text-red-300"
                              >
                                {gap}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  )}

                  <div className="flex flex-col gap-3 border-t border-zinc-800 p-6">
                    <div className="flex gap-3">
                      <PDFDownloadLink
                        document={
                          <TailoredResumePDF
                            resumeMarkdown={result.tailoredResume}
                            name="Your Name"
                            title={jobTitle.trim() || undefined}
                          />
                        }
                        fileName={`${pdfFileBase}-tailored-resume.pdf`}
                        className="flex-1"
                      >
                        {({ loading }) => (
                          <Button type="button" className="w-full" disabled={loading}>
                            <Download className="mr-2 size-4" aria-hidden />
                            {loading ? "Generating PDF…" : "Download PDF"}
                          </Button>
                        )}
                      </PDFDownloadLink>

                      <Button variant="outline" className="flex-1 border-zinc-600 bg-transparent" asChild>
                        <Link href="/applications/board">
                          Open applications board
                          <ArrowRight className="ml-2 size-4" aria-hidden />
                        </Link>
                      </Button>
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        const element = document.createElement("a");
                        element.setAttribute(
                          "href",
                          "data:text/markdown;charset=utf-8," +
                            encodeURIComponent(result.tailoredResume),
                        );
                        element.setAttribute(
                          "download",
                          `${company.trim() || "job"}-tailored-resume.md`,
                        );
                        element.style.display = "none";
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                      }}
                      className="w-full py-6"
                    >
                      📥 Download Tailored Resume (Markdown)
                    </Button>
                  </div>
                </Card>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
