'use client';

import { convert } from "html-to-text";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    borderBottomStyle: "solid",
    paddingBottom: 10,
  },
  name: { fontSize: 24, fontFamily: "Helvetica-Bold" },
  title: { fontSize: 14, color: "#555555", fontFamily: "Helvetica" },
  section: { marginBottom: 15 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    textTransform: "uppercase",
  },
});

export type ResumePDFProps = {
  resumeMarkdown: string;
  name?: string;
  title?: string;
};

/**
 * Strip HTML to plain text when tags are present (optional preprocessing for `resumeMarkdown`).
 */
export function normalizeResumeBody(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.includes("<") && t.includes(">")) {
    try {
      return convert(t, {
        wordwrap: false,
        selectors: [{ selector: "a", options: { ignoreHref: true } }],
      }).trim();
    } catch {
      return t;
    }
  }
  return t;
}

/**
 * Simple Markdown-ish resume → PDF (sections split by blank lines; first line of each block is the heading).
 */
export function TailoredResumePDF({
  resumeMarkdown,
  name = "Your Name",
  title,
}: ResumePDFProps) {
  const normalized = normalizeResumeBody(resumeMarkdown);
  const blocks = normalized.split(/\n\n+/).filter(Boolean);

  return (
    <Document title={`${name} — Resume`} author="Resume Matchmaker" language="en">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          {title ? <Text style={styles.title}>{title}</Text> : null}
        </View>

        {blocks.length === 0 ? (
          <Text>No resume content to render.</Text>
        ) : (
          blocks.map((section, i) => {
            const lines = section.split("\n");
            const heading =
              (lines[0] ?? "").replace(/#/g, "").trim() || "Section";
            const body = lines.slice(1).join("\n");
            return (
              <View key={`section-${i}`} style={styles.section}>
                <Text style={styles.sectionTitle}>{heading}</Text>
                <Text>{body}</Text>
              </View>
            );
          })
        )}
      </Page>
    </Document>
  );
}

export type TailoredResumePDFDownloadProps = ResumePDFProps & {
  fileName?: string;
  className?: string;
};

/** Ready-made download control wrapping {@link TailoredResumePDF} in `PDFDownloadLink`. */
export function TailoredResumePDFDownload({
  fileName = "tailored-resume.pdf",
  className,
  ...pdfProps
}: TailoredResumePDFDownloadProps) {
  return (
    <PDFDownloadLink
      document={<TailoredResumePDF {...pdfProps} />}
      fileName={fileName}
      className={className}
    >
      {({ loading }) => (
        <Button type="button" disabled={loading} className="gap-2" variant="default">
          <Download className="size-4" aria-hidden />
          {loading ? "Preparing PDF…" : "Download PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}

/** @deprecated Use {@link TailoredResumePDF} with `resumeMarkdown` + optional `name` / `title`. */
export function TailoredResumePDFDocument({
  body,
  documentTitle = "Tailored resume",
}: {
  body: string;
  documentTitle?: string;
}) {
  return <TailoredResumePDF resumeMarkdown={body} name={documentTitle} />;
}

export default TailoredResumePDF;
