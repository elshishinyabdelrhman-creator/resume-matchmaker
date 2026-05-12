"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownViewProps = {
  content: string;
};

export function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <div className="match-markdown text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mt-4 text-lg font-semibold tracking-tight first:mt-0">{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="mt-4 text-base font-semibold tracking-tight">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-3 text-sm font-semibold">{children}</h4>
          ),
          p: ({ children }) => <p className="mt-2 text-muted-foreground">{children}</p>,
          ul: ({ children }) => (
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-muted-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted-foreground">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-border" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/40 pl-3 text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock = Boolean(className?.includes("language-"));
            if (isBlock) {
              return (
                <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">
                  <code className={className}>{children}</code>
                </pre>
              );
            }
            return (
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8rem] text-foreground">
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
