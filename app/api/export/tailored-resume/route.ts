import { NextResponse } from "next/server";

import { buildAtsTailoredResumePdf } from "@/lib/pdf/ats-tailored-resume";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SuggestionsPayload = {
  tailoredResumeMarkdown?: string;
  jobTitle?: string;
  companyName?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tailorRunId = searchParams.get("tailorRunId");
  if (!tailorRunId) {
    return NextResponse.json({ error: "Missing tailorRunId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: run, error } = await supabase
    .from("tailor_runs")
    .select("suggestions")
    .eq("id", tailorRunId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !run?.suggestions) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const payload = run.suggestions as SuggestionsPayload;
  const md = payload.tailoredResumeMarkdown?.trim();
  if (!md) {
    return NextResponse.json({ error: "No tailored markdown for this run" }, { status: 400 });
  }

  const title = [payload.jobTitle, payload.companyName].filter(Boolean).join(" · ") || "Tailored resume";

  try {
    const bytes = await buildAtsTailoredResumePdf(md, title);
    const filename = `tailored-resume-${tailorRunId.slice(0, 8)}.pdf`;
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF build failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
