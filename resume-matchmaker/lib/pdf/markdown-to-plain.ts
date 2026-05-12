/**
 * Strip common Markdown to ATS-friendly plain text (single-flow, no tables).
 */
export function markdownToAtsPlainText(markdown: string): string {
  let t = markdown.replace(/\r\n/g, "\n");

  t = t.replace(/```[\w]*\n([\s\S]*?)```/g, "$1");
  t = t.replace(/`([^`]+)`/g, "$1");
  t = t.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  t = t.replace(/^#{1,6}\s+/gm, "");
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/__([^_]+)__/g, "$1");
  t = t.replace(/\*([^*]+)\*/g, "$1");
  t = t.replace(/^\s*[-*+]\s+/gm, "• ");
  t = t.replace(/^\s*\d+\.\s+/gm, "• ");
  t = t.replace(/^>\s?/gm, "");
  t = t.replace(/\n{3,}/g, "\n\n");

  return t
    .split("\n")
    .map((l) => l.trimEnd())
    .join("\n")
    .trim();
}
