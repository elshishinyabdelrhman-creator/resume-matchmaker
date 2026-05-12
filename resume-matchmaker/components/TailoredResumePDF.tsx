"use client";

import { convert } from "html-to-text";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    borderBottomStyle: "solid",
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 14,
    color: "#555555",
    marginBottom: 4,
    fontFamily: "Helvetica",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bullet: {
    marginLeft: 10,
    marginBottom: 4,
    fontFamily: "Helvetica",
  },
});

const SECTIONS_PER_PAGE = 12;

function chunkSections<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

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
  const sections = normalized.split(/\n\n+/).filter(Boolean);
  const pages = chunkSections(sections, SECTIONS_PER_PAGE);

  return (
    <Document title={`${name} — Resume`} author="Resume Matchmaker" language="en">
      {pages.map((pageSections, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {pageIndex === 0 ? (
            <View style={styles.header}>
              <Text style={styles.name}>{name}</Text>
              {title ? <Text style={styles.title}>{title}</Text> : null}
            </View>
          ) : null}

          {pageSections.length === 0 ? (
            <Text style={styles.bullet}> </Text>
          ) : (
            pageSections.map((section, index) => {
              const lines = section.split("\n").filter((l) => l.length > 0);
              const rawHeading = lines[0] ?? "";
              const heading = rawHeading.replace(/^#+\s*/, "").trim() || "Section";
              const bodyLines = lines.slice(1);

              return (
                <View key={`${pageIndex}-${index}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{heading}</Text>
                  {bodyLines.map((line, i) => {
                    const trimmed = line.replace(/^[-*]\s+/, "");
                    const isBullet = /^[-*]\s+/.test(line);
                    return (
                      <Text key={i} style={styles.bullet}>
                        {isBullet ? "• " : ""}
                        {trimmed}
                      </Text>
                    );
                  })}
                </View>
              );
            })
          )}
        </Page>
      ))}
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
