"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ArrowRight, Download, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  extractTextFromPDFAction,
  optimizeResume,
  type OptimizeResumeResult,
} from "@/app/actions";
import { TailoredResumePDF } from "@/components/TailoredResumePDF";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SuccessResult = Extract<OptimizeResumeResult, { success: true }>;

export default function DashboardContent() {
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [parsingPdf, setParsingPdf] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<SuccessResult | null>(null);
  const [activeTab, setActiveTab] = useState("input");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const pdfFileBase =
    company
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "tailored";

  const processPdfFile = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Please upload a PDF file");
      return;
    }

    setFileName(file.name);
    setParsingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await extractTextFromPDFAction(formData);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setResumeText(res.text);
      toast.success("PDF parsed successfully");
    } finally {
      setParsingPdf(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    void processPdfFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processPdfFile(file);
  };

  const handleOptimize = async () => {
    if (!resumeText.trim() || !jobDescription.trim() || !company.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setOptimizing(true);
    const formData = new FormData();
    formData.append("resumeText", resumeText);
    formData.append("company", company);
    formData.append("jobTitle", jobTitle);
    formData.append("jobDescription", jobDescription);

    try {
      const data = await optimizeResume(formData);
      if (!data.success) {
        toast.error(data.error);
        return;
      }
      setResult(data);
      setActiveTab("results");
      toast.success(`Optimized! ATS score: ${data.atsScore}%`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Optimization failed";
      toast.error(message);
    } finally {
      setOptimizing(false);
    }
  };

  const busy = parsingPdf || optimizing;

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
            <div className="grid gap-8 lg:grid-cols-2">
              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle>Application details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Upload resume PDF</Label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={cn(
                        "mt-2 w-full cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-colors",
                        isDragging
                          ? "border-blue-500 bg-blue-500/5"
                          : "border-zinc-700 hover:border-blue-500",
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
                        <Loader2 className="mx-auto mb-4 size-12 animate-spin text-zinc-500" />
                      ) : (
                        <Upload className="mx-auto mb-4 size-12 text-zinc-500" aria-hidden />
                      )}
                      <p className="font-medium">{fileName || "Drop your resume here"}</p>
                      <p className="mt-1 text-sm text-zinc-500">Click or drag and drop</p>
                    </button>
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
                      rows={14}
                      placeholder="Paste the full job description…"
                      className="border-zinc-800 bg-zinc-950"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => void handleOptimize()}
                    disabled={busy}
                    className="w-full py-7 text-lg"
                  >
                    {optimizing ? (
                      <>
                        AI is optimizing…
                        <Loader2 className="ml-2 size-5 animate-spin" aria-hidden />
                      </>
                    ) : (
                      "✨ Generate tailored resume"
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-zinc-800 bg-zinc-900">
                <CardHeader>
                  <CardTitle>Original resume</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={22}
                    className="border-zinc-800 bg-zinc-950 font-mono text-sm"
                    placeholder="Resume text will appear here after upload…"
                  />
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

                  <div className="flex gap-3 border-t border-zinc-800 p-6">
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
                      <Link href={`/applications/${result.application.id}`}>
                        Save &amp; track application
                        <ArrowRight className="ml-2 size-4" aria-hidden />
                      </Link>
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
