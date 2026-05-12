"use client";

import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-svh font-sans antialiased">
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-8 text-white">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">Something went wrong</h2>
            <p className="mb-6 text-zinc-400">{error.message}</p>
            {error.digest ? (
              <p className="mb-6 text-xs text-zinc-500">Digest: {error.digest}</p>
            ) : null}
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-full bg-white px-6 py-3 font-medium text-black"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
